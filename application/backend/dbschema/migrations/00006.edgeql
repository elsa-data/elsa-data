CREATE MIGRATION m142tdkfmmn77abmq66myb34tvorxht5qkhp4s4nslh3j5vdn55qda
    ONTO m14vusedvn5asyxmhxcuam4md72nguug7fw7lzzsds4fipg7e3v6ha
{
  ALTER TYPE release::DataSharingConfiguration {
      CREATE MULTI PROPERTY htsgetRestrictions: std::str;
  };
  ALTER TYPE release::Release {
      DROP PROPERTY htsgetRestrictions;
  };
};
