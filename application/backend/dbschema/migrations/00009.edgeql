CREATE MIGRATION m17pteuvf76qlxru6so7lual37gprskzdqdyyzpoqr4rlk5rb2zkra
    ONTO m1vd4qiyhd4dgv3zyewyamize2nrm6e4rxn32fyl37yjxfypcl47ha
{
  ALTER TYPE permission::PotentialUser {
      ALTER PROPERTY futureIsAllowedCreateRelease {
          RENAME TO isAllowedCreateRelease;
      };
  };
  ALTER TYPE permission::PotentialUser {
      ALTER PROPERTY futureIsAllowedOverallAdministratorView {
          RENAME TO isAllowedOverallAdministratorView;
      };
  };
  ALTER TYPE permission::PotentialUser {
      ALTER PROPERTY futureIsAllowedRefreshDatasetIndex {
          RENAME TO isAllowedRefreshDatasetIndex;
      };
  };
};
