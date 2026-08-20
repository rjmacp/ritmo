#!/bin/bash
set -e
tabbar() { active=$1; cat <<EOF
  <div style="position: absolute; left: 0; right: 0; bottom: 0; height: 72px; background: #1a1d26; border-top: 1px solid #2a2d3a; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); padding-bottom: 12px;">
EOF
for t in Home:home Plan:plan Activities:act Trends:trends Records:rec; do n=${t%%:*}; id=${t##*:}; col="#6b7080"; [ "$id" = "$active" ] && col="#FC5200";
case $id in
home) p='<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>';;
plan) p='<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>';;
act) p='<path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/>';;
trends) p='<path d="M3 20h18"/><path d="M5 16l4-6 4 3 6-8"/>';;
rec) p='<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>';;
esac
echo "    <div style=\"display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: $col;\"><svg class=\"ic\" viewBox=\"0 0 24 24\">$p</svg><span style=\"font-size: 10px; font-weight: 500;\">$n</span></div>"; done
echo "  </div>"
}
GEAR='<svg class="ic" viewBox="0 0 24 24" style="color: #6b7080;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'
CHEV='<svg class="ic" viewBox="0 0 24 24" style="width: 16px; height: 16px; color: #6b7080;"><path d="M9 6l6 6-6 6"/></svg>'
header() { cat <<EOF
  <div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 12px;">
    <div class="num" style="font-size: 22px; color: #FC5200; letter-spacing: .5px;">$1</div>
    $2
  </div>
EOF
}
card() { echo "  <div style=\"background: #1a1d26; border: 1px solid #2a2d3a; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 10px;\">"; cat; echo "  </div>"; }
badge() { echo "<span style=\"font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 10px; background: $2; color: #fff;\">$1</span>"; }
start() { cat _head.html; echo "<div style=\"position: relative; width: 390px; height: 844px; overflow: hidden; background: #12141a; display: flex; flex-direction: column;\">"; }
body_open() { echo "  <div style=\"flex: 1; overflow: hidden; padding: 0 16px 84px; display: flex; flex-direction: column; gap: 12px;\">"; }
finish() { echo "  </div>"; tabbar $1; echo "</div>"; cat _tail.html; }
EASY="#6b7a8a"; MED="#3a6fb5"; TEMPO="#FC5200"; LONG="#2d8a5a"; RACE="#c9a227"

