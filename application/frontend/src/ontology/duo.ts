export function isKnownDuoCode(x: string): boolean {
  return x in duoCodeToDescription;
}

type CodeToDescriptionType = {
  [duo: string]: string;
};

export const duoCodeToDescription: CodeToDescriptionType = {
  "DUO:0000004": "No restriction",
  "DUO:0000006": "Health or medical or biomedical research",
  "DUO:0000007": "Disease specific research",
  "DUO:0000011": "Population origins or ancestry research only",
  "DUO:0000015": "No general methods research",
  "DUO:0000016": "Genetic studies only",
  "DUO:0000018": "Not for profit",
  "DUO:0000019": "Publication required",
  "DUO:0000020": "Collaboration required",
  "DUO:0000022": "Geographical restriction",
  "DUO:0000024": "Publication moratorium",
  "DUO:0000025": "Time limit on use",
  "DUO:0000026": "User specific restriction",
  "DUO:0000027": "Project specific restriction",
  "DUO:0000028": "Institution specific restriction",
  "DUO:0000029": "Return to database or resource",
  "DUO:0000042": "General research use",
  "DUO:0000043": "Clinical care use",
  "DUO:0000045": "Not for profit organisation use only",
  "DUO:0000046": "Non-commercial use only",
};
