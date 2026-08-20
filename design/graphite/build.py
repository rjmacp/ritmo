import json
BG="#f3f3f1"; TILE="#ffffff"; TXT="#17191c"; MUT="#6f747b"; GA="#23272e"; GB="#4b535e"
AMB="#e0a830"; GRN="#2f9d6b"; STL="#5b7ba8"; RED="#d9534f"; ACC="#17191c"
SH="0 6px 22px rgba(23,25,28,.09)"
TYPE={"easy":"#8a929c","medium":STL,"tempo":AMB,"long":GRN,"race":TXT}
ZONE=["#c9ced6",STL,GRN,AMB,RED]
ICONS={"home":'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
"plan":'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
"act":'<path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/>',
"trends":'<path d="M3 20h18"/><path d="M5 16l4-6 4 3 6-8"/>',
"rec":'<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>'}
CHEV='<svg class="ic" viewBox="0 0 24 24" style="width: 16px; height: 16px;"><path d="M9 6l6 6-6 6"/></svg>'
BACK='<svg class="ic" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>'
USER='<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>'

def head():
    return f'''<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&display=swap">
  <style>
    body {{ margin: 0; background: {BG}; color: {TXT}; font-family: 'Manrope', system-ui, sans-serif; font-size: 14px; }}
    a {{ color: {ACC}; }} a:hover {{ opacity: .8; }}
    .num {{ font-weight: 800; line-height: 1; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }}
    .k {{ font-size: 12px; color: {MUT}; font-weight: 500; }}
    .tile {{ background: {TILE}; border-radius: 22px; padding: 18px; display: flex; flex-direction: column; gap: 8px; box-shadow: {SH}; }}
    .pill {{ font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }}
    svg.ic {{ width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }}
  </style>
</helmet>
<div style="position: relative; width: 390px; height: 844px; overflow: hidden; background: {BG}; display: flex; flex-direction: column;">
'''
def tail(active):
    tabs=""
    for n,i in [("Home","home"),("Plan","plan"),("Runs","act"),("Trends","trends"),("Records","rec")]:
        col = ACC if i==active else MUT
        tabs+=f'    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; color: {col};"><svg class="ic" viewBox="0 0 24 24">{ICONS[i]}</svg><span style="font-size: 10px; font-weight: 700;">{n}</span></div>\n'
    return f'''  <div style="position: absolute; left: 16px; right: 16px; bottom: 18px; height: 64px; background: {TILE}; border-radius: 999px; box-shadow: {SH}; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); align-items: center;">
{tabs}  </div>
</div>
</x-dc>
<script data-dc-script data-props='{{}}'>
class Component extends DCLogic {{ renderVals() {{ return {{}}; }} }}
</script>
</body>
</html>
'''
def header(kicker,title,right=None):
    right = right if right is not None else f'<div style="width: 40px; height: 40px; border-radius: 50%; background: {TILE}; box-shadow: {SH}; display: flex; align-items: center; justify-content: center; color: {MUT};">{USER}</div>'
    return f'''  <div style="display: flex; align-items: flex-end; justify-content: space-between; padding: 24px 22px 14px;">
    <div style="display: flex; flex-direction: column; gap: 2px;"><span class="k">{kicker}</span><span class="num" style="font-size: 28px;">{title}</span></div>
    {right}
  </div>
  <div style="flex: 1; overflow: hidden; padding: 0 16px 90px; display: flex; flex-direction: column; gap: 12px;">
'''
END_BODY="  </div>\n"
def chips(items, active):
    s='  <div style="display: flex; gap: 8px; overflow: hidden;">\n'
    for it in items:
        if it==active: s+=f'    <span style="background: {ACC}; color: #fff; font-size: 12px; font-weight: 700; padding: 8px 14px; border-radius: 999px; white-space: nowrap;">{it}</span>\n'
        else: s+=f'    <span style="background: {TILE}; color: {MUT}; font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 999px; white-space: nowrap; box-shadow: {SH};">{it}</span>\n'
    return s+'  </div>\n'
