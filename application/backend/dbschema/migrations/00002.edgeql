CREATE MIGRATION m1f6twc6b27e6wkvvu3uckminarlcrtr5ok7qke3fop5n7onf4vora
    ONTO m1lt44twvfd75hhuuyjgxhwxzsm2uteenmn3gnus2nuqztoxqvsgla
{
  ALTER TYPE release::Release {
      CREATE REQUIRED PROPERTY lastUpdatedSubjectId -> std::str {
          SET REQUIRED USING ('unknown');
      };
  };
};
