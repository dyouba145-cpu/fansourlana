import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Settings, X, Moon, Sun, Volume2, VolumeX, Vibrate, Compass, HandMetal,
  Navigation, Check, ChevronDown, Plus, Trash2, Upload,
  Clock, History as HistoryIcon, Star, Sunrise, Maximize, Minimize, Target,
  Users, Heart, MessageCircle, LogOut, Film,
} from "lucide-react";

/* ============================================================================
   FANSOURLANA — un tasbih numérique, direction "Liquid Glass Premium"
   Chaque surface est du verre : translucide, floue, bordée de lumière fine.
   Le chapelet de perles est la pièce signature — verre, profondeur, lumière
   qui circule, célébration à chaque cycle.
============================================================================ */

/* ---------------------------------- Tokens ---------------------------------- */
const THEME = {
  dark: {
    bg: "#070A08",
    text: "#F4F1E8",
    textDim: "rgba(244,241,232,.58)",
    textFaint: "rgba(244,241,232,.34)",
    glass: "rgba(255,255,255,.055)",
    glassStrong: "rgba(255,255,255,.10)",
    glassBorder: "rgba(255,255,255,.14)",
    glassHighlight: "rgba(255,255,255,.30)",
    shadow: "0 24px 60px rgba(0,0,0,.5)",
    scrim: "rgba(4,7,6,.62)",
  },
  light: {
    bg: "#F7F5F0",
    text: "#151E1A",
    textDim: "rgba(21,30,26,.58)",
    textFaint: "rgba(21,30,26,.34)",
    glass: "rgba(226,240,232,.42)",
    glassStrong: "rgba(232,244,236,.68)",
    glassBorder: "rgba(140,190,170,.28)",
    glassHighlight: "rgba(255,255,255,.92)",
    shadow: "0 24px 50px rgba(70,110,95,.14)",
    scrim: "rgba(247,245,240,.6)",
  },
};
const MINT = "#BFE8D8";
const MINT_GLOW = "#8FE0BE";
const ACCENT = "#1F7A5C";
const ACCENT_BRIGHT = "#3BBE93";
const GOLD = "#C9A227";
const GOLD_BRIGHT = "#F0CE6A";
const KAABA = { lat: 21.4225, lng: 39.8262 };
// Position par défaut utilisée pour la Qibla et les horaires de prière — aucune
// géolocalisation n'est demandée à l'utilisateur. Modifiable ci-dessous si besoin.
const DEFAULT_COORDS = { lat: 48.8566, lng: 2.3522 }; // Paris
const DEFAULT_LOCATION_LABEL = "Paris (par défaut)";

/* ============================================================================
   SUPABASE — Connexion Google + base Communauté (vidéos, posts, likes, commentaires)
   Remplace les deux valeurs ci-dessous par celles de TON projet Supabase :
   Dashboard > Project Settings > API > "Project URL" et "anon public" key.
   Le schéma SQL correspondant est dans supabase_schema.sql (à exécuter une fois
   dans Supabase > SQL Editor), et Google doit être activé dans
   Authentication > Providers.
============================================================================ */
const SUPABASE_URL = "https://iswhtaetzyilgvlseigk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_uRbDG-597hojbWM8dSCvXw_fRT5Rufu";
const supabase = (SUPABASE_URL.includes("TON-PROJET") || SUPABASE_ANON_KEY.includes("TA_CLE"))
  ? null // évite de planter tant que les vraies clés ne sont pas renseignées
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BEADS_TOTAL = 33;
const SESSION_TIMEOUT_MS = 30000;
const GOAL_PRESETS = [33, 99, 100, 1000];

const R = { xs: 6, sm: 10, md: 14, lg: 20, xl: 26, xxl: 32, pill: 999 };
const EASE = { standard: "cubic-bezier(.22,1,.36,1)", spring: "cubic-bezier(.34,1.56,.64,1)", swift: "cubic-bezier(.4,0,.2,1)", visionos: "cubic-bezier(.16,1,.3,1)" };
const BLUR = "blur(22px) saturate(165%)";

function glass(th, { strong = false, radius = R.lg, border = true, deep = false } = {}) {
  return {
    background: strong ? th.glassStrong : th.glass,
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: border ? `1px solid ${th.glassBorder}` : "none",
    borderRadius: radius,
    boxShadow: deep ? `inset 0 1px 0 ${th.glassHighlight}, ${th.shadow}` : `inset 0 1px 0 ${th.glassHighlight}`,
  };
}

const DHIKRS = [
  { id: "subhanallah", arabic: "سُبْحَانَ اللّٰه", translit: "SubhanAllah", meaning: "Gloire à Allah" },
  { id: "alhamdulillah", arabic: "اَلْحَمْدُ لِلّٰه", translit: "Alhamdulillah", meaning: "Louange à Allah" },
  { id: "allahuakbar", arabic: "اَللّٰهُ أَكْبَر", translit: "Allahu Akbar", meaning: "Allah est le plus grand" },
  { id: "astaghfirullah", arabic: "أَسْتَغْفِرُ اللّٰه", translit: "Astaghfirullah", meaning: "Je demande pardon à Allah" },
  { id: "lailaha", arabic: "لَا إِلٰهَ إِلَّا اللّٰه", translit: "La ilaha illa Allah", meaning: "Nulle divinité si ce n'est Allah" },
];

const PRESETS = [
  { id: "nuit", label: "Nuit étoilée", css: () =>
      "radial-gradient(1.5px 1.5px at 18% 26%, rgba(255,255,255,.85), transparent 60%)," +
      "radial-gradient(1.5px 1.5px at 68% 60%, rgba(255,255,255,.7), transparent 60%)," +
      "radial-gradient(1px 1px at 40% 78%, rgba(255,255,255,.6), transparent 60%)," +
      "radial-gradient(1px 1px at 85% 22%, rgba(255,255,255,.5), transparent 60%)," +
      "radial-gradient(120% 90% at 50% -10%, #16202B 0%, #0A0F16 55%, #05070A 100%)" },
  { id: "aube", label: "Aube dorée", css: (dark) => dark
      ? "radial-gradient(120% 90% at 50% -10%, #2A2013 0%, #17130C 55%, #0D0A06 100%)"
      : "radial-gradient(120% 90% at 50% -10%, #FFF3DA 0%, #FCE7C2 55%, #F6D89E 100%)" },
  { id: "oasis", label: "Oasis", css: (dark) => dark
      ? "radial-gradient(120% 90% at 50% -10%, #10241D 0%, #0A1712 55%, #060D0A 100%)"
      : "radial-gradient(120% 90% at 50% -10%, #E7F3EC 0%, #D4EBE0 55%, #BEDFD0 100%)" },
  { id: "desert", label: "Désert", css: (dark) => dark
      ? "radial-gradient(120% 90% at 50% -10%, #26190F 0%, #180F09 55%, #0D0805 100%)"
      : "radial-gradient(120% 90% at 50% -10%, #F8ECD9 0%, #F0DEBF 55%, #E4CB9F 100%)" },
  { id: "marbre", label: "Marbre", css: (dark) => dark
      ? "radial-gradient(120% 90% at 50% -10%, #1B1D1F 0%, #131416 55%, #0B0C0D 100%)"
      : "radial-gradient(120% 90% at 50% -10%, #FBFBF9 0%, #F1F0EC 55%, #E7E5DE 100%)" },
];

/* ---------------------------------- Haptics (real toggle, no global override) ---------------------------------- */
const hapticState = { enabled: true };
function buzz(ms) {
  if (!hapticState.enabled || !navigator.vibrate) return;
  try { navigator.vibrate(ms); } catch (e) {}
}

/* ---------------------------------- Storage ---------------------------------- */
/* Uses localStorage — works in any real browser / WebView (Capacitor), unlike
   window.storage which only exists inside the Claude chat preview environment. */
async function loadJSON(key, fallback) {
  try {
    const raw = window.localStorage ? window.localStorage.getItem(key) : null;
    return raw != null ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
async function saveJSON(key, value) {
  try { if (window.localStorage) window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

/* ---------------------------------- Utils ---------------------------------- */
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

function qiblaBearing(lat, lng) {
  const phi1 = toRad(lat), phi2 = toRad(KAABA.lat);
  const dLambda = toRad(KAABA.lng - lng);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
function distanceToKaabaKm(lat, lng) {
  const Rk = 6371;
  const dphi = toRad(KAABA.lat - lat), dl = toRad(KAABA.lng - lng);
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(KAABA.lat)) * Math.sin(dl / 2) ** 2;
  return Rk * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function angleDiff(a, b) { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }

function downscaleImage(dataUrl, maxDim = 1400) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale); height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function formatDayLabel(ts) {
  const d = new Date(ts), now = new Date();
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return "Aujourd'hui";
  if (sameDay(d, yesterday)) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}
function formatTime(ts) { return new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
function toArabicDigits(str) { return String(str).replace(/[0-9]/g, (d) => ARABIC_DIGITS[+d]); }
function pad2(n) { return String(n).padStart(2, "0"); }

/* ---- Prayer times (astronomical calculation, MWL angles: Fajr 18°, Isha 17°, Asr factor 1) ---- */
const dsin = (d) => Math.sin(toRad(d));
const dcos = (d) => Math.cos(toRad(d));
const dtan = (d) => Math.tan(toRad(d));
const darcsin = (x) => toDeg(Math.asin(x));
const darccos = (x) => toDeg(Math.acos(Math.max(-1, Math.min(1, x))));
const darctan2 = (y, x) => toDeg(Math.atan2(y, x));
const darccot = (x) => toDeg(Math.atan2(1, x));
const fixAngle = (a) => { a = a - 360 * Math.floor(a / 360); return a < 0 ? a + 360 : a; };

function julianDay(year, month, day) {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}
function sunPosition(jd) {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * dsin(g) + 0.02 * dsin(2 * g));
  const e = 23.439 - 0.00000036 * D;
  const RA = darctan2(dcos(e) * dsin(L), dcos(L)) / 15;
  const eqt = q / 15 - fixAngle(RA * 15) / 15;
  const decl = darcsin(dsin(e) * dsin(L));
  return { declination: decl, equation: eqt };
}
function sunHourAngleHours(lat, decl, altitudeDeg) {
  const cosH = (dsin(altitudeDeg) - dsin(lat) * dsin(decl)) / (dcos(lat) * dcos(decl));
  return darccos(cosH) / 15;
}
function asrAltitude(lat, decl, factor) { return darccot(factor + dtan(Math.abs(lat - decl))); }

function computePrayerTimes(lat, lng, date) {
  const jd = julianDay(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()) - lng / (15 * 24) + 0.5;
  const { declination: decl, equation: eqt } = sunPosition(jd);
  const dhuhr = 12 - lng / 15 - eqt;
  const fajrOff = sunHourAngleHours(lat, decl, -18);
  const sunOff = sunHourAngleHours(lat, decl, -0.833);
  const ishaOff = sunHourAngleHours(lat, decl, -17);
  const asrAlt = asrAltitude(lat, decl, 1);
  const asrOff = sunHourAngleHours(lat, decl, asrAlt);
  const toDate = (hoursUTC) => {
    let h = hoursUTC; let dayShift = 0;
    while (h < 0) { h += 24; dayShift -= 1; }
    while (h >= 24) { h -= 24; dayShift += 1; }
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + dayShift));
    d.setUTCHours(0, 0, 0, 0);
    d.setTime(d.getTime() + h * 3600 * 1000);
    return d;
  };
  return {
    fajr: toDate(dhuhr - fajrOff), sunrise: toDate(dhuhr - sunOff), dhuhr: toDate(dhuhr),
    asr: toDate(dhuhr + asrOff), maghrib: toDate(dhuhr + sunOff), isha: toDate(dhuhr + ishaOff),
  };
}

/* Damped spring — settle time depends on distance, drives all "organic" motion */
function useSpring(target, { stiffness = 210, damping = 22, mass = 1 } = {}) {
  const [value, setValue] = useState(target);
  const state = useRef({ v: target, vel: 0 });
  const raf = useRef(null);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    function step() {
      const s = state.current;
      const acc = (-stiffness * (s.v - target) - damping * s.vel) / mass;
      s.vel += acc / 60; s.v += s.vel / 60;
      setValue(s.v);
      if (Math.abs(s.vel) > 0.02 || Math.abs(s.v - target) > 0.02) raf.current = requestAnimationFrame(step);
      else { s.v = target; s.vel = 0; setValue(target); }
    }
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
  return value;
}
function useTicker(intervalMs, active) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
}
/* Same physics as useSpring, but writes straight to a DOM node via ref + applyFn
   instead of calling setState every frame. Used for continuous animations (a
   rotating light, a compass needle) so the 60fps loop never re-renders React. */
function useSpringStyle(ref, target, applyFn, { stiffness = 210, damping = 22, mass = 1 } = {}) {
  const state = useRef({ v: target, vel: 0, inited: false });
  const raf = useRef(null);
  const applyFnRef = useRef(applyFn); applyFnRef.current = applyFn;
  useEffect(() => {
    if (!state.current.inited) { state.current.v = target; state.current.inited = true; }
    cancelAnimationFrame(raf.current);
    function step() {
      const s = state.current;
      const acc = (-stiffness * (s.v - target) - damping * s.vel) / mass;
      s.vel += acc / 60; s.v += s.vel / 60;
      if (ref.current) applyFnRef.current(ref.current, s.v);
      if (Math.abs(s.vel) > 0.02 || Math.abs(s.v - target) > 0.02) raf.current = requestAnimationFrame(step);
      else { s.v = target; s.vel = 0; if (ref.current) applyFnRef.current(ref.current, target); }
    }
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
}

/* ---------------------------------- Primitives ---------------------------------- */
function Pressable({ onClick, children, style, scale = 0.96, haptic = 5, disabled, as = "div", ariaLabel, role = "button", ...rest }) {
  const [pressed, setPressed] = useState(false);
  const Tag = as;
  const trigger = () => {
    if (disabled) return;
    if (haptic) buzz(haptic);
    onClick && onClick();
  };
  return (
    <Tag
      role={role}
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onClick={trigger}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); trigger(); } }}
      style={{
        transform: pressed ? `scale(${scale})` : "scale(1)",
        transition: `transform 150ms ${EASE.visionos}, opacity 150ms ${EASE.swift}, box-shadow 150ms ${EASE.swift}`,
        opacity: disabled ? 0.35 : pressed ? 0.86 : 1,
        cursor: disabled ? "default" : "pointer",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        outline: "none",
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function Spinner({ size = 15, color = ACCENT }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: "fl-spin .8s linear infinite" }}>
      <circle cx="12" cy="12" r="9" stroke="rgba(128,128,128,.18)" strokeWidth="2.4" fill="none" />
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.4" fill="none" strokeDasharray="14 40" strokeLinecap="round" />
    </svg>
  );
}

