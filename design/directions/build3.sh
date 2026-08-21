#!/bin/bash
set -e
# warm(NAME TITLE BG TILE TXT MUT GRAD_A GRAD_B HERO_TXT RING RING_TRACK C1 C2 C3 ACC FONT GF SHADOW)
warm() {
NAME=$1 BG=$2 TILE=$3 TXT=$4 MUT=$5 GA=$6 GB=$7 HT=$8 RING=$9 RT=${10} C1=${11} C2=${12} C3=${13} ACC=${14} FONT=${15} GF=${16} SH=${17} LOGO=${18}
cat <<EOF
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?$GF&display=swap">
  <style>
    body { margin: 0; background: $BG; color: $TXT; font-family: $FONT; font-size: 14px; }
    a { color: $ACC; } a:hover { opacity: .8; }
    .num { font-weight: 700; line-height: 1; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
    .k { font-size: 12px; color: $MUT; font-weight: 500; }
    .tile { background: $TILE; border-radius: 22px; padding: 18px; display: flex; flex-direction: column; gap: 8px; box-shadow: $SH; }
    svg.ic { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  </style>
</helmet>
<div style="position: relative; width: 390px; height: 844px; overflow: hidden; background: $BG; display: flex; flex-direction: column;">
  <div style="display: flex; align-items: flex-end; justify-content: space-between; padding: 24px 22px 14px;">
    <div style="display: flex; flex-direction: column; gap: 2px;"><span class="k">Thursday 20 August</span><span class="num" style="font-size: 28px;">$LOGO</span></div>
    <div style="width: 40px; height: 40px; border-radius: 50%; background: $TILE; box-shadow: $SH; display: flex; align-items: center; justify-content: center; color: $MUT;"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></div>
  </div>
  <div style="flex: 1; overflow: hidden; padding: 0 16px 90px; display: flex; flex-direction: column; gap: 12px;">
  <div style="border-radius: 26px; padding: 20px; background: linear-gradient(135deg, $GA 0%, $GB 100%); color: $HT; display: flex; flex-direction: column; gap: 14px; box-shadow: $SH;">
    <div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 12px; font-weight: 600; opacity: .85;">TODAY · EASY</span><span style="font-size: 12px; font-weight: 600; background: rgba(255,255,255,.35); padding: 4px 10px; border-radius: 999px;">wk 5 of 8</span></div>
    <div style="display: flex; align-items: center; gap: 18px;">
      <div style="position: relative; width: 96px; height: 96px; flex-shrink: 0;">
        <svg viewBox="0 0 96 96" style="width: 96px; height: 96px; transform: rotate(-90deg);"><circle cx="48" cy="48" r="40" fill="none" stroke="$RT" stroke-width="10"/><circle cx="48" cy="48" r="40" fill="none" stroke="$RING" stroke-width="10" stroke-linecap="round" stroke-dasharray="163 251"/></svg>
        <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;"><span class="num" style="font-size: 26px;">+3</span><span style="font-size: 10px; font-weight: 600; opacity: .8;">FORM</span></div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <span class="num" style="font-size: 44px;">8 km</span>
        <span style="font-size: 14px; opacity: .9;">6:05–6:25 /km · under <strong>145 bpm</strong></span>
        <span style="font-size: 13px; opacity: .8; line-height: 1.4;">Recovery, not pace. See 150? Walk 30 s.</span>
      </div>
    </div>
    <div style="height: 46px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.92); color: $TXT; border-radius: 16px; font-weight: 700; font-size: 14px;">Pre-session brief</div>
  </div>
  <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px;">
    <div class="tile" style="padding: 16px 14px;"><span class="k">Streak</span><span class="num" style="font-size: 30px; color: $C1;">6</span><span style="font-size: 11px; color: $MUT;">at effort</span></div>
    <div class="tile" style="padding: 16px 14px;"><span class="k">TT in</span><span class="num" style="font-size: 30px; color: $C2;">24</span><span style="font-size: 11px; color: $MUT;">days</span></div>
    <div class="tile" style="padding: 16px 14px;"><span class="k">Week</span><span class="num" style="font-size: 30px; color: $C3;">23</span><span style="font-size: 11px; color: $MUT;">of 38 km</span></div>
  </div>
  <div class="tile">
    <div style="display: flex; justify-content: space-between; align-items: center;"><span class="k">Yesterday · Tempo</span><span style="font-size: 12px; font-weight: 700; color: $C1; background: $BG; padding: 4px 10px; border-radius: 999px;">On target</span></div>
    <div style="display: flex; align-items: baseline; gap: 14px;">
      <span class="num" style="font-size: 30px;">7.4<span style="font-size: 14px; font-weight: 500; color: $MUT;"> km</span></span>
      <span class="num" style="font-size: 30px;">5:26<span style="font-size: 14px; font-weight: 500; color: $MUT;"> /km</span></span>
      <span class="num" style="font-size: 30px;">158<span style="font-size: 14px; font-weight: 500; color: $MUT;"> bpm</span></span>
    </div>
    <div style="font-size: 13px; color: $MUT; line-height: 1.5;">Reps at 4:49–5:07 on 171–174 bpm — exactly the effort asked. New season best over 2 km. Keep today honestly easy to bank it.</div>
    <div style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: $ACC; font-weight: 600;"><span>Add Garmin stats</span><svg class="ic" viewBox="0 0 24 24" style="width: 16px; height: 16px;"><path d="M9 6l6 6-6 6"/></svg></div>
  </div>
  </div>
  <div style="position: absolute; left: 16px; right: 16px; bottom: 18px; height: 64px; background: $TILE; border-radius: 999px; box-shadow: $SH; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); align-items: center;">
EOF
for t in Home:home Plan:plan Runs:act Trends:trends Records:rec; do n=${t%%:*}; id=${t##*:}; col="$MUT"; [ "$id" = home ] && col="$ACC";
case $id in
home) p='<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>';;
plan) p='<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>';;
act) p='<path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/>';;
trends) p='<path d="M3 20h18"/><path d="M5 16l4-6 4 3 6-8"/>';;
rec) p='<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>';;
esac
echo "    <div style=\"display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; color: $col;\"><svg class=\"ic\" viewBox=\"0 0 24 24\">$p</svg><span style=\"font-size: 10px; font-weight: 600;\">$n</span></div>"; done
cat <<EOF
  </div>
