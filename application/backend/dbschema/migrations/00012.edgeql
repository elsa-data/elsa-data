CREATE MIGRATION m1etiee22vf4lfsm3jw7wv63fwx3nx3tnfsal6ox6wygln6v2maswa
    ONTO m1k2lbbf5wm2doned3xkdtnbapq3st6rnfoobmbfotgmvihcsjduiq
{
  ALTER TYPE lab::ArtifactBase {
      CREATE PROPERTY sampleIds -> array<std::str>;
  };
};
