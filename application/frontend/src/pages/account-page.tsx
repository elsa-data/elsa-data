import {
  UI_PAGE_SIZE_COOKIE_NAME,
  UI_PAGE_SIZE_DEFAULT,
} from "@umccr/elsa-constants";
import React from "react";
import { useCookies } from "react-cookie";

type Props = {};

export const AccountPage = ({}: Props) => {
  return (
    <div className="card">
      <div className="mb-4 border-b pb-4 text-xl font-semibold">Preference</div>
      <PageSizeSetting />
    </div>
  );
};

/**
 * Helper Component
 */
const PageSizeSetting = () => {
  const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

  const [cookies, setCookie, removeCookie] = useCookies<any>([
    UI_PAGE_SIZE_COOKIE_NAME,
  ]);

  const pageSizeFromCookie = parseInt(cookies[UI_PAGE_SIZE_COOKIE_NAME]);
  const pageSize = isFinite(pageSizeFromCookie)
    ? pageSizeFromCookie
    : UI_PAGE_SIZE_DEFAULT;

  const mutatePageSizeCookie = (newVal?: number) => {
    if (newVal)
      setCookie(UI_PAGE_SIZE_COOKIE_NAME, newVal.toString(), { path: "/" });
    else removeCookie(UI_PAGE_SIZE_COOKIE_NAME, { path: "/" });
  };

  return (
    <>
      <fieldset className="flex flex-col gap-4" id="radio">
        <legend className="mb-4">Page size</legend>

        {PAGE_SIZE_OPTIONS.map((n) => (
          <div key={`${n}`} className="flex items-center gap-2">
            <input
              id={`page-size-${n}`}
              type="radio"
              name="Page Size"
              onChange={() => mutatePageSizeCookie(n)}
              checked={n == pageSize}
              className="radio focus:ring-0"
            />
            <label htmlFor={`page-size-${n}`}>{`${n}`} items</label>
          </div>
        ))}
      </fieldset>
    </>
  );
};
