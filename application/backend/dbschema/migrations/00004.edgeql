CREATE MIGRATION m14niccvkffi63d26dh5u2fnvbxisijg2uu3gwi5ham3rixe7nrhma
    ONTO m17ysf4t5jsztke5s55zbnnwnrt6fr7kgkee5eylmkt4ufwkfsaamq
{
  ALTER TYPE permission::PotentialUser {
      ALTER PROPERTY email {
          CREATE CONSTRAINT std::exclusive;
      };
      ALTER PROPERTY email {
          SET readonly := true;
          SET REQUIRED USING (SELECT
              <std::str>permission::PotentialUser.displayName
          );
      };
  };
  ALTER TYPE permission::User {
      CREATE REQUIRED PROPERTY email -> std::str {
          SET readonly := true;
          SET REQUIRED USING (SELECT
              <std::str>permission::User.displayName
          );
          CREATE CONSTRAINT std::exclusive;
      };
  };
};