</div>
</x-dc>
<script data-dc-script data-props='{}'>
class Component extends DCLogic { renderVals() { return {}; } }
</script>
</body>
</html>
EOF
}
SH="0 6px 24px rgba(60,40,20,.07)"
# I · Glow — cream, peach→rose hero, Apple-Health multi-colour numbers
warm Glow "#faf5ee" "#ffffff" "#2a2420" "#8a7f74" "#f6b89a" "#e88aa6" "#3a2320" "#ffffff" "rgba(255,255,255,.35)" "#2f9e6b" "#c2589a" "#d89b2b" "#c2589a" "'Figtree', system-ui, sans-serif" "family=Figtree:wght@400;500;700" "$SH" "Good morning, Ryan" > Glow.dc.html
# J · Clay — sand, terracotta-free: ochre→sage hero, earthy
warm Clay "#f3ede3" "#fbf8f2" "#2b2621" "#8c8273" "#d9b46a" "#8fae8b" "#2b2621" "#2b2621" "rgba(43,38,33,.15)" "#5f8a5a" "#b88a2e" "#7a6a9c" "#5f8a5a" "'Albert Sans', system-ui, sans-serif" "family=Albert+Sans:wght@400;500;700" "0 4px 18px rgba(43,38,33,.06)" "Good morning, Ryan" > Clay.dc.html
# K · Bloom — Oura-like: warm white, lavender→rose hero, deep plum text
warm Bloom "#fbf7f7" "#ffffff" "#2d2233" "#8b7f91" "#b8a0e8" "#f0a6b4" "#2d2233" "#ffffff" "rgba(255,255,255,.4)" "#3f9d7a" "#7c5cc4" "#d97a6a" "#7c5cc4" "'Outfit', system-ui, sans-serif" "family=Outfit:wght@400;500;700" "0 8px 28px rgba(80,50,90,.08)" "Good morning, Ryan" > Bloom.dc.html
python3 - <<'PY'
import json
c=json.load(open('canvas.json'))
c['artboards']+=[
 {"file":"Glow.dc.html","title":"I · Glow","x":0,"y":2000,"w":390,"h":844},
 {"file":"Clay.dc.html","title":"J · Clay","x":470,"y":2000,"w":390,"h":844},
 {"file":"Bloom.dc.html","title":"K · Bloom","x":940,"y":2000,"w":390,"h":844}]
c['annotations']+=[
 {"id":"row3","x":0,"y":1900,"w":760,"text":"Round 3 — warm, Apple Health × Oura. New layout: no borders, soft shadows, gradient hero with a form ring, big coloured numbers (each metric owns a colour), floating pill tab bar."},
 {"id":"i-note","x":0,"y":2870,"w":390,"text":"I · Glow\nCream base, peach→rose hero, Figtree. Warmest and friendliest; closest to Apple Fitness. Trade-off: the peach is a cousin of orange."},
 {"id":"j-note","x":470,"y":2870,"w":390,"text":"J · Clay\nSand base, ochre→sage hero, dark text on the gradient, Albert Sans. Earthy and calm, more 'trail journal'. Trade-off: lowest contrast of the three; needs care with small text."},
 {"id":"k-note","x":940,"y":2870,"w":390,"text":"K · Bloom\nWarm white, lavender→rose hero, plum text, Outfit. The Oura one: soft, premium, nothing orange about it. Trade-off: least obviously 'running'."}]
c['launch']={"view":"canvas"}
json.dump(c,open('canvas.json','w'),indent=2)
PY
B=/tmp/claude-1000/bundled-skills/2.1.237/719e09e09690256afcff4f7c596a433e/design
node "$B/seed-canvas.mjs" --template "$B/payload.template.html" --out ritmo-directions.html --title "Ritmo Directions" $(for f in Main Track Dusk Signal Forest Plum Ink Ocean Glow Clay Bloom; do echo --artboard $f.dc.html; done) --canvas canvas.json && node "$B/seed-canvas.mjs" --check ritmo-directions.html
