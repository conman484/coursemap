import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MLMap, Marker } from "maplibre-gl";
// Vite doesn't auto-bundle maplibre-gl's worker (it builds the URL
// dynamically, so static analysis misses it) — resolve it explicitly as an
// asset URL so the production build ships it and the worker actually loads.
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type { LogMap } from "../lib/storage";

maplibregl.setWorkerUrl(maplibreWorkerUrl);

export type Course = {
  id: string;
  name: string;
  type: "xc" | "indoor" | "track" | "marathon";
  lat: number;
  lng: number;
  blurb: string;
  terrain: string;
  elevationGain: number;
  distanceMeters?: number;
  avgRating: number;
  reviewCount: number;
};

type Props = {
  courses: Course[];
  log: LogMap;
  visibleIds: Set<string>;
  selectedId: string | null;
  onSelect: (course: Course) => void;
};

export function elevationTier(gain: number) {
  if (gain < 100) return "low" as const;
  if (gain < 200) return "medium" as const;
  return "high" as const;
}

const TIER_COLORS = {
  low: { base: "#2dd4bf", deep: "#0f9488" },
  medium: { base: "#fbbf24", deep: "#d97706" },
  high: { base: "#fb7185", deep: "#e11d48" },
};

export function elevationColor(gain: number) {
  return TIER_COLORS[elevationTier(gain)].base;
}

function pinSize(gain: number) {
  const tier = elevationTier(gain);
  if (tier === "low") return 26;
  if (tier === "medium") return 32;
  return 38;
}

function innerIconClip(type: Course["type"]) {
  if (type === "track") return "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"; // diamond
  if (type === "marathon")
    return "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)"; // hexagon
  return "none"; // xc = circle (via border-radius), indoor = square (via border-radius)
}

function styleMarker(
  pin: HTMLDivElement,
  icon: HTMLDivElement,
  course: Course,
  logged: boolean,
  isSelected: boolean,
  isDimmed: boolean
) {
  const tier = elevationTier(course.elevationGain);
  const { base, deep } = TIER_COLORS[tier];
  const size = pinSize(course.elevationGain) * (isSelected ? 1.25 : 1);

  pin.style.width = `${size}px`;
  pin.style.height = `${size}px`;
  pin.style.background = `linear-gradient(135deg, ${base}, ${deep})`;
  pin.style.borderRadius = "50% 50% 50% 0";
  pin.style.transform = "rotate(-45deg)";
  pin.style.boxShadow = logged
    ? `0 0 0 3px #ffffff, 0 2px 10px rgba(0,0,0,0.5), 0 0 14px 2px ${base}aa`
    : `0 1px 1px rgba(255,255,255,0.5) inset, 0 2px 6px rgba(0,0,0,0.5)`;
  pin.style.opacity = isDimmed ? "0.25" : "1";

  const iconSize = size * 0.38;
  icon.style.width = `${iconSize}px`;
  icon.style.height = `${iconSize}px`;
  icon.style.transform = "rotate(45deg)";
  icon.style.background = "#ffffff";
  icon.style.clipPath = innerIconClip(course.type);
  icon.style.borderRadius = course.type === "indoor" ? "2px" : course.type === "xc" ? "50%" : "0";
}

export default function Map({ courses, log, visibleIds, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const pinsRef = useRef<Record<string, HTMLDivElement>>({});
  const iconsRef = useRef<Record<string, HTMLDivElement>>({});

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/dark",
      center: [-78.3, 37.9],
      zoom: 6.7,
      minZoom: 5,
      maxZoom: 15,
    });
    mapRef.current = map;

    courses.forEach((course) => {
      const hit = document.createElement("button");
      hit.className =
        "w-11 h-11 flex items-end justify-center cursor-pointer bg-transparent border-0 p-0 pb-1 transition-transform duration-150 active:scale-90";
      const typeLabel =
        course.type === "indoor"
          ? "indoor track"
          : course.type === "track"
            ? "outdoor track"
            : course.type === "marathon"
              ? "marathon"
              : "XC course";
      hit.setAttribute("aria-label", `${course.name} (${typeLabel})`);

      const pin = document.createElement("div");
      pin.className = "relative flex items-center justify-center transition-all duration-200";
      const icon = document.createElement("div");
      icon.className = "pointer-events-none";
      pin.appendChild(icon);
      hit.appendChild(pin);

      pinsRef.current[course.id] = pin;
      iconsRef.current[course.id] = icon;
      styleMarker(pin, icon, course, Boolean(log[course.id]?.logged), false, false);

      hit.onclick = () => onSelect(course);

      const marker = new maplibregl.Marker({ element: hit, anchor: "bottom" })
        .setLngLat([course.lng, course.lat])
        .addTo(map);
      markersRef.current[course.id] = marker;
    });

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    courses.forEach((course) => {
      const marker = markersRef.current[course.id];
      const pin = pinsRef.current[course.id];
      const icon = iconsRef.current[course.id];
      if (!marker || !pin || !icon) return;
      const isSelected = selectedId === course.id;
      const isDimmed = selectedId !== null && !isSelected;
      styleMarker(pin, icon, course, Boolean(log[course.id]?.logged), isSelected, isDimmed);
      const el = marker.getElement() as HTMLButtonElement;
      el.style.opacity = visibleIds.has(course.id) ? "1" : "0";
      el.style.pointerEvents = visibleIds.has(course.id) ? "auto" : "none";
      el.style.transition = "opacity 200ms ease";
      el.style.zIndex = isSelected ? "10" : "1";
    });
  }, [log, visibleIds, selectedId, courses]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