def pill(text,bg,fg="#fff"): return f'<span class="pill" style="background: {bg}; color: {fg};">{text}</span>'
def stat(v,k,col=TXT,size=30): return f'<div class="tile" style="padding: 14px; gap: 6px;"><span class="num" style="font-size: {size}px; color: {col};">{v}</span><span class="k">{k}</span></div>'

# ---------------- HOME ----------------
home = head()+header("Thursday 20 August","Today")+f'''  <div style="border-radius: 26px; padding: 20px; background: linear-gradient(135deg, {GA} 0%, {GB} 100%); color: #fff; display: flex; flex-direction: column; gap: 14px; box-shadow: {SH};">
    <div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 12px; font-weight: 700; opacity: .85;">EASY RUN</span><span class="pill" style="background: rgba(255,255,255,.18);">HM Build · wk 5 of 8</span></div>
    <div style="display: flex; align-items: center; gap: 18px;">
      <div style="position: relative; width: 96px; height: 96px; flex-shrink: 0;">
        <svg viewBox="0 0 96 96" style="width: 96px; height: 96px; transform: rotate(-90deg);"><circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="10"/><circle cx="48" cy="48" r="40" fill="none" stroke="{AMB}" stroke-width="10" stroke-linecap="round" stroke-dasharray="163 251"/></svg>
        <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;"><span class="num" style="font-size: 26px;">+3</span><span style="font-size: 10px; font-weight: 700; opacity: .8;">FORM</span></div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <span class="num" style="font-size: 44px;">8 km</span>
        <span style="font-size: 14px; opacity: .9;">6:05–6:25 /km · under <strong>145 bpm</strong></span>
        <span style="font-size: 13px; opacity: .75; line-height: 1.4;">Recovery, not pace. See 150? Walk 30 s.</span>
      </div>
    </div>
    <div style="height: 46px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.94); color: {TXT}; border-radius: 16px; font-weight: 800; font-size: 14px;">Pre-session brief</div>
  </div>
  <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px;">
    {stat("6","streak at effort",GRN)}
    {stat("24","days to HM",AMB)}
    {stat("15","of 47 km this wk",STL)}
  </div>
  <div class="tile">
    <div style="display: flex; justify-content: space-between; align-items: center;"><span class="k">Yesterday · Tempo</span>{pill("On target",BG,GRN)}</div>
    <div style="display: flex; align-items: baseline; gap: 14px;">
      <span class="num" style="font-size: 30px;">7.4<span style="font-size: 14px; font-weight: 500; color: {MUT};"> km</span></span>
      <span class="num" style="font-size: 30px;">5:26<span style="font-size: 14px; font-weight: 500; color: {MUT};"> /km</span></span>
      <span class="num" style="font-size: 30px;">158<span style="font-size: 14px; font-weight: 500; color: {MUT};"> bpm</span></span>
    </div>
    <div style="font-size: 13px; color: {MUT}; line-height: 1.5;">Tempo kilometres at 4:49–5:07 on 171–174 bpm — exactly the effort asked, and you held back on the cool-down. Keep today honestly easy to bank it.</div>
    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 700; padding-top: 4px;"><span>Add Garmin stats</span>{CHEV}</div>
  </div>
  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: {MUT}; padding: 0 6px;"><span>Synced from Strava 19 Aug, 20:14</span><span style="color: {TXT}; font-weight: 700;">Sync now</span></div>
'''+END_BODY+tail("home")

# ---------------- PLAN ----------------
def day(n,d,c,state):
    op = ".35" if state=="plan" else "1"
    ring = f" box-shadow: 0 0 0 3px {BG}, 0 0 0 5px {TXT};" if state=="today" else ""
    fg = "#fff" if state!="rest" else MUT
    return f'    <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;"><span class="k">{n}</span><div style="width: 38px; height: 38px; border-radius: 50%; background: {c}; opacity: {op};{ring} display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: {fg};">{d}</div></div>\n'
