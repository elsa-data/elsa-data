CREATE MIGRATION m14wubfk7mlhg7lsh7lw2bqvbnifnkqc2ftsvhamgc65plwnirjgaq
    ONTO m1w772xacqordjlwm3bj6yozqfveh2wzxu4aqfys2d6ed6tf54ouqq
{
  ALTER TYPE permission::PotentialUser {
      ALTER LINK futureReleaseParticipant {
          ALTER PROPERTY role {
              CREATE CONSTRAINT std::one_of('Administrator', 'Manager', 'Member');
          };
      };
  };
  ALTER TYPE permission::PotentialUser {
      ALTER LINK futureReleaseParticipant {
          ALTER PROPERTY role {
              DROP CONSTRAINT std::one_of('DataOwner', 'Member', 'PI');
          };
      };
  };
  ALTER TYPE permission::User {
      ALTER LINK releaseParticipant {
          ALTER PROPERTY role {
              CREATE CONSTRAINT std::one_of('Administrator', 'Manager', 'Member');
          };
      };
  };
  ALTER TYPE permission::User {
      ALTER LINK releaseParticipant {
          ALTER PROPERTY role {
              DROP CONSTRAINT std::one_of('DataOwner', 'Member', 'PI');
          };
      };
  };
};
