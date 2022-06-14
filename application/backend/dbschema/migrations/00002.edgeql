CREATE MIGRATION m1iq6hejpuxbzsoeccamo2hv7lvij4vfophvx2i2d7kptojcvzhw4a
    ONTO m17xv2r7ypv54c2qgl2rlytnihxk4qn2kyq4rvoymjezkypd7sptoa
{
  ALTER TYPE release::Release {
      CREATE MULTI LINK selectedSpecimens -> dataset::DatasetSpecimen {
          ON TARGET DELETE  ALLOW;
      };
  };
};
