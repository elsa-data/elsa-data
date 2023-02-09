CREATE MIGRATION m1yfjhn2ltzvdj6lbbe5img2e6vkr5cv6tdgjtkzxqatojg2ck5hvq
    ONTO m1k2lbbf5wm2doned3xkdtnbapq3st6rnfoobmbfotgmvihcsjduiq
{
  ALTER TYPE lab::ArtifactVcf {
      CREATE PROPERTY sampleIds -> array<std::str>;
  };
};
