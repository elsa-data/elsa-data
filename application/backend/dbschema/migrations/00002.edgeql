CREATE MIGRATION m1bx4gtxpuxikvjkwmiunoqer2rg4kbgmfump6in4unct5krwx34zq
    ONTO m14c3ucfvfwnfnpalenmtbjf3zr3mioceo6o6nf55c2yfoqkacuaeq
{
  CREATE TYPE audit::DataAccessAuditEvent EXTENDING audit::AuditEvent {
      CREATE LINK file -> storage::File {
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