function LightSwitch({ on, onChange }) {
  return (
    <Pressable onClick={() => onChange(!on)} scale={0.97} haptic={7} ariaLabel={on ? "Passer en thème clair" : "Passer en thème sombre"} style={{
      width: 92, height: 42, borderRadius: R.pill, position: "relative", flexShrink: 0,
      background: "linear-gradient(to bottom, #2b2d30 0%, #303339 35%, #1a1c1f 100%)",
      boxShadow: "inset 2px 2px 5px rgba(255,255,255,.08), inset -2px -4px 8px rgba(0,0,0,.6), 0 6px 14px rgba(0,0,0,.35)",
      display: "flex", alignItems: "center", padding: "0 5px",
    }}>
      <div style={{
        position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
        width: 17, height: 17, borderRadius: "50%",
        background: on ? GOLD_BRIGHT : "rgba(255,255,255,.14)",
        boxShadow: on ? `0 0 12px 3px ${GOLD_BRIGHT}90, inset 0 0 5px rgba(255,255,255,.6)` : "none",
        transition: "background 340ms ease, box-shadow 340ms ease",
      }} />
      <div style={{
        width: 34, height: 34, borderRadius: "50%",
        background: "linear-gradient(135deg, #43464b, #1b1d20 70%)",
        boxShadow: "inset 3px 3px 5px rgba(255,255,255,.22), inset -3px -4px 6px rgba(0,0,0,.7), 0 3px 7px rgba(0,0,0,.5)",
        transform: `translateX(${on ? 48 : 0}px)`,
        transition: "transform .55s cubic-bezier(.5,1.8,.3,.9)",
        position: "relative", zIndex: 2,
      }} />
    </Pressable>
  );
}

function MiniToggle({ on, onChange, accent = ACCENT, ariaLabel }) {
  return (
    <Pressable onClick={() => onChange(!on)} scale={0.95} haptic={5} ariaLabel={ariaLabel} style={{
      width: 44, height: 26, borderRadius: R.pill, position: "relative", flexShrink: 0,
      background: on ? accent : "rgba(128,128,128,.25)",
      transition: `background 260ms ${EASE.swift}`,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3,
        boxShadow: "0 2px 5px rgba(0,0,0,.3)",
        transform: `translateX(${on ? 21 : 3}px)`,
        transition: "transform .4s cubic-bezier(.5,1.8,.3,.9)",
      }} />
    </Pressable>
  );
}

/* Slim glass slider (used for music volume) */
function GlassSlider({ value, onChange, th, accent = ACCENT, ariaLabel }) {
  const trackRef = useRef(null);
  const setFromClientX = (clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(ratio);
  };
  return (
    <div
      ref={trackRef}
      role="slider" aria-label={ariaLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") onChange(Math.min(1, value + 0.05));
        if (e.key === "ArrowLeft") onChange(Math.max(0, value - 0.05));
      }}
      onPointerDown={(e) => { setFromClientX(e.clientX); const move = (ev) => setFromClientX(ev.clientX); const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); }; window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); }}
      style={{ position: "relative", width: "100%", height: 22, display: "flex", alignItems: "center", cursor: "pointer", touchAction: "none" }}
    >
      <div style={{ width: "100%", height: 4, borderRadius: 4, background: th.glassBorder, overflow: "hidden" }}>
        <div style={{ width: `${value * 100}%`, height: "100%", background: `linear-gradient(90deg, ${accent}, ${ACCENT_BRIGHT})`, borderRadius: 4 }} />
      </div>
      <div style={{
        position: "absolute", left: `calc(${value * 100}% - 8px)`, width: 16, height: 16, borderRadius: "50%",
        background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,.35)",
      }} />
    </div>
  );
}

/* ---------------------------------- Sound ---------------------------------- */
function useTock() {
  const ctxRef = useRef(null);
  return useCallback((variant = "tap") => {
    try {
      if (!ctxRef.current) { const Ctx = window.AudioContext || window.webkitAudioContext; ctxRef.current = new Ctx(); }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = "sine"; const now = ctx.currentTime;
      if (variant === "tap") {
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(230, now + 0.075);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.stop(now + 0.1);
      } else if (variant === "cycle") {
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.stop(now + 0.42);
      } else if (variant === "goal") {
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = "sine"; const s = now + i * 0.12;
          o.frequency.setValueAtTime(freq, s);
          g.gain.setValueAtTime(0.0001, s);
          g.gain.exponentialRampToValueAtTime(0.18, s + 0.05);
          g.gain.exponentialRampToValueAtTime(0.0001, s + 0.5);
          o.connect(g); g.connect(ctx.destination); o.start(s); o.stop(s + 0.55);
        });
        return;
      } else {
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.stop(now + 0.34);
      }
      osc.connect(gain); gain.connect(ctx.destination); osc.start(now);
    } catch (e) {}
  }, []);
}
function useReminderChime() {
  const ctxRef = useRef(null);
  return useCallback(() => {
    try {
      if (!ctxRef.current) { const Ctx = window.AudioContext || window.webkitAudioContext; ctxRef.current = new Ctx(); }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const notes = [392.0, 466.16, 523.25, 659.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = "sine"; const start = ctx.currentTime + i * 0.55;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.22, start + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.95);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(start); osc.stop(start + 1.0);
      });
    } catch (e) {}
  }, []);
}

/* ---------------------------------- Animated background halos ---------------------------------- */
const AmbientBackground = React.memo(function AmbientBackground({ dark }) {
  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
      <div style={{
        position: "absolute", width: "70vw", height: "70vw", maxWidth: 520, maxHeight: 520,
        left: "-15%", top: "-10%", borderRadius: "50%", filter: "blur(70px)",
        background: `radial-gradient(circle, ${ACCENT}${dark ? "3a" : "26"}, transparent 70%)`,
        animation: "fl-drift1 26s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: "60vw", height: "60vw", maxWidth: 460, maxHeight: 460,
        right: "-12%", top: "18%", borderRadius: "50%", filter: "blur(70px)",
        background: `radial-gradient(circle, ${GOLD}${dark ? "26" : "1c"}, transparent 70%)`,
        animation: "fl-drift2 32s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: "55vw", height: "55vw", maxWidth: 420, maxHeight: 420,
        left: "10%", bottom: "-14%", borderRadius: "50%", filter: "blur(75px)",
        background: `radial-gradient(circle, ${ACCENT}${dark ? "28" : "1a"}, transparent 70%)`,
        animation: "fl-drift3 28s ease-in-out infinite",
      }} />
    </div>
  );
});

/* ---------------------------------- Intro screen ---------------------------------- */
function IntroScreen({ dark, onDone }) {
  const th = dark ? THEME.dark : THEME.light;
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [onDone]);
  const radius = 100;
  return (
    <div onClick={onDone} style={{
      position: "fixed", inset: 0, background: th.bg, display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100,
      animation: "fl-fadein 500ms ease", cursor: "pointer", overflow: "hidden",
    }}>
      <AmbientBackground dark={dark} />
      <div style={{ position: "relative", width: radius * 2 + 40, height: radius * 2 + 40, zIndex: 1 }}>
        {Array.from({ length: BEADS_TOTAL }).map((_, i) => {
          const angle = (360 / BEADS_TOTAL) * i - 90;
          const rad = toRad(angle);
          const x = radius * Math.cos(rad), y = radius * Math.sin(rad);
          const sz = i === 0 ? 13 : 9;
          return (
            <div key={i} style={{
              position: "absolute", left: "50%", top: "50%", width: sz, height: sz, borderRadius: "50%",
              transform: `translate(-50%,-50%) translate(${x}px, ${y}px)`,
              background: `radial-gradient(circle at 32% 28%, #fff, ${th.text} 55%, transparent 85%)`,
              boxShadow: `0 0 8px ${th.glassHighlight}`,
              opacity: 0, animation: "fl-beadpop 480ms ease forwards", animationDelay: `${i * 26}ms`,
            }} />
          );
        })}
        <div style={{
          position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", textAlign: "center",
          opacity: 0, animation: "fl-fadein 700ms ease forwards", animationDelay: `${BEADS_TOTAL * 26 + 250}ms`, width: 220,
        }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, color: th.text, letterSpacing: -0.5 }}>Fansourlana</div>
          <div style={{ fontSize: 11.5, color: th.textDim, marginTop: 7, letterSpacing: 0.4 }}>Tranquillité à chaque perle</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Bead ring — the signature glass tasbih ---------------------------------- */
const BeadRing = React.memo(function BeadRing({ count, dark, th, dhikr, celebrating, goalHit }) {
  const radius = 120;
  const size = radius * 2 + 40;
  const activeIdx = count % BEADS_TOTAL;
  const half = Math.floor(BEADS_TOTAL / 2);
  const angleTarget = (360 / BEADS_TOTAL) * count; // unbounded — the thread turns continuously, never snaps back
  const lightWrapRef = useRef(null);
  useSpringStyle(lightWrapRef, angleTarget, (node, v) => { node.style.transform = `rotate(${v - 90}deg)`; }, { stiffness: 150, damping: 19 });
  const dimBg = dark ? "rgba(255,255,255,.09)" : "rgba(20,31,25,.08)";
  const dimBorder = dark ? "1px solid rgba(255,255,255,.10)" : "1px solid rgba(20,31,25,.10)";

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      {/* ambient breathing halo behind the glass */}
      <div style={{
        position: "absolute", inset: -10, borderRadius: "50%",
        background: `radial-gradient(circle, ${dark ? "rgba(255,255,255,.06)" : "rgba(20,31,25,.05)"}, transparent 68%)`,
        animation: "fl-breathe 7s ease-in-out infinite",
      }} />

      {/* traveling light — a spark that circles the thread continuously as you count */}
      <div ref={lightWrapRef} style={{ position: "absolute", inset: 0, transform: `rotate(${angleTarget - 90}deg)`, pointerEvents: "none", willChange: "transform" }}>
        <div style={{
          position: "absolute", top: 0, left: "50%", width: 5, height: 5, marginLeft: -2.5, borderRadius: "50%",
          background: GOLD_BRIGHT, boxShadow: `0 0 12px 4px ${GOLD_BRIGHT}b0, 0 0 24px 8px ${GOLD_BRIGHT}40`,
        }} />
      </div>

      {(celebrating || goalHit) && (
        <div style={{
          position: "absolute", inset: 4, borderRadius: "50%",
          border: `2px solid ${GOLD_BRIGHT}`, boxShadow: `0 0 34px 6px ${GOLD_BRIGHT}70`,
          animation: "fl-cycleflash 950ms ease-out forwards",
        }} />
      )}

      {Array.from({ length: BEADS_TOTAL }).map((_, i) => {
        const angle = (360 / BEADS_TOTAL) * i - 90;
        const rad = toRad(angle);
        const x = radius * Math.cos(rad), y = radius * Math.sin(rad);
        const passed = i < activeIdx;
        const isCurrent = i === activeIdx - 1 && count > 0;
        const isImam = i === 0;
        const beadSize = isImam ? 17 : 12;
        const isFirstHalf = i < half;
        const glassBead = isFirstHalf
          ? { bg: "radial-gradient(circle at 28% 24%, #ffffff, #f4efe4 42%, #e3ddd0 72%, #cdc6b6 100%)", ring: "1.4px solid rgba(120,100,70,.18)", glow: "0 0 13px 3px rgba(255,250,235,.7), inset 0 -2px 3px rgba(120,100,70,.14), inset 0 1px 1px rgba(255,255,255,.9)" }
          : { bg: "radial-gradient(circle at 28% 24%, #e2ece6, #a8bdb4 42%, #6d8078 72%, #465650 100%)", ring: "1.4px solid rgba(200,225,210,.35)", glow: "0 0 12px 3px rgba(191,232,216,.55), inset 0 -2px 3px rgba(20,30,25,.25), inset 0 1px 1px rgba(255,255,255,.5)" };
        return (
          <div key={i} style={{
            position: "absolute", left: "50%", top: "50%", width: beadSize, height: beadSize, borderRadius: "50%",
            transform: `translate(-50%,-50%) translate(${x}px, ${y}px) scale(${isCurrent ? 1.4 : 1})`,
            transition: `transform 420ms ${EASE.visionos}, background 340ms ${EASE.swift}, box-shadow 340ms ${EASE.swift}`,
            background: passed || isImam ? glassBead.bg : dimBg,
            border: passed || isImam ? glassBead.ring : dimBorder,
            boxShadow: isCurrent ? glassBead.glow : passed || isImam ? "0 1px 3px rgba(0,0,0,.25)" : "none",
          }} />
        );
      })}

      {/* glass dial center */}
      <div style={{
        position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
        width: radius * 2 - 62, height: radius * 2 - 62, borderRadius: "50%",
        ...glass(th, { strong: false, radius: "50%", deep: true }),
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: 12, textAlign: "center",
      }}>
        {dhikr.arabic ? (
          <div style={{ fontFamily: "'Amiri', serif", fontSize: 21, color: th.text, lineHeight: 1.3, direction: "rtl" }}>{dhikr.arabic}</div>
        ) : null}
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 54, fontWeight: 600, color: th.text, lineHeight: 1, letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>
          {count}
        </div>
        <div style={{ fontSize: 11, color: th.textDim, fontWeight: 700, letterSpacing: 0.3 }}>{dhikr.translit}</div>
      </div>
    </div>
  );
});

