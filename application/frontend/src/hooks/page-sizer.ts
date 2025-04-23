import { useCookies } from "react-cookie";
import {
  UI_PAGE_SIZE_COOKIE_NAME,
  UI_PAGE_SIZE_DEFAULT,
} from "../../../backend/src/shared/constants-cookies";

/**
 * Find the current UI wide page size - from either cookies or defaults.
 * This is just a simple wrapper around a hook - so I am not sure if this is officially
 * actually a hook or not... but the React linter made me treat it like one.
 */
export function usePageSizer(): number {
  const [cookies] = useCookies<any>([UI_PAGE_SIZE_COOKIE_NAME]);

  const pageSizeFromCookie = parseInt(cookies[UI_PAGE_SIZE_COOKIE_NAME]);

  return isFinite(pageSizeFromCookie)
    ? pageSizeFromCookie
    : UI_PAGE_SIZE_DEFAULT;
}
