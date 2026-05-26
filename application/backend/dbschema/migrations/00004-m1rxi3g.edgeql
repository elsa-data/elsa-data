CREATE MIGRATION m1rxi3gn745ihw3bu7lve7gsmqbonlmx7wyhaifeevps4tjfi4a7ka
    ONTO m13nm7ua7wjtofcffzdlgvd5djymgmo4dhmnbhj7eqv67wtaen64kq
{
  ALTER TYPE release::DataSharingConfiguration {
      CREATE OPTIONAL PROPERTY globusResearcherUsername: std::str;
  };
};
