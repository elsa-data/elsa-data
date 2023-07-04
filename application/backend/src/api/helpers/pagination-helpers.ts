import { FastifyRequest } from "fastify";
import {
  UI_PAGE_SIZE_COOKIE_NAME,
  UI_PAGE_SIZE_DEFAULT,
} from "@umccr/elsa-constants";

// NOTE: both fastify and axios are going to lowercase this anyhow - so mind as well start out that way
export const TOTAL_COUNT_HEADER_NAME = "elsa-total-count";

export function currentPageSize(request: FastifyRequest): number {
  const cookiePageSizeValue = request.cookies[UI_PAGE_SIZE_COOKIE_NAME];

  if (!cookiePageSizeValue) return UI_PAGE_SIZE_DEFAULT;

  const cookieSetPageSize = parseInt(cookiePageSizeValue);

  if (isNaN(cookieSetPageSize)) return UI_PAGE_SIZE_DEFAULT;

  if (!cookieSetPageSize) return UI_PAGE_SIZE_DEFAULT;

  return cookieSetPageSize;
}

export type PagedResult<T> = {
  data?: T[];
  total: number;
};

/**
 * Create a paged result object from the results of an internal edge
 * db query we have made using limits/offsets.
 *
 * @param data
 * @param total
 */
export function createPagedResult<T>(
  data: T[],
  total?: number
): PagedResult<T> {
  return {
    data: data,
    total: total !== undefined ? total : data.length,
  };
}
