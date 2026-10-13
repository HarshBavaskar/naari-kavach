// Generated from brand/geometry.json (pipeline: brand.py). Do not hand-edit:
// change the construction there and regenerate so app and brand files stay identical.
export const CRESCENTS = [
  "M66.206 23.600A16.5 16.5 0 1 0 33.794 23.600A16.5 16.5 0 0 1 66.206 23.600Z",
  "M80.127 42.792A16.5 16.5 0 1 0 57.208 19.873A16.5 16.5 0 0 1 80.127 42.792Z",
  "M76.400 66.206A16.5 16.5 0 1 0 76.400 33.794A16.5 16.5 0 0 1 76.400 66.206Z",
  "M57.208 80.127A16.5 16.5 0 1 0 80.127 57.208A16.5 16.5 0 0 1 57.208 80.127Z",
  "M33.794 76.400A16.5 16.5 0 1 0 66.206 76.400A16.5 16.5 0 0 1 33.794 76.400Z",
  "M19.873 57.208A16.5 16.5 0 1 0 42.792 80.127A16.5 16.5 0 0 1 19.873 57.208Z",
  "M23.600 33.794A16.5 16.5 0 1 0 23.600 66.206A16.5 16.5 0 0 1 23.600 33.794Z",
  "M42.792 19.873A16.5 16.5 0 1 0 19.873 42.792A16.5 16.5 0 0 1 42.792 19.873Z"
] as const;
/** Centre of the clockwise neighbour of crescent i: each crescent passes under it. */
export const NEIGHBOUR = [[70.86, 29.14], [79.5, 50.0], [70.86, 70.86], [50.0, 79.5], [29.14, 70.86], [20.5, 50.0], [29.14, 29.14], [50.0, 20.5]] as const;
export const RADIUS = 16.5;
export const GAP = 1.6;
export const BODY = "M50 44.2C44.6 44.2 42.1 48 41.6 52.2C41.1 57.2 39.5 63.4 37.6 69.4Q37.3 70.6 38.5 70.6H61.5Q62.7 70.6 62.4 69.4C60.5 63.4 58.9 57.2 58.4 52.2C57.9 48 55.4 44.2 50 44.2Z";
export const PALLU = ["M42.2 48.6C49.6 52.4 55.6 59.6 59.2 69.2", "M41.6 53.0C47.6 56.2 52.4 62 55.2 69.4"] as const;
export const HEAD = { cx: 50, cy: 36.4, r: 5.4 };
/** Figure is scaled 1.16 about (50, 53) inside the ring. */
export const FIGURE_TRANSFORM = 'translate(50 53) scale(1.16) translate(-50 -53)';
