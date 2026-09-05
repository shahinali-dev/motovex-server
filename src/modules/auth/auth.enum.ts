// A plain const (not a TS enum, since enum members must be string/number)
// giving readable names to the boolean `success` flag used across the
// raw `res.json(...)` responses in auth.controller.ts.
export const IResponseStatus = {
  SUCCESS: true,
  ERROR: false,
} as const;