def sess(date,name,t,desc,v,verdict,vc):
    return f'''  <div class="tile" style="flex-direction: row; align-items: center; gap: 14px; padding: 14px 16px;">
    <div style="width: 6px; height: 40px; border-radius: 3px; background: {TYPE[t]}; flex-shrink: 0;"></div>
    <div style="flex: 1; min-width: 0;"><div style="display: flex; align-items: center; gap: 8px;"><span class="k">{date}</span><span style="font-weight: 800;">{name}</span></div><div style="font-size: 12px; color: {MUT}; margin-top: 2px;">{desc}</div></div>
    <div style="text-align: right;"><div class="num" style="font-size: 22px;">{v}</div><div style="font-size: 10px; font-weight: 700; color: {vc};">{verdict}</div></div>
  </div>
'''
plan = head()+header("HM Build · week 5 of 8","Plan")+f'''  <div class="tile" style="gap: 10px;">
    <div style="display: flex; justify-content: space-between; align-items: baseline;"><span class="num" style="font-size: 22px;">137 <span style="font-size: 13px; font-weight: 500; color: {MUT};">/ 210 km</span></span><span class="k">Benchmark · HM · 13 Sep</span></div>
    <div style="height: 8px; background: {BG}; border-radius: 4px; overflow: hidden;"><div style="width: 65%; height: 100%; background: linear-gradient(90deg, {GA}, {GB}); border-radius: 4px;"></div></div>
  </div>
  <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 6px;"><span style="font-weight: 800;">This week · 17–23 Aug</span><span class="k">47 km · 2 of 2 at effort</span></div>
  <div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px;">
{day("M",17,TYPE["easy"],"done")}{day("T",18,TILE,"rest")}{day("W",19,TYPE["tempo"],"done")}{day("T",20,TYPE["easy"],"today")}{day("F",21,TILE,"rest")}{day("S",22,TYPE["medium"],"plan")}{day("S",23,TYPE["long"],"plan")}  </div>
{sess("Mon 17","Easy","easy","8 km · Z2 · ran 8.1 km at 6:08, 144 bpm","8.1","On target",GRN)}{sess("Wed 19","Tempo","tempo","3 km @ 4:50–5:10 inside 7 km · ran 7.4","7.4","On target",GRN)}{sess("Thu 20","Easy","easy","8 km · Z2 · under 145 bpm","8","Today",TXT)}{sess("Sat 22","Medium","medium","10 km · Z3 · 5:35–5:45 /km","10","Planned",MUT)}{sess("Sun 23","Long","long","14 km · Z2 · last 3 km at HM effort","14","Planned",MUT)}  <div class="tile" style="gap: 10px;">
    <div style="min-height: 44px; border-radius: 14px; background: {BG}; padding: 13px 14px; font-size: 13px; color: {MUT};">How are you feeling? e.g. calf tight, away Friday…</div>
    <div style="height: 46px; display: flex; align-items: center; justify-content: center; background: {ACC}; color: #fff; border-radius: 16px; font-weight: 800; font-size: 14px;">Plan week 6</div>
  </div>
'''+END_BODY+tail("plan")

