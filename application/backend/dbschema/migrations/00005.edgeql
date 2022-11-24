CREATE MIGRATION m1inpqaucss5dh6s5i4dmmwrl7fai7o45clovxyywfhutnidg6rw2q
    ONTO m1xrjtf74ctw3zx23f7f2cq4rtzfyrjsxhhqv76o5qqotrn7t563eq
{
  ALTER TYPE storage::File {
      CREATE REQUIRED PROPERTY isAvailable -> std::bool {
          SET default := true;
      };
  };
};
