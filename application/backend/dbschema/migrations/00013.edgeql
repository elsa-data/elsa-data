CREATE MIGRATION m1l5uupghraajc57qflwe37pkra2ujtudh66mglzf537pwbx2bzgna
    ONTO m1yfjhn2ltzvdj6lbbe5img2e6vkr5cv6tdgjtkzxqatojg2ck5hvq
{
  ALTER TYPE release::Release {
      CREATE REQUIRED PROPERTY lastUpdated -> std::datetime {
          SET default := (std::datetime_current());
      };
  };
};
