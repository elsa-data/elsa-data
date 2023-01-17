CREATE MIGRATION m1erthlyhfyzfhzvwkvycpcuopgwpbbpwyzxwydhvfhuigo7nnszpa
    ONTO m1kdjoaxubenhff2v3hc257x3vudq4o322v6nzcqr6cxrwzeidgajq
{
  CREATE TYPE release::Activation {
      CREATE REQUIRED PROPERTY activatedAt -> std::datetime {
          SET default := (std::datetime_current());
          SET readonly := true;
      };
      CREATE REQUIRED PROPERTY activatedByDisplayName -> std::str;
      CREATE REQUIRED PROPERTY activatedById -> std::str;
      CREATE REQUIRED PROPERTY manifest -> std::json;
      CREATE REQUIRED PROPERTY manifestEtag -> std::str;
  };
  ALTER TYPE release::Release {
      CREATE OPTIONAL LINK activated -> release::Activation {
          ON SOURCE DELETE DELETE TARGET;
          CREATE CONSTRAINT std::exclusive;
      };
  };
  ALTER TYPE release::Release {
      CREATE OPTIONAL MULTI LINK previouslyActivated -> release::Activation {
          ON SOURCE DELETE DELETE TARGET;
          CREATE CONSTRAINT std::exclusive;
      };
      ALTER LINK applicationCoded {
          ON SOURCE DELETE DELETE TARGET;
          CREATE CONSTRAINT std::exclusive;
      };
  };
  ALTER TYPE release::Release {
      DROP PROPERTY releaseEnded;
  };
  ALTER TYPE release::Release {
      DROP PROPERTY releaseStarted;
  };
};
