CREATE MIGRATION m1pdfkemdbkdgtoh2f3rfnvhusstwnezbttmurpsufrlhtktp5gbcq
    ONTO m1l5uupghraajc57qflwe37pkra2ujtudh66mglzf537pwbx2bzgna
{
  ALTER TYPE audit::AuditEvent {
      ALTER PROPERTY whoDisplayName {
          RESET OPTIONALITY;
      };
  };
  ALTER TYPE audit::AuditEvent {
      ALTER PROPERTY whoId {
          RESET OPTIONALITY;
      };
  };
  CREATE TYPE audit::UserAuditEvent EXTENDING audit::AuditEvent;
  ALTER TYPE permission::User {
      CREATE MULTI LINK userAuditEvent -> audit::UserAuditEvent {
          ON TARGET DELETE RESTRICT;
      };
  };
  ALTER TYPE audit::UserAuditEvent {
      CREATE LINK user_ := (.<userAuditEvent[IS permission::User]);
  };
};
