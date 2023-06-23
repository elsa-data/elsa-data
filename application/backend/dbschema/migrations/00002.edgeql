CREATE MIGRATION m1qotfeolmstr6xarz2n7imt4lfpub7xpc2zzaflzfigo6taimd4ua
    ONTO m1h7stuitcbnttllrpusnxes2yqxk3jinfelrcunilohbfvb2usbva
{
  ALTER TYPE release::Release {
      CREATE MULTI PROPERTY htsgetRestrictions: std::str;
  };
};