/* ---------------------------------- Tap zone: glass orb with liquid ripple ---------------------------------- */
function TapZone({ th, onTap, onFinish, hasCount }) {
  const [ripples, setRipples] = useState([]);
  const [pressed, setPressed] = useState(false);

  const handleTap = () => {
    const id = Date.now() + Math.random();
    setRipples((r) => [...r, id]);
    setTimeout(() => setRipples((r) => r.filter((x) => x !== id)), 700);
    onTap();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%" }}>
      <div
        role="button" tabIndex={0} aria-label="Compter une perle"
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onClick={handleTap}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleTap(); } }}
        style={{
          position: "relative", width: 86, height: 86, borderRadius: "50%", cursor: "pointer",
          transform: pressed ? "scale(0.9)" : "scale(1)",
          transition: `transform 160ms ${EASE.visionos}`,
          background: `radial-gradient(circle at 32% 26%, ${ACCENT_BRIGHT}, ${ACCENT} 70%)`,
          boxShadow: pressed
            ? `0 4px 14px ${ACCENT}55, inset 0 3px 8px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.2)`
            : `0 12px 30px ${ACCENT}55, inset 0 1px 0 rgba(255,255,255,.4), inset 0 -6px 10px rgba(0,0,0,.2)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          WebkitTapHighlightColor: "transparent", outline: "none",
        }}
      >
        {ripples.map((id) => (
          <div key={id} style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `1.5px solid ${GOLD_BRIGHT}aa`,
            animation: "fl-ripple 700ms ease-out forwards",
          }} />
        ))}
        <HandMetal size={26} color="#fff" strokeWidth={1.7} />
      </div>
      {hasCount ? (
        <Pressable onClick={onFinish} haptic={8} scale={0.95} style={{ padding: "6px 4px" }}>
          <span style={{ fontSize: 11.5, color: th.textDim, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>
            Terminer la séance
          </span>
        </Pressable>
      ) : (
        <div style={{ height: 25 }} />
      )}
    </div>
  );
}

/* ---------------------------------- Regularity stars + live clock ---------------------------------- */
function StreakStars({ th, history, todayActive }) {
  const lit = [3, 2, 1, 0].map((offset) => {
    if (offset === 0 && todayActive) return true;
    const d = new Date(); d.setDate(d.getDate() - offset);
    const dayStr = d.toDateString();
    return history.some((h) => new Date(h.at).toDateString() === dayStr);
  });
  return (
    <div style={{ display: "flex", gap: 5 }} aria-label="Régularité des 4 derniers jours">
      {lit.map((on, i) => (
        <Star key={i} size={14} strokeWidth={1.6} color={on ? GOLD_BRIGHT : th.textFaint} fill={on ? GOLD_BRIGHT : "none"}
          style={{ filter: on ? `drop-shadow(0 0 4px ${GOLD_BRIGHT}80)` : "none", transition: `all 320ms ${EASE.swift}` }} />
      ))}
    </div>
  );
}
function LiveClock({ th }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const label = toArabicDigits(`${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`);
  return (
    <span style={{ fontSize: 13, color: th.textDim, fontWeight: 600, letterSpacing: 0.5, fontFamily: "'Amiri', serif" }}>
      {label}
    </span>
  );
}

/* Liquid 30s save bar — replaces a simple progress indicator with a "living" line.
   Shows a traveling bead of light as the session approaches auto-save, then a soft
   confirmation pulse once the session has been written to history. */
const LiquidSaveBar = React.memo(function LiquidSaveBar({ th, active, lastTap, justSaved, onExpire }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 150);
    return () => clearInterval(id);
  }, [active]);

  const elapsed = active ? now - lastTap : 0;
  const progress = active ? Math.min(1, elapsed / SESSION_TIMEOUT_MS) : 0;
  const secondsLeft = Math.max(0, Math.ceil((SESSION_TIMEOUT_MS - elapsed) / 1000));

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  useEffect(() => { if (active && progress >= 1) onExpireRef.current(); }, [active, progress]);

  if (!active && !justSaved) {
    return (
      <div style={{ width: 190, margin: "-6px auto 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ width: "100%", height: 2, borderRadius: 2, background: th.glassBorder, opacity: 0.5 }} />
      </div>
    );
  }
  return (
    <div style={{ width: 190, margin: "-6px auto 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: "100%", height: 3, borderRadius: 3, background: th.glassBorder, overflow: "visible" }}>
        <div style={{
          width: justSaved ? "100%" : `${progress * 100}%`, height: "100%", borderRadius: 3,
          background: justSaved ? `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})` : `linear-gradient(90deg, ${ACCENT}, ${ACCENT_BRIGHT})`,
          transition: `width 160ms linear, background 300ms ease`,
        }} />
        {!justSaved && (
          <div style={{
            position: "absolute", top: "50%", left: `${progress * 100}%`, width: 7, height: 7, marginLeft: -3.5, marginTop: -3.5,
            borderRadius: "50%", background: ACCENT_BRIGHT,
            boxShadow: `0 0 8px 3px ${ACCENT_BRIGHT}90`,
            transition: "left 160ms linear",
          }} />
        )}
        {justSaved && (
          <div style={{
            position: "absolute", inset: -6, borderRadius: 6, border: `1px solid ${GOLD_BRIGHT}`,
            animation: "fl-savepulse 700ms ease-out forwards",
          }} />
        )}
      </div>
      <span style={{ fontSize: 10, color: justSaved ? GOLD_BRIGHT : th.textFaint, fontWeight: 700, letterSpacing: 0.2 }}>
        {justSaved ? "✓ Sauvegardé" : `Sauvegarde dans 00:${pad2(secondsLeft)}`}
      </span>
    </div>
  );
});

/* ---------------------------------- Dhikr picker (glass drawer, goals + favorites) ---------------------------------- */
function DhikrPicker({ th, dark, activeDhikr, allDhikrs, onSelect, onAddCustom, onDeleteCustom, favorites, toggleFavorite, goal, setGoal }) {
  const [open, setOpen] = useState(false);
  const [arabic, setArabic] = useState("");
  const [translit, setTranslit] = useState("");
  const [meaning, setMeaning] = useState("");
  const [customGoal, setCustomGoal] = useState("");

  const submit = () => {
    if (!translit.trim()) return;
    onAddCustom({ arabic: arabic.trim(), translit: translit.trim(), meaning: meaning.trim() });
    setArabic(""); setTranslit(""); setMeaning("");
    setOpen(false);
  };

  const sorted = useMemo(() => {
    const favs = allDhikrs.filter((d) => favorites.includes(d.id));
    const rest = allDhikrs.filter((d) => !favorites.includes(d.id));
    return [...favs, ...rest];
  }, [allDhikrs, favorites]);

  const inputStyle = { fontFamily: "inherit", fontSize: 13, padding: "10px 12px", borderRadius: R.sm, border: `1px solid ${th.glassBorder}`, background: th.glass, color: th.text, outline: "none", width: "100%" };

  return (
    <div style={{ width: "100%" }}>
      <Pressable onClick={() => setOpen((o) => !o)} scale={0.98} haptic={4} ariaLabel="Choisir une prière" style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "13px 17px", ...glass(th),
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: th.text }}>{activeDhikr.translit}</span>
          <span style={{ fontSize: 10.5, color: th.textFaint }}>Objectif : {goal} · Choisir une autre prière</span>
        </div>
        <ChevronDown size={16} color={th.textDim} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: `transform 300ms ${EASE.swift}` }} />
      </Pressable>

      <div style={{
        maxHeight: open ? 640 : 0, opacity: open ? 1 : 0, overflow: "hidden",
        transition: `max-height 420ms ${EASE.visionos}, opacity 280ms ${EASE.swift}`,
      }}>
        <div style={{ padding: "14px 4px 4px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {sorted.map((d) => {
              const isActive = d.id === activeDhikr.id;
              const isFav = favorites.includes(d.id);
              return (
                <div key={d.id} style={{ position: "relative" }}>
                  <Pressable onClick={() => { onSelect(d.id); setOpen(false); }} scale={0.96} haptic={4} style={{
                    padding: d.custom ? "9px 46px 9px 14px" : "9px 30px 9px 14px", borderRadius: R.pill,
                    background: isActive ? `linear-gradient(135deg, ${ACCENT_BRIGHT}, ${ACCENT})` : th.glassStrong,
                    border: `1px solid ${isActive ? "transparent" : th.glassBorder}`,
                    backdropFilter: BLUR, WebkitBackdropFilter: BLUR,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? "#08120D" : th.text }}>{d.translit}</span>
                  </Pressable>
                  <Pressable onClick={() => toggleFavorite(d.id)} haptic={4} scale={0.85} ariaLabel={isFav ? "Retirer des favoris" : "Ajouter aux favoris"} style={{
                    position: "absolute", right: d.custom ? 22 : 6, top: "50%", transform: "translateY(-50%)",
                    width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Star size={11} color={isFav ? GOLD_BRIGHT : (isActive ? "#08120D" : th.textFaint)} fill={isFav ? GOLD_BRIGHT : "none"} strokeWidth={1.8} />
                  </Pressable>
                  {d.custom && (
                    <Pressable onClick={() => onDeleteCustom(d.id)} haptic={6} scale={0.85} ariaLabel="Supprimer cette prière" style={{
                      position: "absolute", right: 3, top: "50%", transform: "translateY(-50%)",
                      width: 16, height: 16, borderRadius: "50%", background: "rgba(0,0,0,.28)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <X size={9} color="#fff" strokeWidth={3} />
                    </Pressable>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ height: 1, background: th.glassBorder }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: th.textDim, display: "flex", alignItems: "center", gap: 6 }}>
              <Target size={12} /> Objectif de récitation
            </span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {GOAL_PRESETS.map((g) => (
                <Pressable key={g} onClick={() => setGoal(g)} scale={0.95} haptic={4} style={{
                  padding: "7px 13px", borderRadius: R.pill,
                  background: goal === g ? `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})` : th.glass,
                  border: `1px solid ${goal === g ? "transparent" : th.glassBorder}`,
                }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: goal === g ? "#241a03" : th.text }}>{g}</span>
                </Pressable>
              ))}
              <input
                value={customGoal} onChange={(e) => setCustomGoal(e.target.value.replace(/\D/g, ""))}
                onBlur={() => { const n = parseInt(customGoal, 10); if (n > 0) setGoal(n); setCustomGoal(""); }}
                placeholder="Autre"
                style={{ width: 64, fontSize: 11.5, padding: "7px 10px", borderRadius: R.pill, border: `1px solid ${th.glassBorder}`, background: th.glass, color: th.text, outline: "none" }}
              />
            </div>
          </div>

          <div style={{ height: 1, background: th.glassBorder }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: th.textDim }}>Composer votre propre prière</span>
            <input value={arabic} onChange={(e) => setArabic(e.target.value)} placeholder="النص بالعربية (optionnel)" dir="rtl" style={{ ...inputStyle, fontFamily: "'Amiri', serif", fontSize: 15 }} />
            <input value={translit} onChange={(e) => setTranslit(e.target.value)} placeholder="Translittération ou texte *" style={inputStyle} />
            <input value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="Signification (optionnel)" style={inputStyle} />
            <Pressable onClick={submit} disabled={!translit.trim()} haptic={7} style={{
              marginTop: 2, padding: "11px 16px", borderRadius: R.md, textAlign: "center",
              background: !translit.trim() ? th.glass : `linear-gradient(135deg, ${ACCENT_BRIGHT}, ${ACCENT})`,
              border: !translit.trim() ? `1px solid ${th.glassBorder}` : "none",
              color: !translit.trim() ? th.textFaint : "#fff", fontSize: 12.5, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <Plus size={14} /> Ajouter et réciter
            </Pressable>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Dhikr screen ---------------------------------- */
function DhikrScreen({ th, dark, activeId, setActiveId, counts, setCounts, soundOn, tock, allDhikrs, customDhikrs, setCustomDhikrs, history, appendHistory, favorites, toggleFavorite, goals, setGoalFor, onOpenQibla }) {
  const [celebrating, setCelebrating] = useState(false);
  const [goalHit, setGoalHit] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [lastTap, setLastTap] = useState(() => Date.now());
  const dhikr = allDhikrs.find((d) => d.id === activeId) || allDhikrs[0];
  const c = counts[activeId] || { total: 0, cycles: 0 };
  const goal = goals[activeId] || 33;

  const mountedRef = useRef(true);
  const timeoutsRef = useRef([]);
  useEffect(() => () => { mountedRef.current = false; timeoutsRef.current.forEach(clearTimeout); }, []);
  const safeTimeout = (fn, ms) => {
    const id = setTimeout(() => { if (mountedRef.current) fn(); }, ms);
    timeoutsRef.current.push(id);
    return id;
  };

  const finalize = useCallback((id) => {
    setCounts((prev) => {
      const cur = prev[id];
      if (!cur || cur.total === 0) return prev;
      const dh = allDhikrs.find((d) => d.id === id);
      appendHistory({ id: `${id}-${Date.now()}`, dhikrId: id, label: dh ? dh.translit : id, arabic: dh ? dh.arabic : "", count: cur.total, cycles: cur.cycles, at: Date.now() });
      return { ...prev, [id]: { total: 0, cycles: 0 } };
    });
    if (mountedRef.current) setJustSaved(true);
    safeTimeout(() => setJustSaved(false), 1300);
  }, [allDhikrs, appendHistory, setCounts]);

  const bearing = useMemo(() => qiblaBearing(DEFAULT_COORDS.lat, DEFAULT_COORDS.lng), []);

  const handleTap = () => {
    setLastTap(Date.now());
    if (soundOn) tock("tap");
    setCounts((prev) => {
      const cur = prev[activeId] || { total: 0, cycles: 0 };
      const nextTotal = cur.total + 1;
      const completedCycle = nextTotal % BEADS_TOTAL === 0;
      const hitGoal = nextTotal % goal === 0;
      if (completedCycle) {
        if (soundOn) safeTimeout(() => tock("cycle"), 60);
        buzz([10, 40, 10, 40, 18]);
        setCelebrating(true); safeTimeout(() => setCelebrating(false), 950);
      }
      if (hitGoal && !completedCycle) {
        if (soundOn) safeTimeout(() => tock("goal"), 60);
        buzz([12, 30, 12, 30, 12, 30, 20]);
        setGoalHit(true); safeTimeout(() => setGoalHit(false), 950);
      }
      return { ...prev, [activeId]: { total: nextTotal, cycles: cur.cycles + (completedCycle ? 1 : 0) } };
    });
  };

  const handleSelectDhikr = (id) => { if (id === activeId) return; if (c.total > 0) finalize(activeId); setActiveId(id); };
  const handleAddCustom = ({ arabic, translit, meaning }) => {
    const id = `custom-${Date.now()}`;
    setCustomDhikrs((prev) => [...prev, { id, arabic, translit, meaning, custom: true }]);
    if (c.total > 0) finalize(activeId);
    setActiveId(id);
  };
  const handleDeleteCustom = (id) => {
    if (c.total > 0 && id === activeId) finalize(activeId);
    setCustomDhikrs((prev) => prev.filter((d) => d.id !== id));
    if (id === activeId) setActiveId(DHIKRS[0].id);
  };

  const todayStr = new Date().toDateString();
  const historyToday = useMemo(() => history.filter((h) => new Date(h.at).toDateString() === todayStr), [history, todayStr]);
  const todayTotal = historyToday.reduce((s, h) => s + h.count, 0) + c.total;
  const todayCycles = historyToday.reduce((s, h) => s + h.cycles, 0) + c.cycles;
  const goalProgress = (c.total % goal) / goal;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0 2px" }}>
        <StreakStars th={th} history={history} todayActive={todayTotal > 0} />
        <LiveClock th={th} />
      </div>

      <Pressable onClick={onOpenQibla} scale={0.96} haptic={4} ariaLabel="Ouvrir la boussole Qibla" style={{
        alignSelf: "center", display: "flex", alignItems: "center", gap: 7, padding: "7px 14px",
        borderRadius: R.pill, ...glass(th), marginTop: -10,
      }}>
        <Compass size={12} color={GOLD_BRIGHT} strokeWidth={2} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color: th.textDim, letterSpacing: 0.3 }}>QIBLA</span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: th.text, fontVariantNumeric: "tabular-nums" }}>{Math.round(bearing)}°</span>
      </Pressable>

      <DhikrPicker
        th={th} dark={dark} activeDhikr={dhikr} allDhikrs={allDhikrs}
        onSelect={handleSelectDhikr} onAddCustom={handleAddCustom} onDeleteCustom={handleDeleteCustom}
        favorites={favorites} toggleFavorite={toggleFavorite} goal={goal} setGoal={(g) => setGoalFor(activeId, g)}
      />

      <BeadRing count={c.total} dark={dark} th={th} dhikr={dhikr} celebrating={celebrating} goalHit={goalHit} />

      <div style={{ width: 190, height: 3, borderRadius: 3, background: th.glassBorder, margin: "-8px auto 0", overflow: "hidden" }} aria-hidden="true">
        <div style={{ width: `${goalProgress * 100}%`, height: "100%", background: `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})`, transition: "width 200ms linear" }} />
      </div>

      <LiquidSaveBar th={th} active={c.total > 0} lastTap={lastTap} justSaved={justSaved} onExpire={() => finalize(activeId)} />

      {dhikr.meaning ? (
        <div style={{ fontSize: 12.5, color: th.textFaint, textAlign: "center", padding: "0 30px", lineHeight: 1.5, marginTop: -10 }}>
          {dhikr.meaning}
        </div>
      ) : null}

      <TapZone th={th} onTap={handleTap} onFinish={() => finalize(activeId)} hasCount={c.total > 0} />

      <div style={{ display: "flex", borderRadius: R.lg, overflow: "hidden", ...glass(th) }}>
        {[
          { label: "Perles aujourd'hui", value: todayTotal },
          { label: "Cycles accomplis", value: todayCycles },
        ].map((s, i) => (
          <div key={s.label} style={{ flex: 1, padding: "16px 12px", textAlign: "center", borderLeft: i > 0 ? `1px solid ${th.glassBorder}` : "none" }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: th.text }}>{s.value}</div>
            <div style={{ fontSize: 10.5, color: th.textDim, marginTop: 2, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- History screen (list + minimal weekly chart) ---------------------------------- */
function HistoryScreen({ th, history, onDelete }) {
  const groups = useMemo(() => {
    const sorted = [...history].sort((a, b) => b.at - a.at);
    const map = new Map();
    sorted.forEach((h) => { const label = formatDayLabel(h.at); if (!map.has(label)) map.set(label, []); map.get(label).push(h); });
    return Array.from(map.entries());
  }, [history]);

  const week = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const dayStr = d.toDateString();
      const total = history.filter((h) => new Date(h.at).toDateString() === dayStr).reduce((s, h) => s + h.count, 0);
      days.push({ label: d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 1).toUpperCase(), total });
    }
    return days;
  }, [history]);
  const weekMax = Math.max(1, ...week.map((d) => d.total));
  const weekTotal = week.reduce((s, d) => s + d.total, 0);

  const streak = useMemo(() => {
    let n = 0;
    for (let i = 0; ; i++) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const has = history.some((h) => new Date(h.at).toDateString() === d.toDateString());
      if (!has) break;
      n++;
    }
    return n;
  }, [history]);

  if (history.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "80px 26px", textAlign: "center" }}>
        <div style={{ width: 54, height: 54, borderRadius: "50%", ...glass(th, { radius: "50%" }), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Clock size={22} color={th.textDim} strokeWidth={1.6} />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: th.text }}>Aucune séance enregistrée</div>
        <div style={{ fontSize: 12, color: th.textFaint, lineHeight: 1.6, maxWidth: 240 }}>
          Vos récitations sont sauvegardées automatiquement ici, avec la date, l'heure et le nombre de perles.
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, padding: "14px", ...glass(th), textAlign: "center" }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: th.text }}>{weekTotal}</div>
          <div style={{ fontSize: 10, color: th.textDim, fontWeight: 600, marginTop: 2 }}>Cette semaine</div>
        </div>
        <div style={{ flex: 1, padding: "14px", ...glass(th), textAlign: "center" }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: GOLD_BRIGHT }}>{streak}j</div>
          <div style={{ fontSize: 10, color: th.textDim, fontWeight: 600, marginTop: 2 }}>Série en cours</div>
        </div>
      </div>

      <div style={{ padding: "16px 14px", ...glass(th) }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: 70, gap: 6 }}>
          {week.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
              <div style={{
                width: "100%", maxWidth: 20, borderRadius: 5,
                height: `${Math.max(4, (d.total / weekMax) * 52)}px`,
                background: d.total > 0 ? `linear-gradient(180deg, ${ACCENT_BRIGHT}, ${ACCENT})` : th.glassBorder,
                transition: `height 500ms ${EASE.visionos}`,
              }} />
              <span style={{ fontSize: 9.5, color: th.textFaint, fontWeight: 700 }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {groups.map(([label, items]) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: th.textFaint, letterSpacing: 0.3, padding: "0 2px" }}>{label}</div>
          {items.map((h) => (
            <div key={h.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", ...glass(th) }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: th.text }}>{h.label}</span>
                  {h.arabic ? <span style={{ fontFamily: "'Amiri', serif", fontSize: 13, color: th.textDim, direction: "rtl" }}>{h.arabic}</span> : null}
                </div>
                <span style={{ fontSize: 11, color: th.textFaint }}>{formatTime(h.at)}{h.cycles > 0 ? ` · ${h.cycles} cycle${h.cycles > 1 ? "s" : ""}` : ""}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600, color: th.text }}>× {h.count}</span>
                <Pressable onClick={() => onDelete(h.id)} haptic={6} scale={0.85} ariaLabel="Supprimer cette séance" style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={13} color={th.textFaint} strokeWidth={1.8} />
                </Pressable>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------- Prayer times screen ---------------------------------- */
function PrayerTimesScreen({ th, dark }) {
  useTicker(30000, true);
  const [reminders, setReminders] = useState({});
  const [remindersLoaded, setRemindersLoaded] = useState(false);
  const [testPulse, setTestPulse] = useState(false);
  const playChime = useReminderChime();
  const timersRef = useRef([]);
  const firedRef = useRef({});

  useEffect(() => { (async () => { const saved = await loadJSON("fansourlana:reminders", {}); setReminders(saved || {}); setRemindersLoaded(true); })(); }, []);

  const fireReminder = useCallback((label) => {
    playChime();
    buzz([12, 60, 12, 60, 12]);
    try { if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("Fansourlana", { body: `C'est l'heure de la prière : ${label}`, silent: false }); } catch (e) {}
  }, [playChime]);

  useEffect(() => {
    timersRef.current.forEach((t) => clearTimeout(t)); timersRef.current = [];
    if (!remindersLoaded) return;
    const now = new Date();
    const times = computePrayerTimes(DEFAULT_COORDS.lat, DEFAULT_COORDS.lng, now);
    const list = [
      { id: "fajr", label: "Fajr", time: times.fajr }, { id: "dhuhr", label: "Dhuhr", time: times.dhuhr },
      { id: "asr", label: "Asr", time: times.asr }, { id: "maghrib", label: "Maghrib", time: times.maghrib }, { id: "isha", label: "Isha", time: times.isha },
    ];
    list.forEach((p) => {
      if (!reminders[p.id]) return;
      const delay = p.time.getTime() - Date.now();
      const key = `${p.id}-${p.time.toDateString()}`;
      if (delay > 0 && delay < 24 * 3600 * 1000 && !firedRef.current[key]) {
        const t = setTimeout(() => { fireReminder(p.label); firedRef.current[key] = true; }, delay);
        timersRef.current.push(t);
      }
    });
    return () => { timersRef.current.forEach((t) => clearTimeout(t)); };
  }, [reminders, remindersLoaded, fireReminder]);

  const toggleReminder = (id) => {
    setReminders((prev) => { const next = { ...prev, [id]: !prev[id] }; saveJSON("fansourlana:reminders", next); return next; });
    if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission();
  };

  const testReminder = () => {
    fireReminder("Test");
    setTestPulse(true); setTimeout(() => setTestPulse(false), 900);
  };

  const now = new Date();
  const times = computePrayerTimes(DEFAULT_COORDS.lat, DEFAULT_COORDS.lng, now);
  const entries = [
    { id: "fajr", label: "Fajr", time: times.fajr }, { id: "sunrise", label: "Lever du soleil", time: times.sunrise, minor: true },
    { id: "dhuhr", label: "Dhuhr", time: times.dhuhr }, { id: "asr", label: "Asr", time: times.asr },
    { id: "maghrib", label: "Maghrib", time: times.maghrib }, { id: "isha", label: "Isha", time: times.isha },
  ];
  const prayerOnly = entries.filter((e) => !e.minor);
  let nextId = null;
  for (const e of prayerOnly) { if (e.time.getTime() > now.getTime()) { nextId = e.id; break; } }
  if (!nextId) nextId = "fajr";
  const next = prayerOnly.find((e) => e.id === nextId);
  let msLeft = next.time.getTime() - now.getTime(); if (msLeft < 0) msLeft += 24 * 3600 * 1000;
  const hoursLeft = Math.floor(msLeft / 3600000), minutesLeft = Math.floor((msLeft % 3600000) / 60000);
  const dayMs = 24 * 3600 * 1000;
  const arcProgress = 1 - msLeft / dayMs;
  const anyReminderOn = Object.values(reminders).some(Boolean);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Hero card — deepest glass tier: near-transparent, breathing halo, reflective sweep */}
      <div style={{
        padding: "28px 20px", textAlign: "center", position: "relative", overflow: "hidden", borderRadius: R.xl,
        background: dark ? "rgba(255,255,255,.045)" : "rgba(255,255,255,.38)",
        backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)",
        border: `1px solid ${dark ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.55)"}`,
        boxShadow: `inset 0 1px 0 ${th.glassHighlight}, inset 0 0 40px ${dark ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.25)"}, ${th.shadow}`,
      }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% -20%, ${GOLD}30, transparent 60%)`, animation: "fl-breathe 8s ease-in-out infinite" }} />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{
            position: "absolute", top: "-40%", left: 0, width: "45%", height: "180%",
            background: `linear-gradient(90deg, transparent, ${dark ? "rgba(255,255,255,.10)" : "rgba(255,255,255,.5)"}, transparent)`,
            animation: "fl-shimmer 6s ease-in-out infinite", animationDelay: "1s",
          }} />
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11.5, color: th.textFaint, fontWeight: 700, letterSpacing: 0.4 }}>PROCHAINE PRIÈRE</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 600, color: th.text, marginTop: 4 }}>{next.label}</div>
          <div style={{ fontSize: 13, color: GOLD_BRIGHT, fontWeight: 700, marginTop: 4 }}>dans {hoursLeft}h{String(minutesLeft).padStart(2, "0")}</div>
          <div style={{ width: "100%", maxWidth: 220, height: 3, borderRadius: 3, background: dark ? "rgba(255,255,255,.12)" : "rgba(20,31,25,.10)", margin: "14px auto 0", overflow: "hidden" }}>
            <div style={{ width: `${arcProgress * 100}%`, height: "100%", background: `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})`, boxShadow: `0 0 8px ${GOLD_BRIGHT}90` }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map((e) => {
          const isNext = e.id === nextId;
          return (
            <div key={e.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", overflow: "hidden",
              padding: e.minor ? "9px 14px" : "13px 14px", borderRadius: R.md,
              background: isNext ? (dark ? "rgba(240,206,106,.08)" : "rgba(255,255,255,.55)") : (dark ? "rgba(255,255,255,.035)" : "rgba(255,255,255,.32)"),
              backdropFilter: "blur(20px) saturate(170%)", WebkitBackdropFilter: "blur(20px) saturate(170%)",
              border: `1px solid ${isNext ? GOLD_BRIGHT : (dark ? "rgba(255,255,255,.10)" : "rgba(255,255,255,.5)")}`,
              boxShadow: isNext ? `inset 0 1px 0 rgba(255,255,255,.4), 0 0 22px ${GOLD_BRIGHT}25` : `inset 0 1px 0 ${th.glassHighlight}`,
              opacity: e.minor ? 0.78 : 1,
              transition: `background 300ms ${EASE.swift}, border 300ms ${EASE.swift}`,
            }}>
              <span style={{ fontSize: e.minor ? 12 : 13.5, fontWeight: e.minor ? 600 : 700, color: isNext ? GOLD_BRIGHT : th.text, position: "relative" }}>{e.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: e.minor ? 15 : 18, fontWeight: 600, color: isNext ? GOLD_BRIGHT : th.text, fontVariantNumeric: "tabular-nums" }}>
                  {e.time.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {!e.minor && <MiniToggle on={!!reminders[e.id]} onChange={() => toggleReminder(e.id)} accent={ACCENT} ariaLabel={`Rappel pour ${e.label}`} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reminder card — bell that rings when a reminder fires or is tested, plus a way to hear it now */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: R.lg,
        background: dark ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.4)",
        backdropFilter: "blur(22px) saturate(170%)", WebkitBackdropFilter: "blur(22px) saturate(170%)",
        border: `1px solid ${anyReminderOn ? GOLD_BRIGHT : th.glassBorder}`,
        boxShadow: `inset 0 1px 0 ${th.glassHighlight}`,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: anyReminderOn ? `${GOLD_BRIGHT}22` : (dark ? "rgba(255,255,255,.06)" : "rgba(20,31,25,.06)"),
        }}>
          <span style={{ fontSize: 16, display: "inline-block", animation: testPulse ? "fl-bellring 700ms ease-in-out" : "none" }}>🔔</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: th.text }}>Rappel de prière</div>
          <div style={{ fontSize: 10.5, color: th.textFaint, marginTop: 1, lineHeight: 1.4 }}>Une mélodie douce sonne à l'heure de chaque prière activée ci-dessus.</div>
        </div>
        <Pressable onClick={testReminder} haptic={6} scale={0.95} style={{
          padding: "8px 14px", borderRadius: R.pill, flexShrink: 0,
          background: dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.6)", border: `1px solid ${th.glassBorder}`,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: th.text }}>Tester</span>
        </Pressable>
      </div>

      <div style={{ fontSize: 10.5, color: th.textFaint, textAlign: "center", lineHeight: 1.5, padding: "0 12px" }}>
        Horaires calculés pour {DEFAULT_LOCATION_LABEL}, sans utiliser votre position. Les rappels sonnent tant que l'application reste ouverte. Horaires indicatifs — vérifiez auprès de votre mosquée locale.
      </div>
    </div>
  );
}

/* Unwraps a cyclic angle (0-360) into a continuous value so a spring animating
   toward it always takes the shortest path instead of spinning the long way
   around whenever the raw value crosses the 0°/360° boundary. */
function useUnwrappedAngle(target) {
  const ref = useRef({ raw: target, unwrapped: target });
  if (target != null) {
    if (ref.current.raw == null) { ref.current.raw = target; ref.current.unwrapped = target; }
    else {
      let delta = target - ref.current.raw;
      delta = ((delta + 180) % 360 + 360) % 360 - 180;
      ref.current.unwrapped += delta;
      ref.current.raw = target;
    }
  }
  return ref.current.unwrapped;
}

/* ---------------------------------- Qibla screen — glass compass ---------------------------------- */
function QiblaScreen({ th, dark }) {
  const [heading, setHeading] = useState(null);
  const [orientationReady, setOrientationReady] = useState(false);
  const [needsIOSPermission, setNeedsIOSPermission] = useState(false);

  const bearing = qiblaBearing(DEFAULT_COORDS.lat, DEFAULT_COORDS.lng);
  const distance = distanceToKaabaKm(DEFAULT_COORDS.lat, DEFAULT_COORDS.lng);
  const diff = heading != null && bearing != null ? angleDiff(heading, bearing) : null;
  const aligned = diff != null && diff < 6;
  const rawNeedleTarget = bearing != null && heading != null ? bearing - heading : 0;
  const needleTarget = useUnwrappedAngle(rawNeedleTarget);
  const needleRef = useRef(null);
  const dialRef = useRef(null);
  useSpringStyle(needleRef, needleTarget, (node, v) => { node.style.transform = `translate(-50%, -96%) rotate(${v}deg)`; }, { stiffness: 210, damping: 22 });
  useSpringStyle(dialRef, aligned ? 0 : 6, (node, v) => { node.style.transform = `rotateX(${v}deg)`; }, { stiffness: 120, damping: 18 });

  const requestOrientation = useCallback(async () => {
    try {
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== "granted") { setNeedsIOSPermission(true); return; }
      }
      setOrientationReady(true); setNeedsIOSPermission(false);
    } catch (e) { setNeedsIOSPermission(true); }
  }, []);

  useEffect(() => {
    if (!orientationReady) return;
    const smoothRef = { current: null };
    let lastCommit = 0;
    const handler = (e) => {
      const raw = e.webkitCompassHeading != null ? e.webkitCompassHeading : e.alpha != null ? (360 - e.alpha) % 360 : null;
      if (raw == null) return;
      if (smoothRef.current == null) smoothRef.current = raw;
      else {
        let delta = raw - smoothRef.current;
        delta = ((delta + 180) % 360 + 360) % 360 - 180;
        smoothRef.current += delta * 0.35; // low-pass filter: kills sensor jitter, stays responsive
      }
      const now = performance.now();
      if (now - lastCommit < 66) return; // cap React re-renders at ~15/s; the spring still animates at 60fps
      lastCommit = now;
      const h = ((smoothRef.current % 360) + 360) % 360;
      setHeading(h);
    };
    const hasAbsolute = "ondeviceorientationabsolute" in window;
    const eventName = hasAbsolute ? "deviceorientationabsolute" : "deviceorientation";
    window.addEventListener(eventName, handler, true);
    return () => window.removeEventListener(eventName, handler, true);
  }, [orientationReady]);

  useEffect(() => {
    if (orientationReady) return;
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission !== "function") setOrientationReady(true);
  }, [orientationReady]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%" }}>
      <div style={{ fontSize: 12, color: th.textDim, fontWeight: 600 }}>{`${Math.round(distance).toLocaleString("fr-FR")} km jusqu'à la Kaaba depuis ${DEFAULT_LOCATION_LABEL}`}</div>
      <div style={{ fontSize: 10.5, color: th.textFaint, textAlign: "center", maxWidth: 260, lineHeight: 1.5, marginTop: -12 }}>
        Aucune position n'est demandée : la direction de la Kaaba est calculée depuis {DEFAULT_LOCATION_LABEL}. L'aiguille suit ensuite les mouvements réels de votre téléphone, comme une vraie boussole.
      </div>

      {!orientationReady && (
        <Pressable onClick={requestOrientation} haptic={6} style={{ padding: "11px 20px", borderRadius: R.pill, ...glass(th), display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: th.text }}>
          <Compass size={15} /> Activer la boussole
        </Pressable>
      )}

      <div style={{ perspective: 700 }}>
        <div ref={dialRef} style={{ position: "relative", width: 264, height: 264, transformStyle: "preserve-3d", willChange: "transform", transform: `rotateX(${aligned ? 0 : 6}deg)` }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle, ${aligned ? MINT_GLOW : ACCENT}${dark ? "35" : "28"}, transparent 70%)`, animation: "fl-breathe 7s ease-in-out infinite" }} />
          {/* outer ring — glows mint when aligned, exactly like the reference glass compass */}
          <div style={{
            position: "absolute", inset: 2, borderRadius: "50%",
            border: `3px solid ${aligned ? MINT_GLOW : "rgba(160,190,180,.35)"}`,
            boxShadow: aligned ? `0 0 22px 5px ${MINT_GLOW}90, inset 0 0 16px 2px ${MINT_GLOW}50` : "none",
            transition: `border 400ms ${EASE.swift}, box-shadow 400ms ${EASE.swift}`,
          }} />
          {/* white glass face — natural instrument look, independent of app theme */}
          <div style={{
            position: "absolute", inset: 12, borderRadius: "50%",
            background: "radial-gradient(circle at 32% 26%, #ffffff, #f4f6f4 70%, #eceeec 100%)",
            border: "1px solid rgba(20,30,25,.08)",
            boxShadow: "inset 0 2px 6px rgba(255,255,255,.9), inset 0 -8px 18px rgba(20,30,25,.05), 0 10px 30px rgba(20,30,25,.12)",
          }}>
            <div style={{ position: "absolute", inset: 22, borderRadius: "50%", border: "1px solid rgba(20,30,25,.14)" }} />
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} style={{
                position: "absolute", left: "50%", top: "50%", width: i % 6 === 0 ? 2 : 1, height: i % 6 === 0 ? 13 : 7,
                background: i % 6 === 0 ? "#141F19" : "rgba(20,30,25,.3)",
                transform: `rotate(${i * 7.5}deg) translate(0, -110px)`, transformOrigin: "50% 0",
              }} />
            ))}
            {[0, 30, 50, 150, 220, 330].map((deg) => (
              <div key={deg} style={{ position: "absolute", left: "50%", top: "50%", fontSize: 8.5, fontWeight: 600, color: "rgba(20,30,25,.4)",
                transform: `rotate(${deg}deg) translate(0, -92px) rotate(${-deg}deg) translate(-50%,-50%)` }}>{deg}</div>
            ))}
            {["N", "E", "S", "O"].map((label, i) => (
              <div key={label} style={{ position: "absolute", left: "50%", top: "50%", fontSize: 13, fontWeight: 800, color: "#101815", transform: `rotate(${i * 90}deg) translate(0, -78px) rotate(${-i * 90}deg) translate(-50%,-50%)` }}>{label}</div>
            ))}
            {aligned && (
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", textAlign: "center", animation: "fl-fadein 260ms ease" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#101815", letterSpacing: 0.5 }}>ALIGNÉ</div>
              </div>
            )}
          </div>
          <div ref={needleRef} style={{ position: "absolute", left: "50%", top: "50%", width: 4, height: 88, transformOrigin: "50% 100%", zIndex: 2, willChange: "transform", transform: `translate(-50%, -96%) rotate(${needleTarget}deg)` }}>
            <div style={{ width: 4, height: 88, borderRadius: 4, background: aligned ? `linear-gradient(to top, transparent, ${ACCENT})` : "linear-gradient(to top, transparent, #14201b)", boxShadow: aligned ? `0 0 14px 3px ${MINT_GLOW}90` : "0 1px 3px rgba(0,0,0,.3)" }} />
            <div style={{ position: "absolute", top: -3, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: `11px solid ${aligned ? ACCENT : "#14201b"}`, filter: aligned ? `drop-shadow(0 0 6px ${MINT_GLOW}90)` : "none" }} />
          </div>
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 13, height: 13, borderRadius: "50%", background: "radial-gradient(circle at 32% 26%, #fff, #cfd8d3 60%, #a9b6ae)", boxShadow: "0 2px 6px rgba(0,0,0,.3)", zIndex: 3 }} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: R.pill, ...glass(th), border: `1px solid ${aligned ? MINT_GLOW : th.glassBorder}` }}>
        {aligned ? <Check size={15} color={ACCENT} strokeWidth={2.6} /> : <Navigation size={15} color={th.textDim} strokeWidth={2} />}
        <span style={{ fontSize: 12.5, fontWeight: 700, color: aligned ? ACCENT : th.textDim }}>
          {heading == null ? "En attente du capteur de la boussole…" : aligned ? "Vous faites face à la Qibla" : `Tournez de ${Math.round(diff)}°`}
        </span>
      </div>

      {heading != null && bearing != null && (
        <div style={{ display: "flex", gap: 18, fontSize: 10.5, color: th.textFaint, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          <span>Cap Kaaba : {Math.round(bearing)}°</span><span>Votre cap : {Math.round(heading)}°</span>
        </div>
      )}
      {needsIOSPermission && (
        <div style={{ fontSize: 11.5, color: th.textFaint, textAlign: "center", maxWidth: 240, lineHeight: 1.5 }}>
          L'accès aux capteurs a été refusé. Vérifiez les réglages de confidentialité de votre navigateur pour activer la boussole.
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Supabase auth (Google) + Community screen ---------------------------------- */
function useSupabaseAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setUser(data.session ? data.session.user : null); setAuthLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session ? session.user : null); });
    return () => sub.subscription.unsubscribe();
  }, []);
  const signInWithGoogle = useCallback(() => { if (supabase) supabase.auth.signInWithOAuth({ provider: "google" }); }, []);
  const signOut = useCallback(() => { if (supabase) supabase.auth.signOut(); }, []);
  return { user, authLoading, signInWithGoogle, signOut };
}

function usePostsFeed(user) {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());

  const fetchPosts = useCallback(async () => {
    if (!supabase) { setLoadingPosts(false); return; }
    setLoadingPosts(true);
    const { data, error } = await supabase
      .from("posts")
      .select("id, caption, video_url, created_at, user_id, profiles(display_name, avatar_url), likes(count), comments(count)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error) setPosts(data || []);
    setLoadingPosts(false);
  }, []);

  const fetchMyLikes = useCallback(async () => {
    if (!supabase || !user) { setLikedIds(new Set()); return; }
    const { data } = await supabase.from("likes").select("post_id").eq("user_id", user.id);
    setLikedIds(new Set((data || []).map((r) => r.post_id)));
  }, [user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { fetchMyLikes(); }, [fetchMyLikes]);

  const toggleLike = useCallback(async (postId) => {
    if (!supabase || !user) return;
    const already = likedIds.has(postId);
    setLikedIds((prev) => { const next = new Set(prev); already ? next.delete(postId) : next.add(postId); return next; });
    if (already) await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id);
    else await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
    fetchPosts();
  }, [likedIds, user, fetchPosts]);

  return { posts, loadingPosts, likedIds, toggleLike, refetch: fetchPosts };
}

function PostCard({ th, post, user, liked, onToggleLike, tall }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const likeCount = (post.likes && post.likes[0] && post.likes[0].count) || 0;
  const commentCount = (post.comments && post.comments[0] && post.comments[0].count) || 0;
  const author = post.profiles ? post.profiles.display_name : "Utilisateur";

  const loadComments = async () => {
    if (!supabase) return;
    const { data } = await supabase.from("comments").select("id, content, created_at, profiles(display_name)").eq("post_id", post.id).order("created_at", { ascending: true });
    setComments(data || []);
  };
  const toggleOpen = () => { const next = !open; setOpen(next); if (next) loadComments(); };
  const submitComment = async () => {
    if (!supabase || !user || !commentText.trim()) return;
    await supabase.from("comments").insert({ post_id: post.id, user_id: user.id, content: commentText.trim() });
    setCommentText(""); loadComments();
  };

  return (
    <div style={{ borderRadius: R.lg, overflow: "hidden", ...glass(th) }}>
      <div style={{ padding: "12px 14px 0", display: "flex", alignItems: "center", gap: 8 }}>
        {post.profiles && post.profiles.avatar_url ? <img src={post.profiles.avatar_url} alt="" style={{ width: 22, height: 22, borderRadius: "50%" }} /> : <div style={{ width: 22, height: 22, borderRadius: "50%", background: th.glassStrong }} />}
        <span style={{ fontSize: 12, fontWeight: 700, color: th.text }}>{author}</span>
        <span style={{ fontSize: 10, color: th.textFaint, marginLeft: "auto" }}>{formatDayLabel(new Date(post.created_at).getTime())}</span>
      </div>
      {post.caption && <div style={{ padding: "8px 14px 0", fontSize: 13, color: th.text, lineHeight: 1.5 }}>{post.caption}</div>}
      {post.video_url && (
        <video src={post.video_url} controls style={{ width: "100%", maxHeight: tall ? 520 : 320, marginTop: 10, background: "#000", display: "block" }} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "10px 14px" }}>
        <Pressable onClick={() => onToggleLike(post.id)} disabled={!user} haptic={5} scale={0.9} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Heart size={15} color={liked ? "#E0607A" : th.textDim} fill={liked ? "#E0607A" : "none"} strokeWidth={1.8} />
          <span style={{ fontSize: 11.5, color: th.textDim, fontWeight: 600 }}>{likeCount}</span>
        </Pressable>
        <Pressable onClick={toggleOpen} haptic={5} scale={0.9} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <MessageCircle size={15} color={th.textDim} strokeWidth={1.8} />
          <span style={{ fontSize: 11.5, color: th.textDim, fontWeight: 600 }}>{commentCount}</span>
        </Pressable>
      </div>
      {open && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ height: 1, background: th.glassBorder, marginBottom: 4 }} />
          {comments.map((c) => (
            <div key={c.id} style={{ fontSize: 12, color: th.textDim }}>
              <span style={{ fontWeight: 700, color: th.text }}>{c.profiles ? c.profiles.display_name : "Utilisateur"}</span> {c.content}
            </div>
          ))}
          {user && (
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Écrire un commentaire…"
                style={{ flex: 1, fontSize: 12, padding: "8px 10px", borderRadius: R.sm, border: `1px solid ${th.glassBorder}`, background: th.glass, color: th.text, outline: "none" }} />
              <Pressable onClick={submitComment} haptic={5} style={{ padding: "8px 12px", borderRadius: R.sm, background: `linear-gradient(135deg, ${ACCENT_BRIGHT}, ${ACCENT})` }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>Envoyer</span>
              </Pressable>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotConnectedNotice({ th }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "60px 26px", textAlign: "center" }}>
      <div style={{ width: 54, height: 54, borderRadius: "50%", ...glass(th, { radius: "50%" }), display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Users size={22} color={th.textDim} strokeWidth={1.6} />
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: th.text }}>Communauté pas encore branchée</div>
      <div style={{ fontSize: 12, color: th.textFaint, lineHeight: 1.6, maxWidth: 280 }}>
        Renseigne <code>SUPABASE_URL</code> et <code>SUPABASE_ANON_KEY</code> en haut du fichier, puis exécute <code>supabase_schema.sql</code> dans l'éditeur SQL de ton projet.
      </div>
    </div>
  );
}

function GoogleSignInButton({ onClick }) {
  return (
    <Pressable onClick={onClick} haptic={6} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: R.pill, background: "#fff", border: "1px solid rgba(0,0,0,.1)", boxShadow: "0 2px 8px rgba(0,0,0,.1)" }}>
      <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.26a12 12 0 0 0 0 10.76z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.62l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75z"/></svg>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#141414" }}>Continuer avec Google</span>
    </Pressable>
  );
}

/* ---------------------------------- Informations — text-first feed (icon 2, like "Friends") ---------------------------------- */
function InfoFeedScreen({ th, auth }) {
  const { posts, loadingPosts, likedIds, toggleLike } = usePostsFeed(auth.user);
  if (!supabase) return <NotConnectedNotice th={th} />;
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Star size={16} color={ACCENT_BRIGHT} />
        <span style={{ fontSize: 14, fontWeight: 700, color: th.text }}>Informations</span>
      </div>
      {loadingPosts ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner size={20} /></div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", color: th.textFaint, fontSize: 12.5 }}>Rien à afficher pour l'instant.</div>
      ) : (
        posts.map((p) => <PostCard key={p.id} th={th} post={p} user={auth.user} liked={likedIds.has(p.id)} onToggleLike={toggleLike} />)
      )}
    </div>
  );
}

/* ---------------------------------- Vidéos — video-only feed (icon 4, like "Inbox") ---------------------------------- */
function VideoFeedScreen({ th, auth }) {
  const { posts, loadingPosts, likedIds, toggleLike } = usePostsFeed(auth.user);
  const videoPosts = useMemo(() => posts.filter((p) => !!p.video_url), [posts]);
  if (!supabase) return <NotConnectedNotice th={th} />;
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Film size={16} color={ACCENT_BRIGHT} />
        <span style={{ fontSize: 14, fontWeight: 700, color: th.text }}>Vidéos</span>
      </div>
      {loadingPosts ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner size={20} /></div>
      ) : videoPosts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", color: th.textFaint, fontSize: 12.5 }}>Aucune vidéo publiée pour l'instant.</div>
      ) : (
        videoPosts.map((p) => <PostCard key={p.id} th={th} post={p} user={auth.user} liked={likedIds.has(p.id)} onToggleLike={toggleLike} tall />)
      )}
    </div>
  );
}

/* ---------------------------------- Profil — icon 5, like "Profile" ---------------------------------- */
function ProfileScreen({ th, auth, onOpenSettings }) {
  const { user, authLoading, signInWithGoogle, signOut } = auth;
  const { posts, loadingPosts } = usePostsFeed(user);
  const myPosts = useMemo(() => (user ? posts.filter((p) => p.user_id === user.id) : []), [posts, user]);

  if (!supabase) return <NotConnectedNotice th={th} />;
  if (authLoading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={20} /></div>;

  if (!user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "70px 26px", textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", ...glass(th, { radius: "50%" }), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Users size={26} color={th.textDim} strokeWidth={1.6} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: th.text }}>Pas encore connecté</div>
        <div style={{ fontSize: 12.5, color: th.textDim, lineHeight: 1.6, maxWidth: 260 }}>Connecte-toi avec Google pour publier et retrouver ton profil.</div>
        <GoogleSignInButton onClick={signInWithGoogle} />
      </div>
    );
  }

  const meta = user.user_metadata || {};
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
      {meta.avatar_url ? <img src={meta.avatar_url} alt="" style={{ width: 64, height: 64, borderRadius: "50%" }} /> :
        <div style={{ width: 64, height: 64, borderRadius: "50%", ...glass(th, { radius: "50%" }) }} />}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: th.text }}>{meta.full_name || user.email}</div>
        <div style={{ fontSize: 11.5, color: th.textFaint, marginTop: 2 }}>{user.email}</div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Pressable onClick={onOpenSettings} haptic={5} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: R.pill, ...glass(th) }}>
          <Settings size={13} color={th.textDim} /><span style={{ fontSize: 11, fontWeight: 700, color: th.textDim }}>Réglages</span>
        </Pressable>
        <Pressable onClick={signOut} haptic={5} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: R.pill, ...glass(th) }}>
          <LogOut size={13} color={th.textDim} /><span style={{ fontSize: 11, fontWeight: 700, color: th.textDim }}>Déconnexion</span>
        </Pressable>
      </div>
      <div style={{ width: "100%", height: 1, background: th.glassBorder }} />
      <div style={{ width: "100%", fontSize: 11.5, fontWeight: 700, color: th.textFaint, textAlign: "left" }}>MES PUBLICATIONS</div>
      {loadingPosts ? (
        <Spinner size={18} />
      ) : myPosts.length === 0 ? (
        <div style={{ fontSize: 12, color: th.textFaint, padding: "20px 0" }}>Tu n'as encore rien publié.</div>
      ) : (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
          {myPosts.map((p) => <PostCard key={p.id} th={th} post={p} user={user} liked={false} onToggleLike={() => {}} />)}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Publish sheet — opened from the center "+" button ---------------------------------- */
function PublishSheet({ th, dark, auth, onClose, onPublished }) {
  const { user, signInWithGoogle } = auth;
  const [caption, setCaption] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handlePublish = async () => {
    if (!supabase || !user || (!caption.trim() && !videoFile)) return;
    setUploading(true);
    try {
      let video_url = null;
      if (videoFile) {
        const path = `${user.id}/${Date.now()}-${videoFile.name}`;
        const { error: upErr } = await supabase.storage.from("videos").upload(path, videoFile);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("videos").getPublicUrl(path);
        video_url = pub.publicUrl;
      }
      const { error } = await supabase.from("posts").insert({ user_id: user.id, caption: caption.trim() || null, video_url });
      if (error) throw error;
      onPublished(); onClose();
    } catch (e) { console.error(e); } finally { setUploading(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 55, animation: "fl-fadein 220ms ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 480, background: dark ? "rgba(10,15,13,.9)" : "rgba(245,242,233,.92)",
        backdropFilter: BLUR, WebkitBackdropFilter: BLUR,
        borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, border: `1px solid ${th.glassBorder}`, borderBottom: "none",
        padding: "10px 18px 28px", animation: "fl-sheetup 380ms cubic-bezier(.16,1,.3,1)",
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 4, background: th.glassBorder, margin: "8px auto 18px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "0 4px" }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: th.text, fontFamily: "'Fraunces', serif" }}>Publier</span>
          <Pressable onClick={onClose} haptic={4} ariaLabel="Fermer" style={{ width: 30, height: 30, borderRadius: "50%", ...glass(th, { radius: "50%" }), display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color={th.textDim} />
          </Pressable>
        </div>

        {!supabase ? (
          <NotConnectedNotice th={th} />
        ) : !user ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "20px 10px 10px" }}>
            <div style={{ fontSize: 13, color: th.textDim, textAlign: "center" }}>Connecte-toi pour publier une information ou une vidéo.</div>
            <GoogleSignInButton onClick={signInWithGoogle} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <textarea
              value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Information à partager…"
              rows={3}
              style={{ resize: "none", fontFamily: "inherit", fontSize: 13, padding: "10px 12px", borderRadius: R.sm, border: `1px solid ${th.glassBorder}`, background: th.glass, color: th.text, outline: "none", width: "100%" }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Pressable onClick={() => fileRef.current && fileRef.current.click()} haptic={4} scale={0.96} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: R.pill, background: th.glass, border: `1px solid ${th.glassBorder}` }}>
                <Film size={13} color={th.textDim} />
                <span style={{ fontSize: 11, fontWeight: 700, color: th.textDim }}>{videoFile ? videoFile.name.slice(0, 18) : "Ajouter une vidéo"}</span>
              </Pressable>
              <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => setVideoFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
              <Pressable onClick={handlePublish} disabled={uploading || (!caption.trim() && !videoFile)} haptic={7} style={{
                padding: "9px 18px", borderRadius: R.pill,
                background: uploading || (!caption.trim() && !videoFile) ? th.glass : `linear-gradient(135deg, ${ACCENT_BRIGHT}, ${ACCENT})`,
              }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: uploading || (!caption.trim() && !videoFile) ? th.textFaint : "#fff" }}>{uploading ? "Envoi…" : "Publier"}</span>
              </Pressable>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- Chapelet — home tab, groups Dhikr / Qibla / Historique / Horaires ---------------------------------- */
function ChapeletScreen({ th, dark, section, setSection, dhikrProps, history, deleteHistoryEntry }) {
  const sections = [
    { id: "dhikr", label: "Chapelet" },
    { id: "qibla", label: "Qibla" },
    { id: "historique", label: "Historique" },
    { id: "horaires", label: "Horaires" },
  ];
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", borderRadius: R.pill, padding: 4, ...glass(th) }}>
        {sections.map((s) => {
          const active = s.id === section;
          return (
            <Pressable key={s.id} onClick={() => setSection(s.id)} scale={0.96} haptic={4} style={{
              flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: R.pill,
              background: active ? `linear-gradient(135deg, ${ACCENT_BRIGHT}, ${ACCENT})` : "transparent",
            }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: active ? "#08120D" : th.textDim }}>{s.label}</span>
            </Pressable>
          );
        })}
      </div>
      {section === "dhikr" && <DhikrScreen th={th} dark={dark} {...dhikrProps} />}
      {section === "qibla" && <QiblaScreen th={th} dark={dark} />}
      {section === "historique" && <HistoryScreen th={th} history={history} onDelete={deleteHistoryEntry} />}
      {section === "horaires" && <PrayerTimesScreen th={th} dark={dark} />}
    </div>
  );
}

/* ---------------------------------- Music panel — glass player ---------------------------------- */
function MusicPanel({ th }) {
  const [tracks, setTracks] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [bars, setBars] = useState([0.15, 0.15, 0.15, 0.15]);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const ctxRef = useRef(null);
  const rafRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const el = new window.Audio(); el.volume = volume; audioRef.current = el;
    const onEnded = () => setPlayingId(null);
    el.addEventListener("ended", onEnded);
    return () => { el.removeEventListener("ended", onEnded); cancelAnimationFrame(rafRef.current); el.pause(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  const ensureGraph = () => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      ctxRef.current = new Ctx();
      sourceRef.current = ctxRef.current.createMediaElementSource(audioRef.current);
      analyserRef.current = ctxRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(ctxRef.current.destination);
    }
  };
  const tick = () => {
    if (analyserRef.current) {
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      const n = data.length;
      setBars([0, 1, 2, 3].map((i) => {
        const start = Math.floor((i / 4) * n), end = Math.floor(((i + 1) / 4) * n);
        let sum = 0; for (let j = start; j < end; j++) sum += data[j];
        return Math.max(0.12, sum / (end - start || 1) / 255);
      }));
    }
    rafRef.current = requestAnimationFrame(tick);
  };
  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setTracks((prev) => [...prev, ...files.map((f) => ({ id: `${Date.now()}-${f.name}`, name: f.name.replace(/\.mp3$/i, ""), url: URL.createObjectURL(f) }))]);
    e.target.value = "";
  };
  const toggle = (track) => {
    try {
      if (playingId === track.id) { audioRef.current.pause(); setPlayingId(null); cancelAnimationFrame(rafRef.current); }
      else {
        audioRef.current.src = track.url; ensureGraph();
        if (ctxRef.current.state === "suspended") ctxRef.current.resume();
        audioRef.current.play(); setPlayingId(track.id);
        cancelAnimationFrame(rafRef.current); tick();
      }
    } catch (e) {}
  };
  const removeTrack = (id) => {
    if (playingId === id) { audioRef.current.pause(); setPlayingId(null); cancelAnimationFrame(rafRef.current); }
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: th.text, marginBottom: 4 }}>Musique</div>
      <div style={{ fontSize: 10.5, color: th.textFaint, marginBottom: 12, lineHeight: 1.5 }}>Ajoutez vos propres pistes pour accompagner votre récitation — disponibles pendant cette session.</div>

      {playingId && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "8px 4px" }}>
          <Volume2 size={14} color={th.textDim} />
          <GlassSlider value={volume} onChange={setVolume} th={th} ariaLabel="Volume" />
        </div>
      )}

      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {tracks.map((t) => {
          const active = playingId === t.id;
          return (
            <div key={t.id} style={{ position: "relative", flexShrink: 0 }}>
              <Pressable onClick={() => toggle(t)} scale={0.95} haptic={5} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 14px",
                borderRadius: R.md, background: active ? `${ACCENT}26` : th.glass, border: `1px solid ${active ? ACCENT_BRIGHT : th.glassBorder}`,
                backdropFilter: BLUR, WebkitBackdropFilter: BLUR, minWidth: 72,
              }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 16 }}>
                  {(active ? bars : [0.2, 0.35, 0.2, 0.3]).map((v, i) => (
                    <div key={i} style={{ width: 3, borderRadius: 2, background: active ? ACCENT_BRIGHT : th.textFaint, height: `${Math.max(4, v * 16)}px`, transition: active ? "height 90ms linear" : "none" }} />
                  ))}
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: th.text, maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
              </Pressable>
              <Pressable onClick={() => removeTrack(t.id)} haptic={6} scale={0.85} ariaLabel="Supprimer cette piste" style={{ position: "absolute", top: -5, right: -5, width: 17, height: 17, borderRadius: "50%", background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={9} color="#fff" strokeWidth={3} />
              </Pressable>
            </div>
          );
        })}
        <Pressable onClick={() => fileRef.current && fileRef.current.click()} scale={0.95} haptic={4} style={{
          flexShrink: 0, width: 60, borderRadius: R.md, background: th.glass, border: `1px dashed ${th.glassBorder}`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "10px 0",
        }}>
          <Plus size={16} color={th.textDim} /><span style={{ fontSize: 9, color: th.textFaint, fontWeight: 600 }}>MP3</span>
        </Pressable>
        <input ref={fileRef} type="file" accept="audio/mpeg,audio/mp3,audio/*" multiple onChange={handleFiles} style={{ display: "none" }} />
      </div>
    </div>
  );
}

/* ---------------------------------- Settings — sectioned glass panel ---------------------------------- */
function SettingsSection({ title, th, children }) {
  return (
    <div style={{ ...glass(th, { radius: R.lg }), padding: "16px 16px 14px", marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: th.textFaint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

function SettingsModal({ open, onClose, dark, setDark, soundOn, setSoundOn, hapticOn, setHapticOn, th, onResetAll, background, setBackground, isFullscreen, toggleFullscreen }) {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => { try { const resized = await downscaleImage(reader.result, 1400); setBackground({ type: "custom", value: resized }); } catch (err) {} };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50, animation: "fl-fadein 220ms ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 480, maxHeight: "86vh", overflowY: "auto", background: dark ? "rgba(10,15,13,.82)" : "rgba(245,242,233,.86)",
        backdropFilter: BLUR, WebkitBackdropFilter: BLUR,
        borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, border: `1px solid ${th.glassBorder}`, borderBottom: "none",
        padding: "10px 18px 28px", animation: "fl-sheetup 380ms cubic-bezier(.16,1,.3,1)",
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 4, background: th.glassBorder, margin: "8px auto 18px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "0 4px" }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: th.text, fontFamily: "'Fraunces', serif" }}>Réglages</span>
          <Pressable onClick={onClose} haptic={4} ariaLabel="Fermer les réglages" style={{ width: 30, height: 30, borderRadius: "50%", ...glass(th, { radius: "50%" }), display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color={th.textDim} />
          </Pressable>
        </div>

        <SettingsSection title="Apparence" th={th}>
          <SettingRow icon={dark ? Moon : Sun} label="Thème" th={th} description={dark ? "Sombre" : "Clair"}><LightSwitch on={dark} onChange={setDark} /></SettingRow>
          <SettingRow icon={isFullscreen ? Minimize : Maximize} label="Plein écran" th={th} description="Masque l'interface du navigateur">
            <Pressable onClick={toggleFullscreen} haptic={6} ariaLabel="Basculer le plein écran" style={{ padding: "8px 14px", borderRadius: R.pill, ...glass(th) }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: th.text }}>{isFullscreen ? "Quitter" : "Activer"}</span>
            </Pressable>
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="Audio & haptique" th={th}>
          <SettingRow icon={soundOn ? Volume2 : VolumeX} label="Son des perles" th={th} description="Un léger clic à chaque perle"><MiniToggle on={soundOn} onChange={setSoundOn} ariaLabel="Son des perles" /></SettingRow>
          <SettingRow icon={Vibrate} label="Vibrations" th={th} description="Retour haptique au toucher"><MiniToggle on={hapticOn} onChange={setHapticOn} ariaLabel="Vibrations" /></SettingRow>
        </SettingsSection>

        <SettingsSection title="Personnalisation du fond" th={th}>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, paddingTop: 4 }}>
            <Pressable onClick={() => setBackground({ type: "default" })} scale={0.94} haptic={4} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ width: 52, height: 52, borderRadius: R.md, background: th.bg, border: `2px solid ${(!background || background.type === "default") ? ACCENT_BRIGHT : "transparent"}` }} />
              <span style={{ fontSize: 9.5, color: th.textFaint, fontWeight: 600 }}>Défaut</span>
            </Pressable>
            {PRESETS.map((p) => (
              <Pressable key={p.id} onClick={() => setBackground({ type: "preset", value: p.id })} scale={0.94} haptic={4} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{ width: 52, height: 52, borderRadius: R.md, background: p.css(dark), border: `2px solid ${background && background.type === "preset" && background.value === p.id ? ACCENT_BRIGHT : "transparent"}` }} />
                <span style={{ fontSize: 9.5, color: th.textFaint, fontWeight: 600, maxWidth: 56, textAlign: "center" }}>{p.label}</span>
              </Pressable>
            ))}
            <Pressable onClick={() => fileInputRef.current && fileInputRef.current.click()} scale={0.94} haptic={4} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{
                width: 52, height: 52, borderRadius: R.md,
                backgroundImage: background && background.type === "custom" ? `url(${background.value})` : "none",
                backgroundSize: "cover", backgroundPosition: "center",
                background: background && background.type === "custom" ? undefined : th.glass,
                border: `2px solid ${background && background.type === "custom" ? ACCENT_BRIGHT : th.glassBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {!(background && background.type === "custom") && <Upload size={16} color={th.textDim} strokeWidth={1.8} />}
              </div>
              <span style={{ fontSize: 9.5, color: th.textFaint, fontWeight: 600 }}>Importer</span>
            </Pressable>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          </div>
        </SettingsSection>

        <SettingsSection title="Musique" th={th}><MusicPanel th={th} /></SettingsSection>

        <Pressable
          onClick={() => { if (confirmingReset) { onResetAll(); setConfirmingReset(false); onClose(); } else setConfirmingReset(true); }}
          haptic={confirmingReset ? 14 : 5}
          style={{
            width: "100%", padding: "13px 16px", borderRadius: R.md, textAlign: "center",
            background: confirmingReset ? "rgba(200,60,60,.16)" : th.glass,
            border: `1px solid ${confirmingReset ? "rgba(200,60,60,.4)" : th.glassBorder}`,
            color: confirmingReset ? "#E06060" : th.textDim, fontSize: 13, fontWeight: 700,
          }}
        >
          {confirmingReset ? "Confirmer la réinitialisation de toutes les statistiques" : "Réinitialiser toutes les statistiques"}
        </Pressable>
      </div>
    </div>
  );
}

