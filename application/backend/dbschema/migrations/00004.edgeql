CREATE MIGRATION m1g7nv7dyddbdoy5l6yj53gh2dkv2wytkkecpxd23cevmnp3qb44sq
    ONTO m17ibvtylic3vcs76juwofv2epzn67br6qow5zynfi3cfqu67utyua
{
  ALTER TYPE audit::AuditEvent {
      CREATE REQUIRED PROPERTY inProgress: std::bool {
          SET REQUIRED USING (<std::bool>false);
      };
  };
};
