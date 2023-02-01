CREATE MIGRATION m1vnmsx3tiv4mvl7gdjmecop2e7hny6lqh3nslxisb6v4jmlsinh7q
    ONTO m1l5uupghraajc57qflwe37pkra2ujtudh66mglzf537pwbx2bzgna
{
  ALTER TYPE dataset::Dataset {
      CREATE OPTIONAL PROPERTY dataOwnerEmailArray -> array<std::str>;
  };
};