function SettingRow({ icon: Icon, label, description, th, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 2px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: R.sm, ...glass(th), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={15} color={th.textDim} strokeWidth={1.8} />
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: th.text }}>{label}</div>
          <div style={{ fontSize: 11.5, color: th.textFaint, marginTop: 1 }}>{description}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ---------------------------------- Floating glass bottom nav ---------------------------------- */
function BottomNav({ tab, setTab, th, onPublish }) {
  const items = [
    { id: "chapelet", label: "Chapelet", icon: HandMetal },
    { id: "informations", label: "Infos", icon: Star },
    { id: "__publish__", label: "", icon: Plus },
    { id: "videos", label: "Vidéos", icon: Film },
    { id: "profil", label: "Profil", icon: Users },
  ];
  const activeIndex = Math.max(0, items.findIndex((i) => i.id === tab));
  const indicatorLeft = useSpring(activeIndex * (100 / items.length), { stiffness: 260, damping: 26 });

  return (
    <nav role="tablist" aria-label="Navigation principale" style={{
      position: "sticky", bottom: 14, width: "100%", maxWidth: 400, margin: "0 auto",
      ...glass(th, { strong: true, radius: R.pill, deep: true }), padding: 6, display: "flex",
    }}>
      <div style={{
        position: "absolute", top: 6, bottom: 6, left: `calc(${indicatorLeft}% + 6px)`, width: `calc(${100 / items.length}% - 12px)`,
        borderRadius: R.pill, background: `radial-gradient(circle, ${ACCENT_BRIGHT}45, transparent 75%)`, filter: "blur(4px)",
      }} />
      {items.map((it) => {
        if (it.id === "__publish__") {
          return (
            <Pressable key={it.id} ariaLabel="Publier" onClick={onPublish} scale={0.92} haptic={7} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1,
            }}>
              <div style={{
                width: 34, height: 26, borderRadius: R.md, display: "flex", alignItems: "center", justifyContent: "center",
                background: `linear-gradient(135deg, ${ACCENT_BRIGHT}, ${ACCENT})`, boxShadow: `0 4px 12px ${ACCENT}60`,
              }}>
                <Plus size={16} color="#fff" strokeWidth={2.6} />
              </div>
            </Pressable>
          );
        }
        const active = it.id === tab; const Icon = it.icon;
        return (
          <Pressable key={it.id} role="tab" aria-selected={active} onClick={() => setTab(it.id)} scale={0.95} haptic={5} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "9px 0", borderRadius: R.pill, position: "relative", zIndex: 1,
          }}>
            <Icon size={13} color={active ? GOLD_BRIGHT : th.textDim} strokeWidth={2} style={active ? { filter: `drop-shadow(0 0 4px ${GOLD_BRIGHT}80)` } : undefined} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: active ? th.text : th.textDim }}>{it.label}</span>
          </Pressable>
        );
      })}
    </nav>
  );
}

