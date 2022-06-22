import { FastifyReply, FastifyRequest } from "fastify";
import { isNumber } from "lodash";

const DEFAULT_PAGE_SIZE = 5;
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

export type PagedResult<T> = {
  data: T[];
  total: number;
  limit?: number;
  offset?: number;
  prev?: number;
  next?: number;
};

export function createPagedResult<T>(
  data: T[],
  total: number,
  limit?: number,
  offset?: number
): PagedResult<T> {
  const pr: PagedResult<T> = {
    data: data,
    total: total,
  };

  if (isNumber(limit) && isNumber(offset)) {
    pr.limit = limit;
    pr.offset = offset;

    if (offset > 0) {
      pr.prev = Math.max(0, offset - limit);
    }

    if (offset < total) {
      pr.next = Math.min(total, offset + limit);
    }
  }

  return pr;
}
