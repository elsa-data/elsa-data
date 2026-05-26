CREATE MIGRATION m1hnf6bq7xcthcxbw52leehu4bu5mruafny6dkukwrhwciysl2p2qq
    ONTO m1uewbtxsevuacjfrcgbdll53iged3vuv2k3z3krqhc4himbbf7vza
{
  ALTER TYPE release::Release {
      CREATE REQUIRED PROPERTY isAllowedNciGlobusData: std::bool {
          SET default := false;
      };
  };
};