# ---------- HOME ----------
{ start; header "Ritmo" "<div style=\"display: flex; align-items: center; gap: 10px;\"><div class=\"mono\" style=\"font-size: 11px; color: #6b7080; background: #222534; border: 1px solid #2a2d3a; border-radius: 6px; padding: 6px 10px;\">HM Build · wk <span style=\"color: #e8eaf0;\">5/8</span></div>$GEAR</div>"; body_open
card <<EOF
    <div style="display: flex; justify-content: space-between; align-items: baseline;"><span class="k">Today · Thu 20 Aug</span>$(badge Easy $EASY)</div>
    <div style="display: flex; align-items: baseline; gap: 8px;"><span class="num" style="font-size: 34px;">8 km</span><span style="color: #6b7080;">easy · zone 2</span></div>
    <div style="display: flex; gap: 16px;">
      <div><div class="num" style="font-size: 18px;">6:05–6:25</div><div class="k">/km</div></div>
      <div><div class="num" style="font-size: 18px; color: #e8a030;">&lt; 145</div><div class="k">bpm ceiling</div></div>
      <div><div class="num" style="font-size: 18px;">50 min</div><div class="k">approx</div></div>
    </div>
    <div style="font-size: 13px; color: #a9adb8; line-height: 1.45;">Day after a tempo. The job today is recovery, not pace — if you see 150 on the watch, walk 30 s.</div>
    <div style="display: flex; gap: 8px;">
      <div style="flex: 1; height: 44px; display: flex; align-items: center; justify-content: center; background: #FC5200; color: #fff; border-radius: 8px; font-weight: 600; font-size: 13px;">Pre-session brief</div>
      <div style="height: 44px; padding: 0 14px; display: flex; align-items: center; background: #222534; border: 1px solid #2a2d3a; border-radius: 8px; font-size: 13px; color: #a9adb8;">Move</div>
    </div>
EOF
card <<EOF
    <div style="display: flex; justify-content: space-between; align-items: center;"><span class="k">Last run · Wed 19 Aug</span><span style="font-size: 11px; font-weight: 600; color: #4db87a;">On target</span></div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 3px; height: 36px; background: $TEMPO; border-radius: 2px;"></div>
      <div style="flex: 1;"><div style="font-weight: 600;">Tempo · Mafra Corrida</div><div style="font-size: 12px; color: #6b7080;">7.4 km · 40:12 · 5:26/km · 158 bpm</div></div>
      <div style="text-align: right;"><div class="num" style="font-size: 18px;">4:30</div><div class="k">best km</div></div>
    </div>
    <div style="font-size: 13px; color: #a9adb8; line-height: 1.45;">Tempo laps 3–5 sat at 4:49–5:07 on 171–174 bpm: exactly the effort asked. New season best over 2 km. Keep tomorrow honestly easy to bank it.</div>
    <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid #2a2d3a; font-size: 13px; color: #FC5200;"><span>Add Garmin stats (TE)</span>$CHEV</div>
EOF
cat <<EOF
  <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px;">
    <div style="background: #1a1d26; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px;"><div class="num" style="font-size: 26px; color: #4db87a;">6</div><div class="k">streak at effort</div></div>
    <div style="background: #1a1d26; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px;"><div class="num" style="font-size: 26px;">24</div><div class="k">days to TT</div></div>
    <div style="background: #1a1d26; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px;"><div class="num" style="font-size: 26px;">+3</div><div class="k">form</div></div>
  </div>
  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #6b7080; padding: 0 2px;"><span>Synced from Strava 19 Aug, 20:14</span><span style="color: #FC5200; font-weight: 500;">Sync now</span></div>
EOF
finish home; } > Main.dc.html

# ---------- PLAN ----------
{ start; header "Plan" "$GEAR"; body_open
card <<EOF
    <div style="display: flex; justify-content: space-between; align-items: baseline;"><div class="num" style="font-size: 20px;">HM Build</div><span class="k">week 5 of 8</span></div>
    <div style="height: 6px; background: #222534; border-radius: 3px; overflow: hidden;"><div style="width: 58%; height: 100%; background: #FC5200; border-radius: 3px;"></div></div>
    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #6b7080;"><span>137 / 210 km</span><span>Benchmark: HM · 13 Sep</span></div>
EOF
cat <<EOF
  <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 2px;"><span style="font-weight: 600;">This week · 17–23 Aug</span><span style="font-size: 12px; color: #6b7080;">38 km planned · 4/6 at effort</span></div>
  <div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px;">
EOF
for d in "M:17:$LONG:done" "T:18:#222534:rest" "W:19:$TEMPO:done" "T:20:$EASY:today" "F:21:#222534:rest" "S:22:$MED:plan" "S:23:$LONG:plan"; do IFS=: read n dt c st <<<"$d"; ring=""; [ $st = today ] && ring="box-shadow: 0 0 0 2px #FC5200;"; op="1"; [ $st = plan ] && op=".45"
echo "    <div style=\"display: flex; flex-direction: column; align-items: center; gap: 6px;\"><span class=\"k\">$n</span><div style=\"width: 34px; height: 34px; border-radius: 50%; background: $c; opacity: $op; $ring display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;\">$dt</div></div>"; done
echo "  </div>"
sess() { cat <<EOF
  <div style="background: #1a1d26; border: 1px solid #2a2d3a; border-left: 3px solid $3; border-radius: 8px; padding: 12px 14px; display: flex; align-items: center; gap: 12px;">
    <div style="flex: 1;"><div style="display: flex; align-items: center; gap: 8px;"><span class="mono" style="font-size: 11px; color: #6b7080;">$1</span><span style="font-weight: 600;">$2</span></div><div style="font-size: 12px; color: #6b7080; margin-top: 2px;">$4</div></div>
    <div style="text-align: right;"><div class="num" style="font-size: 18px;">$5</div><div style="font-size: 10px; font-weight: 600; color: $7;">$6</div></div>
  </div>
EOF
}
sess "Mon 17" "Long" $LONG "16 km · Z2 · actual 16.1 km, 5:31/km" "16.1" "On target" "#4db87a"
sess "Wed 19" "Tempo" $TEMPO "3×1.6 km @ 4:50 · actual 7.4 km" "7.4" "On target" "#4db87a"
sess "Thu 20" "Easy" $EASY "8 km · Z2 · under 145 bpm" "8" "Today" "#FC5200"
sess "Sat 22" "Medium" $MED "10 km · Z3 · 5:35–5:45/km" "10" "Planned" "#6b7080"
card <<EOF
    <div class="k">Next week</div>
    <div style="height: 44px; border: 1px solid #2a2d3a; border-radius: 8px; background: #12141a; padding: 12px; font-size: 13px; color: #6b7080;">How are you feeling? e.g. calf tight, away on Friday…</div>
    <div style="height: 44px; display: flex; align-items: center; justify-content: center; background: #FC5200; color: #fff; border-radius: 8px; font-weight: 600; font-size: 13px;">Plan week 6</div>
EOF
finish plan; } > Plan.dc.html

