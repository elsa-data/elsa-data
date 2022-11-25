CREATE MIGRATION m1ilogluugx2uswekns6qqilwhvs5vdxncpnjp35d4vegpqeiwk4bq
    ONTO m1bvd6nj7f6xoi54eev5snbeavsli35iejhisxmg7fqqgujd3uvdgq
{
  ALTER TYPE storage::File {
      CREATE REQUIRED PROPERTY isDeleted -> std::bool {
          SET default := false;
      };
  };
};
