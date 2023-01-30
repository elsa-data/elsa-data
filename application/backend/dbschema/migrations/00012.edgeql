CREATE MIGRATION m1hdqyfgs5bkbuoxpn4vnojyunci335vehctsnaknvk2bzzvxxiybq
    ONTO m1k2lbbf5wm2doned3xkdtnbapq3st6rnfoobmbfotgmvihcsjduiq
{
  ALTER TYPE release::Release {
      CREATE REQUIRED PROPERTY lastUpdated -> std::datetime {
          SET default := (std::datetime_current());
      };
  };
};