# ---------------- ACTIVITIES ----------------
def run(date,name,t,km,pace,hr,note=""):
    n = f'<span class="pill" style="background: {BG}; color: {AMB};">{note}</span>' if note else ""
    return f'''  <div class="tile" style="flex-direction: row; align-items: center; gap: 14px; padding: 14px 16px;">
    <div style="width: 6px; height: 40px; border-radius: 3px; background: {TYPE[t]}; flex-shrink: 0;"></div>
    <div style="flex: 1; min-width: 0;"><div class="k">{date}</div><div style="display: flex; align-items: center; gap: 8px; font-weight: 800; margin-top: 2px;"><span>{name}</span>{n}</div></div>
    <div style="display: flex; gap: 14px;">
      <div style="text-align: right;"><div class="num" style="font-size: 20px;">{km}</div><div class="k" style="font-size: 10px;">km</div></div>
      <div style="text-align: right;"><div class="num" style="font-size: 20px;">{pace}</div><div class="k" style="font-size: 10px;">/km</div></div>
      <div style="text-align: right;"><div class="num" style="font-size: 20px; color: {STL};">{hr}</div><div class="k" style="font-size: 10px;">bpm</div></div>
    </div>
  </div>
'''
acts = head()+header("August · 112 km","Runs",f'<div style="height: 40px; padding: 0 16px; border-radius: 999px; background: {TILE}; box-shadow: {SH}; display: flex; align-items: center; font-size: 13px; font-weight: 700;">Upload</div>')
acts += chips(["All","Easy","Medium","Tempo","Long","Race"],"All")
acts += run("Wed 19 Aug · Tempo","Mafra Corrida","tempo","7.4","5:26",158)
acts += run("Mon 17 Aug · Easy","Mafra Corrida","easy","8.1","6:08",144)
acts += run("Sun 16 Aug · Long","Mafra Corrida","long","16.1","5:31",153,"PB 10 km")
acts += run("Thu 13 Aug · Medium","Ferreira do Zêzere","medium","9.0","5:43",157)
acts += run("Tue 11 Aug · Easy","Mafra Corrida","easy","6.5","6:12",141)
acts += run("Sun 9 Aug · Long","Mafra Corrida","long","14.1","5:38",152)
acts += run("Thu 6 Aug · Tempo","Mafra Corrida","tempo","7.2","5:30",159)
acts += END_BODY+tail("act")

# ---------------- ACTIVITY DETAIL ----------------
laps=[("1","5:47",126,"+23",MUT),("2","5:31",150,"+15",MUT),("3","4:49",171,"+1",GRN),("4","5:01",174,"−6",GRN),("5","5:07",173,"−4",GRN),("6","6:09",163,"−18",MUT),("7","6:13",157,"−13",MUT),("0.4","1:35",155,"−2",MUT)]
laprows=""
for n,t,hr,e,c in laps:
    m,s=t.split(":"); sec=int(m)*60+int(s)
    w = 100 if n=="0.4" else int((420-sec)*100/160)
    w = 40 if n=="0.4" else w
    laprows+=f'    <div style="display: grid; grid-template-columns: 30px 1fr 52px 44px 40px; gap: 8px; align-items: center; height: 22px;"><span class="k" style="font-size: 11px;">{n}</span><div style="height: 6px; background: {BG}; border-radius: 3px;"><div style="width: {w}%; height: 100%; background: {c}; border-radius: 3px; opacity: .85;"></div></div><span class="num" style="font-size: 13px; text-align: right; color: {c};">{t}</span><span class="num" style="font-size: 13px; text-align: right; font-weight: 700;">{hr}</span><span class="k" style="font-size: 11px; text-align: right;">{e}</span></div>\n'
