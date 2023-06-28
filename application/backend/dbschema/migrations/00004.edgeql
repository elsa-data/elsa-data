CREATE MIGRATION m1w7u37iidzp26tefsdkr6xwwq3qku3czenswhbbubqt7ricbozjsa
    ONTO m17ibvtylic3vcs76juwofv2epzn67br6qow5zynfi3cfqu67utyua
{
  ALTER TYPE release::DataSharingConfiguration {
      ALTER PROPERTY awsAccessPointAccountId {
          RENAME TO awsAccessPointName;
      };
  };
  ALTER TYPE release::DataSharingConfiguration {
      DROP PROPERTY awsAccessPointVpcId;
  };
};
