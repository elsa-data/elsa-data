import { FastifyReply, FastifyRequest } from "fastify";

const DEFAULT_PAGE_SIZE = 2;
const DEFAULT_PAGE_SIZE_COOKIE_NAME = "elsa-page-size";

export function currentPageSize(request: FastifyRequest): number {
  const cookiePageSizeValue = request.cookies[DEFAULT_PAGE_SIZE_COOKIE_NAME];

  if (!cookiePageSizeValue) return DEFAULT_PAGE_SIZE;

  const cookieSetPageSize = parseInt(cookiePageSizeValue);

  if (isNaN(cookieSetPageSize)) return DEFAULT_PAGE_SIZE;

  if (!cookieSetPageSize) return DEFAULT_PAGE_SIZE;

  return cookieSetPageSize;
}

export function setPageSize(
  request: FastifyRequest,
  reply: FastifyReply,
  pageSize: number
): void {
  reply.setCookie(DEFAULT_PAGE_SIZE_COOKIE_NAME, pageSize.toString());
}
