export type ConceptDictionary = { [id: string]: Concept };

export type Concept = {
  id: string;
  name: string;
};

// this is a replica of the CodingType in our backend
// importing the type was too much of a pain so it is replicated
export type CodingType = {
  system: string;
  code: string;

  display?: string;
};
