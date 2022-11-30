CREATE MIGRATION m1wp6fqdhbpb2sggynxgz7yf5qlgnz567g733py3lsecrzs4t4a4oq
    ONTO m1ovbix2dqrbsphhycxj7v2qn76r6zqv3cm2yocuupo6jv264nhqzq
{
  CREATE TYPE job::CloudFormationDeleteJob EXTENDING job::Job {
      CREATE REQUIRED PROPERTY awsStackId -> std::str;
  };
  ALTER TYPE job::Job {
      CREATE INDEX ON (.status);
  };
};
