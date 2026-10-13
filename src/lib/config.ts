/**
 * Runtime configuration. Every external service here is free and keyless by
 * default. Optional keys come from Vite env vars (see .env.example).
 */

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && v !== '' && v !== undefined ? n : fallback;
};

export const config = {
  defaultCenter: {
    lat: num(import.meta.env.VITE_DEFAULT_LAT, 19.1861),
    lng: num(import.meta.env.VITE_DEFAULT_LNG, 72.9756),
  },
  defaultCityLabel: 'Thane',

  /** H3 resolution 10 = hexes about 130 m across. Street-block granularity. */
  h3Resolution: 10,
  /** Rings of hexes drawn around the map centre. 22 rings ≈ 1519 cells ≈ 2.5 km radius. */
  gridRings: 22,

  /** Radius (m) for nearby help + POI fetches. */
  poiRadius: 2600,

  orsKey: (import.meta.env.VITE_ORS_KEY as string | undefined) || '',
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '',
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '',

  endpoints: {
    /** Public mirrors, tried in order. The next one starts only if the one before fails or stays silent. */
    overpass: [
      'https://overpass-api.de/api/interpreter',
      'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
      'https://overpass.private.coffee/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ],
    photon: 'https://photon.komoot.io/reverse',
    nominatim: 'https://nominatim.openstreetmap.org/search',
    osrmFoot: 'https://routing.openstreetmap.de/routed-foot/route/v1/driving',
    osrmCar: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
    ors: 'https://api.openrouteservice.org/v2/directions',
    /** Open-Meteo hourly forecast: no key, no account. */
    weather: 'https://api.open-meteo.com/v1/forecast',
  },

  /** OpenStreetMap standard tiles: no key, no account. Muted and dark-themed in CSS (.leaflet-tile-pane). */
  tiles: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },

  /** SOS: hold duration before the cancel countdown starts, then the countdown length. */
  sosHoldMs: 1500,
  sosCountdownS: 5,
  /** Fake call: seconds between the tap and the ring, enough to put the phone away first. */
  fakeCallDelayS: 5,
} as const;

export const cloudEnabled = Boolean(config.supabaseUrl && config.supabaseAnonKey);

/** India emergency numbers. Verified national lines; keep this list short and accurate. */
export const helplines = [
  { id: 'erss', number: '112', key: 'helpline.112' },
  { id: 'women', number: '1091', key: 'helpline.1091' },
  { id: 'whl', number: '181', key: 'helpline.181' },
  { id: 'ambulance', number: '108', key: 'helpline.108' },
  { id: 'cyber', number: '1930', key: 'helpline.1930' },
] as const;
