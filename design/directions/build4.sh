#!/bin/bash
set -e
sed -n '/^warm()/,/^}/p' build3.sh > _warm.sh; source ./_warm.sh
# L · Slate — stone base, navy→teal hero, heavy Manrope
warm Slate "#f2f1ed" "#ffffff" "#1c2026" "#737a84" "#1f3b5c" "#2d7d78" "#ffffff" "#ffffff" "rgba(255,255,255,.25)" "#2d7d78" "#c98a2e" "#3d5a80" "#1f3b5c" "'Manrope', system-ui, sans-serif" "family=Manrope:wght@500;700;800" "0 6px 22px rgba(28,32,38,.08)" "Thursday" > Slate.dc.html
# M · Moss — warm grey base, deep forest→moss hero, ochre numbers
warm Moss "#f1efea" "#fbfaf7" "#1e221d" "#767c72" "#1f4a3a" "#4f7f5f" "#ffffff" "#ffffff" "rgba(255,255,255,.25)" "#2f7a55" "#b7862b" "#4a6670" "#1f4a3a" "'Sora', system-ui, sans-serif" "family=Sora:wght@500;700;800" "0 6px 22px rgba(30,34,29,.08)" "Thursday" > Moss.dc.html
# N · Graphite — cool off-white, charcoal→graphite hero, amber accent
warm Graphite "#f3f3f1" "#ffffff" "#17191c" "#6f747b" "#23272e" "#4b535e" "#ffffff" "#e0a830" "rgba(255,255,255,.18)" "#2f9d6b" "#e0a830" "#5b7ba8" "#17191c" "'Manrope', system-ui, sans-serif" "family=Manrope:wght@500;700;800" "0 6px 22px rgba(23,25,28,.09)" "Thursday" > Graphite.dc.html
# heavier numerals for this round
sed -i 's/\.num { font-weight: 700;/.num { font-weight: 800;/' Slate.dc.html Moss.dc.html Graphite.dc.html
python3 - <<'PY'
import json
c=json.load(open('canvas.json'))
c['artboards']+=[
 {"file":"Slate.dc.html","title":"L · Slate","x":0,"y":3000,"w":390,"h":844},
 {"file":"Moss.dc.html","title":"M · Moss","x":470,"y":3000,"w":390,"h":844},
 {"file":"Graphite.dc.html","title":"N · Graphite","x":940,"y":3000,"w":390,"h":844}]
c['annotations']+=[
 {"id":"row4","x":0,"y":2900,"w":760,"text":"Round 4 — same layout as round 3, more masculine: deeper cooler hero gradients, heavier numerals (800 weight), stone/grey bases, greeting replaced by the day."},
 {"id":"l-note","x":0,"y":3870,"w":390,"text":"L · Slate\nStone base, navy→teal hero, Manrope 800. Nautical, solid; teal and amber numbers. The balanced one."},
 {"id":"m-note","x":470,"y":3870,"w":390,"text":"M · Moss\nWarm grey base, forest→moss hero, Sora 800. Outdoors, trail, Mafra hills. Ochre numbers keep it warm."},
 {"id":"n-note","x":940,"y":3870,"w":390,"text":"N · Graphite\nNear-monochrome: charcoal hero with one amber ring. The most serious; colour only where it earns it. Risk: a touch austere."}]
c['launch']={"view":"canvas"}
json.dump(c,open('canvas.json','w'),indent=2)
PY
B=/tmp/claude-1000/bundled-skills/2.1.237/719e09e09690256afcff4f7c596a433e/design
node "$B/seed-canvas.mjs" --template "$B/payload.template.html" --out ritmo-directions.html --title "Ritmo Directions" $(for f in Main Track Dusk Signal Forest Plum Ink Ocean Glow Clay Bloom Slate Moss Graphite; do echo --artboard $f.dc.html; done) --canvas canvas.json && node "$B/seed-canvas.mjs" --check ritmo-directions.html