# ---------- ACTIVITIES ----------
{ start; header "Activities" "<div style=\"display: flex; align-items: center; gap: 10px;\"><div style=\"font-size: 12px; color: #FC5200; font-weight: 500;\">Upload</div>$GEAR</div>"; body_open
echo '  <div style="display: flex; gap: 6px; flex-wrap: wrap;">'
for f in All:on Easy Medium Tempo Long Race; do n=${f%%:*}; if [ "${f##*:}" = on ]; then bg="#FC5200"; bc="#FC5200"; col="#fff"; else bg="#222534"; bc="#2a2d3a"; col="#6b7080"; fi
echo "    <span style=\"background: $bg; border: 1px solid $bc; color: $col; font-size: 12px; font-weight: 500; padding: 6px 12px; border-radius: 20px;\">$n</span>"; done
echo '  </div>'
echo '  <div class="k" style="padding: 4px 2px 0;">August · 112 km</div>'
run() { cat <<EOF
  <div style="background: #1a1d26; border: 1px solid #2a2d3a; border-left: 3px solid $3; border-radius: 8px; padding: 12px 14px; display: flex; align-items: center; gap: 12px;">
    <div style="flex: 1; min-width: 0;"><div class="mono" style="font-size: 11px; color: #6b7080;">$1</div><div style="display: flex; align-items: center; gap: 6px; font-weight: 600; margin-top: 2px;">$2 $(badge "$4" $3) $8</div></div>
    <div style="display: flex; gap: 14px;">
      <div style="text-align: right;"><div class="num" style="font-size: 18px;">$5</div><div class="k">km</div></div>
      <div style="text-align: right;"><div class="num" style="font-size: 18px;">$6</div><div class="k">/km</div></div>
      <div style="text-align: right;"><div class="num" style="font-size: 18px;">$7</div><div class="k">bpm</div></div>
    </div>
  </div>
EOF
}
run "19 Aug · 18:02" "Mafra Corrida" $TEMPO Tempo 7.4 5:26 158 "<span style=\"font-size: 10px; color: #c9a227; font-weight: 600;\">PB 2 km</span>"
run "17 Aug · 09:12" "Mafra Corrida" $LONG Long 16.1 5:31 153 ""
run "14 Aug · 18:40" "Mafra Corrida" $EASY Easy 6.5 6:08 144 ""
run "12 Aug · 18:21" "Ferreira do Zêzere" $MED Medium 9.0 5:43 157 ""
run "10 Aug · 09:05" "Mafra Corrida" $LONG Long 14.1 5:38 152 ""
run "07 Aug · 18:55" "Mafra Corrida" $EASY Easy 6.6 6:12 141 ""
run "05 Aug · 18:31" "Mafra Corrida" $TEMPO Tempo 7.2 5:30 159 ""
echo '  <div class="k" style="padding: 4px 2px 0;">July · 98 km</div>'
run "29 Jul · 09:20" "Mafra Corrida" $EASY Easy 6.5 6:02 142 ""
finish act; } > Activities.dc.html

