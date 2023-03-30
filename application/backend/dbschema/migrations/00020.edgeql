CREATE MIGRATION m1dnakkp3srwppg447eavum55fou6wo2kqjkkdijujtcb6rv5gre3q
    ONTO m1v4abs537ah5gus3ndpa3usluni455mxyk7qxjypvu5j6ett5iypq
{
  ALTER TYPE release::Release {
      CREATE REQUIRED PROPERTY isAllowedHtsget -> std::bool {
          SET default := false;
      };
  };
};
