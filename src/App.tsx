import { useMemo, useState } from "react";
import Map, { elevationColor, type Course } from "./components/Map";
import CoursePanel from "./components/CoursePanel";
import HistoryPanel from "./components/HistoryPanel";
import coursesData from "./data/courses.json";
import { getLog, medalsFromLog, type LogMap } from "./lib/storage";

const courses = coursesData as Course[];
const xcCount = courses.filter((c) => c.type === "xc").length;
const indoorCount = courses.filter((c) => c.type === "indoor").length;
const trackCount = courses.filter((c) => c.type === "track").length;
const marathonCount = courses.filter((c) => c.type === "marathon").length;

type TypeFilter = Course["type"];

const TYPE_LABELS: Record<TypeFilter, string> = {
  xc: "XC Courses",
  indoor: "Indoor Tracks",
  track: "Outdoor Tracks",
  marathon: "Marathons",
};

function App() {
  const [log, setLog] = useState<LogMap>(() => getLog());
  const [selected, setSelected] = useState<Course | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<Set<TypeFilter>>(
    new Set(["xc", "indoor", "track", "marathon"])
  );

  const loggedCount = Object.values(log).filter((e) => e.logged).length;
  const { medals, title: medalsTitle } = medalsFromLog(log);

  function toggleType(t: TypeFilter) {
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses
      .filter((c) => types.has(c.type))
      .filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [query, types]);

  const visibleIds = useMemo(() => new Set(visible.map((c) => c.id)), [visible]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1a1a2e]">
      <Map
        courses={courses}
        log={log}
        visibleIds={visibleIds}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
      />

      <div className="absolute top-0 left-0 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-3 bg-[#13131f]/95 backdrop-blur shadow-sm z-10 border-b border-white/10">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">coursemap.va</h1>
          <p className="text-xs text-[#b3b8c2]">
            {xcCount} XC · {indoorCount} indoor · {trackCount} outdoor tracks · {marathonCount} marathons — Virginia
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-200">
            {(Object.keys(TYPE_LABELS) as TypeFilter[]).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer select-none min-h-11">
                <input
                  type="checkbox"
                  checked={types.has(t)}
                  onChange={() => toggleType(t)}
                  className="accent-rose-400 w-4 h-4"
                />
                {TYPE_LABELS[t]}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses..."
                className="text-sm bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-full px-4 py-2 w-full sm:w-48 transition-colors focus:border-white/50"
              />
              {query && (
                <span className="text-[10px] text-[#9299a6] mt-1 pl-1">
                  {visible.length} result{visible.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 text-sm font-semibold text-[#13131f] bg-white hover:bg-gray-200 transition-colors active:scale-95 rounded-full px-4 py-2 min-h-11"
            >
              My Runs
              <span className="bg-[#13131f] text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {loggedCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowHistory(true)}
        className="absolute top-20 sm:top-[72px] right-4 z-10 flex items-center gap-2 bg-[#13131f]/90 backdrop-blur border border-white/10 rounded-full pl-2 pr-3 py-1.5 shadow-lg hover:border-white/30 transition-colors"
      >
        <span className="text-base leading-none">🏅</span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-xs font-bold text-white">{medals} medals</span>
          <span className="text-[10px] text-[#9299a6]">{medalsTitle}</span>
        </span>
      </button>

      <div className="hidden sm:block absolute bottom-6 left-4 z-10 bg-[#13131f]/90 backdrop-blur rounded-lg px-3 py-2.5 text-xs text-[#d7dae0] border border-white/10 shadow-lg">
        <div className="font-semibold text-white mb-1.5">Elevation gain</div>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full" style={{ background: elevationColor(50), width: 10, height: 10 }} />
          Low (&lt;100ft)
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full" style={{ background: elevationColor(150), width: 14, height: 14 }} />
          Medium (100–200ft)
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="rounded-full" style={{ background: elevationColor(250), width: 18, height: 18 }} />
          High (200ft+)
        </div>
        <div className="pt-1.5 border-t border-white/10 text-[#9299a6] space-y-0.5">
          <div>● XC &nbsp; ■ Indoor &nbsp; ◆ Outdoor track &nbsp; ⬡ Marathon</div>
          <div>Size &amp; color both encode elevation</div>
        </div>
      </div>

      {selected && (
        <CoursePanel
          course={selected}
          log={log}
          onUpdate={setLog}
          onClose={() => setSelected(null)}
        />
      )}

      {showHistory && (
        <HistoryPanel
          courses={courses}
          log={log}
          onSelect={(c) => {
            setSelected(c);
            setShowHistory(false);
          }}
          onClose={() => setShowHistory(false)}
        />
      )}

      <div className="hidden sm:block absolute bottom-1 right-2 text-[10px] text-gray-500 z-10">
        © OpenStreetMap contributors © OpenFreeMap
      </div>
    </div>
  );
}

export default App;
