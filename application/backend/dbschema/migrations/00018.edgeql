CREATE MIGRATION m1q67hd73w556ohmmajbcjexso7d7kejpkh7l4htjwpzu4e2ggkaoa
    ONTO m1sdljd6avv3kjavniekruzju4g5y3u52j3afxt75r4lvhy3ykwxnq
{
  ALTER TYPE permission::User {
      ALTER PROPERTY isAllowedSyncDataAccessEvents {
          RENAME TO isAllowedChangeUserPermission;
      };
  };
  ALTER TYPE permission::User {
      ALTER PROPERTY isAllowedViewAllAuditEvents {
          RENAME TO isAllowedElsaAdminView;
      };
  };
  ALTER TYPE permission::User {
      DROP PROPERTY isAllowedViewAllReleases;
      DROP PROPERTY isAllowedViewDatasetContent;
      DROP PROPERTY isAllowedViewUserManagement;
  };
};
