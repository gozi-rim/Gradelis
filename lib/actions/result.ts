export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; message: string; errors?: Record<string, string[]> };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(
  message: string,
  errors?: Record<string, string[]>,
): ActionResult<T> {
  return { ok: false, message, errors };
}
