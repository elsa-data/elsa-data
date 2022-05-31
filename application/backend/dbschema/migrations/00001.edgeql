CREATE MIGRATION m1jcoy5xnttrspspcbxrwwksojcmjcy2edf5cyctg5dvslq536rreq
    ONTO initial
{
  CREATE MODULE consent IF NOT EXISTS;
  CREATE MODULE dataset IF NOT EXISTS;
  CREATE MODULE lab IF NOT EXISTS;
  CREATE MODULE release IF NOT EXISTS;
  CREATE ABSTRACT TYPE consent::ConsentStatement;
  CREATE TYPE consent::Consent {
      CREATE MULTI LINK statements -> consent::ConsentStatement {
          ON TARGET DELETE  ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
  };
  CREATE ABSTRACT TYPE dataset::DatasetIdentifiable {
      CREATE PROPERTY externalIdentifiers -> array<tuple<system: std::str, value: std::str>>;
  };
  CREATE ABSTRACT TYPE dataset::DatasetShareable {
      CREATE LINK consent -> consent::Consent;
  };
  CREATE TYPE dataset::Dataset EXTENDING dataset::DatasetShareable, dataset::DatasetIdentifiable {
      CREATE OPTIONAL LINK previous -> dataset::Dataset;
      CREATE REQUIRED PROPERTY description -> std::str;
      CREATE REQUIRED PROPERTY uri -> std::str {
          SET readonly := true;
      };
  };
  CREATE TYPE dataset::DatasetCase EXTENDING dataset::DatasetShareable, dataset::DatasetIdentifiable;
  ALTER TYPE dataset::Dataset {
      CREATE MULTI LINK cases -> dataset::DatasetCase {
          ON TARGET DELETE  ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
  };
  CREATE TYPE dataset::DatasetPatient EXTENDING dataset::DatasetShareable, dataset::DatasetIdentifiable;
  ALTER TYPE dataset::DatasetCase {
      CREATE MULTI LINK patients -> dataset::DatasetPatient {
          ON TARGET DELETE  ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE LINK dataset := (.<cases[IS dataset::Dataset]);
  };
  CREATE SCALAR TYPE lab::ChecksumType EXTENDING enum<MD5, `AWS-ETAG`, `SHA-1`, `SHA-256`>;
  CREATE ABSTRACT TYPE lab::ArtifactBase {
      CREATE PROPERTY checksums -> array<tuple<type: lab::ChecksumType, value: std::str>>;
      CREATE REQUIRED PROPERTY size -> std::int64;
      CREATE REQUIRED PROPERTY url -> std::str;
  };
  CREATE TYPE dataset::DatasetSpecimen EXTENDING dataset::DatasetShareable, dataset::DatasetIdentifiable {
      CREATE MULTI LINK artifacts -> lab::ArtifactBase;
  };
  CREATE ABSTRACT TYPE release::ReleaseIdentifiable {
      CREATE PROPERTY externalIdentifiers -> array<tuple<system: std::str, value: std::str>>;
  };
  CREATE ABSTRACT TYPE release::ReleaseShareable {
      CREATE LINK consent -> consent::Consent;
      CREATE REQUIRED PROPERTY included -> std::bool;
  };
  CREATE TYPE release::ReleaseCase EXTENDING release::ReleaseShareable, release::ReleaseIdentifiable;
  CREATE TYPE release::ReleaseDataset EXTENDING release::ReleaseShareable, release::ReleaseIdentifiable {
      CREATE MULTI LINK cases -> release::ReleaseCase {
          ON TARGET DELETE  ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY description -> std::str;
      CREATE REQUIRED PROPERTY uri -> std::str {
          SET readonly := true;
      };
  };
  CREATE TYPE release::ReleaseSpecimen EXTENDING release::ReleaseShareable, release::ReleaseIdentifiable {
      CREATE MULTI LINK artifacts -> lab::ArtifactBase;
  };
  CREATE TYPE release::ReleasePatient EXTENDING release::ReleaseShareable, release::ReleaseIdentifiable {
      CREATE MULTI LINK specimens -> release::ReleaseSpecimen {
          ON TARGET DELETE  ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
  };
  CREATE ABSTRACT TYPE lab::AnalysesArtifactBase EXTENDING lab::ArtifactBase;
  CREATE TYPE lab::AnalysesArtifactBam EXTENDING lab::AnalysesArtifactBase {
      CREATE PROPERTY urlBai -> std::str;
  };
  CREATE TYPE lab::AnalysesArtifactVcf EXTENDING lab::AnalysesArtifactBase {
      CREATE PROPERTY urlTbi -> std::str;
  };
  CREATE ABSTRACT TYPE lab::RunArtifactBase EXTENDING lab::ArtifactBase;
  CREATE TYPE lab::RunArtifactFastqPair EXTENDING lab::RunArtifactBase {
      CREATE PROPERTY urlR2 -> std::str;
  };
  CREATE TYPE lab::RunArtifactBcl EXTENDING lab::RunArtifactBase;
  CREATE TYPE consent::ConsentStatementDuo EXTENDING consent::ConsentStatement {
      CREATE REQUIRED PROPERTY dataUseLimitation -> std::json;
  };
  ALTER TYPE dataset::DatasetPatient {
      CREATE LINK dataset := (.<patients[IS dataset::DatasetCase].<cases[IS dataset::Dataset]);
      CREATE MULTI LINK specimens -> dataset::DatasetSpecimen {
          ON TARGET DELETE  ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
  };
  ALTER TYPE dataset::DatasetSpecimen {
      CREATE LINK dataset := (.<specimens[IS dataset::DatasetPatient].<patients[IS dataset::DatasetCase].<cases[IS dataset::Dataset]);
  };
  CREATE TYPE lab::Analyses {
      CREATE MULTI LINK input -> lab::RunArtifactBase;
      CREATE MULTI LINK output -> lab::AnalysesArtifactBase {
          ON TARGET DELETE  ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE PROPERTY analysesDate -> std::datetime;
      CREATE PROPERTY pipeline -> std::str;
  };
  CREATE TYPE lab::SubmissionBatch {
      CREATE MULTI LINK artifactsIncluded -> lab::ArtifactBase {
          ON TARGET DELETE  ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE PROPERTY externalIdentifier -> std::str;
  };
  CREATE TYPE lab::Run {
      CREATE MULTI LINK artifactsProduced -> lab::RunArtifactBase {
          ON TARGET DELETE  ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE PROPERTY platform -> std::str;
      CREATE PROPERTY runDate -> std::datetime;
  };
  CREATE TYPE release::AuditEvent {
      CREATE REQUIRED PROPERTY occurredDateTime -> std::datetime;
      CREATE PROPERTY occurredDuration -> std::duration;
      CREATE REQUIRED PROPERTY recordedDateTime -> std::datetime {
          SET default := (std::datetime_current());
          SET readonly := true;
      };
      CREATE PROPERTY what -> std::str;
  };
  CREATE TYPE release::Release {
      CREATE MULTI LINK manualExclusions -> release::ReleaseShareable {
          CREATE PROPERTY reason -> std::str;
          CREATE PROPERTY recorded -> std::str;
          CREATE PROPERTY who -> std::str;
      };
      CREATE MULTI LINK sharedContent -> release::ReleaseDataset {
          ON TARGET DELETE  ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE PROPERTY applicationCoded -> std::json;
      CREATE PROPERTY applicationDacDetails -> std::str;
      CREATE PROPERTY applicationDacIdentifier -> std::str;
      CREATE PROPERTY applicationDacTitle -> std::str;
      CREATE REQUIRED PROPERTY created -> std::datetime {
          SET default := (std::datetime_current());
          SET readonly := true;
      };
      CREATE REQUIRED PROPERTY datasetUris -> array<std::str>;
      CREATE PROPERTY releaseEnded -> std::datetime;
      CREATE PROPERTY releaseIdentifier -> std::str;
      CREATE PROPERTY releaseStarted -> std::datetime;
  };
  ALTER TYPE release::ReleaseCase {
      CREATE LINK dataset := (.<cases[IS release::ReleaseDataset]);
      CREATE MULTI LINK patients -> release::ReleasePatient {
          ON TARGET DELETE  ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
  };
  ALTER TYPE release::ReleasePatient {
      CREATE LINK dataset := (.<patients[IS release::ReleaseCase].<cases[IS release::ReleaseDataset]);
  };
  ALTER TYPE release::ReleaseSpecimen {
      CREATE LINK dataset := (.<specimens[IS release::ReleasePatient].<patients[IS release::ReleaseCase].<cases[IS release::ReleaseDataset]);
  };
};
