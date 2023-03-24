import { RouteValidation } from "@umccr/elsa-types";
import React, { Dispatch, SetStateAction } from "react";
import { Menu } from "../menu/menu";
import { MenuItem } from "../menu/menu-item";
import AuditEventUserFilterType = RouteValidation.AuditEventUserFilterType;
import { ToolTip } from "../tooltip";
import { useUiAllowed } from "../../hooks/ui-allowed";
import { ALLOWED_OVERALL_ADMIN_VIEW } from "@umccr/elsa-constants";

export type FilterMenuProps = {
  includeEvents: RouteValidation.AuditEventUserFilterType[];
  setIncludeEvents: Dispatch<SetStateAction<AuditEventUserFilterType[]>>;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  setCurrentTotal: Dispatch<SetStateAction<number>>;
  setUpdateData: Dispatch<SetStateAction<boolean>>;
};

/**
 * Menu for filtering audit events.
 */
export const FilterMenu = ({
  includeEvents,
  setIncludeEvents,
  setCurrentPage,
  setCurrentTotal,
  setUpdateData,
}: FilterMenuProps): JSX.Element => {
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
    <Menu heading={<>Filter audit events</>}>
      <MenuItem>
        <ToolTip
          trigger={
            <label className="flex grow content-center items-center pl-2 text-gray-800">
              <input
                className="mr-2 h-3 w-3 cursor-pointer rounded-sm"
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
      </MenuItem>
      <MenuItem>
        <ToolTip
          trigger={
            <label className="flex grow content-center items-center pl-2 text-gray-800">
              <input
                className="mr-2 h-3 w-3 cursor-pointer rounded-sm"
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
      </MenuItem>
      {allowed.has(ALLOWED_OVERALL_ADMIN_VIEW) && (
        <MenuItem>
          <ToolTip
            trigger={
              <label className="flex grow content-center items-center pl-2 text-gray-800">
                <input
                  className="mr-2 h-3 w-3 cursor-pointer rounded-sm"
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
        </MenuItem>
      )}
      {allowed.has(ALLOWED_OVERALL_ADMIN_VIEW) && (
        <MenuItem>
          <ToolTip
            trigger={
              <label className="flex grow content-center items-center pl-2 text-gray-800">
                <input
                  className="mr-2 h-3 w-3 cursor-pointer rounded-sm"
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
        </MenuItem>
      )}
    </Menu>
  );
};
