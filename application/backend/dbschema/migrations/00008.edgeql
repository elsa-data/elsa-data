CREATE MIGRATION m1vd4qiyhd4dgv3zyewyamize2nrm6e4rxn32fyl37yjxfypcl47ha
    ONTO m1fpuubbvyh7syvun7ewtzswxgiesvamgqm5xgyodftegwaina3fnq
{
  ALTER TYPE permission::PotentialUser {
      CREATE REQUIRED PROPERTY createdDateTime: std::datetime {
          SET default := (std::datetime_current());
          SET readonly := true;
      };
      CREATE REQUIRED PROPERTY futureIsAllowedCreateRelease: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY futureIsAllowedOverallAdministratorView: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY futureIsAllowedRefreshDatasetIndex: std::bool {
          SET default := false;
      };
  };
};
