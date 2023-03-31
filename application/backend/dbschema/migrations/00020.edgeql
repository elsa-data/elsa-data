CREATE MIGRATION m1fdsz6kpwcf7q2re5uly4a5ysz5mqjf54dz36hbjrbab2hcafbjoq
    ONTO m1v4abs537ah5gus3ndpa3usluni455mxyk7qxjypvu5j6ett5iypq
{
  ALTER TYPE audit::DataAccessAuditEvent {
      DROP LINK release_;
      DROP PROPERTY egressBytes;
  };
  ALTER TYPE release::Release {
      DROP LINK dataAccessAuditLog;
  };
  DROP TYPE audit::DataAccessAuditEvent;
  CREATE TYPE release::DataAccessedRecord {
      CREATE PROPERTY description -> std::str;
      CREATE PROPERTY egressBytes -> std::int64;
      CREATE REQUIRED PROPERTY fileSize -> std::int64;
      CREATE REQUIRED PROPERTY fileUrl -> std::str;
      CREATE REQUIRED PROPERTY occurredDateTime -> std::datetime;
      CREATE REQUIRED PROPERTY releaseCount -> std::int32;
      CREATE PROPERTY sourceIpAddress -> std::str;
      CREATE PROPERTY sourceLocation -> std::str;
  };
  ALTER TYPE release::Release {
      CREATE MULTI LINK dataAccessedRecord -> release::DataAccessedRecord {
          ON TARGET DELETE RESTRICT;
      };
  };
  ALTER TYPE release::DataAccessedRecord {
      CREATE LINK release := (.<dataAccessedRecord[IS release::Release]);
  };
  ALTER TYPE release::Release {
      ALTER PROPERTY lastDateTimeDataAccessLogQuery {
          RENAME TO lastDataAccessQueryTimestamp;
      };
  };
};
