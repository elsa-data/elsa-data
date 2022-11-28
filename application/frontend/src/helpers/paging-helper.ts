import { AxiosResponse } from "axios";

/**
 * Inspect a response and if a valid new paging Total Count has been passed back, then
 * use that to set the current total state.
 *
 * @param response
 * @param setCurrentTotal
 */
export function handleTotalCountHeaders(
  response: AxiosResponse,
  setCurrentTotal: (value: ((prevState: number) => number) | number) => void
) {
  const newTotal = parseInt(
    response.headers["elsa-total-count"] ?? "not-a-number"
  );

  if (isFinite(newTotal)) setCurrentTotal(newTotal);
}
