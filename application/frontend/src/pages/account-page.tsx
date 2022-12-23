import {
  UI_PAGE_SIZE_COOKIE_NAME,
  UI_PAGE_SIZE_DEFAULT,
  USER_ALLOWED_COOKIE_NAME,
} from "@umccr/elsa-constants";
import { Card, Label, Radio } from "flowbite-react";
import React from "react";
import { useCookies } from "react-cookie";
import { LayoutBase } from "../layouts/layout-base";

type Props = {};

function AccountPage({}: Props) {
  return (
    <LayoutBase>
      <Card>
        <div>
          <div className="mb-4 border-b pb-4 text-xl font-semibold">
            Preference
          </div>
          <PageSizeSetting />
        </div>
      </Card>
    </LayoutBase>
  );
}

export default AccountPage;

/**
 * Helper Component
 */
const PageSizeSetting = () => {
  const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];

  const [cookies, setCookie, removeCookie] = useCookies<any>([
    UI_PAGE_SIZE_COOKIE_NAME,
    USER_ALLOWED_COOKIE_NAME,
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
            <Radio
              id={`page-size-${n}`}
              name="Page Size"
              value={n}
              onChange={() => mutatePageSizeCookie(n)}
              checked={n == pageSize}
              className="focus:ring-0"
            />
            <Label htmlFor={`page-size-${n}`}>{`${n}`} items</Label>
          </div>
        ))}
      </fieldset>
    </>
  );
};
