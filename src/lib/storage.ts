export type VisitType = "ran" | "spectated";

export type LogEntry = {
  logged: boolean;
  visitType: VisitType | null;
  rating: number;
  note: string;
  date: string;
};

export type LogMap = Record<string, LogEntry>;

const KEY = "va-xc-log";

export function getLog(): LogMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function setEntry(courseId: string, entry: Partial<LogEntry>) {
  const log = getLog();
  const existing = log[courseId] ?? {
    logged: false,
    visitType: null,
    rating: 0,
    note: "",
    date: "",
  };
  log[courseId] = {
    ...existing,
    ...entry,
    date: new Date().toISOString().slice(0, 10),
  };
  localStorage.setItem(KEY, JSON.stringify(log));
  return log[courseId];
}

const MEDAL_LEVELS = [
  { min: 0, title: "New Runner" },
  { min: 50, title: "Course Scout" },
  { min: 150, title: "Trail Reviewer" },
  { min: 350, title: "VA Running Authority" },
  { min: 700, title: "Course Legend" },
];

function hashStr(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Simulated other-runner endorsements on a review — deterministic per entry
 * so it stays stable across reloads without needing a backend. */
export function endorsementsFor(courseId: string, entry: LogEntry) {
  if (!entry.logged || entry.note.trim().length === 0) return 0;
  return hashStr(courseId + "|" + entry.note) % 20; // 0-19
}

export function medalsFromLog(log: LogMap) {
  let medals = 0;
  for (const [courseId, entry] of Object.entries(log)) {
    if (!entry.logged) continue;
    medals += 10;
    if (entry.rating > 0) medals += 5;
    if (entry.note.trim().length > 0) medals += 15;
    if (entry.note.trim().length >= 40) medals += 10;
    // other runners giving your review a medal also ranks you up
    medals += endorsementsFor(courseId, entry);
  }
  let title = MEDAL_LEVELS[0].title;
  let next = MEDAL_LEVELS[1];
  for (const level of MEDAL_LEVELS) {
    if (medals >= level.min) title = level.title;
  }
  next = MEDAL_LEVELS.find((l) => l.min > medals) ?? MEDAL_LEVELS[MEDAL_LEVELS.length - 1];
  return { medals, title, nextAt: next.min === medals ? null : next.min };
}
