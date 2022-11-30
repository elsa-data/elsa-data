CREATE MIGRATION m1qgau4ndf6o3jqgub6hosc3va4dpnxb6itcdrosm3sk5y7sfc5hgq
    ONTO m1bvd6nj7f6xoi54eev5snbeavsli35iejhisxmg7fqqgujd3uvdgq
{
  CREATE TYPE job::CloudFormationInstallJob EXTENDING job::Job {
      CREATE REQUIRED PROPERTY awsStackId -> std::str;
      CREATE REQUIRED PROPERTY s3HttpsUrl -> std::str;
  };
};
