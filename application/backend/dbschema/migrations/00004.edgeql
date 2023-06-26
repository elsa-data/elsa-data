CREATE MIGRATION m1iqeqb4xlyi246kglubcmeyqozjoibascx75d7y333d4pfv57n3ea
    ONTO m17ibvtylic3vcs76juwofv2epzn67br6qow5zynfi3cfqu67utyua
{
  ALTER TYPE release::DataSharingConfiguration {
      CREATE MULTI PROPERTY htsgetRestrictions: std::str;
  };
  ALTER TYPE release::Release {
      DROP PROPERTY htsgetRestrictions;
  };
};
