CREATE MIGRATION m1fdmb7aesr3wsko2bzjt74vd735exx3asniauaiye7tl6a6mak2wa
    ONTO m1ybtzphw6gvt3f4ykoa2egpxb7qycqs7wcpmatc2l7xctomnadjba
{
  ALTER TYPE permission::PotentialUser {
      ALTER LINK futureReleaseParticipant {
          ALTER PROPERTY role {
              CREATE CONSTRAINT std::one_of('Administrator', 'Manager', 'Member');
          };
      };
  };
  ALTER TYPE permission::PotentialUser {
      ALTER LINK futureReleaseParticipant {
          ALTER PROPERTY role {
              DROP CONSTRAINT std::one_of('DataOwner', 'Member', 'PI');
          };
      };
  };
  ALTER TYPE permission::User {
      ALTER LINK releaseParticipant {
          ALTER PROPERTY role {
              CREATE CONSTRAINT std::one_of('Administrator', 'Manager', 'Member');
          };
      };
  };
  ALTER TYPE permission::User {
      ALTER LINK releaseParticipant {
          ALTER PROPERTY role {
              DROP CONSTRAINT std::one_of('DataOwner', 'Member', 'PI');
          };
      };
  };
  ALTER TYPE permission::User {
      ALTER PROPERTY allowedChangeReleaseDataOwner {
          RENAME TO isAllowedChangeReleaseDataOwner;
      };
  };
  ALTER TYPE permission::User {
      ALTER PROPERTY allowedCreateRelease {
          RENAME TO isAllowedCreateRelease;
      };
  };
  ALTER TYPE permission::User {
      ALTER PROPERTY allowedImportDataset {
          RENAME TO isAllowedImportDataset;
      };
  };
  ALTER TYPE permission::User {
      CREATE REQUIRED PROPERTY isAllowedSyncDataAccessEvents -> std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY isAllowedViewAllAuditEvents -> std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY isAllowedViewDatasetContent -> std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY isAllowedViewUserManagement -> std::bool {
          SET default := false;
      };
  };
};
