CREATE MIGRATION m1lalck6ohk7f362n3ct6vw5ribeslty7cfyy2z76my5uezv47twha
    ONTO initial
{
  CREATE MODULE audit IF NOT EXISTS;
  CREATE MODULE consent IF NOT EXISTS;
  CREATE MODULE dataset IF NOT EXISTS;
  CREATE MODULE job IF NOT EXISTS;
  CREATE MODULE lab IF NOT EXISTS;
  CREATE MODULE mock IF NOT EXISTS;
  CREATE MODULE pedigree IF NOT EXISTS;
  CREATE MODULE permission IF NOT EXISTS;
  CREATE MODULE release IF NOT EXISTS;
  CREATE MODULE storage IF NOT EXISTS;
  CREATE SCALAR TYPE release::ApplicationCodedStudyType EXTENDING enum<GRU, HMB, CC, POA, DS>;
  CREATE TYPE release::ApplicationCoded {
      CREATE REQUIRED PROPERTY countriesInvolved: array<tuple<system: std::str, code: std::str>>;
      CREATE REQUIRED PROPERTY diseasesOfStudy: array<tuple<system: std::str, code: std::str>>;
      CREATE REQUIRED PROPERTY beaconQuery: std::json;
      CREATE REQUIRED PROPERTY studyAgreesToPublish: std::bool;
      CREATE REQUIRED PROPERTY studyIsNotCommercial: std::bool;
      CREATE REQUIRED PROPERTY studyType: release::ApplicationCodedStudyType;
  };
  CREATE ABSTRACT TYPE consent::ConsentStatement;
  CREATE TYPE consent::Consent {
      CREATE MULTI LINK statements: consent::ConsentStatement {
          ON SOURCE DELETE DELETE TARGET;
          ON TARGET DELETE ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
  };
  CREATE ABSTRACT TYPE dataset::DatasetIdentifiable {
      CREATE PROPERTY externalIdentifiers: array<tuple<system: std::str, value: std::str>>;
  };
  CREATE ABSTRACT TYPE dataset::DatasetShareable {
      CREATE LINK consent: consent::Consent {
          ON SOURCE DELETE DELETE TARGET;
          ON TARGET DELETE ALLOW;
      };
  };
  CREATE TYPE dataset::Dataset EXTENDING dataset::DatasetShareable, dataset::DatasetIdentifiable {
      CREATE OPTIONAL LINK previous: dataset::Dataset;
      CREATE REQUIRED PROPERTY description: std::str;
      CREATE REQUIRED PROPERTY isInConfig: std::bool {
          SET default := true;
      };
      CREATE PROPERTY updatedDateTime: std::datetime;
      CREATE REQUIRED PROPERTY uri: std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::exclusive ON (std::str_lower(__subject__));
      };
  };
  CREATE TYPE dataset::DatasetCase EXTENDING dataset::DatasetShareable, dataset::DatasetIdentifiable;
  ALTER TYPE dataset::Dataset {
      CREATE MULTI LINK cases: dataset::DatasetCase {
          ON SOURCE DELETE DELETE TARGET;
          ON TARGET DELETE ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
  };
  CREATE SCALAR TYPE dataset::SexAtBirthType EXTENDING enum<male, female, other>;
  CREATE TYPE dataset::DatasetPatient EXTENDING dataset::DatasetShareable, dataset::DatasetIdentifiable {
      CREATE OPTIONAL PROPERTY sexAtBirth: dataset::SexAtBirthType;
  };
  ALTER TYPE dataset::DatasetCase {
      CREATE MULTI LINK patients: dataset::DatasetPatient {
          ON SOURCE DELETE DELETE TARGET;
          ON TARGET DELETE ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE LINK dataset := (.<cases[IS dataset::Dataset]);
  };
  CREATE ABSTRACT TYPE lab::ArtifactBase;
  CREATE TYPE dataset::DatasetSpecimen EXTENDING dataset::DatasetShareable, dataset::DatasetIdentifiable {
      CREATE MULTI LINK artifacts: lab::ArtifactBase;
      CREATE OPTIONAL PROPERTY sampleType: std::str;
  };
  CREATE SCALAR TYPE storage::ChecksumType EXTENDING enum<MD5, AWS_ETAG, SHA_1, SHA_256>;
  CREATE TYPE storage::File {
      CREATE REQUIRED PROPERTY checksums: array<tuple<type: storage::ChecksumType, value: std::str>>;
      CREATE REQUIRED PROPERTY isDeleted: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY size: std::int64;
      CREATE REQUIRED PROPERTY url: std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::exclusive ON (std::str_lower(__subject__));
          CREATE CONSTRAINT std::min_len_value(5);
      };
  };
  CREATE FUNCTION dataset::extractIdentifierValue(i: tuple<system: std::str, value: std::str>) ->  std::str USING (i.value);
  CREATE SCALAR TYPE audit::ActionType EXTENDING enum<C, R, U, D, E>;
  CREATE ABSTRACT TYPE audit::AuditEvent {
      CREATE REQUIRED PROPERTY updatedDateTime: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE INDEX ON (.updatedDateTime);
      CREATE REQUIRED PROPERTY actionCategory: audit::ActionType;
      CREATE REQUIRED PROPERTY actionDescription: std::str;
      CREATE PROPERTY details: std::json;
      CREATE REQUIRED PROPERTY inProgress: std::bool;
      CREATE REQUIRED PROPERTY occurredDateTime: std::datetime;
      CREATE PROPERTY occurredDuration: std::duration;
      CREATE REQUIRED PROPERTY outcome: std::int16 {
          CREATE CONSTRAINT std::one_of(0, 4, 8, 12);
      };
      CREATE REQUIRED PROPERTY recordedDateTime: std::datetime {
          SET default := (std::datetime_current());
          SET readonly := true;
      };
  };
  CREATE ABSTRACT TYPE audit::OwnedAuditEvent EXTENDING audit::AuditEvent {
      CREATE REQUIRED PROPERTY whoDisplayName: std::str;
      CREATE REQUIRED PROPERTY whoId: std::str;
  };
  CREATE TYPE audit::ReleaseAuditEvent EXTENDING audit::OwnedAuditEvent;
  CREATE TYPE audit::SystemAuditEvent EXTENDING audit::AuditEvent;
  CREATE TYPE audit::UserAuditEvent EXTENDING audit::OwnedAuditEvent;
  CREATE SCALAR TYPE job::JobStatus EXTENDING enum<running, succeeded, failed, cancelled>;
  CREATE ABSTRACT TYPE job::Job {
      CREATE REQUIRED LINK auditEntry: audit::AuditEvent;
      CREATE REQUIRED PROPERTY created: std::datetime {
          SET default := (std::datetime_current());
          SET readonly := true;
      };
      CREATE OPTIONAL PROPERTY ended: std::datetime;
      CREATE REQUIRED PROPERTY messages: array<std::str>;
      CREATE REQUIRED PROPERTY percentDone: std::int16 {
          CREATE CONSTRAINT std::max_value(100);
          CREATE CONSTRAINT std::min_value(0);
      };
      CREATE REQUIRED PROPERTY requestedCancellation: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY started: std::datetime;
      CREATE REQUIRED PROPERTY status: job::JobStatus;
      CREATE INDEX ON (.status);
  };
  CREATE TYPE job::CloudFormationDeleteJob EXTENDING job::Job {
      CREATE REQUIRED PROPERTY awsStackId: std::str;
  };
  CREATE TYPE job::CloudFormationInstallJob EXTENDING job::Job {
      CREATE REQUIRED PROPERTY awsStackId: std::str;
      CREATE REQUIRED PROPERTY s3HttpsUrl: std::str;
  };
  CREATE TYPE job::CopyOutJob EXTENDING job::Job {
      CREATE REQUIRED PROPERTY awsExecutionArn: std::str;
  };
  CREATE TYPE job::SelectJob EXTENDING job::Job {
      CREATE MULTI LINK todoQueue: dataset::DatasetCase {
          ON TARGET DELETE ALLOW;
      };
      CREATE MULTI LINK selectedSpecimens: dataset::DatasetSpecimen {
          ON TARGET DELETE ALLOW;
      };
      CREATE REQUIRED PROPERTY initialTodoCount: std::int32;
  };
  CREATE TYPE release::Activation {
      CREATE REQUIRED PROPERTY activatedAt: std::datetime {
          SET default := (std::datetime_current());
          SET readonly := true;
      };
      CREATE REQUIRED PROPERTY activatedByDisplayName: std::str;
      CREATE REQUIRED PROPERTY activatedById: std::str;
      CREATE REQUIRED PROPERTY manifest: std::json;
      CREATE REQUIRED PROPERTY manifestEtag: std::str;
  };
  CREATE TYPE release::DataSharingConfiguration {
      CREATE REQUIRED PROPERTY awsAccessPointEnabled: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY awsAccessPointName: std::str {
          SET default := '';
      };
      CREATE REQUIRED PROPERTY copyOutDestinationLocation: std::str {
          SET default := '';
      };
      CREATE REQUIRED PROPERTY copyOutEnabled: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY gcpStorageIamEnabled: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY gcpStorageIamUsers: array<std::str> {
          SET default := (<array<std::str>>[]);
      };
      CREATE REQUIRED PROPERTY htsgetEnabled: std::bool {
          SET default := false;
      };
      CREATE MULTI PROPERTY htsgetRestrictions: std::str;
      CREATE REQUIRED PROPERTY objectSigningEnabled: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY objectSigningExpiryHours: std::int16 {
          SET default := ((6 * 24));
      };
  };
  CREATE SCALAR TYPE release::ReleaseCounterSequence EXTENDING std::sequence;
  CREATE TYPE release::Release {
      CREATE MULTI LINK releaseAuditLog: audit::ReleaseAuditEvent {
          ON TARGET DELETE RESTRICT;
      };
      CREATE MULTI LINK selectedSpecimens: dataset::DatasetSpecimen {
          ON TARGET DELETE ALLOW;
      };
      CREATE OPTIONAL LINK activation: release::Activation {
          ON SOURCE DELETE DELETE TARGET;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE OPTIONAL MULTI LINK previouslyActivated: release::Activation {
          ON SOURCE DELETE DELETE TARGET;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED LINK applicationCoded: release::ApplicationCoded {
          ON SOURCE DELETE DELETE TARGET;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED LINK dataSharingConfiguration: release::DataSharingConfiguration {
          ON SOURCE DELETE DELETE TARGET;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY applicationDacDetails: std::str;
      CREATE REQUIRED PROPERTY applicationDacIdentifier: tuple<system: std::str, value: std::str> {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY applicationDacTitle: std::str;
      CREATE REQUIRED PROPERTY counter: release::ReleaseCounterSequence {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY created: std::datetime {
          SET default := (std::datetime_current());
          SET readonly := true;
      };
      CREATE REQUIRED PROPERTY datasetCaseUrisOrderPreference: array<std::str>;
      CREATE REQUIRED PROPERTY datasetIndividualUrisOrderPreference: array<std::str>;
      CREATE REQUIRED PROPERTY datasetSpecimenUrisOrderPreference: array<std::str>;
      CREATE REQUIRED PROPERTY datasetUris: array<std::str>;
      CREATE REQUIRED PROPERTY isAllowedGSData: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY isAllowedPhenotypeData: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY isAllowedR2Data: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY isAllowedReadData: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY isAllowedS3Data: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY isAllowedVariantData: std::bool {
          SET default := false;
      };
      CREATE PROPERTY lastDataEgressQueryTimestamp: std::datetime;
      CREATE REQUIRED PROPERTY lastUpdated: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE REQUIRED PROPERTY lastUpdatedSubjectId: std::str;
      CREATE REQUIRED PROPERTY releaseKey: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY releasePassword: std::str;
  };
  ALTER TYPE audit::ReleaseAuditEvent {
      CREATE LINK release_ := (.<releaseAuditLog[IS release::Release]);
  };
  CREATE TYPE permission::User {
      CREATE MULTI LINK userAuditEvent: audit::UserAuditEvent {
          ON TARGET DELETE RESTRICT;
      };
      CREATE MULTI LINK releaseParticipant: release::Release {
          ON TARGET DELETE ALLOW;
          CREATE PROPERTY role: std::str {
              CREATE CONSTRAINT std::one_of('Administrator', 'Manager', 'Member');
          };
      };
      CREATE REQUIRED PROPERTY displayName: std::str;
      CREATE REQUIRED PROPERTY email: std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::exclusive ON (std::str_lower(__subject__));
      };
      CREATE REQUIRED PROPERTY isAllowedCreateRelease: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY isAllowedOverallAdministratorView: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY isAllowedRefreshDatasetIndex: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY lastLoginDateTime: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE REQUIRED PROPERTY subjectId: std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::exclusive;
          CREATE CONSTRAINT std::min_len_value(6);
      };
  };
  ALTER TYPE audit::UserAuditEvent {
      CREATE LINK user_ := (.<userAuditEvent[IS permission::User]);
  };
  CREATE TYPE consent::ConsentStatementDuo EXTENDING consent::ConsentStatement {
      CREATE REQUIRED PROPERTY dataUseLimitation: std::json;
  };
  ALTER TYPE dataset::DatasetPatient {
      CREATE LINK dataset := (.<patients[IS dataset::DatasetCase].<cases[IS dataset::Dataset]);
      CREATE MULTI LINK specimens: dataset::DatasetSpecimen {
          ON SOURCE DELETE DELETE TARGET;
          ON TARGET DELETE ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
  };
  ALTER TYPE dataset::DatasetSpecimen {
      CREATE LINK dataset := (.<specimens[IS dataset::DatasetPatient].<patients[IS dataset::DatasetCase].<cases[IS dataset::Dataset]);
      CREATE LINK case_ := (.<specimens[IS dataset::DatasetPatient].<patients[IS dataset::DatasetCase]);
      CREATE LINK patient := (.<specimens[IS dataset::DatasetPatient]);
  };
  CREATE SCALAR TYPE pedigree::KinType EXTENDING enum<isRelativeOf, isBiologicalRelativeOf, isBiologicalParentOf, isBiologicalFatherOf, isBiologicalMotherOf, isSpermDonorOf, isBiologicalSiblingOf, isFullSiblingOf, isMultipleBirthSiblingOf, isParentalSiblingOf, isHalfSiblingOf, isMaternalCousinOf, isPaternalCousinOf>;
  CREATE TYPE pedigree::PedigreeRelationship {
      CREATE REQUIRED LINK individual: dataset::DatasetPatient {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE REQUIRED LINK relative: dataset::DatasetPatient {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE REQUIRED PROPERTY relation: pedigree::KinType;
  };
  CREATE TYPE pedigree::Pedigree {
      CREATE LINK proband: dataset::DatasetPatient {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE MULTI LINK relationships: pedigree::PedigreeRelationship {
          ON SOURCE DELETE DELETE TARGET;
          ON TARGET DELETE ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE OPTIONAL PROPERTY reason: tuple<system: std::str, value: std::str>;
  };
  ALTER TYPE dataset::DatasetCase {
      CREATE OPTIONAL LINK pedigree: pedigree::Pedigree {
          ON SOURCE DELETE DELETE TARGET;
          ON TARGET DELETE ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
  };
  ALTER TYPE pedigree::Pedigree {
      CREATE LINK case_ := (.<pedigree[IS dataset::DatasetCase]);
  };
  ALTER TYPE job::Job {
      CREATE REQUIRED LINK forRelease: release::Release {
          ON TARGET DELETE RESTRICT;
      };
  };
  ALTER TYPE release::Release {
      CREATE OPTIONAL LINK runningJob := (SELECT
          .<forRelease[IS job::Job]
      FILTER
          (.status = job::JobStatus.running)
      );
      CREATE MULTI LINK participants := (.<releaseParticipant[IS permission::User]);
  };
  CREATE TYPE lab::Analyses {
      CREATE MULTI LINK input: lab::ArtifactBase;
      CREATE MULTI LINK output: lab::ArtifactBase {
          ON SOURCE DELETE DELETE TARGET;
          ON TARGET DELETE ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE PROPERTY analysesDate: std::datetime;
      CREATE PROPERTY pipeline: std::str;
  };
  CREATE TYPE lab::ArtifactBam EXTENDING lab::ArtifactBase {
      CREATE REQUIRED LINK baiFile: storage::File {
          ON SOURCE DELETE DELETE TARGET;
      };
      CREATE REQUIRED LINK bamFile: storage::File {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  CREATE TYPE lab::ArtifactBcl EXTENDING lab::ArtifactBase {
      CREATE REQUIRED LINK bclFile: storage::File {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  CREATE TYPE lab::ArtifactCram EXTENDING lab::ArtifactBase {
      CREATE REQUIRED LINK craiFile: storage::File {
          ON SOURCE DELETE DELETE TARGET;
      };
      CREATE REQUIRED LINK cramFile: storage::File {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  CREATE TYPE lab::ArtifactFastqPair EXTENDING lab::ArtifactBase {
      CREATE REQUIRED LINK forwardFile: storage::File {
          ON SOURCE DELETE DELETE TARGET;
      };
      CREATE REQUIRED LINK reverseFile: storage::File {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  CREATE TYPE lab::ArtifactVcf EXTENDING lab::ArtifactBase {
      CREATE REQUIRED LINK tbiFile: storage::File {
          ON SOURCE DELETE DELETE TARGET;
      };
      CREATE REQUIRED LINK vcfFile: storage::File {
          ON SOURCE DELETE DELETE TARGET;
      };
      CREATE PROPERTY sampleIds: array<std::str>;
  };
  CREATE TYPE lab::SubmissionBatch {
      CREATE MULTI LINK artifactsIncluded: lab::ArtifactBase {
          ON SOURCE DELETE DELETE TARGET;
          ON TARGET DELETE ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE PROPERTY externalIdentifier: std::str;
  };
  CREATE TYPE lab::Run {
      CREATE MULTI LINK artifactsProduced: lab::ArtifactBase {
          ON SOURCE DELETE DELETE TARGET;
          ON TARGET DELETE ALLOW;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE PROPERTY platform: std::str;
      CREATE PROPERTY runDate: std::datetime;
  };
  CREATE TYPE mock::AwsCloudFormationStack {
      CREATE REQUIRED PROPERTY installedDateTime: std::datetime;
      CREATE REQUIRED PROPERTY stackId: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY stackName: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
  };
  CREATE TYPE permission::PotentialUser {
      CREATE MULTI LINK futureReleaseParticipant: release::Release {
          ON TARGET DELETE ALLOW;
          CREATE PROPERTY role: std::str {
              CREATE CONSTRAINT std::one_of('Administrator', 'Manager', 'Member');
          };
      };
      CREATE REQUIRED PROPERTY createdDateTime: std::datetime {
          SET default := (std::datetime_current());
          SET readonly := true;
      };
      CREATE PROPERTY displayName: std::str;
      CREATE REQUIRED PROPERTY email: std::str {
          SET readonly := true;
          CREATE CONSTRAINT std::exclusive ON (std::str_lower(__subject__));
      };
      CREATE REQUIRED PROPERTY isAllowedCreateRelease: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY isAllowedOverallAdministratorView: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY isAllowedRefreshDatasetIndex: std::bool {
          SET default := false;
      };
  };
  CREATE TYPE release::DataEgressRecord {
      CREATE PROPERTY auditId: std::str;
      CREATE PROPERTY description: std::str;
      CREATE PROPERTY egressBytes: std::int64;
      CREATE REQUIRED PROPERTY egressId: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY fileSize: std::int64;
      CREATE REQUIRED PROPERTY fileUrl: std::str;
      CREATE REQUIRED PROPERTY occurredDateTime: std::datetime;
      CREATE PROPERTY sourceIpAddress: std::str;
      CREATE PROPERTY sourceLocation: std::json;
  };
  ALTER TYPE release::Release {
      CREATE MULTI LINK dataEgressRecord: release::DataEgressRecord {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE release::DataEgressRecord {
      CREATE LINK release := (.<dataEgressRecord[IS release::Release]);
  };
};