# ---------- ACTIVITY DETAIL ----------
{ start; cat <<EOF
  <div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 12px;">
    <div style="display: flex; align-items: center; gap: 8px; color: #6b7080;"><svg class="ic" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg><span style="font-size: 13px;">Activities</span></div>
    <div style="font-size: 12px; color: #FC5200; font-weight: 500;">Edit</div>
  </div>
EOF
body_open
cat <<EOF
  <div style="display: flex; flex-direction: column; gap: 4px;">
    <div style="display: flex; align-items: center; gap: 8px;"><span class="mono" style="font-size: 11px; color: #6b7080;">Wed 19 Aug · 18:02</span>$(badge Tempo $TEMPO)<span style="font-size: 10px; color: #c9a227; font-weight: 600;">PB 2 km</span></div>
    <div class="num" style="font-size: 26px;">Mafra Corrida</div>
  </div>
  <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px;">
EOF
for s in "7.41:km" "40:12:time" "5:26:/km" "158:avg bpm" "183:max bpm" "172:spm" "71:m climb" "3.7:TE aer" "84:load"; do v=${s%:*}; k=${s##*:}; echo "    <div style=\"background: #1a1d26; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px;\"><div class=\"num\" style=\"font-size: 22px;\">$v</div><div class=\"k\">$k</div></div>"; done
echo '  </div>'
card <<EOF
    <div style="display: flex; justify-content: space-between;"><span class="k">Time in zone</span><span class="k">40 min</span></div>
    <div style="display: flex; height: 10px; border-radius: 5px; overflow: hidden; gap: 2px;">
      <div style="width: 8%; background: #4a5160;"></div><div style="width: 30%; background: #3a6fb5;"></div><div style="width: 22%; background: #4db87a;"></div><div style="width: 32%; background: #e8a030;"></div><div style="width: 8%; background: #FC5200;"></div>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #6b7080;"><span>Z1 3m</span><span>Z2 12m</span><span>Z3 9m</span><span>Z4 13m</span><span>Z5 3m</span></div>
EOF
card <<EOF
    <div style="display: flex; justify-content: space-between; align-items: center;"><span class="k">Planned · 3×1.6 km @ 4:50</span><span style="font-size: 11px; font-weight: 600; color: #4db87a;">On target</span></div>
    <div style="font-size: 13px; color: #a9adb8; line-height: 1.45;">Reps at 4:49, 5:01, 5:07 — first one a touch quick, last one faded 4 %. HR 171–174 is right in Z4. Effort was the plan; keep Thursday easy.</div>
EOF
card <<EOF
    <div class="k">Laps</div>
    <div style="display: grid; grid-template-columns: 28px 1fr 56px 56px 48px; gap: 6px; font-size: 11px; color: #6b7080;"><span>#</span><span></span><span style="text-align: right;">pace</span><span style="text-align: right;">bpm</span><span style="text-align: right;">elev</span></div>
EOF
for l in "1:5:47:126:+23:#6b7080" "2:5:31:150:+15:#6b7080" "3:4:49:171:+1:#4db87a" "4:5:01:174:-6:#4db87a" "5:5:07:173:-4:#4db87a" "6:6:09:163:-18:#6b7080" "7:4:30:169:-13:#c9a227"; do IFS=: read n m s hr e c <<<"$l"; w=$(( (400 - 10#$m*60 - 10#$s) * 100 / 140 )); cat <<EOF
    <div style="display: grid; grid-template-columns: 28px 1fr 56px 56px 48px; gap: 6px; align-items: center;"><span class="mono" style="font-size: 11px; color: #6b7080;">$n</span><div style="height: 4px; background: #222534; border-radius: 2px;"><div style="width: ${w}%; height: 100%; background: #FC5200; opacity: .5; border-radius: 2px;"></div></div><span class="mono" style="font-size: 12px; text-align: right; color: $c;">$m:$s</span><span class="mono" style="font-size: 12px; text-align: right;">$hr</span><span class="mono" style="font-size: 11px; text-align: right; color: #6b7080;">$e</span></div>
EOF
done
echo "  </div>"
finish act; } > ActivityDetail.dc.html

# ---------- TRENDS ----------
{ start; header "Trends" "$GEAR"; body_open
echo '  <div style="display: flex; gap: 6px;">'
for f in 4w 8w:on 12w Block Season; do n=${f%%:*}; if [ "${f##*:}" = on ]; then bg="#FC5200"; bc="#FC5200"; col="#fff"; else bg="#222534"; bc="#2a2d3a"; col="#6b7080"; fi
echo "    <span style=\"background: $bg; border: 1px solid $bc; color: $col; font-size: 12px; font-weight: 500; padding: 6px 12px; border-radius: 20px;\">$n</span>"; done
echo '  </div>'
card <<EOF
    <div style="display: flex; justify-content: space-between; align-items: baseline;"><span class="num" style="font-size: 16px; font-weight: 600;">Fitness · Fatigue · Form</span><span class="k">today 41 · 38 · +3</span></div>
    <svg viewBox="0 0 330 120" style="width: 100%; height: 120px; display: block;">
      <line x1="0" y1="100" x2="330" y2="100" stroke="#2a2d3a"/><line x1="0" y1="60" x2="330" y2="60" stroke="#2a2d3a"/><line x1="0" y1="20" x2="330" y2="20" stroke="#2a2d3a"/>
      <path d="M0 92 C40 88 70 84 110 78 S190 62 240 52 S300 40 330 36" fill="none" stroke="#3a6fb5" stroke-width="2"/>
      <path d="M0 96 L30 80 L55 90 L85 66 L115 76 L150 58 L180 70 L215 50 L245 62 L280 44 L310 56 L330 42" fill="none" stroke="#FC5200" stroke-width="2"/>
      <path d="M0 60 L30 72 L55 58 L85 76 L115 66 L150 80 L180 70 L215 82 L245 70 L280 82 L310 70 L330 58" fill="none" stroke="#4db87a" stroke-width="2" stroke-dasharray="4 3"/>
      <line x1="300" y1="10" x2="300" y2="105" stroke="#c9a227" stroke-dasharray="2 3"/>
      <text x="296" y="116" fill="#c9a227" font-size="9" font-family="Inter" text-anchor="end">TT 13 Sep</text>
      <text x="0" y="116" fill="#6b7080" font-size="9" font-family="Inter">Jun</text><text x="110" y="116" fill="#6b7080" font-size="9" font-family="Inter">Jul</text><text x="220" y="116" fill="#6b7080" font-size="9" font-family="Inter">Aug</text>
    </svg>
    <div style="display: flex; gap: 14px; font-size: 11px; color: #6b7080;"><span style="display: flex; align-items: center; gap: 5px;"><i style="width: 8px; height: 8px; border-radius: 50%; background: #3a6fb5;"></i>Fitness</span><span style="display: flex; align-items: center; gap: 5px;"><i style="width: 8px; height: 8px; border-radius: 50%; background: #FC5200;"></i>Fatigue</span><span style="display: flex; align-items: center; gap: 5px;"><i style="width: 8px; height: 8px; border-radius: 50%; background: #4db87a;"></i>Form</span></div>
EOF
card <<EOF
    <div style="display: flex; justify-content: space-between; align-items: baseline;"><span class="num" style="font-size: 16px; font-weight: 600;">Weekly volume &amp; zones</span><span class="k">km</span></div>
    <div style="display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 8px; align-items: end; height: 110px;">
EOF
for w in 22:70:25:5 26:68:26:6 29:66:26:8 31:64:28:8 34:62:28:10 36:60:30:10 37:58:30:12 38:62:26:12; do IFS=: read km z2 z3 z4 <<<"$w"; h=$((km*100/40)); echo "      <div style=\"height: ${h}%; display: flex; flex-direction: column; border-radius: 3px; overflow: hidden;\"><div style=\"flex: $z4; background: #e8a030;\"></div><div style=\"flex: $z3; background: #4db87a;\"></div><div style=\"flex: $z2; background: #3a6fb5;\"></div></div>"; done
cat <<EOF
    </div>
    <div style="display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 8px; font-size: 10px; color: #6b7080; text-align: center;"><span>22</span><span>26</span><span>29</span><span>31</span><span>34</span><span>36</span><span>37</span><span style="color: #e8eaf0;">38</span></div>
EOF
card <<EOF
    <div style="display: flex; justify-content: space-between; align-items: baseline;"><span class="num" style="font-size: 16px; font-weight: 600;">Aerobic efficiency</span><span class="k">easy runs · +6 % vs Jun</span></div>
    <svg viewBox="0 0 330 70" style="width: 100%; height: 70px; display: block;">
      <line x1="0" y1="60" x2="330" y2="60" stroke="#2a2d3a"/>
      <path d="M0 50 L40 54 L80 44 L120 46 L160 38 L200 40 L240 30 L280 28 L330 22" fill="none" stroke="#FC5200" stroke-width="2"/>
      <circle cx="330" cy="22" r="3" fill="#FC5200"/>
    </svg>
EOF
finish trends; } > Trends.dc.html

# ---------- RECORDS ----------
{ start; header "Records" "$GEAR"; body_open
echo '  <div style="display: flex; gap: 6px;">'
for f in "Best times:on" Benchmarks Predictions; do n=${f%%:*}; if [ "${f##*:}" = on ]; then bg="#FC5200"; bc="#FC5200"; col="#fff"; else bg="#222534"; bc="#2a2d3a"; col="#6b7080"; fi
echo "    <span style=\"background: $bg; border: 1px solid $bc; color: $col; font-size: 12px; font-weight: 500; padding: 6px 12px; border-radius: 20px;\">$n</span>"; done
echo '  </div>'
rec() { # label alltime date rows...
cat <<EOF
  <div style="background: #1a1d26; border: 1px solid #2a2d3a; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 10px;">
    <div style="display: flex; justify-content: space-between; align-items: baseline;"><span class="num" style="font-size: 20px;">$1</span><span class="k">all-time $2 · $3</span></div>
    <div style="display: flex; align-items: flex-end; gap: 14px;">
      <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
EOF
shift 3
for r in "$@"; do IFS=: read yr t d pct st <<<"$r"; col="#e8eaf0"; dc="#6b7080"; [ "$d" != "—" ] && [ "${d:0:1}" = "-" ] && dc="#4db87a"; [ "$st" = best ] && col="#c9a227"
cat <<EOF
        <div style="display: flex; align-items: center; gap: 10px;"><span class="mono" style="font-size: 11px; color: #6b7080; width: 32px;">$yr</span><div style="flex: 1; height: 6px; background: #222534; border-radius: 3px;"><div style="width: ${pct}%; height: 100%; background: $col; border-radius: 3px; opacity: .8;"></div></div><span class="mono" style="font-size: 13px; color: $col; width: 48px; text-align: right;">$t</span><span class="mono" style="font-size: 11px; color: $dc; width: 40px; text-align: right;">$d</span></div>
EOF
done
echo "      </div>$CHEV</div></div>"
}
rec "5 km" "23:34" "19 Aug 2026" "2024:26:12:—:100:" "2025:24:51:-1:21:94:" "2026:23:34:-1:17:88:best"
rec "10 km" "53:50*" "17 Aug 2026" "2024:58:40:—:100:" "2025:55:02:-3:38:93:" "2026:53:50*:-1:12:90:best"
rec "Half" "1:58:12" "14 Sep 2025" "2025:1:58:12:—:100:best" "2026:—:—:0:"
rec "1 km" "4:21" "26 Jul 2026" "2025:4:33:—:100:" "2026:4:21:-0:12:95:best"
echo '  <div style="font-size: 11px; color: #6b7080; padding: 0 2px;">* estimated from lap splits · season starts 1 Jan</div>'
finish rec; } > Records.dc.html

# ---------- SETTINGS ----------
{ start; header "Settings" ""; body_open
row() { echo "    <div style=\"display: flex; align-items: center; justify-content: space-between; min-height: 44px;\"><span style=\"font-size: 14px;\">$1</span><div style=\"display: flex; align-items: center; gap: 8px; color: #6b7080; font-size: 13px;\"><span class=\"$3\">$2</span>$CHEV</div></div>"; }
sec() { echo "  <div class=\"k\" style=\"padding: 6px 2px 0;\">$1</div>"; }
sec "Data"; card <<EOF
    <div style="display: flex; align-items: center; justify-content: space-between; min-height: 44px;"><div style="display: flex; align-items: center; gap: 10px;"><div style="width: 28px; height: 28px; border-radius: 6px; background: #FC5200; display: flex; align-items: center; justify-content: center;"><svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: #fff;"><path d="M10 2L4 14h4l2-4 2 4h4z"/><path d="M14 12l-2 4-2-4H7l5 9 5-9z" opacity=".6"/></svg></div><div><div>Strava</div><div style="font-size: 11px; color: #4db87a;">Connected · rjmac</div></div></div><span style="font-size: 12px; color: #6b7080;">Disconnect</span></div>
$(row "Sync log" "last ok · 19 Aug 20:14" mono)
$(row "Upload FIT / GPX" "" "")
EOF
sec "Athlete"; card <<EOF
$(row "Max heart rate" "196 bpm" mono)
$(row "Resting heart rate" "48 bpm" mono)
$(row "HR zones" "118 · 137 · 157 · 176" mono)
$(row "Season starts" "1 Jan" "")
$(row "Units" "km" "")
EOF
sec "Coach"; card <<EOF
$(row "Runs per week" "4" mono)
$(row "Long run day" "Sunday" "")
$(row "Block length" "8 weeks" "")
$(row "Debrief after every run" "On" "")
$(row "Block planning model" "Opus" "")
EOF
echo '  <div style="display: flex; justify-content: center; font-size: 11px; color: #6b7080; padding-top: 4px;">Powered by Strava</div>'
finish home; } > Settings.dc.html

cat > canvas.json <<EOF
{
  "artboards": [
    { "file": "Main.dc.html", "title": "Home", "x": 0, "y": 0, "w": 390, "h": 844 },
    { "file": "Plan.dc.html", "x": 470, "y": 0, "w": 390, "h": 844 },
    { "file": "Activities.dc.html", "x": 940, "y": 0, "w": 390, "h": 844 },
    { "file": "ActivityDetail.dc.html", "title": "Activity detail", "x": 1410, "y": 0, "w": 390, "h": 844 },
    { "file": "Trends.dc.html", "x": 0, "y": 940, "w": 390, "h": 844 },
    { "file": "Records.dc.html", "x": 470, "y": 940, "w": 390, "h": 844 },
    { "file": "Settings.dc.html", "x": 940, "y": 940, "w": 390, "h": 844 }
  ],
  "annotations": [
    { "id": "flow-note", "x": 1410, "y": 960, "w": 360, "text": "Ritmo v1 screens, 390×844.\nTop row: the daily loop — Home → Plan → Activities → detail.\nBottom row: review screens. Tab bar is shared; Settings opens from the gear.\nCopy is illustrative but uses real runs from the MVP (19 Aug tempo, 17 Aug long)." }
  ],
  "launch": { "view": "canvas" }
}
EOF
echo built; ls
