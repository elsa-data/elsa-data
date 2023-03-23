CREATE MIGRATION m1hy4gruokr3efblcplbldmrst7islgfx5sfloatuw27p3my32ce4a
    ONTO m1sdljd6avv3kjavniekruzju4g5y3u52j3afxt75r4lvhy3ykwxnq
{
  ALTER TYPE permission::User {
      ALTER PROPERTY isAllowedSyncDataAccessEvents {
          RENAME TO isAllowedChangeUserPermission;
      };
  };
  ALTER TYPE permission::User {
      ALTER PROPERTY isAllowedViewAllAuditEvents {
          RENAME TO isAllowedOverallAdministratorView;
      };
  };
  ALTER TYPE permission::User {
      DROP PROPERTY isAllowedViewAllReleases;
      DROP PROPERTY isAllowedViewDatasetContent;
      DROP PROPERTY isAllowedViewUserManagement;
  };
};
