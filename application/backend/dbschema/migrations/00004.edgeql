CREATE MIGRATION m1swsso2eo2gv3vsxensbhpjteidjydm6h7pvkhy4nrqqfdrbpf6lq
    ONTO m17ibvtylic3vcs76juwofv2epzn67br6qow5zynfi3cfqu67utyua
{
  ALTER TYPE release::DataEgressRecord {
      CREATE REQUIRED PROPERTY egressId: std::str {
          SET REQUIRED USING (SELECT
              <std::str>std::random()
          );
          CREATE CONSTRAINT std::exclusive;
      };
  };
};
