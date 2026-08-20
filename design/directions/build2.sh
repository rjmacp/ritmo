#!/bin/bash
set -e
source ./_gen.sh
SG="'Space Grotesk', system-ui, sans-serif"; SM="'Space Mono', ui-monospace, monospace"; GF="family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400"
# E Forest: warm stone + deep green
gen Forest Forest "#f5f3ee" "#ffffff" "#e4e0d6" "#1a1c19" "#6e7268" "#1f6f4a" "#ffffff" "$SG" "$SG" "$SM" "$GF" "14px" "0 1px 2px rgba(26,28,25,.04)" "#e3ede6" "#1f6f4a" "#b45309" "#ffffff" \
 "<div class=\"num\" style=\"font-size: 22px; letter-spacing: -.03em; color: #1f6f4a;\">RITMO</div>" > Forest.dc.html
# F Plum: cool white + violet
gen Plum Plum "#f7f6fa" "#ffffff" "#e6e3ee" "#17151f" "#6f6b7d" "#6d28d9" "#ffffff" "$SG" "$SG" "$SM" "$GF" "14px" "0 1px 2px rgba(23,21,31,.04)" "#ece6f8" "#15803d" "#c2410c" "#ffffff" \
 "<div class=\"num\" style=\"font-size: 22px; letter-spacing: -.03em; color: #6d28d9;\">RITMO</div>" > Plum.dc.html
# G Ink: pure neutral, near-black accent, colour only in data
gen Ink Ink "#f4f4f5" "#ffffff" "#e4e4e7" "#111113" "#71717a" "#111113" "#ffffff" "$SG" "$SG" "$SM" "$GF" "10px" "none" "#e9e9ec" "#16a34a" "#d97706" "#ffffff" \
 "<div class=\"num\" style=\"font-size: 22px; letter-spacing: -.03em; color: #111113;\">RITMO</div>" > Ink.dc.html
# H Ocean: warm white + deep teal
gen Ocean Ocean "#f6f5f1" "#ffffff" "#e3e1da" "#14201f" "#6b7675" "#0f766e" "#ffffff" "$SG" "$SG" "$SM" "$GF" "14px" "0 1px 2px rgba(20,32,31,.04)" "#dcefec" "#15803d" "#c2410c" "#ffffff" \
 "<div class=\"num\" style=\"font-size: 22px; letter-spacing: -.03em; color: #0f766e;\">RITMO</div>" > Ocean.dc.html
python3 - <<'PY'
import json
c=json.load(open('canvas.json'))
c['artboards']+=[
 {"file":"Forest.dc.html","title":"E · Forest","x":0,"y":1000,"w":390,"h":844},
 {"file":"Plum.dc.html","title":"F · Plum","x":470,"y":1000,"w":390,"h":844},
 {"file":"Ink.dc.html","title":"G · Ink","x":940,"y":1000,"w":390,"h":844},
 {"file":"Ocean.dc.html","title":"H · Ocean","x":1410,"y":1000,"w":390,"h":844}]
c['annotations']+=[
 {"id":"row2","x":0,"y":900,"w":700,"text":"Round 2 — light only. Same layout and type as B; only the palette changes.\nStay clear of orange/red so the accent never collides with HR zones or 'too hard' warnings."},
 {"id":"e-note","x":0,"y":1870,"w":390,"text":"E · Forest\nWarm stone background, deep green accent. Outdoorsy, calm, reads 'trail'. Green also means 'on target' — accent and success share a hue, which can blur."},
 {"id":"f-note","x":470,"y":1870,"w":390,"text":"F · Plum\nCool white, violet accent. Distinctive — no running app uses it — and fully clear of zone colours. Trade-off: least 'athletic'."},
 {"id":"g-note","x":940,"y":1870,"w":390,"text":"G · Ink\nNo accent colour at all: black buttons, grey chrome. Colour appears only in data (zones, verdicts, session types), so it always means something. Most editorial; risks feeling austere."},
 {"id":"h-note","x":1410,"y":1870,"w":390,"text":"H · Ocean\nWarm white, deep teal. Between Forest and Track: sporty but not corporate blue, distinct from the green used for 'on target'. Safest all-rounder."}]
json.dump(c,open('canvas.json','w'),indent=2)
PY
B=/tmp/claude-1000/bundled-skills/2.1.237/719e09e09690256afcff4f7c596a433e/design
node "$B/seed-canvas.mjs" --template "$B/payload.template.html" --out ritmo-directions.html --title "Ritmo Directions" $(for f in Main Track Dusk Signal Forest Plum Ink Ocean; do echo --artboard $f.dc.html; done) --canvas canvas.json && node "$B/seed-canvas.mjs" --check ritmo-directions.html
