import React, { useState, useEffect, useMemo } from "react";
import {
  Utensils, ShowerHead, GraduationCap, Coffee, Armchair, BookOpen, NotebookPen,
  ChevronLeft, ChevronRight, Flame, RotateCcw,
} from "lucide-react";

// -- Paleta verde (hermana diurna de mañana/noche) ----------------
const C = {
  bg: "#F2F7EC",
  panel: "#FFFFFF",
  panelSoft: "#E6EFD9",
  border: "#CFE0B8",
  ink: "#2E3A22",
  muted: "#7C8B68",
  green: "#5FA86B",
  leafPale: "#E8F3DD",
};

// Hábitos según el día de la semana.
//   Mié: almuerzo, baño, pre-estudio, psicóloga, estudio
//   Lun/Mar/Jue/Vie: almuerzo, baño, clase
//   Sáb/Dom: almuerzo, baño
const ALMUERZO = { key: "almuerzo", label: "Almuerzo", Icon: Utensils, color: "#D98C4A" };
const BANO = { key: "bano", label: "Baño", Icon: ShowerHead, color: "#4FA3D1" };
const REPASO = { key: "repaso", label: "Repaso", Icon: NotebookPen, color: "#6FA85F" };
const CLASE = { key: "clase", label: "Clase", Icon: GraduationCap, color: "#7E9F3C" };
const PRE_ESTUDIO = { key: "pre_estudio", label: "Pre-estudio", Icon: Coffee, color: "#C9893C" };
const PSICOLOGA = { key: "psicologa", label: "Psicóloga", Icon: Armchair, color: "#A78BE0" };
const ESTUDIO = { key: "estudio", label: "Estudio", Icon: BookOpen, color: "#5FA86B" };

const habitsForDate = (d) => {
  const dow = d.getDay(); // 0=Dom .. 6=Sáb
  if (dow === 3) return [ALMUERZO, BANO, PRE_ESTUDIO, PSICOLOGA, ESTUDIO]; // miércoles
  if (dow === 0 || dow === 6) return [ALMUERZO, BANO]; // finde
  return [ALMUERZO, BANO, REPASO, CLASE]; // lun/mar/jue/vie
};

const STORAGE_KEY = "midday_routine_data_v1";

// -- Almacenamiento local (localStorage) --------------------------
const storage = {
  async get(key) {
    const value = window.localStorage.getItem(key);
    return value === null ? null : { value };
  },
  async set(key, value) {
    window.localStorage.setItem(key, value);
  },
  async delete(key) {
    window.localStorage.removeItem(key);
  },
};

