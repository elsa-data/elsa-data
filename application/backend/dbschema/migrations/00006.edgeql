CREATE MIGRATION m1ohl2y57sfpku27xc37lmqi4yted5tsjzvongclm3pniid6zb3nmq
    ONTO m14vusedvn5asyxmhxcuam4md72nguug7fw7lzzsds4fipg7e3v6ha
{
  ALTER TYPE release::DataEgressRecord {
      CREATE REQUIRED PROPERTY egressId: std::str {
          SET REQUIRED USING (SELECT
              <std::str>std::random()
          );
          CREATE CONSTRAINT std::exclusive;
      };
  };
};
