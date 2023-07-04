CREATE MIGRATION m17ibvtylic3vcs76juwofv2epzn67br6qow5zynfi3cfqu67utyua
    ONTO m1bizzba2fn6sie6eym2jep54a67lumiezkhsbpq4wg5gvh6lnjrwa
{
  ALTER TYPE release::Release {
      CREATE MULTI PROPERTY htsgetRestrictions: std::str;
  };
};