/* ---------------------------------- Root ---------------------------------- */
export default function App() {
  const [booting, setBooting] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("chapelet");
  const [chapeletSection, setChapeletSection] = useState("dhikr");
  const [publishOpen, setPublishOpen] = useState(false);
  const [feedVersion, setFeedVersion] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [hapticOn, setHapticOn] = useState(true);
  const [activeId, setActiveId] = useState(DHIKRS[0].id);
  const [customDhikrs, setCustomDhikrs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [goals, setGoals] = useState({});
  const [counts, setCounts] = useState({});
  const [history, setHistory] = useState([]);
  const [background, setBackground] = useState({ type: "default" });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tock = useTock();
  const sessionSaveTimer = useRef(null);

  const th = dark ? THEME.dark : THEME.light;
  const allDhikrs = useMemo(() => [...DHIKRS, ...customDhikrs], [customDhikrs]);
  const auth = useSupabaseAuth();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return "Paix de la nuit";
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  }, []);

  useEffect(() => { hapticState.enabled = hapticOn; }, [hapticOn]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);
  const toggleFullscreen = useCallback(() => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    } catch (e) {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const prefs = await loadJSON("fansourlana:prefs", null);
      const hist = await loadJSON("fansourlana:history", []);
      const sess = await loadJSON("fansourlana:session", {});
      if (cancelled) return;
      if (prefs) {
        setDark(prefs.dark ?? true);
        setSoundOn(prefs.soundOn ?? true);
        setHapticOn(prefs.hapticOn ?? true);
        setActiveId(prefs.activeId || DHIKRS[0].id);
        setCustomDhikrs(prefs.customDhikrs || []);
        setBackground(prefs.background || { type: "default" });
        setFavorites(prefs.favorites || []);
        setGoals(prefs.goals || {});
      }
      setHistory(Array.isArray(hist) ? hist : []);
      setCounts(sess && typeof sess === "object" ? sess : {});
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveJSON("fansourlana:prefs", { dark, soundOn, hapticOn, activeId, customDhikrs, background, favorites, goals });
  }, [hydrated, dark, soundOn, hapticOn, activeId, customDhikrs, background, favorites, goals]);

  useEffect(() => {
    if (!hydrated) return;
    clearTimeout(sessionSaveTimer.current);
    sessionSaveTimer.current = setTimeout(() => saveJSON("fansourlana:session", counts), 500);
    return () => clearTimeout(sessionSaveTimer.current);
  }, [counts, hydrated]);

  const appendHistory = useCallback((record) => {
    setHistory((prev) => { const next = [record, ...prev].slice(0, 300); saveJSON("fansourlana:history", next); return next; });
  }, []);
  const deleteHistoryEntry = useCallback((id) => {
    setHistory((prev) => { const next = prev.filter((h) => h.id !== id); saveJSON("fansourlana:history", next); return next; });
  }, []);
  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);
  const setGoalFor = useCallback((id, g) => {
    setGoals((prev) => ({ ...prev, [id]: g }));
  }, []);

  const resetAll = () => { setCounts({}); setHistory([]); saveJSON("fansourlana:history", []); saveJSON("fansourlana:session", {}); };

  const bgStyle = useMemo(() => {
    if (!background || background.type === "default") return { background: th.bg };
    if (background.type === "preset") { const p = PRESETS.find((x) => x.id === background.value); return { background: p ? p.css(dark) : th.bg }; }
    if (background.type === "custom" && background.value) return { backgroundImage: `url(${background.value})`, backgroundSize: "cover", backgroundPosition: "center" };
    return { background: th.bg };
  }, [background, dark, th]);

  const globalStyle = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap');
      * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
      html, body { margin: 0; }
      @keyframes fl-spin { to { transform: rotate(360deg); } }
      @keyframes fl-breathe { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.045); } }
      @keyframes fl-cycleflash { 0% { opacity: 0; transform: scale(.9); } 30% { opacity: 1; } 100% { opacity: 0; transform: scale(1.14); } }
      @keyframes fl-fadein { from { opacity: 0; } to { opacity: 1; } }
      @keyframes fl-sheetup { from { transform: translateY(100%); } to { transform: translateY(0); } }
      @keyframes fl-beadpop { from { opacity: 0; } to { opacity: 1; } }
      @keyframes fl-ripple { from { transform: scale(0.4); opacity: .7; } to { transform: scale(2.4); opacity: 0; } }
      @keyframes fl-savepulse { from { opacity: .9; transform: scale(1); } to { opacity: 0; transform: scale(1.6); } }
      @keyframes fl-shimmer { 0% { transform: translateX(-120%) rotate(8deg); } 100% { transform: translateX(220%) rotate(8deg); } }
      @keyframes fl-bellring { 0%,100% { transform: rotate(0deg); } 15% { transform: rotate(-12deg); } 30% { transform: rotate(10deg); } 45% { transform: rotate(-8deg); } 60% { transform: rotate(5deg); } 75% { transform: rotate(-2deg); } }
      @keyframes fl-drift1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(6%, 8%); } }
      @keyframes fl-drift2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-7%, 6%); } }
      @keyframes fl-drift3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(5%, -7%); } }
      input::placeholder { color: ${th.textFaint}; }
      *:focus-visible { outline: 2px solid ${GOLD_BRIGHT}; outline-offset: 2px; }
      ::-webkit-scrollbar { display: none; }
      @media (prefers-reduced-motion: reduce) {
        * { animation-duration: .001ms !important; transition-duration: .001ms !important; }
      }
    `}</style>
  );

  if (booting) return (<>{globalStyle}<IntroScreen dark={dark} onDone={() => setBooting(false)} /></>);

  return (
    <div style={{
      minHeight: "100vh", width: "100%", ...bgStyle, color: th.text,
      fontFamily: "'Manrope', -apple-system, sans-serif", position: "relative", overflow: "hidden",
      transition: `background 400ms ${EASE.swift}, color 400ms ${EASE.swift}`,
    }}>
      {globalStyle}
      {(!background || background.type === "default") && <AmbientBackground dark={dark} />}
      {background && background.type !== "default" && (<div style={{ position: "absolute", inset: 0, background: th.scrim, pointerEvents: "none" }} />)}

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 20px 14px", boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
          <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11.5, color: th.textFaint, fontWeight: 600, letterSpacing: 0.3 }}>{greeting}</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600, color: th.text, marginTop: 1 }}>Fansourlana</div>
            </div>
            <Pressable onClick={() => setSettingsOpen(true)} haptic={4} ariaLabel="Ouvrir les réglages" style={{
              width: 38, height: 38, borderRadius: "50%", ...glass(th), display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Settings size={16} color={th.textDim} strokeWidth={1.9} />
            </Pressable>
          </div>

          <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 4 }}>
            {tab === "chapelet" && (
              <ChapeletScreen
                th={th} dark={dark} section={chapeletSection} setSection={setChapeletSection}
                history={history} deleteHistoryEntry={deleteHistoryEntry}
                dhikrProps={{
                  activeId, setActiveId, counts, setCounts, soundOn, tock,
                  allDhikrs, customDhikrs, setCustomDhikrs, history, appendHistory,
                  favorites, toggleFavorite, goals, setGoalFor,
                  onOpenQibla: () => setChapeletSection("qibla"),
                }}
              />
            )}
            {tab === "informations" && <InfoFeedScreen key={feedVersion} th={th} auth={auth} />}
            {tab === "videos" && <VideoFeedScreen key={feedVersion} th={th} auth={auth} />}
            {tab === "profil" && <ProfileScreen key={feedVersion} th={th} auth={auth} onOpenSettings={() => setSettingsOpen(true)} />}
          </div>

          <div style={{ height: 26 }} />
        </div>

        <BottomNav tab={tab} setTab={setTab} th={th} onPublish={() => setPublishOpen(true)} />

        {publishOpen && (
          <PublishSheet th={th} dark={dark} auth={auth} onClose={() => setPublishOpen(false)} onPublished={() => setFeedVersion((v) => v + 1)} />
        )}

        <SettingsModal
          open={settingsOpen} onClose={() => setSettingsOpen(false)}
          dark={dark} setDark={setDark} soundOn={soundOn} setSoundOn={setSoundOn}
          hapticOn={hapticOn} setHapticOn={setHapticOn} th={th} onResetAll={resetAll}
          background={background} setBackground={setBackground}
          isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  );
}
