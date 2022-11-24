CREATE MIGRATION m1yngzhfe336htzunuz2exdc4l4awvgtgiqlxvjznbvny2flevuzsa
    ONTO m1xrjtf74ctw3zx23f7f2cq4rtzfyrjsxhhqv76o5qqotrn7t563eq
{
  ALTER TYPE dataset::Dataset {
      ALTER PROPERTY uri {
          CREATE CONSTRAINT std::exclusive ON (std::str_lower(__subject__));
      };
  };
};
