import { RouteValidation } from "@umccr/elsa-types";
import React, { Dispatch, SetStateAction } from "react";
import { ToolTip } from "../tooltip";
import { useUiAllowed } from "../../hooks/ui-allowed";
import { ALLOWED_OVERALL_ADMIN_VIEW } from "@umccr/elsa-constants";
import AuditEventUserFilterType = RouteValidation.AuditEventUserFilterType;

export type FilterElementsProps = {
  includeEvents: RouteValidation.AuditEventUserFilterType[];
  setIncludeEvents: Dispatch<SetStateAction<AuditEventUserFilterType[]>>;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  setCurrentTotal: Dispatch<SetStateAction<number>>;
  setUpdateData: Dispatch<SetStateAction<boolean>>;
};

/**
 * Menu for filtering audit events.
 */
export const FilterElements = ({
  includeEvents,
  setIncludeEvents,
  setCurrentPage,
  setCurrentTotal,
  setUpdateData,
}: FilterElementsProps): JSX.Element => {
  const updateIncludeEvents = (checkbox: AuditEventUserFilterType) => {
    if (includeEvents.includes(checkbox)) {
      setIncludeEvents(includeEvents.filter((value) => value !== checkbox));
    } else {
      setIncludeEvents([...includeEvents, checkbox]);
    }

    setCurrentPage(1);
    setCurrentTotal(1);
    setUpdateData(true);
  };

  const allowed = useUiAllowed();

  return (
    <>
      <ToolTip
        trigger={
          <label className="flex grow content-center items-center rounded-sm pl-2">
            <input
              className="checkbox-accent checkbox checkbox-xs mr-2 cursor-pointer"
              type="checkbox"
              checked={includeEvents.includes("release")}
              onChange={() => updateIncludeEvents("release")}
            />
            <div className="text-xs">Release audit events</div>
          </label>
        }
        applyCSS={"font-normal flex content-center items-center grow"}
        description="Show events for all releases"
      />
      <ToolTip
        trigger={
          <label className="flex grow content-center items-center rounded-sm pl-2">
            <input
              className="checkbox-accent checkbox checkbox-xs mr-2 cursor-pointer"
              type="checkbox"
              checked={includeEvents.includes("user")}
              onChange={() => updateIncludeEvents("user")}
            />
            <div className="text-xs">User audit events</div>
          </label>
        }
        applyCSS={"font-normal flex content-center items-center grow"}
        description="Show non-release events"
      />
      {allowed.has(ALLOWED_OVERALL_ADMIN_VIEW) && (
        <ToolTip
          trigger={
            <label className="flex grow content-center items-center rounded-sm pl-2">
              <input
                className="checkbox-accent checkbox checkbox-xs mr-2 cursor-pointer"
                type="checkbox"
                checked={includeEvents.includes("system")}
                onChange={() => updateIncludeEvents("system")}
              />
              <div className="text-xs">System audit events</div>
            </label>
          }
          applyCSS={"font-normal flex content-center items-center grow"}
          description="Show system level events not tied to a user"
        />
      )}
      {allowed.has(ALLOWED_OVERALL_ADMIN_VIEW) && (
        <div className="flex">
          <div className="divider divider-horizontal"></div>
          <ToolTip
            trigger={
              <label className="flex grow content-center items-center">
                <input
                  className="toggle-accent toggle toggle-xs mr-2 cursor-pointer"
                  type="checkbox"
                  checked={includeEvents.includes("all")}
                  onChange={() => updateIncludeEvents("all")}
                />
                <div className="text-xs">All audit events</div>
              </label>
            }
            applyCSS={"font-normal flex content-center items-center grow"}
            description="Include all users' events"
          />
        </div>
      )}
    </>
  );
};
