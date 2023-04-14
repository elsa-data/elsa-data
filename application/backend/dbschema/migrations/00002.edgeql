CREATE MIGRATION m1tsby3mtutgvufv3v5zya63ajbnsnhw52swmppcbojjku3tcpozeq
    ONTO m1umtlgdbtod433p7qejxjjyqvq3yhqaxtnkusjw3jjs4m3ssrwyla
{
  ALTER TYPE permission::PotentialUser {
      DROP PROPERTY subjectId;
  };
  ALTER TYPE permission::User {
      DROP PROPERTY isAllowedChangeUserPermission;
  };
};
