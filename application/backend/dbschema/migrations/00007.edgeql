CREATE MIGRATION m17u5wr5453fimt7vkqsiekedfwybejyj3syjyjhqygvukrhaduw6a
    ONTO m1jsh3lpg6if43yagemnjbkgzejmntxoyaabfi67io7e5budip7sma
{
  CREATE TYPE job::CloudFormationDeleteJob EXTENDING job::Job {
      CREATE REQUIRED PROPERTY awsStackId -> std::str;
  };
  ALTER TYPE job::Job {
      CREATE INDEX ON (.status);
  };
  CREATE TYPE job::CloudFormationInstallJob EXTENDING job::Job {
      CREATE REQUIRED PROPERTY awsStackId -> std::str;
      CREATE REQUIRED PROPERTY s3HttpsUrl -> std::str;
  };
  ALTER TYPE release::Release {
      CREATE REQUIRED PROPERTY isAllowedPhenotypeData -> std::bool {
          SET REQUIRED USING (true);
      };
      CREATE REQUIRED PROPERTY isAllowedReadData -> std::bool {
          SET REQUIRED USING (true);
      };
      CREATE REQUIRED PROPERTY isAllowedVariantData -> std::bool {
          SET REQUIRED USING (true);
      };
  };
};