zones=[(7,"3m"),(30,"12m"),(22,"9m"),(33,"13m"),(8,"3m")]
zbar="".join(f'<div style="width: {p}%; background: {ZONE[i]};"></div>' for i,(p,_) in enumerate(zones))
zlab="".join(f'<span>Z{i+1} {l}</span>' for i,(_,l) in enumerate(zones))
detail = head()+header("Wed 19 Aug · 18:02 · Tempo","Mafra Corrida",f'<div style="height: 40px; padding: 0 16px; border-radius: 999px; background: {TILE}; box-shadow: {SH}; display: flex; align-items: center; font-size: 13px; font-weight: 700;">Edit</div>')
detail += f'''  <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px;">
    {stat("7.4","km",TXT,26)}
    {stat("40:12","time",TXT,26)}
    {stat("5:26","/km",TXT,26)}
    {stat("158","avg bpm",STL,26)}
    {stat("84","load",AMB,26)}
    {stat("3.7","TE aerobic",GRN,26)}
  </div>
  <div class="tile" style="gap: 10px;">
    <div style="display: flex; justify-content: space-between;"><span class="k">Time in zone</span><span class="k">40 min</span></div>
    <div style="display: flex; height: 12px; border-radius: 6px; overflow: hidden;">{zbar}</div>
    <div style="display: flex; justify-content: space-between; font-size: 11px; color: {MUT}; font-weight: 600;">{zlab}</div>
  </div>
  <div class="tile" style="gap: 8px;">
    <div style="display: flex; justify-content: space-between; align-items: center;"><span class="k">Planned · 3 km @ 4:50–5:10</span>{pill("On target",BG,GRN)}</div>
    <div style="font-size: 13px; color: {MUT}; line-height: 1.5;">Kilometres 3–5 at 4:49, 5:01, 5:07 — first a touch quick, last faded 4 %. HR 171–174 is squarely zone 4. The effort was the plan; keep Thursday easy.</div>
  </div>
  <div class="tile" style="gap: 6px;">
    <div style="display: grid; grid-template-columns: 30px 1fr 52px 44px 40px; gap: 8px; font-size: 11px; color: {MUT}; font-weight: 600;"><span>km</span><span></span><span style="text-align: right;">pace</span><span style="text-align: right;">bpm</span><span style="text-align: right;">elev</span></div>
{laprows}  </div>
'''+END_BODY+tail("act")

# ---------------- TRENDS ----------------
weeks=[(24,"27 Jul"),(28,""),(31,""),(33,""),(36,""),(38,""),(40,""),(15,"this wk")]
bars=""; labels=""
for km,l in weeks:
    h=int(km*100/44); z2=60; z3=28; z4=12
    cur = km==15
    op = ".45" if cur else "1"
    bars+=f'      <div style="height: {h}%; display: flex; flex-direction: column; border-radius: 6px 6px 3px 3px; overflow: hidden; opacity: {op};"><div style="flex: {z4}; background: {AMB};"></div><div style="flex: {z3}; background: {GRN};"></div><div style="flex: {z2}; background: {STL};"></div></div>\n'
    labels+=f'<span style="{"color: "+TXT+"; font-weight: 800;" if cur else ""}">{km}</span>'
