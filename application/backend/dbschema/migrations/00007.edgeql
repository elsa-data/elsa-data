CREATE MIGRATION m1ovbix2dqrbsphhycxj7v2qn76r6zqv3cm2yocuupo6jv264nhqzq
    ONTO m1qgau4ndf6o3jqgub6hosc3va4dpnxb6itcdrosm3sk5y7sfc5hgq
{
  ALTER TYPE release::Release {
      CREATE REQUIRED PROPERTY isAllowedPhenotypeData -> std::bool {
          SET REQUIRED USING (false);
      };
      CREATE REQUIRED PROPERTY isAllowedReadData -> std::bool {
          SET REQUIRED USING (false);
      };
      CREATE REQUIRED PROPERTY isAllowedVariantData -> std::bool {
          SET REQUIRED USING (false);
      };
  };
};
