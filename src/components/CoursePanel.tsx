import { useState } from "react";
import type { Course } from "./Map";
import { setEntry, type LogMap, type VisitType } from "../lib/storage";

type Props = {
  course: Course;
  log: LogMap;
  onUpdate: (log: LogMap) => void;
  onClose: () => void;
};

const typeLabel: Record<Course["type"], string> = {
  xc: "XC Course",
  indoor: "Indoor Track",
  track: "Outdoor Track",
  marathon: "Marathon",
};

export default function CoursePanel({ course, log, onUpdate, onClose }: Props) {
  const entry = log[course.id] ?? { logged: false, visitType: null, rating: 0, note: "", date: "" };
  const [note, setNote] = useState(entry.note);
  const [hoverRating, setHoverRating] = useState(0);

  function update(partial: Partial<typeof entry>) {
    setEntry(course.id, partial);
    onUpdate({ ...log, [course.id]: { ...entry, ...partial } });
  }

  function logAs(visitType: VisitType) {
    if (entry.logged && entry.visitType === visitType) {
      update({ logged: false, visitType: null });
    } else {
      update({ logged: true, visitType });
    }
  }

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-80 bg-[#13131f] text-white shadow-2xl p-5 overflow-y-auto z-10 border-l border-white/10 animate-slide-in-right">
      <div className="flex items-start justify-between mb-4">
        <span className="text-[11px] uppercase tracking-wider text-[#b3b8c2] font-medium">
          {typeLabel[course.type]}
        </span>
        <button
          onClick={onClose}
          aria-label="Close course details"
          className="text-sm text-[#b3b8c2] hover:text-white transition-colors p-2 -m-2 rounded-full active:scale-90"
        >
          ✕
        </button>
      </div>

      <h2 className="font-display text-2xl font-bold text-white leading-tight">{course.name}</h2>
      <p className="text-sm text-[#b3b8c2] mt-1">{course.terrain}</p>

      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-yellow-400 text-sm">★ {course.avgRating.toFixed(1)}</span>
        <span className="text-xs text-[#9299a6]">({course.reviewCount} reviews)</span>
      </div>

      <p className="text-sm text-gray-200 mt-3">{course.blurb}</p>
      {course.elevationGain > 0 && (
        <p className="text-sm text-[#b3b8c2] mt-2">
          Elevation gain: <span className="text-white font-medium">{course.elevationGain} ft</span>
        </p>
      )}

      <div className="flex gap-2 mt-5">
        <button
          onClick={() => logAs("ran")}
          className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 active:scale-95 ${
            entry.logged && entry.visitType === "ran"
              ? "bg-green-600 text-white hover:bg-green-500"
              : "bg-gradient-to-r from-white to-gray-200 text-[#13131f] hover:from-gray-100 hover:to-white"
          }`}
        >
          {entry.logged && entry.visitType === "ran" ? "✓ Ran It" : "I Ran This"}
        </button>
        <button
          onClick={() => logAs("spectated")}
          className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 active:scale-95 border ${
            entry.logged && entry.visitType === "spectated"
              ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-500"
              : "bg-transparent text-white border-white/30 hover:border-white/60"
          }`}
        >
          {entry.logged && entry.visitType === "spectated" ? "✓ Spectated" : "I Spectated"}
        </button>
      </div>

      {entry.logged && (
        <div className="mt-4 space-y-3">
          <div>
            <span className="text-xs text-[#b3b8c2] block mb-1">Your rating</span>
            <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onMouseEnter={() => setHoverRating(n)}
                  onClick={() => update({ rating: n })}
                  aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
                  className={`text-xl transition-transform duration-100 hover:scale-125 active:scale-95 ${
                    n <= (hoverRating || entry.rating) ? "text-yellow-400" : "text-gray-600"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-[#b3b8c2] block mb-1">Your note</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => update({ note })}
              rows={3}
              className="w-full text-sm bg-white/5 text-white border border-white/20 rounded-md p-2 placeholder-gray-500 transition-colors focus:border-white/50"
              placeholder="How was it?"
            />
            {note.trim().length > 0 && note.trim().length < 40 && (
              <p className="text-[11px] text-[#9299a6] mt-1">
                +10 bonus clout at 40+ characters — add a bit more detail.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
