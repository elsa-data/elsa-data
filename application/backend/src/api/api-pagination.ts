import { FastifyReply, FastifyRequest } from "fastify";
import {
  UI_PAGE_SIZE_COOKIE_NAME,
  UI_PAGE_SIZE_DEFAULT,
} from "@umccr/elsa-constants";

// NOTE: both fastify and axios are going to lowercase this anyhow - so mind as well start out that way
export const TOTAL_COUNT_HEADER_NAME = "elsa-total-count";
export const LAST_PAGE_HEADER_NAME = "elsa-last-page";
export const PAGE_SIZE_HEADER_NAME = "elsa-page-size";

export function currentPageSize(request: FastifyRequest): number {
  const cookiePageSizeValue = request.cookies[UI_PAGE_SIZE_COOKIE_NAME];

  if (!cookiePageSizeValue) return UI_PAGE_SIZE_DEFAULT;

  const cookieSetPageSize = parseInt(cookiePageSizeValue);

  if (isNaN(cookieSetPageSize)) return UI_PAGE_SIZE_DEFAULT;

  if (!cookieSetPageSize) return UI_PAGE_SIZE_DEFAULT;

  return cookieSetPageSize;
}

/*export function setPageSize(
  request: FastifyRequest,
  reply: FastifyReply,
  pageSize: number
): void {
  reply.setCookie(UI_PAGE_SIZE_COOKIE_NAME, pageSize.toString());
} */

export type PagedResult<T> = {
  data: T[];
  total: number;
  first: number;
  last: number;
};

/**
 * Create a paged result object from the results of an internal edge
 * db query we have made using limits/offsets. Our outer APIs always
 * use the concept of pages - so this converts back.
 *
 * @param data
 * @param total
 * @param pageSize
 */
export function createPagedResult<T>(
  data: T[],
  total: number,
  pageSize: number,
): PagedResult<T> {
  return {
    data: data,
    total: total,
    // note: our first page being 1 makes our last page one higher than you might expect!
    first: 1,
    last: Math.ceil(total / pageSize) + 1,
  };
}