trends = head()+header("Last 8 weeks","Trends")+chips(["4w","8w","12w","Block","Season"],"8w")+f'''  <div class="tile" style="gap: 10px;">
    <div style="display: flex; justify-content: space-between; align-items: baseline;"><span style="font-weight: 800;">Fitness · Fatigue · Form</span><span class="k">41 · 38 · <span style="color: {GRN}; font-weight: 800;">+3</span></span></div>
    <svg viewBox="0 0 330 120" style="width: 100%; height: 120px; display: block;">
      <line x1="0" y1="100" x2="330" y2="100" stroke="{BG}" stroke-width="2"/><line x1="0" y1="60" x2="330" y2="60" stroke="{BG}" stroke-width="2"/><line x1="0" y1="20" x2="330" y2="20" stroke="{BG}" stroke-width="2"/>
      <path d="M0 92 C40 88 70 84 110 78 S190 62 240 52 S300 40 330 36" fill="none" stroke="{STL}" stroke-width="3" stroke-linecap="round"/>
      <path d="M0 96 L30 80 L55 90 L85 66 L115 76 L150 58 L180 70 L215 50 L245 62 L280 44 L310 56 L330 42" fill="none" stroke="{AMB}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M0 60 L30 72 L55 58 L85 76 L115 66 L150 80 L180 70 L215 82 L245 70 L280 82 L310 70 L330 58" fill="none" stroke="{GRN}" stroke-width="2.5" stroke-dasharray="5 4"/>
      <line x1="312" y1="8" x2="312" y2="104" stroke="{TXT}" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="308" y="116" fill="{TXT}" font-size="10" font-weight="700" font-family="Manrope" text-anchor="end">HM 13 Sep</text>
      <text x="0" y="116" fill="{MUT}" font-size="10" font-family="Manrope">Jun</text><text x="110" y="116" fill="{MUT}" font-size="10" font-family="Manrope">Jul</text><text x="220" y="116" fill="{MUT}" font-size="10" font-family="Manrope">Aug</text>
    </svg>
    <div style="display: flex; gap: 16px; font-size: 11px; color: {MUT}; font-weight: 600;"><span style="display: flex; align-items: center; gap: 6px;"><i style="width: 10px; height: 10px; border-radius: 50%; background: {STL};"></i>Fitness</span><span style="display: flex; align-items: center; gap: 6px;"><i style="width: 10px; height: 10px; border-radius: 50%; background: {AMB};"></i>Fatigue</span><span style="display: flex; align-items: center; gap: 6px;"><i style="width: 10px; height: 10px; border-radius: 50%; background: {GRN};"></i>Form</span></div>
  </div>
  <div class="tile" style="gap: 10px;">
    <div style="display: flex; justify-content: space-between; align-items: baseline;"><span style="font-weight: 800;">Weekly km by zone</span><span class="k">Z2 · Z3 · Z4+</span></div>
    <div style="display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 8px; align-items: end; height: 110px;">
{bars}    </div>
    <div style="display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 8px; font-size: 11px; color: {MUT}; text-align: center; font-weight: 600;">{labels}</div>
  </div>
  <div class="tile" style="gap: 10px;">
    <div style="display: flex; justify-content: space-between; align-items: baseline;"><span style="font-weight: 800;">Aerobic efficiency</span><span class="k">easy runs · <span style="color: {GRN}; font-weight: 800;">+6 %</span> vs June</span></div>
    <svg viewBox="0 0 330 60" style="width: 100%; height: 60px; display: block;">
      <line x1="0" y1="52" x2="330" y2="52" stroke="{BG}" stroke-width="2"/>
      <path d="M0 44 L40 48 L80 38 L120 40 L160 32 L200 34 L240 24 L280 22 L330 16" fill="none" stroke="{TXT}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="330" cy="16" r="4" fill="{GRN}"/>
    </svg>
  </div>
'''+END_BODY+tail("trends")

# ---------------- RECORDS ----------------
def rec(label, rows):
    # rows: (year, time, delta, pct, best)
    out=f'''  <div class="tile" style="gap: 10px;">
    <div style="display: flex; justify-content: space-between; align-items: center;"><span class="num" style="font-size: 22px;">{label}</span>{CHEV}</div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
'''
    for yr,t,d,pct,best in rows:
        col = AMB if best else STL
        dcol = GRN if d.startswith("−") else MUT
        out+=f'      <div style="display: flex; align-items: center; gap: 10px;"><span class="k" style="width: 34px;">{yr}</span><div style="flex: 1; height: 8px; background: {BG}; border-radius: 4px;"><div style="width: {pct}%; height: 100%; background: {col}; border-radius: 4px;"></div></div><span class="num" style="font-size: 15px; width: 62px; text-align: right; color: {TXT if best else MUT};">{t}</span><span style="font-size: 11px; font-weight: 700; color: {dcol}; width: 44px; text-align: right;">{d}</span></div>\n'
    return out+"    </div>\n  </div>\n"
records = head()+header("Season bests by year","Records")+chips(["Best times","Benchmarks","Predictions"],"Best times")
records += rec("5 km",[("2024","26:12","",100,False),("2025","24:51","−1:21",94,False),("2026","24:04","−0:47",90,True)])
records += rec("10 km",[("2024","58:40","",100,False),("2025","55:02","−3:38",93,False),("2026","53:50*","−1:12",90,True)])
records += rec("Half",[("2025","1:58:12","",100,True),("2026","—","13 Sep",0,False)])
records += rec("1 km",[("2025","4:33","",100,False),("2026","4:21","−0:12",95,True)])
records += f'  <div class="k" style="padding: 0 6px; font-size: 11px;">* estimated from lap splits · season = calendar year</div>\n'
records += END_BODY+tail("rec")

