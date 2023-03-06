CREATE MIGRATION m1bjz5dysaiuznrcfsn6xgi7xpbffyflhmx6pql3ovlxqtvbgua3na
    ONTO m1l5uupghraajc57qflwe37pkra2ujtudh66mglzf537pwbx2bzgna
{
  CREATE TYPE audit::UserAuditEvent EXTENDING audit::AuditEvent;
  ALTER TYPE permission::User {
      CREATE MULTI LINK userAuditEvent -> audit::UserAuditEvent {
          ON TARGET DELETE RESTRICT;
      };
  };
  ALTER TYPE audit::UserAuditEvent {
      CREATE LINK user_ := (.<userAuditEvent[IS permission::User]);
  };
  ALTER TYPE release::Release {
      CREATE MULTI LINK participants := (.<releaseParticipant[IS permission::User]);
  };
};
