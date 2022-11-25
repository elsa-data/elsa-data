CREATE MIGRATION m1bvd6nj7f6xoi54eev5snbeavsli35iejhisxmg7fqqgujd3uvdgq
    ONTO m1xrjtf74ctw3zx23f7f2cq4rtzfyrjsxhhqv76o5qqotrn7t563eq
{
  ALTER TYPE dataset::Dataset {
      CREATE REQUIRED PROPERTY isInConfig -> std::bool {
          SET default := true;
      };
      ALTER PROPERTY uri {
          CREATE CONSTRAINT std::exclusive ON (std::str_lower(__subject__));
      };
  };
};
