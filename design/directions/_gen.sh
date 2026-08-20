gen() {
NAME=$1 TITLE=$2 BG=$3 SURF=$4 BOR=$5 TXT=$6 MUT=$7 ACC=$8 ACCT=$9 DISP=${10} BODY=${11} MONO=${12} GF=${13} RAD=${14} SHADOW=${15} EASY=${16} GOOD=${17} WARN=${18} TABBG=${19} HDR=${20}
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
    body { margin: 0; background: $BG; color: $TXT; font-family: $BODY; font-size: 14px; }
    a { color: $ACC; } a:hover { opacity: .8; }
    .num { font-family: $DISP; font-weight: 700; line-height: 1; letter-spacing: -.01em; }
    .mono { font-family: $MONO; }
    .k { font-size: 11px; color: $MUT; text-transform: uppercase; letter-spacing: .6px; font-weight: 500; }
    .card { background: $SURF; border: 1px solid $BOR; border-radius: $RAD; padding: 16px; display: flex; flex-direction: column; gap: 10px; box-shadow: $SHADOW; }
    svg.ic { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  </style>
</helmet>
<div style="position: relative; width: 390px; height: 844px; overflow: hidden; background: $BG; display: flex; flex-direction: column;">
  <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 12px;">
    $HDR
    <div style="display: flex; align-items: center; gap: 10px;"><div class="mono" style="font-size: 11px; color: $MUT; background: $SURF; border: 1px solid $BOR; border-radius: 999px; padding: 6px 12px;">HM Build · wk <span style="color: $TXT; font-weight: 600;">5/8</span></div></div>
  </div>
  <div style="flex: 1; overflow: hidden; padding: 0 16px 84px; display: flex; flex-direction: column; gap: 12px;">
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: baseline;"><span class="k">Today · Thu 20 Aug</span><span style="font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 999px; background: $EASY; color: $TXT;">Easy</span></div>
    <div style="display: flex; align-items: baseline; gap: 8px;"><span class="num" style="font-size: 40px;">8 km</span><span style="color: $MUT;">easy · zone 2</span></div>
    <div style="display: flex; gap: 18px;">
      <div><div class="num" style="font-size: 20px;">6:05–6:25</div><div class="k">/km</div></div>
      <div><div class="num" style="font-size: 20px; color: $WARN;">&lt; 145</div><div class="k">bpm ceiling</div></div>
      <div><div class="num" style="font-size: 20px;">50 min</div><div class="k">approx</div></div>
    </div>
    <div style="font-size: 13px; color: $MUT; line-height: 1.5;">Day after a tempo. The job today is recovery, not pace — if you see 150 on the watch, walk 30 s.</div>
    <div style="display: flex; gap: 8px;">
      <div style="flex: 1; height: 44px; display: flex; align-items: center; justify-content: center; background: $ACC; color: $ACCT; border-radius: $RAD; font-weight: 600; font-size: 13px;">Pre-session brief</div>
      <div style="height: 44px; padding: 0 16px; display: flex; align-items: center; border: 1px solid $BOR; border-radius: $RAD; font-size: 13px; color: $MUT;">Move</div>
    </div>
  </div>
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center;"><span class="k">Last run · Wed 19 Aug</span><span style="font-size: 11px; font-weight: 600; color: $GOOD;">On target</span></div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="flex: 1;"><div style="font-weight: 600;">Tempo · Mafra Corrida</div><div style="font-size: 12px; color: $MUT; margin-top: 2px;">7.4 km · 40:12 · 5:26/km · 158 bpm</div></div>
      <div style="text-align: right;"><div class="num" style="font-size: 20px;">4:30</div><div class="k">best km</div></div>
    </div>
    <div style="font-size: 13px; color: $MUT; line-height: 1.5;">Tempo laps 3–5 sat at 4:49–5:07 on 171–174 bpm: exactly the effort asked. New season best over 2 km. Keep tomorrow honestly easy to bank it.</div>
    <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid $BOR; font-size: 13px; color: $ACC; font-weight: 500;"><span>Add Garmin stats</span><svg class="ic" viewBox="0 0 24 24" style="width: 16px; height: 16px;"><path d="M9 6l6 6-6 6"/></svg></div>
  </div>
  <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px;">
    <div class="card" style="padding: 14px; gap: 4px;"><div class="num" style="font-size: 28px; color: $GOOD;">6</div><div class="k">streak at effort</div></div>
    <div class="card" style="padding: 14px; gap: 4px;"><div class="num" style="font-size: 28px;">24</div><div class="k">days to TT</div></div>
    <div class="card" style="padding: 14px; gap: 4px;"><div class="num" style="font-size: 28px;">+3</div><div class="k">form</div></div>
  </div>
  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: $MUT; padding: 0 2px;"><span>Synced from Strava 19 Aug, 20:14</span><span style="color: $ACC; font-weight: 600;">Sync now</span></div>
  </div>
  <div style="position: absolute; left: 0; right: 0; bottom: 0; height: 72px; background: $TABBG; border-top: 1px solid $BOR; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); padding-bottom: 12px;">
EOF
for t in Home:home Plan:plan Activities:act Trends:trends Records:rec; do n=${t%%:*}; id=${t##*:}; col="$MUT"; [ "$id" = home ] && col="$ACC";
case $id in
home) p='<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>';;
plan) p='<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>';;
act) p='<path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/>';;
trends) p='<path d="M3 20h18"/><path d="M5 16l4-6 4 3 6-8"/>';;
rec) p='<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>';;
esac
echo "    <div style=\"display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: $col;\"><svg class=\"ic\" viewBox=\"0 0 24 24\">$p</svg><span style=\"font-size: 10px; font-weight: 600;\">$n</span></div>"; done
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
