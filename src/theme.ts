// src/theme.ts: the one place for colours, type, spacing, radii, shadows and motion.
// Screens import from here instead of defining their own INK / MUTED / AMBER / MAROON constants.
// GLOBAL_CSS holds what inline styles cannot do (hover, focus, pressed, media queries, keyframes).
// App.tsx renders it once as <style>{GLOBAL_CSS}</style>. adRenderer.ts never imports this file.
import type { CSSProperties } from "react";

export const color = {
  paper: "#FAF8F4", // page background
  surface: "#FFFFFF", // inputs, panels, selected segment, picker tiles
  sunk: "#F1EEE7", // photo frame, preview frame, guide stage, segmented track, info notes
  ink: "#1A1814", // text, primary buttons, focus ring, selected rings
  ink2: "#3D3932", // longer secondary copy (hero subline, taglines)
  muted: "#655F55", // hints, captions, placeholders, meta
  faint: "#8A8478", // disabled text only
  line: "#E5E0D6", // decorative dividers and quiet panel edges
  lineStrong: "#8C8579", // borders that mark a control (inputs, secondary buttons, chips)
  accent: "#F5B700", // brand gold: fills and graphics only, never text, never the only state cue
  accentInk: "#7A5900", // gold that must be read (caution-note icon)
  accentWash: "#FBF0CF", // caution note background
  danger: "#B3261E",
  dangerWash: "#F8E6E3",
  success: "#1F6B3A",
  festive: "#6B1020", // Diwali maroon: date line, season badge, greeting dot, GreetingTile only
  festiveText: "#FFE9B8", // text on festive
  btnHover: "#2E2A24",
  btnDisabled: "#D9D3C8",
  scrim: "rgba(26,24,20,0.86)", // cut-out progress panel over the preview
} as const;

// Photo-guide drawings (SVG attributes, so raw hex). Warmed to sit on the paper page.
export const art = {
  stage: "#F1EEE7",
  table: "#E8E3D9",
  tableShadow: "#DCD6CA",
  grey: "#8C8579",
  inkGlass: "#E9E5DD",
  inkShadow: "#E2DDD3",
  mutedLine: "#B9B2A6",
  mutedSoft: "#CFC9BE",
  mutedFill: "#FBFAF7",
  mutedGlass: "#F1EEE7",
  mutedLamp: "#E6E0D5",
  night: "#1D2025", // dark scenes stay as they are
} as const;

const SYSTEM_TAIL = '"Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, "Noto Sans Devanagari", "Kohinoor Devanagari", "Nirmala UI", sans-serif';
export const fontStack = {
  body: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI Variable Text", ${SYSTEM_TAIL}`,
  display: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI Variable Display", ${SYSTEM_TAIL}`,
} as const;

type Weight = 400 | 500 | 600 | 700;
function role(fontSize: number | string, fontWeight: Weight, lineHeight: number, letterSpacing = "0em", fontFamily: string = fontStack.body): CSSProperties {
  return { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing };
}

// Spread into inline styles: style={{ ...text.title, margin: "0 0 8px" }}. Roles carry no margins on purpose.
export const text = {
  display: role("clamp(32px, 7.4vw + 4px, 44px)", 700, 1.05, "-0.025em", fontStack.display), // home hero heading only
  title: role(24, 600, 1.2, "-0.02em", fontStack.display), // screen headings
  heading: role(18, 600, 1.3, "-0.01em"), // section headings
  bodyLg: role(17, 400, 1.5), // hero subline, taglines
  body: role(16, 400, 1.5),
  label: role(15, 500, 1.35), // field labels, links, chips, segments
  button: role(17, 600, 1.2, "-0.005em"),
  small: role(14, 400, 1.45), // hints, helper and status lines
  micro: role(12, 500, 1.25, "0.01em"), // size and background tile labels, tags (the floor)
  code: { ...role(26, 600, 1, "0.4em"), fontVariantNumeric: "tabular-nums" },
} satisfies Record<string, CSSProperties>;

export const space = { s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s8: 32, s10: 40, s12: 48, s16: 64 } as const;
export const gap = { labelToInput: 8, inputToHint: 8, field: 24, group: 32, section: 48 } as const;
export const layout = { maxWidth: 560, gutter: 20, top: 24, bottom: 96 } as const;

export const radius = { input: 10, tile: 10, button: 12, note: 12, media: 12, frame: 16, panel: 16, pill: 999 } as const;

