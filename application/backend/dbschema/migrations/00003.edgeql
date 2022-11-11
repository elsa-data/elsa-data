CREATE MIGRATION m17ysf4t5jsztke5s55zbnnwnrt6fr7kgkee5eylmkt4ufwkfsaamq
    ONTO m1i2d3di6zcpn6hygyz35ztwsrmwgvdaq7ibpw2tn42p4jxop67e3q
{
  ALTER TYPE audit::DataAccessAuditEvent {
      DROP LINK releaseAudit;
  };
  ALTER TYPE release::Release {
      CREATE MULTI LINK dataAccessAuditLog -> audit::DataAccessAuditEvent {
          ON SOURCE DELETE DELETE TARGET;
          ON TARGET DELETE RESTRICT;
      };
  };
  ALTER TYPE audit::DataAccessAuditEvent {
      CREATE LINK release_ := (.<dataAccessAuditLog[IS release::Release]);
  };
  ALTER TYPE audit::ReleaseAuditEvent {
      DROP LINK dataAccessAuditEvents;
  };
  ALTER TYPE release::Release {
      ALTER LINK auditLog {
          RENAME TO releaseAuditLog;
      };
  };
};
