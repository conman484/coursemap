import type { Course } from "./Map";
import type { LogMap } from "../lib/storage";
import { medalsFromLog, endorsementsFor } from "../lib/storage";

type Props = {
  courses: Course[];
  log: LogMap;
  onSelect: (course: Course) => void;
  onClose: () => void;
};

const typeLabel: Record<Course["type"], string> = {
  xc: "XC Course",
  indoor: "Indoor Track",
  track: "Outdoor Track",
  marathon: "Marathon",
};

export default function HistoryPanel({ courses, log, onSelect, onClose }: Props) {
  const reviewed = courses
    .filter((c) => log[c.id]?.logged)
    .map((c) => ({ course: c, entry: log[c.id] }))
    .sort((a, b) => (b.entry.date > a.entry.date ? 1 : -1));

  const { medals, title: medalsTitle, nextAt } = medalsFromLog(log);

  return (
    <div className="absolute top-0 left-0 h-full w-full sm:w-80 bg-[#13131f] text-white shadow-2xl p-5 overflow-y-auto z-10 border-r border-white/10 animate-slide-in-left">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-2xl font-bold text-white">My Runs</h2>
        <button
          onClick={onClose}
          aria-label="Close My Runs"
          className="text-sm text-[#b3b8c2] hover:text-white transition-colors p-2 -m-2 rounded-full active:scale-90"
        >
          ✕
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">🏅 {medals} medals</span>
          <span className="text-xs text-[#9299a6]">{medalsTitle}</span>
        </div>
        {nextAt && (
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (medals / nextAt) * 100)}%` }}
            />
          </div>
        )}
        <p className="text-[11px] text-[#9299a6] mt-1.5">
          Earn medals by logging courses, writing detailed reviews, and getting medals from other runners.
        </p>
      </div>

      <p className="text-sm text-[#b3b8c2] mb-4">
        {reviewed.length} course{reviewed.length === 1 ? "" : "s"} logged
      </p>

      {reviewed.length === 0 && (
        <p className="text-sm text-[#9299a6]">
          No runs logged yet — tap a pin on the map and log your first course.
        </p>
      )}

      <div className="space-y-4">
        {reviewed.map(({ course, entry }) => (
          <button
            key={course.id}
            onClick={() => onSelect(course)}
            className="block w-full text-left border border-white/10 rounded-lg p-3 transition-colors hover:bg-white/5 active:scale-[0.98]"
          >
            <div className="flex justify-between items-baseline">
              <span className="font-medium text-white">{course.name}</span>
              <span className="text-xs text-[#9299a6]">{entry.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide text-[#9299a6]">
                {typeLabel[course.type]}
              </span>
              {entry.visitType && (
                <span className="text-[10px] uppercase tracking-wide text-rose-300">
                  {entry.visitType === "ran" ? "Ran" : "Spectated"}
                </span>
              )}
            </div>
            <div className="text-yellow-400 text-sm mt-1">
              {"★".repeat(entry.rating)}
              <span className="text-gray-600">{"★".repeat(5 - entry.rating)}</span>
            </div>
            {entry.note && (
              <>
                <p className="text-sm text-gray-300 mt-1 italic">"{entry.note}"</p>
                {endorsementsFor(course.id, entry) > 0 && (
                  <p className="text-[11px] text-rose-300 mt-1">
                    🏅 {endorsementsFor(course.id, entry)} other runners gave this review a medal
                  </p>
                )}
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
