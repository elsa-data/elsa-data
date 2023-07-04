CREATE MIGRATION m14vusedvn5asyxmhxcuam4md72nguug7fw7lzzsds4fipg7e3v6ha
    ONTO m1g7nv7dyddbdoy5l6yj53gh2dkv2wytkkecpxd23cevmnp3qb44sq
{
  CREATE MODULE mock IF NOT EXISTS;
  CREATE TYPE mock::AwsCloudFormationStack {
      CREATE REQUIRED PROPERTY installedDateTime: std::datetime;
      CREATE REQUIRED PROPERTY stackId: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY stackName: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
  };
  ALTER TYPE release::DataSharingConfiguration {
      ALTER PROPERTY awsAccessPointAccountId {
          RENAME TO awsAccessPointName;
      };
  };
  ALTER TYPE release::DataSharingConfiguration {
      DROP PROPERTY awsAccessPointVpcId;
  };
};
