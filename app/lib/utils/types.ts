export type Nullable<T> = {
  [P in keyof T]: T[P] | null
}

export type HTTPStatusCode = 200 | 204 | 400 | 401 | 403 | 404 | 404 | 405 | 500
