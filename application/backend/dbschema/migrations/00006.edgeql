CREATE MIGRATION m1jsh3lpg6if43yagemnjbkgzejmntxoyaabfi67io7e5budip7sma
    ONTO m1bvd6nj7f6xoi54eev5snbeavsli35iejhisxmg7fqqgujd3uvdgq
{
  ALTER TYPE dataset::Dataset {
      CREATE PROPERTY updatedDateTime -> std::datetime;
  };
  ALTER TYPE storage::File {
      CREATE REQUIRED PROPERTY isDeleted -> std::bool {
          SET default := false;
      };
  };
};
