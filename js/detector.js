// Automatic muscle-group detection from an exercise name.
// Rules run top to bottom; the first match wins, so specific rules come before general ones.

export const MUSCLES = {
  lats: { label: "Lats", group: "back" },
  mid_back: { label: "Mid-Back", group: "back" },
  traps: { label: "Traps", group: "back" },
  lower_back: { label: "Lower Back", group: "back" },
  rear_delts: { label: "Rear Delts", group: "shoulders" },
  shoulders: { label: "Shoulders", group: "shoulders" },
  chest: { label: "Chest", group: "chest" },
  biceps: { label: "Biceps", group: "arms" },
  triceps: { label: "Triceps", group: "arms" },
  forearms: { label: "Forearms", group: "arms" },
  quads: { label: "Quads", group: "legs" },
  hamstrings: { label: "Hamstrings", group: "legs" },
  glutes: { label: "Glutes", group: "legs" },
  calves: { label: "Calves", group: "legs" },
  abs: { label: "Abs", group: "core" },
};

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[-_/.,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const rules = [
  (n) => /hyper ?extension|back extension|reverse hyper|good ?morning|superman/.test(n) && { p: ["lower_back"], s: ["glutes", "hamstrings"] },
  (n) => /romanian|\brdl\b|stiff leg/.test(n) && { p: ["hamstrings"], s: ["glutes", "lower_back"] },
  (n) => /deadlift|rack pull/.test(n) && { p: ["lower_back", "hamstrings"], s: ["glutes", "traps", "lats"] },
  (n) => /hip thrust|glute|donkey/.test(n) && { p: ["glutes"], s: ["hamstrings"] },
  (n) => /face pull|reverse (fly|flye|pec)|rear delt|rear lateral/.test(n) && { p: ["rear_delts"], s: ["mid_back", "traps"] },
  (n) => /upright row/.test(n) && { p: ["shoulders", "traps"], s: ["biceps"] },
  (n) => /shrug/.test(n) && { p: ["traps"], s: ["forearms"] },
  (n) =>
    /pull ?down|lat pull|pull ?up|chin ?up/.test(n) &&
    (/close|reverse|under|chin/.test(n) ? { p: ["lats", "biceps"], s: ["mid_back", "forearms"] } : { p: ["lats"], s: ["biceps", "mid_back"] }),
  (n) => /pullover|straight arm/.test(n) && { p: ["lats"], s: ["chest", "triceps"] },
  // rows: one-arm / dumbbell, then wide grip, then barbell, then everything else
  (n) => /\brow\b/.test(n) && /(one|single) ?(hand|arm)|unilateral|\bdb\b|dumbbell/.test(n) && { p: ["lats"], s: ["mid_back", "biceps", "rear_delts"] },
  (n) => /\brow\b/.test(n) && /wide/.test(n) && { p: ["mid_back"], s: ["lats", "rear_delts", "biceps"] },
  (n) => /\brow\b/.test(n) && /t ?bar|barbell|bent ?over|pendlay|yates|seal/.test(n) && { p: ["lats", "mid_back"], s: ["lower_back", "biceps", "rear_delts"] },
  (n) => /\brow\b/.test(n) && { p: ["mid_back", "lats"], s: ["biceps", "rear_delts"] },
  (n) => /tricep|skull ?crusher|push ?down|jm press|close grip (bench|push)|french press|overhead extension|kickback/.test(n) && { p: ["triceps"], s: ["shoulders"] },
  (n) => /\bdips?\b/.test(n) && (/bench/.test(n) ? { p: ["triceps"], s: ["shoulders", "chest"] } : { p: ["chest", "triceps"], s: ["shoulders"] }),
  (n) => /bench|chest press|push ?up|pec ?deck|\bfly\b|flye|crossover/.test(n) && { p: ["chest"], s: ["triceps", "shoulders"] },
  (n) => /overhead press|shoulder press|military|arnold|lateral raise|side raise|front raise|\bohp\b|push press|landmine/.test(n) && { p: ["shoulders"], s: ["triceps"] },
  (n) => /leg curl|hamstring curl|nordic/.test(n) && { p: ["hamstrings"], s: ["calves"] },
  (n) => /wrist curl|farmer|grip/.test(n) && { p: ["forearms"], s: [] },
  (n) => /curl|bicep|preacher|hammer|concentration|spider/.test(n) && { p: ["biceps"], s: ["forearms"] },
  (n) => /calf|calves/.test(n) && { p: ["calves"], s: [] },
  (n) => /squat|leg press|hack|lunge|step ?up|leg extension|sissy/.test(n) && { p: ["quads"], s: ["glutes", "hamstrings"] },
  (n) => /crunch|plank|sit ?up|leg raise|knee raise|ab wheel|rollout|russian twist|wood ?chop|\babs?\b|\bcore\b|v up/.test(n) && { p: ["abs"], s: [] },
];

export function detectMuscles(name) {
  const n = norm(name);
  for (const r of rules) {
    const m = r(n);
    if (m) return { primary: m.p, secondary: m.s, matched: true };
  }
  return { primary: [], secondary: [], matched: false };
}