# ---------------- SETTINGS ----------------
def row(k,v,last=False):
    b = "" if last else f" border-bottom: 1px solid {BG};"
    return f'    <div style="display: flex; align-items: center; justify-content: space-between; min-height: 44px;{b}"><span style="font-weight: 600;">{k}</span><div style="display: flex; align-items: center; gap: 8px; color: {MUT}; font-size: 13px; font-weight: 600;"><span>{v}</span>{CHEV}</div></div>\n'
def section(title, rows):
    return f'  <div class="k" style="padding: 4px 6px 0;">{title}</div>\n  <div class="tile" style="gap: 0; padding: 4px 18px;">\n'+"".join(row(k,v,i==len(rows)-1) for i,(k,v) in enumerate(rows))+"  </div>\n"
settings = head()+header("Rob · rjmac","Settings",f'<div style="width: 40px; height: 40px; border-radius: 50%; background: {TILE}; box-shadow: {SH}; display: flex; align-items: center; justify-content: center; color: {MUT};">{BACK}</div>')
settings += f'''  <div class="tile" style="flex-direction: row; align-items: center; gap: 14px;">
    <div style="width: 40px; height: 40px; border-radius: 12px; background: {TXT}; display: flex; align-items: center; justify-content: center;"><svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: #fff;"><path d="M10 2L4 14h4l2-4 2 4h4z"/><path d="M14 12l-2 4-2-4H7l5 9 5-9z" opacity=".55"/></svg></div>
    <div style="flex: 1;"><div style="font-weight: 800;">Strava</div><div style="font-size: 12px; color: {GRN}; font-weight: 700;">Connected · last sync 19 Aug 20:14</div></div>
    <span class="k" style="font-weight: 700;">Disconnect</span>
  </div>
'''
settings += section("Athlete",[("Max heart rate","196 bpm"),("HR zones","118 · 137 · 157 · 176"),("Season starts","1 Jan")])
settings += section("Coach",[("Runs per week","4"),("Long run day","Sunday"),("Block length","8 weeks"),("Debrief after every run","On")])
settings += section("Data",[("Sync log","last 10 · all ok"),("Upload FIT / GPX","")])
settings += f'  <div style="display: flex; justify-content: center; font-size: 11px; color: {MUT}; font-weight: 600;">Powered by Strava</div>\n'
settings += END_BODY+tail("none")

for name,content in [("Main",home),("Plan",plan),("Runs",acts),("RunDetail",detail),("Trends",trends),("Records",records),("Settings",settings)]:
    open(f"{name}.dc.html","w").write(content)
json.dump({
 "artboards":[
  {"file":"Main.dc.html","title":"Home","x":0,"y":0,"w":390,"h":844},
  {"file":"Plan.dc.html","x":470,"y":0,"w":390,"h":844},
  {"file":"Runs.dc.html","x":940,"y":0,"w":390,"h":844},
  {"file":"RunDetail.dc.html","title":"Run detail","x":1410,"y":0,"w":390,"h":844},
  {"file":"Trends.dc.html","x":0,"y":940,"w":390,"h":844},
  {"file":"Records.dc.html","x":470,"y":940,"w":390,"h":844},
  {"file":"Settings.dc.html","x":940,"y":940,"w":390,"h":844}],
 "annotations":[{"id":"note","x":1410,"y":960,"w":360,"text":"Ritmo · Graphite\nTop row is the daily loop (Home → Plan → Runs → Run detail); bottom row the review screens. Settings opens from the profile button.\n\nColour is data only: steel = HR/fitness, amber = load/fatigue/tempo, green = on target/form/long. Charcoal hero and black buttons carry the brand."}],
 "launch":{"view":"canvas"}}, open("canvas.json","w"), indent=2)
print("ok")
