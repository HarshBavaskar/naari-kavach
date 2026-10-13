"""
Naari Kavach static risk layers.

Builds public/data/risk-grid.json: one entry per H3 cell (resolution 10, the
same resolution the web app uses) with two signals in 0..1 where 1 = less safe:

  dark   from NASA VIIRS Black Marble night-time radiance (low light = high dark)
  crime  from NCRB "Crime in India" crimes-against-women rate for the district

Inputs (download once, see pipeline/README.md):
  --viirs     GeoTIFF of night-time radiance covering the area (e.g. VNP46A3 monthly)
  --ncrb      CSV with columns: district,crimes_against_women,female_population
  --districts GeoJSON of Maharashtra district boundaries with a `district` property
  --bbox      south,west,north,east of the area to grid (default: central Pune)

Run:
  python -m venv .venv && . .venv/bin/activate
  pip install -r requirements.txt
  python build_risk_grid.py --viirs raw/viirs.tif --ncrb raw/ncrb.csv --districts raw/mh_districts.geojson

The app treats this file as optional. Missing signals are skipped and the
remaining weights are renormalised (see src/lib/risk.ts).
"""

from __future__ import annotations

import argparse
import csv
import json
import math
from datetime import datetime, timezone
from pathlib import Path

import h3
import numpy as np
import rasterio
from shapely.geometry import Point, shape

RES = 10
OUT = Path(__file__).resolve().parent.parent / "public" / "data" / "risk-grid.json"


def parse_bbox(s: str) -> tuple[float, float, float, float]:
    south, west, north, east = (float(x) for x in s.split(","))
    return south, west, north, east


def cells_in_bbox(south: float, west: float, north: float, east: float) -> list[str]:
    poly = h3.LatLngPoly([(south, west), (south, east), (north, east), (north, west)])
    return list(h3.polygon_to_cells(poly, RES))


def darkness(cells: list[str], tif: Path) -> dict[str, float]:
    """Sample radiance at each cell centre, log-scale it, invert to 0..1 darkness."""
    with rasterio.open(tif) as src:
        coords = [h3.cell_to_latlng(c)[::-1] for c in cells]  # (lng, lat)
        vals = np.array([v[0] for v in src.sample(coords)], dtype=float)
        nodata = src.nodata
    if nodata is not None:
        vals[vals == nodata] = np.nan
    vals = np.log1p(np.clip(vals, 0, None))
    lo, hi = np.nanpercentile(vals, 5), np.nanpercentile(vals, 95)
    norm = np.clip((vals - lo) / max(hi - lo, 1e-6), 0, 1)
    return {c: round(float(1 - n), 3) for c, n in zip(cells, norm) if not math.isnan(n)}


def crime(cells: list[str], ncrb_csv: Path, districts_geojson: Path) -> dict[str, float]:
    """District crimes-against-women per 100k women, min-max scaled across districts."""
    rates: dict[str, float] = {}
    with open(ncrb_csv, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            pop = float(row["female_population"] or 0)
            if pop > 0:
                rates[row["district"].strip().lower()] = float(row["crimes_against_women"]) / pop * 1e5
    if not rates:
        return {}
    lo, hi = min(rates.values()), max(rates.values())
    scaled = {k: (v - lo) / max(hi - lo, 1e-6) for k, v in rates.items()}

    gj = json.loads(Path(districts_geojson).read_text(encoding="utf-8"))
    shapes = [(f["properties"]["district"].strip().lower(), shape(f["geometry"])) for f in gj["features"]]

    out: dict[str, float] = {}
    for c in cells:
        lat, lng = h3.cell_to_latlng(c)
        p = Point(lng, lat)
        for name, geom in shapes:
            if geom.contains(p) and name in scaled:
                out[c] = round(scaled[name], 3)
                break
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--viirs", type=Path)
    ap.add_argument("--ncrb", type=Path)
    ap.add_argument("--districts", type=Path)
    ap.add_argument("--bbox", type=parse_bbox, default=parse_bbox("18.45,73.75,18.62,73.95"))
    args = ap.parse_args()

    cells = cells_in_bbox(*args.bbox)
    print(f"{len(cells):,} cells at resolution {RES}")

    dark = darkness(cells, args.viirs) if args.viirs else {}
    crim = crime(cells, args.ncrb, args.districts) if args.ncrb and args.districts else {}

    # Keep what build_place_grid.mjs wrote (roads, people, coverage): this script only owns dark and crime.
    old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    merged: dict[str, dict[str, float]] = {
        h: {k: v for k, v in c.items() if k not in ("dark", "crime")} for h, c in old.get("cells", {}).items()
    }
    for c in cells:
        entry = merged.get(c, {})
        if c in dark:
            entry["dark"] = dark[c]
        if c in crim:
            entry["crime"] = crim[c]
        if entry or c in merged:
            merged[c] = entry

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                **old,
                "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "resolution": RES,
                "sources": {
                    **old.get("sources", {}),
                    "dark": str(args.viirs.name) if args.viirs else None,
                    "crime": str(args.ncrb.name) if args.ncrb else None,
                },
                "cells": merged,
            },
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )
    print(f"wrote {len(merged):,} cells to {OUT}")


if __name__ == "__main__":
    main()