export const shadow = {
  print: "0 1px 2px rgba(26,24,20,.06), 0 12px 32px -10px rgba(26,24,20,.22)", // the finished picture only
  thumb: "0 1px 3px rgba(26,24,20,.12)", // guide play/pause control only
  ring: `0 0 0 2px ${color.paper}, 0 0 0 4px ${color.ink}`, // chosen card, tile, size
} as const;

export const motion = {
  press: 120,
  state: 200,
  open: 320,
  scene: 600,
  easeOut: "cubic-bezier(.16,1,.3,1)",
  easeIn: "cubic-bezier(.7,0,.84,0)",
  easeInOut: "cubic-bezier(.65,0,.35,1)",
} as const;

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

const c = color;
const m = motion;
const f = fontStack.body;

export const GLOBAL_CSS = `
html{color-scheme:light;-webkit-text-size-adjust:100%;scroll-padding-bottom:104px;background:${c.paper}}
body{margin:0;background:${c.paper};color:${c.ink};font:400 16px/1.5 ${f};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-tap-highlight-color:transparent}
h1,h2,h3{text-wrap:balance}
p,li{text-wrap:pretty}
input,textarea,button,select{font:inherit;color:inherit}
a{color:inherit;text-decoration-thickness:1px;text-underline-offset:3px;text-decoration-color:${c.lineStrong}}
::selection{background:rgba(245,183,0,.35);color:${c.ink}}
::placeholder{color:${c.muted};opacity:1}
input,textarea{caret-color:${c.ink}}
input[type=radio]{accent-color:${c.ink}}
:focus-visible{outline:2px solid ${c.ink};outline-offset:2px}
.mmv-num{font-variant-numeric:tabular-nums}

.mmv-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;padding:14px 20px;box-sizing:border-box;border:0;border-radius:12px;background:${c.ink};color:${c.paper};font:600 17px/1.2 ${f};letter-spacing:-.005em;text-align:center;cursor:pointer;transition:background-color ${m.press}ms,transform ${m.press}ms ${m.easeOut}}
.mmv-btn:active:not(:disabled){transform:scale(.985)}
.mmv-btn:disabled{background:${c.btnDisabled};color:${c.muted};cursor:default}
.mmv-btn2{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 18px;box-sizing:border-box;border:1px solid ${c.lineStrong};border-radius:12px;background:transparent;color:${c.ink};font:600 16px/1.2 ${f};text-align:center;cursor:pointer;transition:background-color ${m.press}ms}
.mmv-btn2--block{display:flex;width:100%}
.mmv-btn2--sm{min-height:44px;padding:0 14px;font-size:15px}
.mmv-btn2:disabled{color:${c.faint};border-color:${c.line};cursor:default}
.mmv-link{display:inline-flex;align-items:center;gap:6px;min-height:44px;margin:0;padding:0;border:0;background:none;color:${c.ink};font-size:15px;font-weight:500;line-height:1.35;text-align:left;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;text-decoration-color:${c.lineStrong};cursor:pointer}
.mmv-link--muted{color:${c.muted}}
.mmv-link:disabled{color:${c.faint};cursor:default}
.mmv-link--muted:disabled{color:${c.muted}}

.mmv-field{margin:0 0 24px}
.mmv-label{display:block;margin:0 0 8px;font-size:15px;font-weight:500;line-height:1.35;color:${c.ink}}
.mmv-opt{color:${c.muted};font-weight:400}
.mmv-input{display:block;width:100%;min-height:50px;margin:0;padding:13px 14px;box-sizing:border-box;border:1px solid ${c.lineStrong};border-radius:10px;background:${c.surface};color:${c.ink};font-size:16px;line-height:1.4;transition:border-color ${m.press}ms}
.mmv-input:focus{border-color:${c.ink}}
.mmv-input:focus-visible{outline-offset:-1px}
textarea.mmv-input{min-height:96px;resize:vertical}
.mmv-input--code{min-height:60px;padding-left:calc(14px + .4em);text-align:center;font-size:26px;font-weight:600;letter-spacing:.4em;font-variant-numeric:tabular-nums}
.mmv-hint{margin:8px 0 0;font-size:14px;line-height:1.45;color:${c.muted}}

.mmv-seg{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:4px;padding:4px;border-radius:12px;background:${c.sunk}}
.mmv-seg>button{min-width:0;min-height:44px;padding:6px 8px;border:0;border-radius:9px;background:transparent;color:${c.muted};font-size:15px;font-weight:500;line-height:1.2;cursor:pointer;transition:background-color ${m.state}ms,color ${m.state}ms,box-shadow ${m.state}ms}
.mmv-seg>button[aria-checked=true]{background:${c.surface};color:${c.ink};font-weight:600;box-shadow:inset 0 0 0 1.5px ${c.ink}}
.mmv-seg--lg>button{min-height:48px;font-size:16px}
.mmv-seg--sm>button{padding:6px 3px;font-size:14px}
.mmv-contact-kind{display:inline-flex;align-items:center;justify-content:center;gap:4px}
@media (max-width:374px){.mmv-contact-kind{flex-direction:column;gap:2px}}

.mmv-chip{position:relative;display:inline-flex;max-width:100%}
.mmv-chip>input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.mmv-chip>span{display:inline-flex;align-items:center;min-height:44px;box-sizing:border-box;padding:10px 16px;border:1px solid ${c.lineStrong};border-radius:999px;background:${c.surface};color:${c.ink};font-size:15px;font-weight:500;line-height:1.3;cursor:pointer;transition:background-color ${m.state}ms,color ${m.state}ms,border-color ${m.state}ms}
.mmv-chip>input:checked+span{background:${c.ink};border-color:${c.ink};color:${c.paper}}
.mmv-chip>input:focus-visible+span{outline:2px solid ${c.ink};outline-offset:2px}

.mmv-note{display:flex;gap:12px;align-items:flex-start;margin:0;padding:14px 16px;border-radius:12px;background:${c.sunk};color:${c.ink};font-size:15px;line-height:1.45;animation:mmv-rise ${m.open}ms ${m.easeOut} both}
.mmv-note>svg{flex:none;margin-top:2px;color:${c.ink}}
.mmv-note--caution{background:${c.accentWash}}
.mmv-note--caution>svg{color:${c.accentInk}}
.mmv-note--error{background:${c.dangerWash}}
.mmv-note--error>svg{color:${c.danger}}
.mmv-note .mmv-btn2{margin-top:12px}
.mmv-status{display:flex;align-items:flex-start;gap:8px;margin:0;font-size:14px;font-weight:500;line-height:1.45;color:${c.ink};animation:mmv-rise ${m.state}ms ${m.easeOut} both}
.mmv-status--wait{color:${c.muted};font-weight:400}
.mmv-status>svg{flex:none;margin-top:2px}
.mmv-status--done>svg{color:${c.success}}
.mmv-error{display:flex;align-items:flex-start;gap:8px;margin:0;color:${c.danger};font-size:15px;font-weight:500;line-height:1.4;animation:mmv-rise ${m.state}ms ${m.easeOut} both}
.mmv-error>svg{flex:none;margin-top:2px}
.mmv-spin{flex:none;width:14px;height:14px;margin-top:3px;box-sizing:border-box;border:2px solid ${c.line};border-top-color:${c.ink};border-radius:50%;animation:mmv-spin 800ms linear infinite}

.mmv-panel{padding:20px;border:1px solid ${c.line};border-radius:16px;background:${c.surface};animation:mmv-rise ${m.open}ms ${m.easeOut} both}
.mmv-frame{position:relative;padding:20px;border-radius:16px;background:${c.sunk}}
.mmv-corner{position:absolute;width:18px;height:18px;border:0 solid ${c.accent};pointer-events:none;animation:mmv-snap ${m.open}ms ${m.easeOut} both}
.mmv-corner--tl{top:10px;left:10px;border-top-width:2.5px;border-left-width:2.5px;border-top-left-radius:5px;--dx:-4px;--dy:-4px}
.mmv-corner--tr{top:10px;right:10px;border-top-width:2.5px;border-right-width:2.5px;border-top-right-radius:5px;--dx:4px;--dy:-4px}
.mmv-corner--br{bottom:10px;right:10px;border-bottom-width:2.5px;border-right-width:2.5px;border-bottom-right-radius:5px;--dx:4px;--dy:4px}
.mmv-corner--bl{bottom:10px;left:10px;border-bottom-width:2.5px;border-left-width:2.5px;border-bottom-left-radius:5px;--dx:-4px;--dy:4px}
.mmv-picks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
@media (max-width:329px){.mmv-picks{grid-template-columns:1fr}}
.mmv-pick-tile{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:8px;min-height:88px;padding:20px 12px 12px;box-sizing:border-box;border:1px solid ${c.lineStrong};border-radius:12px;background:${c.surface};color:${c.ink};font:600 15px/1.25 ${f};text-align:center;cursor:pointer;transition:transform ${m.press}ms ${m.easeOut}}
.mmv-pick-tile:active{transform:scale(.98)}

.mmv-media{display:block;border-radius:12px;background:${c.sunk};transition:box-shadow ${m.state}ms}
.mmv-choice[aria-pressed=true] .mmv-media,.mmv-choice[aria-checked=true] .mmv-media{box-shadow:${shadow.ring}}
.mmv-card{display:flex;flex-direction:column;gap:12px;width:100%;margin:0;padding:0;border:0;border-radius:12px;background:none;color:${c.ink};font:inherit;text-align:left;text-decoration:none;cursor:pointer}
.mmv-card .mmv-media img{transition:transform ${m.open}ms ${m.easeOut}}
.mmv-card:disabled{cursor:default}
.mmv-tile{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;min-height:44px;padding:4px 0;border:0;background:none;color:${c.muted};font-size:12px;font-weight:500;line-height:1.25;cursor:pointer;transition:color ${m.state}ms}
.mmv-tile[aria-checked=true],.mmv-tile[aria-pressed=true]{color:${c.ink};font-weight:600}
.mmv-tile:disabled{color:${c.faint};cursor:not-allowed}
.mmv-tile:disabled .mmv-media{filter:grayscale(1)}
.mmv-bg-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
@media (max-width:359px){.mmv-bg-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}

.mmv-preview{position:relative;height:min(48vh,420px);box-sizing:border-box;padding:16px;border-radius:16px;background:${c.sunk};display:flex;align-items:center;justify-content:center;overflow:hidden}
.mmv-preview>img{max-width:100%;max-height:100%;object-fit:contain;border-radius:4px;box-shadow:${shadow.print};transition:opacity ${m.state}ms}
@media (max-height:700px){.mmv-preview{height:42vh}}
.mmv-makebar{position:sticky;bottom:0;z-index:2;margin:32px -20px 0;padding:12px 20px calc(12px + env(safe-area-inset-bottom));background:${c.paper};border-top:1px solid ${c.line}}
.mmv-makebar .mmv-error{margin:0 0 10px}
main:has(.mmv-panel--signin) .mmv-makebar{position:static}
.mmv-reveal{animation:mmv-rise ${m.open}ms ${m.easeOut} both}
.mmv-scroll{scrollbar-width:thin;scrollbar-color:${c.lineStrong} transparent}
.mmv-slide{animation:mmv-slide 1.4s ${m.easeInOut} infinite}

.mmv-guide>summary{list-style:none}
.mmv-guide>summary::-webkit-details-marker{display:none}
.mmv-guide[open] .mmv-guide-body{animation:mmv-rise ${m.open}ms ${m.easeOut} both}
.mmv-chev{transition:transform ${m.state}ms ${m.easeOut}}
.mmv-guide[open] .mmv-chev{transform:rotate(180deg)}
.pg-stage{position:relative;aspect-ratio:16/10;overflow:hidden;border-radius:12px;background:${art.stage}}
.pg-layer{position:absolute;inset:0;display:grid;place-items:center}
.pg-layer svg{display:block;width:100%;height:auto}
.pg-avoid{place-items:end center;padding-bottom:6px}
.pg-avoid>div{height:92%;aspect-ratio:4/3;max-width:calc(100% - 16px);border-radius:10px;box-shadow:0 0 0 1.5px ${c.lineStrong}}
[data-phase=avoid] .pg-good{opacity:0}
[data-phase=avoid] .pg-avoid{animation:pg-in ${m.open}ms ${m.easeOut} both}
[data-phase=good] .pg-avoid{animation:pg-out 220ms ${m.easeIn} both}
[data-phase=good] .pg-good{animation:pg-in 420ms ${m.easeOut} both}
[data-phase=good][data-tip=whole] .pg-good{animation:pg-pull 700ms ${m.easeOut} both}
[data-phase=good] .pg-corners{stroke-dasharray:1;animation:pg-trace ${m.scene}ms 120ms ${m.easeOut} both}
[data-phase=good][data-tip=height] .pg-line{transform-box:fill-box;transform-origin:0 50%;animation:pg-wipe 420ms 200ms ${m.easeOut} both}
[data-phase=good][data-tip=height] .pg-phone{animation:pg-glide 500ms 200ms ${m.easeOut} both}
.pg-segs{position:absolute;top:10px;left:12px;right:12px;display:flex;gap:4px}
.pg-seg{flex:1;height:2px;overflow:hidden;border-radius:1px;background:rgba(26,24,20,.14)}
.pg-seg>i{display:block;height:100%;background:${c.ink};transform:scaleX(0);transform-origin:0 50%}
.pg-seg[data-state=done]>i{transform:none}
.pg-seg[data-state=now]>i{animation:pg-fill var(--len) linear both}
.pg-stage[data-paused] .pg-seg>i{animation-play-state:paused}
.pg-verdict{position:absolute;top:20px;left:12px;display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 5px;border-radius:999px;background:${c.surface};font-size:13px;font-weight:600;line-height:1.2;animation:pg-pop 240ms ${m.easeOut} both}
.pg-verdict--no{color:${c.danger}}
.pg-verdict--yes{color:${c.success}}
.pg-ctl{position:absolute;right:2px;bottom:2px;display:grid;place-items:center;width:44px;height:44px;padding:0;border:0;background:none;color:${c.ink};cursor:pointer}
.pg-ctl>span{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:${c.surface};box-shadow:${shadow.thumb}}
.pg-tips{margin:16px 0 0;padding:0;list-style:none}
.pg-tip{display:flex;gap:12px;align-items:flex-start;width:100%;min-height:44px;margin:0;padding:8px 0;box-sizing:border-box;border:0;background:none;color:${c.muted};font-size:15px;line-height:1.4;text-align:left;cursor:pointer;transition:color ${m.state}ms}
.pg-tip b{color:${c.ink};font-weight:600}
.pg-num{flex:none;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;box-shadow:inset 0 0 0 1.5px ${c.lineStrong};color:${c.ink};font-size:13px;font-weight:600;transition:background-color ${m.state}ms,box-shadow ${m.state}ms}
.pg-tip[aria-current=step]{color:${c.ink}}
.pg-tip[aria-current=step] .pg-num{background:${c.accent};box-shadow:none}
.pg-badge{position:absolute;top:6px;right:6px}
.pg-avoid-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 12px;margin:0;padding:0;list-style:none}
.pg-thumb{position:relative;margin:0 0 8px;border-radius:10px;box-shadow:0 0 0 1px ${c.line}}

@media (hover:hover){
.mmv-btn:hover:not(:disabled){background:${c.btnHover}}
.mmv-btn2:hover:not(:disabled){background:${c.sunk}}
.mmv-link:hover:not(:disabled){text-decoration-color:currentColor}
.mmv-input:hover:not(:focus){border-color:${c.ink2}}
.mmv-seg>button[aria-checked=false]:hover{color:${c.ink}}
.mmv-pick-tile:hover{background:${c.paper}}
.mmv-card:hover .mmv-media img{transform:scale(1.02)}
.mmv-tile:hover:not(:disabled){color:${c.ink}}
}

@keyframes mmv-rise{from{opacity:0;transform:translateY(4px)}}
@keyframes mmv-fade{from{opacity:0}}
@keyframes mmv-spin{to{transform:rotate(360deg)}}
@keyframes mmv-pulse{50%{opacity:.35}}
@keyframes mmv-snap{from{opacity:0;transform:translate(var(--dx),var(--dy))}}
@keyframes mmv-slide{from{transform:translateX(-100%)}to{transform:translateX(300%)}}
@keyframes pg-in{from{opacity:0;transform:scale(.96)}}
@keyframes pg-out{to{opacity:0;transform:scale(.98)}}
@keyframes pg-pull{from{opacity:0;transform:scale(1.12)}}
@keyframes pg-trace{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes pg-wipe{from{transform:scaleX(0)}}
@keyframes pg-glide{from{opacity:0;transform:translateY(-24px)}}
@keyframes pg-pop{from{opacity:0;transform:scale(.8)}}
@keyframes pg-fill{to{transform:scaleX(1)}}

@media (prefers-reduced-motion:reduce){
.mmv-note,.mmv-panel,.mmv-reveal,.mmv-status,.mmv-error,.mmv-guide[open] .mmv-guide-body{animation:mmv-fade 120ms linear both}
.mmv-corner{animation:none}
.mmv-btn:active:not(:disabled),.mmv-pick-tile:active{transform:none}
.mmv-card .mmv-media img,.mmv-chev{transition:none}
.mmv-spin{animation:mmv-pulse 1.6s ease-in-out infinite}
.mmv-slide{animation-duration:4s}
}
`;