// -- Helpers de fecha ----------------------------------------------
const toKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const startOfWeek = (d) => {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7; // 0 = lunes
  return addDays(x, -dow);
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// -- Hoja que se llena con verde -----------------------------------
function Leaf({ size, fraction, id }) {
  const clipId = `leafclip-${id}`;
  const gradId = `leafgrad-${id}`;
  const fillH = fraction * size;
  const full = fraction >= 1;
  const r = size / 2;
  // Hoja simétrica con punta arriba y abajo.
  const leafPath = `M ${r} ${size * 0.03}
    C ${size * 0.92} ${size * 0.3}, ${size * 0.86} ${size * 0.82}, ${r} ${size * 0.97}
    C ${size * 0.14} ${size * 0.82}, ${size * 0.08} ${size * 0.3}, ${r} ${size * 0.03} Z`;
  return (
    <svg
      width={size + 12}
      height={size + 12}
      viewBox={`${-6} ${-6} ${size + 12} ${size + 12}`}
      style={{ filter: full ? "drop-shadow(0 0 10px rgba(95,168,107,.5))" : "none", transition: "filter .5s" }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={leafPath} />
        </clipPath>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B8E29A" />
          <stop offset="100%" stopColor="#4C8F5A" />
        </linearGradient>
      </defs>
      <path d={leafPath} fill={C.leafPale} stroke={C.border} strokeWidth="1.5" />
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y={size - fillH} width={size} height={fillH} fill={`url(#${gradId})`} style={{ transition: "y .5s ease, height .5s ease" }} />
      </g>
      {/* nervadura central */}
      <line x1={r} y1={size * 0.05} x2={r} y2={size * 0.95} stroke={full ? "rgba(255,255,255,.6)" : C.border} strokeWidth="1.5" strokeLinecap="round" style={{ transition: "stroke .5s" }} />
      <path d={leafPath} fill="none" stroke={full ? C.green : C.border} strokeWidth="1.5" style={{ transition: "stroke .5s" }} />
    </svg>
  );
}

export default function App() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const today = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState(toKey(today));
  const [weekBase, setWeekBase] = useState(startOfWeek(today));

  // Cargar
  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY);
        if (res && res.value) setData(JSON.parse(res.value));
      } catch (e) {
        // primera vez: sin datos
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (next) => {
    try {
      await storage.set(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      // si falla, el estado en pantalla se mantiene igualmente
    }
  };

  const toggle = (habitKey) => {
    const cur = data[selected] || {};
    const nextDay = { ...cur, [habitKey]: !cur[habitKey] };
    const next = { ...data, [selected]: nextDay };
    setData(next);
    save(next);
  };

  const countFor = (key) => {
    const h = data[key] || {};
    const habits = habitsForDate(new Date(key + "T12:00:00"));
    return habits.reduce((n, x) => n + (h[x.key] ? 1 : 0), 0);
  };
  const totalFor = (key) => habitsForDate(new Date(key + "T12:00:00")).length;

  // Racha de días completos, terminando hoy o ayer
  const streak = useMemo(() => {
    let cursor = new Date(today);
    if (countFor(toKey(today)) < totalFor(toKey(today))) cursor = addDays(cursor, -1);
    let n = 0;
    for (let i = 0; i < 400; i++) {
      const k = toKey(cursor);
      if (countFor(k) === totalFor(k)) {
        n++;
        cursor = addDays(cursor, -1);
      } else break;
    }
    return n;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, today]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekBase, i)), [weekBase]);
  const dayLetters = ["L", "M", "X", "J", "V", "S", "D"];

  const selDate = new Date(selected + "T12:00:00");
  const selHabits = habitsForDate(selDate);
  const selCount = countFor(selected);
  const selTotal = selHabits.length;
  const isToday = selected === toKey(today);

  const weekLabel = `${weekDays[0].toLocaleDateString("es-ES", { day: "numeric" })}–${weekDays[6].toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`;

  const reset = async () => {
    if (!window.confirm("¿Borrar todo tu progreso? No se puede deshacer.")) return;
    setData({});
    try { await storage.delete(STORAGE_KEY); } catch (e) {}
  };

  if (loading) {
    return (
      <div style={{ ...wrap, alignItems: "center", justifyContent: "center", minHeight: 480 }}>
        <div style={{ color: C.muted, fontFamily: "system-ui" }}>Cargando…</div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <style>{`
        .mr-tap{ -webkit-tap-highlight-color:transparent; cursor:pointer; }
        .mr-tap:focus-visible{ outline:2px solid ${C.green}; outline-offset:2px; }
        .mr-row{ transition:background .18s ease, border-color .18s ease; }
        .mr-row:hover{ background:${C.panelSoft}; }
        @media (prefers-reduced-motion: reduce){ *{ transition:none!important; } }
      `}</style>

      {/* encabezado */}
      <header style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontFamily: "'Iowan Old Style','Palatino',Georgia,serif", fontSize: 26, color: C.ink, letterSpacing: 0.3 }}>
          Rutina del Mediodía
        </div>
        <div style={{ color: C.muted, fontSize: 13, marginTop: 2, fontFamily: "system-ui" }}>
          {cap(selDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }))}
          {isToday && <span style={{ color: C.green }}> · hoy</span>}
        </div>
      </header>

      {/* hoja + conteo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, margin: "6px 0 2px", position: "relative", zIndex: 1 }}>
        <Leaf size={116} fraction={selCount / selTotal} id="big" />
        <div style={{ fontFamily: "'Iowan Old Style','Palatino',Georgia,serif", fontSize: 20, color: C.ink }}>
          {selCount} <span style={{ color: C.muted }}>/ {selTotal}</span>
        </div>
      </div>

      {/* hábitos */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative", zIndex: 1 }}>
        {selHabits.map(({ key, label, Icon, color }) => {
          const done = !!(data[selected] && data[selected][key]);
          return (
            <div
              key={key}
              className="mr-tap mr-row"
              role="checkbox"
              aria-checked={done}
              tabIndex={0}
              onClick={() => toggle(key)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(key); } }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "13px 14px", borderRadius: 14,
                background: C.panel, border: `1px solid ${done ? color : C.border}`,
              }}
            >
              <span style={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 10, background: done ? color : C.panelSoft, transition: "background .2s" }}>
                <Icon size={18} color={done ? "#FFFFFF" : color} strokeWidth={2} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: C.ink, fontSize: 16, fontFamily: "system-ui", opacity: done ? 1 : 0.85 }}>{label}</span>
              </span>
              <span style={{
                width: 24, height: 24, borderRadius: 999,
                border: `2px solid ${done ? color : C.border}`,
                background: done ? color : "transparent",
                display: "grid", placeItems: "center", transition: "all .2s",
              }}>
                {done && (
                  <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6.3 5 8.7l4.5-5" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* semana */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: "12px 12px 14px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button className="mr-tap" aria-label="Semana anterior" onClick={() => setWeekBase(addDays(weekBase, -7))} style={navBtn}>
            <ChevronLeft size={18} color={C.muted} />
          </button>
          <span style={{ color: C.ink, fontSize: 13, fontFamily: "system-ui", letterSpacing: 0.3 }}>{weekLabel}</span>
          <button className="mr-tap" aria-label="Semana siguiente" onClick={() => setWeekBase(addDays(weekBase, 7))} style={navBtn}>
            <ChevronRight size={18} color={C.muted} />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {weekDays.map((d, i) => {
            const k = toKey(d);
            const frac = countFor(k) / totalFor(k);
            const isSel = k === selected;
            const isFuture = d > today && k !== toKey(today);
            return (
              <button
                key={k}
                className="mr-tap"
                onClick={() => setSelected(k)}
                aria-label={`Ver ${d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric" })}`}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                  background: isSel ? C.panelSoft : "transparent",
                  border: `1px solid ${isSel ? C.green : "transparent"}`,
                  borderRadius: 12, padding: "7px 0 6px", opacity: isFuture ? 0.4 : 1,
                }}
              >
                <span style={{ fontSize: 11, color: k === toKey(today) ? C.green : C.muted, fontFamily: "system-ui" }}>{dayLetters[i]}</span>
                <Leaf size={22} fraction={frac} id={`w${i}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* racha */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.ink, fontFamily: "system-ui", fontSize: 14 }}>
          <Flame size={18} color={streak > 0 ? C.green : C.muted} fill={streak > 0 ? C.green : "none"} />
          {streak > 0 ? (
            <span><b>{streak}</b> {streak === 1 ? "día completo" : "días completos"} seguidos</span>
          ) : (
            <span style={{ color: C.muted }}>Completá los {selTotal} para empezar tu racha</span>
          )}
        </div>
        <button className="mr-tap" onClick={reset} aria-label="Borrar datos" style={{ ...navBtn, width: 32, height: 32 }}>
          <RotateCcw size={15} color={C.muted} />
        </button>
      </div>
    </div>
  );
}

const wrap = {
  maxWidth: 420, margin: "0 auto",
  paddingTop: "calc(22px + env(safe-area-inset-top))",
  paddingRight: "calc(18px + env(safe-area-inset-right))",
  paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
  paddingLeft: "calc(18px + env(safe-area-inset-left))",
  display: "flex", flexDirection: "column", gap: 16,
  background: C.bg, borderRadius: 20, position: "relative", overflow: "hidden",
  fontFamily: "system-ui, sans-serif",
};
const navBtn = {
  width: 30, height: 30, borderRadius: 9, border: `1px solid ${C.border}`,
  background: "transparent", display: "grid", placeItems: "center",
  cursor: "pointer", WebkitTapHighlightColor: "transparent",
};
