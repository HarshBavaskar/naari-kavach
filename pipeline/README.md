# Risk grid pipeline

Builds `public/data/risk-grid.json`, the static layers the app blends into
each hex's risk score. Two scripts write to the same file and keep each
other's layers.

## Roads and people (no key, no account)

```bash
npm run grid                  # region mumbai-thane
npm run grid -- --offline     # cached roads only, no Overpass calls
npm run grid -- --no-people   # skip the population raster
```

`build_place_grid.mjs` writes two layers per hex:

| Key | Meaning | Source |
|---|---|---|
| `x` | No way out, 0..1: how far a walker is committed before the next side turn | OpenStreetMap roads via Overpass |
| `p` | People living in the hex and its ring of neighbours | Meta High Resolution Settlement Layer, read by HTTP range request |

Every hex with a road or with people nearby gets an entry, and the file lists
the boxes it covers, so the app can leave open ground blank and tell an
unmapped street from an empty one.

Road extracts are cached in `raw/osm`. The public Overpass mirrors often time
out on large boxes, so keep fetch tiles small and rerun if a tile fails; a
cached tile is never fetched again. To cover another city, add a region to
`REGIONS` in the script.

## Night lights and crime baseline (needs downloads)

Run it monthly (night lights) and yearly (NCRB).

## Inputs

| File | Where to get it | Notes |
|---|---|---|
| `raw/viirs.tif` | NASA Black Marble VNP46A3 (monthly night lights) via NASA Earthdata (free account) | Clip to your city to keep it small |
| `raw/ncrb.csv` | NCRB "Crime in India", crimes against women, district-wise (data.gov.in or Dataful) | Columns: `district,crimes_against_women,female_population` |
| `raw/mh_districts.geojson` | Maharashtra district boundaries (for example the DataMeet maps project) | Needs a `district` property matching the CSV |

`raw/` is git-ignored. Never commit downloaded datasets.

## Run

```bash
cd pipeline
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
python build_risk_grid.py \
  --viirs raw/viirs.tif \
  --ncrb raw/ncrb.csv \
  --districts raw/mh_districts.geojson \
  --bbox 18.45,73.75,18.62,73.95
```

Either input can be left out; the app skips missing signals.

## Rules

- Resolution must match `config.h3Resolution` in `src/lib/config.ts` (10).
- Output values are 0..1 where 1 means less safe.
- This layer describes places, never people. Do not add any dataset that
  identifies individuals (offender registries, faces, phone numbers).
