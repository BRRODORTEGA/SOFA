export function ok<T>(data: T, init: ResponseInit = {}) {
  return Response.json({ ok: true, data }, { status: 200, ...init });
}

export function created<T>(data: T, init: ResponseInit = {}) {
  return Response.json({ ok: true, data }, { status: 201, ...init });
}

export function badRequest(message = "Bad Request") {
  return Response.json({ ok: false, error: message }, { status: 400 });
}

export function unprocessable(errors: any) {
  return Response.json({ ok: false, error: "Unprocessable Entity", details: errors }, { status: 422 });
}

export function notFound(message = "Not found") {
  return Response.json({ ok: false, error: message }, { status: 404 });
}

export function serverError(message = "Internal Server Error") {
  return Response.json({ ok: false, error: message }, { status: 500 });
}

export type Paginated<T> = { items: T[]; total: number; limit: number; offset: number };

export function paginateParams(searchParams: URLSearchParams) {
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
  const q = (searchParams.get("q") ?? "").trim();
  return { limit, offset, q };
}




