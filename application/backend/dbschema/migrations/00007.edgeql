CREATE MIGRATION m1fpuubbvyh7syvun7ewtzswxgiesvamgqm5xgyodftegwaina3fnq
    ONTO m142tdkfmmn77abmq66myb34tvorxht5qkhp4s4nslh3j5vdn55qda
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
