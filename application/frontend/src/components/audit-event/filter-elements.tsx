import { RouteValidation } from "@umccr/elsa-types";
import React, { Dispatch, SetStateAction } from "react";
import { ToolTip } from "../tooltip";
import AuditEventUserFilterType = RouteValidation.AuditEventUserFilterType;

export type FilterElementsProps = {
  includeEvents: RouteValidation.AuditEventUserFilterType[];
  setIncludeEvents: Dispatch<SetStateAction<AuditEventUserFilterType[]>>;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  setCurrentTotal: Dispatch<SetStateAction<number>>;
  setUpdateData: Dispatch<SetStateAction<boolean>>;
  showAdminView: boolean;
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
  showAdminView,
}: FilterElementsProps): JSX.Element => {
  const updateIncludeEvents = (checkbox: AuditEventUserFilterType[]) => {
    if (checkbox.every((value) => includeEvents.includes(value))) {
      setIncludeEvents(
        includeEvents.filter((value) => !checkbox.includes(value))
      );
    } else {
      setIncludeEvents([...includeEvents, ...checkbox]);
    }

    setCurrentPage(1);
    setCurrentTotal(1);
    setUpdateData(true);
  };

  return (
    <>
      <ToolTip
        trigger={
          <label className="flex grow content-center items-center rounded-sm pl-2">
            <input
              className="checkbox-accent checkbox checkbox-xs mr-2 cursor-pointer"
              type="checkbox"
              checked={includeEvents.includes("release")}
              onChange={() => updateIncludeEvents(["release"])}
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
              onChange={() => updateIncludeEvents(["user"])}
            />
            <div className="text-xs">User audit events</div>
          </label>
        }
        applyCSS={"font-normal flex content-center items-center grow"}
        description="Show non-release events"
      />
      {showAdminView && (
        <div className="flex">
          <div className="divider divider-horizontal"></div>
          <ToolTip
            trigger={
              <label className="flex grow content-center items-center">
                <input
                  className="toggle-accent toggle toggle-xs mr-2 cursor-pointer"
                  type="checkbox"
                  checked={
                    includeEvents.includes("system") &&
                    includeEvents.includes("all")
                  }
                  onChange={() => {
                    updateIncludeEvents(["all", "system"]);
                  }}
                />
                <div className="text-xs">Admin view</div>
              </label>
            }
            applyCSS={"font-normal flex content-center items-center grow"}
            description="Show an admin view of the table which includes all users' events"
          />
        </div>
      )}
    </>
  );
};
