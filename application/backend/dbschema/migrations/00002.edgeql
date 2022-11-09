CREATE MIGRATION m1i2d3di6zcpn6hygyz35ztwsrmwgvdaq7ibpw2tn42p4jxop67e3q
    ONTO m1nv55thvouf4q54d2x2fw5m24u7n7vo3ps6vcc674wklv7yoqvvsa
{
  CREATE TYPE audit::DataAccessAuditEvent EXTENDING audit::AuditEvent {
      CREATE REQUIRED LINK file -> storage::File {
          ON TARGET DELETE ALLOW;
      };
      CREATE REQUIRED PROPERTY egressBytes -> std::int64;
  };
  ALTER TYPE audit::ReleaseAuditEvent {
      CREATE MULTI LINK dataAccessAuditEvents -> audit::DataAccessAuditEvent {
          ON SOURCE DELETE DELETE TARGET;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE LINK release_ := (.<auditLog[IS release::Release]);
  };
  ALTER TYPE audit::DataAccessAuditEvent {
      CREATE LINK releaseAudit := (.<dataAccessAuditEvents[IS audit::ReleaseAuditEvent]);
  };
};
