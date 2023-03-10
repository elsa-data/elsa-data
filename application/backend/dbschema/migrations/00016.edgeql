CREATE MIGRATION m1ybtzphw6gvt3f4ykoa2egpxb7qycqs7wcpmatc2l7xctomnadjba
    ONTO m1w772xacqordjlwm3bj6yozqfveh2wzxu4aqfys2d6ed6tf54ouqq
{
  ALTER TYPE release::Release {
      CREATE REQUIRED PROPERTY isAllowedGSData -> std::bool {
          SET default := false;
      };
  };
  ALTER TYPE release::Release {
      ALTER PROPERTY isAllowedPhenotypeData {
          SET default := false;
      };
  };
  ALTER TYPE release::Release {
      CREATE REQUIRED PROPERTY isAllowedR2Data -> std::bool {
          SET default := false;
      };
  };
  ALTER TYPE release::Release {
      ALTER PROPERTY isAllowedReadData {
          SET default := false;
      };
  };
  ALTER TYPE release::Release {
      CREATE REQUIRED PROPERTY isAllowedS3Data -> std::bool {
          SET default := false;
      };
  };
  ALTER TYPE release::Release {
      ALTER PROPERTY isAllowedVariantData {
          SET default := false;
      };
  };
};
