CREATE MIGRATION m1euvgge53nurlqopytrvzdmiedqcc4yasuz72lidm7trmbto7t2ha
    ONTO m17ibvtylic3vcs76juwofv2epzn67br6qow5zynfi3cfqu67utyua
{
  ALTER TYPE audit::AuditEvent {
      CREATE REQUIRED PROPERTY inProgress: std::bool {
          SET default := false;
      };
  };
};
