CREATE MIGRATION m1xrjtf74ctw3zx23f7f2cq4rtzfyrjsxhhqv76o5qqotrn7t563eq
    ONTO m17ysf4t5jsztke5s55zbnnwnrt6fr7kgkee5eylmkt4ufwkfsaamq
{
  ALTER TYPE permission::PotentialUser {
      ALTER PROPERTY email {
          CREATE CONSTRAINT std::exclusive ON (std::str_lower(__subject__));
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
          CREATE CONSTRAINT std::exclusive ON (std::str_lower(__subject__));
      };
  };
};
