import React from "react";
import { LoggedInUser } from "../providers/logged-in-user-provider";
import { useNavigate } from "react-router-dom";
import { MenuItem } from "../components/menu/menu-item";
import { Menu } from "../components/menu/menu";

type Props = {
  user: LoggedInUser;
};

export const LayoutBaseHeaderUser: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <Menu
      heading={
        <>
          {user.displayName}
          {user.displayEmail && (
            <span className="ml-2 font-mono">{user.displayEmail}</span>
          )}
        </>
      }
    >
      <MenuItem>
        <button
          onClick={() => navigate(`/account`)}
          className="grow text-left indent-4"
        >
          Account settings
        </button>
      </MenuItem>
      <MenuItem>
        <form method="POST" action="/auth/logout" className="flex grow">
          <button type="submit" className="grow text-left indent-4">
            Log Out
          </button>
        </form>
      </MenuItem>
      <MenuItem>
        <form
          method="POST"
          action="/auth/logout-completely"
          className="flex grow"
        >
          <button type="submit" className="grow text-left indent-4">
            Log Out (Complete)
          </button>
        </form>
      </MenuItem>
    </Menu>
  );
};
