CREATE MIGRATION m1fnmlcjii5j4qoodasenkbs73wvh6u7ws5e6dyhkvt4hfv5e6dx7q
    ONTO m1v6b372hl2vh5uwpg2nmg6etkk6mfzu36ttqmyzfsxsagmr5cws6a
{
  ALTER TYPE release::Release {
      CREATE REQUIRED PROPERTY isAllowedHtsget -> std::bool {
          SET default := false;
      };
  };
};
