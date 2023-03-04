import { AppError } from './errors'

export function assertHttpMethod(request: Request, method: string) {
  if (request.method.toLowerCase() !== method.toLowerCase()) {
    throw new AppError({
      message: `Method ${request.method} not allowed.`,
      status: 405,
    })
  }
}

export function assertPost(request: Request) {
  assertHttpMethod(request, 'POST')
}

export function assertGet(request: Request) {
  assertHttpMethod(request, 'GET')
}

export function assertPut(request: Request) {
  assertHttpMethod(request, 'PUT')
}

export function assertDelete(request: Request) {
  assertHttpMethod(request, 'DELETE')
}
