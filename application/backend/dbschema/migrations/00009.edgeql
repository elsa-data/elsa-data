CREATE MIGRATION m1kdjoaxubenhff2v3hc257x3vudq4o322v6nzcqr6cxrwzeidgajq
    ONTO m1kam4c6otwvcv4io5ye3x3hf7hknqwdbv7tnrp2b2ienujrc6pj5a
{
  ALTER TYPE audit::DataAccessAuditEvent {
      DROP LINK file;
  };
  ALTER TYPE consent::Consent {
      ALTER LINK statements {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE dataset::Dataset {
      ALTER LINK cases {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE dataset::DatasetShareable {
      ALTER LINK consent {
          ON SOURCE DELETE DELETE TARGET;
          ON TARGET DELETE ALLOW;
      };
  };
  ALTER TYPE dataset::DatasetCase {
      ALTER LINK patients {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE dataset::DatasetCase {
      ALTER LINK pedigree {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE dataset::DatasetPatient {
      ALTER LINK specimens {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE lab::Analyses {
      ALTER LINK output {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE lab::ArtifactBam {
      ALTER LINK baiFile {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE lab::ArtifactBam {
      ALTER LINK bamFile {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE lab::ArtifactBcl {
      ALTER LINK bclFile {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE lab::ArtifactCram {
      ALTER LINK craiFile {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE lab::ArtifactCram {
      ALTER LINK cramFile {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE lab::ArtifactFastqPair {
      ALTER LINK forwardFile {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE lab::ArtifactFastqPair {
      ALTER LINK reverseFile {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE lab::ArtifactVcf {
      ALTER LINK tbiFile {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE lab::ArtifactVcf {
      ALTER LINK vcfFile {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE lab::Run {
      ALTER LINK artifactsProduced {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE lab::SubmissionBatch {
      ALTER LINK artifactsIncluded {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE pedigree::Pedigree {
      ALTER LINK proband {
          ON TARGET DELETE DELETE SOURCE;
      };
  };
  ALTER TYPE pedigree::Pedigree {
      ALTER LINK relationships {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE pedigree::PedigreeRelationship {
      ALTER LINK individual {
          ON TARGET DELETE DELETE SOURCE;
      };
  };
  ALTER TYPE pedigree::PedigreeRelationship {
      ALTER LINK relative {
          ON TARGET DELETE DELETE SOURCE;
      };
  };
  ALTER TYPE release::Release {
      ALTER LINK dataAccessAuditLog {
          RESET ON SOURCE DELETE;
      };
  };
  ALTER TYPE release::Release {
      ALTER LINK releaseAuditLog {
          RESET ON SOURCE DELETE;
      };
  };
};
