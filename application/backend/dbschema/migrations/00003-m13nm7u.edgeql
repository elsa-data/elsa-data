CREATE MIGRATION m13nm7ua7wjtofcffzdlgvd5djymgmo4dhmnbhj7eqv67wtaen64kq
    ONTO m1hnf6bq7xcthcxbw52leehu4bu5mruafny6dkukwrhwciysl2p2qq
{
  ALTER TYPE release::DataSharingConfiguration {
      CREATE REQUIRED PROPERTY globusEnabled: std::bool {
          SET default := false;
      };
  };
};
