import json
BG="#f7f8fa"; TILE="#ffffff"; TXT="#141a26"; MUT="#5f6776"; GA="#16223d"; GB="#2c4570"
AMB="#f08a24"; GRN="#7ab648"; STL="#2f9ad0"; RED="#d9534f"; ACC="#16223d"; GRN_T="#4f8a22"; AMB_T="#b85f0f"; STL_T="#1f6f9a"; AMB_H="#ffb25c"; GRN_H="#b5e07a"; STL_H="#7fd0f7"
SH="none"; BOR="#e3e6eb"
TYPE={"easy":"#7b8494","medium":STL,"tempo":AMB,"long":GRN,"race":TXT}
TYPE_T={"easy":"#5f6776","medium":STL_T,"tempo":AMB_T,"long":GRN_T,"race":TXT}
WX_SUN='<svg class="ic" viewBox="0 0 24 24" style="width: 14px; height: 14px;"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
WX_CLOUD='<svg class="ic" viewBox="0 0 24 24" style="width: 14px; height: 14px;"><path d="M7 18a4 4 0 0 1-.5-8 6 6 0 0 1 11.3 1.5A3.5 3.5 0 0 1 17.5 18z"/></svg>'
WX_WIND='<svg class="ic" viewBox="0 0 24 24" style="width: 14px; height: 14px;"><path d="M3 8h10a3 3 0 1 0-3-3M3 12h14a3 3 0 1 1-3 3M3 16h7a2 2 0 1 1-2 2"/></svg>'
def wx(icon,text,col=None):
    c=f" color: {col};" if col else ""
    return f'<span style="display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; white-space: nowrap;{c}">{icon}{text}</span>'
def tpill(t): return f'<span class="pill" style="color: {TYPE_T[t]}; text-transform: capitalize;">{t}</span>'
ZONE=["#d0d5de",STL,GRN,AMB,"#d9534f"]
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
    a {{ color: {ACC}; }} a:hover {{ opacity: .85; }}
    .num {{ font-weight: 800; line-height: 1; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }}
    .k {{ font-size: 12px; color: {MUT}; font-weight: 500; }}
    .tile {{ background: {TILE}; border: 1px solid {BOR}; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }}
    .pill {{ font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; border: 1px solid currentColor; background: transparent !important; }}
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
    return f'''  <div style="position: absolute; left: 0; right: 0; bottom: 0; height: 60px; background: #fff; border-top: 1px solid {BOR}; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); align-items: center;">
{tabs}  </div>
</div>
</x-dc>
<script data-dc-script data-props='{{}}'>
class Component extends DCLogic {{ renderVals() {{ return {{}}; }} }}
</script>
</body>
</html>
'''
def header(kicker,title,right="",avatar=True):
    av = f'<div style="width: 34px; height: 34px; border-radius: 50%; background: {TXT}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0;">RM</div>' if avatar else ""
    return f'''  <div style="display: flex; align-items: center; justify-content: space-between; padding: 22px 20px 14px;">
    <div style="display: flex; align-items: center; gap: 12px;">{av}<div style="display: flex; flex-direction: column; gap: 2px;"><span class="k">{kicker}</span><span class="num" style="font-size: 26px;">{title}</span></div></div>
    {right}
  </div>
  <div style="flex: 1; overflow: hidden; padding: 0 16px 72px; display: flex; flex-direction: column; gap: 12px;">
'''
END_BODY="  </div>\n"
HERO=f"border-radius: 12px; padding: 18px 20px; background: radial-gradient(120% 90% at 100% 0%, rgba(127,208,247,.18) 0%, rgba(127,208,247,0) 55%), linear-gradient(135deg, {GA} 0%, {GB} 100%); color: #fff; display: flex; flex-direction: column; gap: 12px;"
def chips(items, active):
    s='  <div style="display: flex; gap: 8px; overflow: hidden; flex-shrink: 0;">\n'
    for it in items:
        if it==active: s+=f'    <span style="background: linear-gradient(135deg, {GA}, {GB}); color: #fff; font-size: 12px; font-weight: 700; padding: 8px 14px; border-radius: 8px; white-space: nowrap;">{it}</span>\n'
        else: s+=f'    <span style="background: {TILE}; border: 1px solid {BOR}; color: {MUT}; font-size: 12px; font-weight: 600; padding: 7px 14px; border-radius: 8px; white-space: nowrap;">{it}</span>\n'
    return s+'  </div>\n'
def pill(text,bg,fg="#fff"): return f'<span class="pill" style="color: {fg};">{text}</span>'
TINT={"#4f8a22":"#7ab64826","#b85f0f":"#f08a2426","#2f9ad0":"#2f9ad01f","#1f6f9a":"#2f9ad01f"}
def stat(v,k,col=TXT,size=30):
    bg = TILE
    return f'<div class="tile" style="padding: 12px 14px; gap: 4px; background: {bg};"><span class="num" style="font-size: {size}px; color: {col};">{v}</span><span class="k">{k}</span></div>'

# ---------------- HOME ----------------
home = head()+header("Thursday 20 August","Today",f'<div style="height: 36px; padding: 0 14px; border-radius: 8px; background: {TILE}; border: 1px solid {BOR}; display: flex; align-items: center; font-size: 13px; font-weight: 700;">Sync</div>')+f'''  <div style="border-radius: 12px; padding: 20px; background: radial-gradient(120% 90% at 100% 0%, rgba(127,208,247,.18) 0%, rgba(127,208,247,0) 55%), linear-gradient(135deg, {GA} 0%, {GB} 100%); color: #fff; display: flex; flex-direction: column; gap: 14px;">
    <div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 12px; font-weight: 700; opacity: .85;">EASY RUN</span><span class="pill" style="background: rgba(255,255,255,.18);">HM Build · wk 5 of 8</span></div>
    <div style="display: flex; align-items: center; gap: 18px;">
      <div style="position: relative; width: 84px; height: 84px; flex-shrink: 0;">
        <svg viewBox="0 0 96 96" style="width: 84px; height: 84px; transform: rotate(-90deg);"><circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="10"/><circle cx="48" cy="48" r="40" fill="none" stroke="{AMB_H}" stroke-width="10" stroke-linecap="round" stroke-dasharray="163 251"/></svg>
        <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;"><span class="num" style="font-size: 26px;">+3</span><span style="font-size: 10px; font-weight: 700; opacity: .85;">FORM</span></div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <span class="num" style="font-size: 44px;">6–7 km</span>
        <span style="font-size: 13px; opacity: .95;"><strong style="color: {STL_H};">6:05–6:25</strong> /km · under <strong style="color: {AMB_H};">145 bpm</strong></span>
        <span style="font-size: 13px; opacity: .85; line-height: 1.4;">Your Mafra loop is ideal. See 150? Walk 30 s.</span>
      </div>
    </div>
    <div style="display: flex; gap: 14px; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.14); opacity: .95;">{wx(WX_SUN,"24 °C at 18:00")}{wx(WX_WIND,"14 km/h NW")}<span style="font-size: 11px; font-weight: 700; color: {AMB_H}; white-space: nowrap;">heat: ceiling 150</span></div>
    <div style="height: 46px; display: flex; align-items: center; justify-content: center; background: #fff; color: {TXT}; border-radius: 8px; font-weight: 800; font-size: 14px;">Pre-session brief</div>
  </div>
  <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px;">
    {stat("6","streak at effort",GRN_T)}
    {stat("24","days to HM",AMB_T)}
    {stat("14","of 39 km this wk",STL_T)}
  </div>
  <div class="tile">
    <div style="display: flex; justify-content: space-between; align-items: center;"><span class="k">Yesterday · Tempo</span>{pill("On target",GRN+"26",GRN_T)}</div>
    <div style="display: flex; align-items: baseline; gap: 14px;">
      <span class="num" style="font-size: 30px;">7.4<span style="font-size: 14px; font-weight: 500; color: {MUT};"> km</span></span>
      <span class="num" style="font-size: 30px;">5:26<span style="font-size: 14px; font-weight: 500; color: {MUT};"> /km</span></span>
      <span class="num" style="font-size: 30px;">158<span style="font-size: 14px; font-weight: 500; color: {MUT};"> bpm</span></span>
    </div>
    <div style="font-size: 13px; color: {MUT}; line-height: 1.5;">Tempo kilometres at 4:49–5:07 on 171–174 bpm — exactly the effort asked, and you held back on the cool-down. Keep today honestly easy to bank it.</div>
    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 700; padding-top: 4px;"><span>Add Garmin stats</span>{CHEV}</div>
  </div>
  <div class="k" style="font-size: 11px; padding: 0 6px;">Synced from Strava 19 Aug, 20:14</div>
'''+END_BODY+tail("home")

# ---------------- PLAN ----------------
def day(n,d,c,state):
    if state=="plan":
        box=f'background: {TILE}; border: 2px solid {c}; color: {c};'
    elif state=="rest":
        box=f'background: {TILE}; border: 1px solid {BOR}; color: {MUT};'
    else:
        fg = TXT if c==AMB else "#fff"
        box=f'background: {c}; color: {fg};'
    ring = f" box-shadow: 0 0 0 3px {BG}, 0 0 0 5px {TXT};" if state=="today" else ""
    return f'    <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;"><span class="k">{n}</span><div style="width: 38px; height: 38px; border-radius: 50%; box-sizing: border-box; {box}{ring} display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800;">{d}</div></div>\n'
def sess(date,name,t,desc,v,verdict,vc):
    return f'''  <div class="tile" style="flex-direction: row; align-items: center; gap: 14px; padding: 12px 16px;">
    <div style="flex: 1; min-width: 0;"><div style="display: flex; align-items: center; gap: 8px;"><span class="k">{date}</span>{tpill(t)}</div><div style="font-size: 12px; color: {MUT}; margin-top: 4px;">{desc}</div></div>
    <div style="text-align: right;"><div class="num" style="font-size: 22px;">{v}</div><div style="font-size: 10px; font-weight: 700; color: {vc};">{verdict}</div></div>
  </div>
'''
plan = head()+header("Thursday 20 August","Plan",f'<div style="display: flex; border: 1px solid {BOR}; border-radius: 8px; overflow: hidden; height: 36px;"><span style="padding: 0 14px; display: flex; align-items: center; font-size: 13px; font-weight: 800; background: {TXT}; color: #fff;">Week</span><span style="padding: 0 14px; display: flex; align-items: center; font-size: 13px; font-weight: 700; color: {MUT};">Month</span></div>')+f'''  <div style="{HERO}">
    <div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 12px; font-weight: 700; opacity: .85;">HM BUILD · WEEK 5 OF 8</span><span class="pill" style="background: rgba(255,255,255,.18);">HM · 13 Sep</span></div>
    <div style="display: flex; align-items: baseline; gap: 8px;"><span class="num" style="font-size: 40px;">141</span><span style="font-size: 14px; opacity: .85;">of 300 km · 24 days to go</span></div>
    <div style="height: 8px; background: rgba(255,255,255,.18); border-radius: 4px; overflow: hidden;"><div style="width: 47%; height: 100%; background: {GRN_H}; border-radius: 4px;"></div></div>
    <div style="height: 44px; display: flex; align-items: center; justify-content: center; background: #fff; color: {TXT}; border-radius: 8px; font-weight: 800; font-size: 14px;">Plan week 6</div>
  </div>
  <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 6px;"><span style="font-weight: 800;">This week · 17–23 Aug</span>{pill("2 of 2 at effort",GRN+"26",GRN_T)}</div>
  <div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px;">
{day("M",17,TYPE["easy"],"done")}{day("T",18,TILE,"rest")}{day("W",19,TYPE["tempo"],"done")}{day("T",20,TYPE["easy"],"today")}{day("F",21,TILE,"rest")}{day("S",22,TYPE["medium"],"plan")}{day("S",23,TYPE["long"],"plan")}  </div>
{sess("Mon 17","Easy","easy","6–7 km Z2 · ran 6.5 at 6:08, 144 bpm","6.5","On target",GRN_T)}{sess("Wed 19","Tempo","tempo","3 km @ 4:50–5:10 · ran 7.4","7.4","On target",GRN_T)}{sess("Thu 20","Easy","easy","6–7 km Z2 · Mafra loop","6–7","Today",TXT)}{sess("Sat 22","Medium","medium","8–9 km Z3 · 5:35–5:45 /km","8–9","Planned",MUT)}{sess("Sun 23","Long","long","12–13 km Z2 · last 3 km at HM effort","12–13","Planned",MUT)}
'''+END_BODY+tail("plan")

# ---------------- ACTIVITIES ----------------
def kmbars(splits):
    # splits: list of (pace_s, zonecolor); bar height inverse to pace
    mx=max(p for p,_ in splits); mn=min(p for p,_ in splits)
    out=""
    for p_,c in splits:
        h=30+int((mx-p_)/(mx-mn+1)*34)
        out+=f'<div style="flex: 1; height: {h}px; background: {c}; border-radius: 3px 3px 0 0; opacity: .9;"></div>'
    return f'<div style="display: flex; align-items: flex-end; gap: 3px; height: 64px; padding: 0 2px; border-bottom: 1px solid {BOR};">{out}</div>'
def feedcard(date,name,t,km,time,pace,hr,climb,verdict,vcol,tags,route,planned,gapv="—"):
    tagchips="".join(f'<span class="pill" style="color: {c};">{x}</span>' for x,c in tags)
    return f'''  <div class="tile" style="gap: 12px;">
    <div style="display: flex; justify-content: space-between; align-items: center;"><span class="k">{date}</span>{tpill(t)}</div>
    <div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 17px; font-weight: 800;">{name}</span><span style="font-size: 12px; color: {MUT};">{planned}</span></div>
    <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px;">
      <div><div class="num" style="font-size: 22px;">{km}</div><div class="k" style="font-size: 10px;">km</div></div>
      <div><div class="num" style="font-size: 22px;">{time}</div><div class="k" style="font-size: 10px;">time</div></div>
      <div><div class="num" style="font-size: 22px;">{pace}</div><div class="k" style="font-size: 10px;">/km · GAP {gapv}</div></div>
      <div><div class="num" style="font-size: 22px; color: {STL_T};">{hr}</div><div class="k" style="font-size: 10px;">avg bpm</div></div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 4px;">{kmbars(route)}<div style="display: flex; justify-content: space-between;"><span class="k" style="font-size: 10px;">pace per km</span><span class="k" style="font-size: 10px;">fastest {min(route)[0]//60}:{min(route)[0]%60:02d}</span></div></div>
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">{pill(verdict,"",vcol)}{tagchips}</div>
      <span class="k" style="font-size: 11px; white-space: nowrap; display: inline-flex; gap: 10px;">{climb}</span>
    </div>
  </div>
'''
acts = head()+header("August · 91 km · 12 runs","Runs",f'<div style="display: flex; gap: 8px;"><div style="width: 36px; height: 36px; border-radius: 8px; background: {TILE}; border: 1px solid {BOR}; display: flex; align-items: center; justify-content: center; color: {MUT};"><svg class="ic" viewBox="0 0 24 24" style="width: 18px; height: 18px;">{ICONS["plan"]}</svg></div><div style="height: 36px; padding: 0 14px; border-radius: 8px; background: {TILE}; border: 1px solid {BOR}; display: flex; align-items: center; font-size: 13px; font-weight: 700;">Upload</div></div>')
acts += chips(["All","Easy","Medium","Tempo","Long","Race"],"All")
acts += feedcard("Wed 19 Aug · 18:02","Mafra Corrida","tempo","7.4","40:12","5:26",158,wx(WX_SUN,"26 °C")+wx(WX_WIND,"9 km/h")+"+71 m","On target",GRN_T,[("Best 2 km · 9:50",AMB_T)],[(347,STL),(331,GRN),(289,AMB),(301,AMB),(307,AMB),(369,GRN),(373,GRN),(380,GRN)],"Planned: 3 km @ 4:50–5:10 inside 7–8 km","5:21")
acts += feedcard("Mon 17 Aug · 09:12","Mafra Corrida","easy","6.5","39:52","6:08",144,wx(WX_CLOUD,"18 °C")+wx(WX_WIND,"21 km/h")+"+58 m","On target",GRN_T,[],[(372,STL),(366,STL),(360,GRN),(362,GRN),(375,STL),(380,STL),(390,STL)],"Planned: 6–7 km easy, under 145 bpm","6:04")
acts += feedcard("Sun 16 Aug · 08:40","Mafra → Ericeira","long","16.1","1:28:50","5:31",153,wx(WX_SUN,"19 °C")+wx(WX_WIND,"6 km/h")+"+140 m","On target",GRN_T,[("PB 10 km · 53:50",AMB_T),("Longest run",STL_T)],[(377,STL),(362,STL),(341,GRN),(341,GRN),(342,GRN),(356,GRN),(357,GRN),(355,GRN),(362,GRN),(362,GRN),(330,GRN),(325,AMB),(327,AMB),(335,AMB),(360,GRN),(380,STL)],"Planned: 15–16 km, last 3 km at HM effort","5:24")
acts += END_BODY+tail("act")

# ---------------- ACTIVITY DETAIL ----------------
def gap(sec, e, dist=1000):
    m = int(e.replace("−","-").replace("+",""))
    i = m/dist
    C = lambda g: 155.4*g**5 - 30.4*g**4 - 43.3*g**3 + 46.3*g**2 + 19.5*g + 3.6
    g = int(round(sec * C(0)/C(i)))
    return f"{g//60}:{g%60:02d}"
laps=[("1","5:47",126,"+23",STL),("2","5:31",150,"+15",GRN),("3","4:49",171,"+1",AMB),("4","5:01",174,"−6",AMB),("5","5:07",173,"−4",AMB),("6","6:09",163,"−18",GRN),("7","6:13",157,"−13",GRN),("0.4","1:35",155,"−2",GRN)]
laprows=""
for n,t,hr,e,c in laps:
    m,s=t.split(":"); sec=int(m)*60+int(s)
    w = 100 if n=="0.4" else int((420-sec)*100/160)
    w = 40 if n=="0.4" else w
    gap_=gap(sec, e)
    laprows+=f'    <div style="display: grid; grid-template-columns: 28px 1fr 46px 46px 40px 38px; gap: 8px; align-items: center; height: 19px;"><span class="k" style="font-size: 11px;">{n}</span><div style="height: 4px; background: #eef0f3; border-radius: 2px;"><div style="width: {w}%; height: 100%; background: {c}; border-radius: 2px; opacity: .85;"></div></div><span class="num" style="font-size: 13px; text-align: right;">{t}</span><span class="num" style="font-size: 13px; text-align: right; color: {STL_T};">{gap_}</span><span class="num" style="font-size: 13px; text-align: right; font-weight: 700;">{hr}</span><span class="k" style="font-size: 11px; text-align: right;">{e}</span></div>\n'
zones=[(7,"3m"),(30,"12m"),(22,"9m"),(33,"13m"),(8,"3m")]
zbar="".join(f'<div style="width: {p}%; background: {ZONE[i]};"></div>' for i,(p,_) in enumerate(zones))
zlab="".join(f'<span>Z{i+1} {l}</span>' for i,(_,l) in enumerate(zones))
detail = head()+header("Wed 19 Aug · 18:02 · Tempo","Mafra Corrida",avatar=False,right=f'<div style="height: 36px; padding: 0 14px; border-radius: 8px; background: {TILE}; border: 1px solid {BOR}; display: flex; align-items: center; font-size: 13px; font-weight: 700;">Edit</div>')
detail += f'''  <div style="{HERO} flex-direction: row; justify-content: space-between; align-items: flex-end;">
    <div><div class="num" style="font-size: 40px;">7.4<span style="font-size: 14px; font-weight: 500; opacity: .85;"> km</span></div><div style="font-size: 12px; opacity: .85; margin-top: 4px;">{pill("On target","rgba(255,255,255,.18)")}</div></div>
    <div style="text-align: right;"><div class="num" style="font-size: 26px;">40:12</div><div style="font-size: 11px; opacity: .85;">time</div></div>
    <div style="text-align: right;"><div class="num" style="font-size: 26px;">5:26</div><div style="font-size: 11px; opacity: .85;">/km · <span style="color: {STL_H}; font-weight: 700;">5:21 GAP</span></div></div>
  </div>
  <div style="display: flex; gap: 14px; padding: 0 4px; color: {MUT}; margin: -4px 0;">{wx(WX_SUN,"26 °C · 48 %")}{wx(WX_WIND,"9 km/h headwind")}<span style="font-size: 11px; font-weight: 600; color: {AMB_T}; white-space: nowrap;">HR ~4 high · heat</span></div>
  <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px;">
    {stat("158","avg bpm",STL_T,26)}
    {stat("84","load",AMB_T,26)}
    {stat("3.7","TE aerobic",GRN_T,26)}
  </div>
  <div class="tile" style="gap: 8px; padding: 14px 16px;">
    <div style="display: flex; justify-content: space-between;"><span class="k">Time in zone</span><span class="k">40 min</span></div>
    <div style="display: flex; height: 12px; border-radius: 6px; overflow: hidden;">{zbar}</div>
    <div style="display: flex; justify-content: space-between; font-size: 11px; color: {MUT}; font-weight: 600;">{zlab}</div>
  </div>
  <div class="tile" style="gap: 6px; padding: 14px 16px;">
    <div style="display: flex; justify-content: space-between; align-items: center;"><span class="k">Planned · 3 km @ 4:50–5:10 inside 7–8 km</span>{pill("On target",GRN+"33",GRN_T)}</div>
    <div style="font-size: 13px; color: {MUT}; line-height: 1.45;">Kilometres 3–5 at 4:49, 5:01, 5:07 — first a touch quick, last faded 4 %. HR 171–174 is squarely zone 4. Effort was the plan; keep Thursday easy.</div>
  </div>
  <div class="tile" style="gap: 6px;">
    <div style="display: grid; grid-template-columns: 28px 1fr 46px 46px 40px 38px; gap: 8px; font-size: 11px; color: {MUT}; font-weight: 600;"><span>km</span><span style="display: flex; gap: 10px;"><span style="color: {STL_T};">Z2</span><span style="color: {GRN_T};">Z3</span><span style="color: {AMB_T};">Z4</span></span><span style="text-align: right;">pace</span><span style="text-align: right; color: {STL_T};">GAP</span><span style="text-align: right;">bpm</span><span style="text-align: right;">elev</span></div>
{laprows}  </div>
'''+END_BODY+tail("act")

# ---------------- TRENDS ----------------
def qtile(q, headline, delta, dcol, body, note):
    return f'''  <div class="tile" style="gap: 10px;">
    <span class="k">{q}</span>
    <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 10px;"><span style="font-size: 16px; font-weight: 800; line-height: 1.3;">{headline}</span><span class="num" style="font-size: 16px; color: {dcol}; white-space: nowrap;">{delta}</span></div>
{body}    <div style="font-size: 12px; color: {MUT}; line-height: 1.45;">{note}</div>
  </div>
'''
# 1 pace at easy HR — line chart
pace_chart=f'''    <svg viewBox="0 0 330 80" style="width: 100%; height: 80px; display: block;">
      <line x1="0" y1="70" x2="330" y2="70" stroke="{BOR}"/><line x1="0" y1="40" x2="330" y2="40" stroke="{BOR}"/><line x1="0" y1="10" x2="330" y2="10" stroke="{BOR}"/>
      <text x="0" y="8" fill="{MUT}" font-size="9" font-family="Manrope">6:15</text><text x="0" y="38" fill="{MUT}" font-size="9" font-family="Manrope">6:00</text><text x="0" y="68" fill="{MUT}" font-size="9" font-family="Manrope">5:45</text>
      <path d="M30 18 L60 24 L90 16 L120 30 L150 34 L180 40 L210 38 L240 48 L270 52 L300 56 L330 58" fill="none" stroke="{STL}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="330" cy="58" r="4" fill="{STL}"/>
    </svg>
'''
# 2 intensity distribution — stacked easy/hard per week with 80% line
def intensity():
    weeks=[(82,18),(79,21),(74,26),(71,29),(68,32),(70,30),(66,34),(85,15)]
    bars="".join(f'<div style="display: flex; flex-direction: column; border-radius: 3px; overflow: hidden; height: 56px;"><div style="flex: {h}; background: {AMB};"></div><div style="flex: {e}; background: {STL};"></div></div>' for e,h in weeks)
    return f'''    <div style="position: relative;">
      <div style="display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 6px;">{bars}</div>
      <div style="position: absolute; left: 0; right: 0; top: 20%; border-top: 2px dashed {TXT}; opacity: .5;"></div>
      <span style="position: absolute; right: 0; top: 22%; font-size: 9px; font-weight: 700; background: #fff; padding: 0 3px;">80 % easy</span>
    </div>
    <div style="display: flex; gap: 14px; font-size: 11px; color: {MUT}; font-weight: 600;"><span style="display: flex; align-items: center; gap: 6px;"><i style="width: 8px; height: 8px; border-radius: 2px; background: {STL};"></i>Easy (Z1–2)</span><span style="display: flex; align-items: center; gap: 6px;"><i style="width: 8px; height: 8px; border-radius: 2px; background: {AMB};"></i>Hard (Z3+)</span></div>
'''
# 2b weekly volume by zone (kept from v1)
def volume():
    weeks=[22,24,26,28,30,33,35,14]
    bars=""
    for km in weeks:
        h=int(km*100/38); cur=km==14; op=".45" if cur else "1"
        bars+=f'<div style="height: {h}%; display: flex; flex-direction: column; border-radius: 4px 4px 2px 2px; overflow: hidden; opacity: {op};"><div style="flex: 12; background: {AMB};"></div><div style="flex: 28; background: {GRN};"></div><div style="flex: 60; background: {STL};"></div></div>'
    labels="".join(f'<span style="{"color: "+TXT+"; font-weight: 800;" if km==14 else ""}">{km}</span>' for km in weeks)
    return f'''    <div style="display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 6px; align-items: end; height: 90px;">{bars}</div>
    <div style="display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 6px; font-size: 10px; color: {MUT}; text-align: center; font-weight: 600;">{labels}</div>
'''
# 3 load — FFF with ACWR band
load_chart=f'''    <svg viewBox="0 0 330 80" style="width: 100%; height: 80px; display: block;">
      <rect x="0" y="22" width="330" height="30" fill="{GRN}" opacity=".12"/>
      <text x="4" y="32" fill="{GRN_T}" font-size="9" font-weight="700" font-family="Manrope">safe ramp 0.8–1.3</text>
      <path d="M0 60 L30 50 L60 54 L90 40 L120 46 L150 34 L180 38 L210 28 L240 36 L270 18 L300 30 L330 40" fill="none" stroke="{AMB}" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="270" cy="18" r="4" fill="{AMB}"/><text x="262" y="12" fill="{AMB_T}" font-size="9" font-weight="700" font-family="Manrope" text-anchor="end">1.42 · wk 4</text>
      <circle cx="330" cy="40" r="4" fill="{TXT}"/>
    </svg>
'''
# 4 consistency — 12-week heatmap (7 rows × 12 cols)
def heatmap():
    import random
    random.seed(4)
    cells=""
    for r in range(7):
        for c in range(12):
            v=random.choice([0,0,1,1,2,3]) if not (r==1 or r==4) else random.choice([0,0,0,1])
            col={0:"#eef0f3",1:STL+"55",2:STL+"99",3:STL}[v]
            cells+=f'<div style="aspect-ratio: 1; border-radius: 2px; background: {col};"></div>'
    return f'    <div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 3px;">{cells}</div>\n'
# 5 prediction — HM time trend vs goal
pred_chart=f'''    <svg viewBox="0 0 330 80" style="width: 100%; height: 80px; display: block;">
      <line x1="0" y1="34" x2="330" y2="34" stroke="{GRN}" stroke-width="1.5" stroke-dasharray="4 3"/><text x="330" y="30" fill="{GRN_T}" font-size="9" font-weight="700" font-family="Manrope" text-anchor="end">goal 1:55</text>
      <path d="M0 14 L40 16 L80 12 L120 20 L160 24 L200 28 L240 30 L280 36 L330 38" fill="none" stroke="{TXT}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M330 38 L360 40" fill="none" stroke="{TXT}" stroke-width="2" stroke-dasharray="3 3"/>
      <circle cx="330" cy="38" r="4" fill="{TXT}"/><text x="322" y="54" fill="{TXT}" font-size="10" font-weight="800" font-family="Manrope" text-anchor="end">1:54:10</text>
      <text x="0" y="76" fill="{MUT}" font-size="9" font-family="Manrope">Jun</text><text x="160" y="76" fill="{MUT}" font-size="9" font-family="Manrope">Jul</text><text x="300" y="76" fill="{MUT}" font-size="9" font-family="Manrope">Aug</text>
    </svg>
'''
trends = head()+header("Thursday 20 August","Trends")+chips(["4w","8w","12w","Block","Season"],"8w")
trends += f'''  <div style="{HERO}">
    <div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 12px; font-weight: 700; opacity: .85;">TODAY'S READ · 06:40</span><span class="pill" style="color: #fff;">after yesterday's tempo</span></div>
    <div style="font-size: 14px; line-height: 1.5;">Your aerobic engine is clearly improving — <strong style="color: {STL_H};">23 s/km faster at 145 bpm</strong> than in June, and yesterday's tempo confirms it. The one thing to watch: the last four weeks were <strong style="color: {AMB_H};">32 % hard</strong>, well over the 20 % target. Easy days have crept up to zone 3. Hold today under 145 and the HM prediction should keep moving.</div>
    <div style="display: flex; gap: 8px; font-size: 11px; font-weight: 700; opacity: .85;"><span>Fitness ↑</span><span>·</span><span>Form +3</span><span>·</span><span>HM 1:54:10</span></div>
  </div>
'''
trends += qtile("Am I fitter aerobically?","5:52 /km at 145 bpm","−23 s",GRN_T,pace_chart,"Easy-run pace at the same heart rate, 8 weeks. Lower is better. Drift on long runs: 3.8 % (good, under 5 %).")
trends += qtile("Am I training too hard?","32 % hard this month","target 20 %",AMB_T,intensity(),"Share of running time in Z3+ per week. Your easy runs average 148 bpm — the fix is pace, not fewer sessions.")
trends += qtile("How much am I running?","35 km last week","+10 % / wk",STL_T,volume(),"Weekly km split by zone. Growth has stayed inside the 10 % rule; the block peaks at 38 km in week 6 before the taper.")
trends += qtile("Am I absorbing the load?","Ramp 1.05 · form +3","fitness 41",STL_T,load_chart,"Acute vs chronic load. Week 4 spiked to 1.42 (the 16 km long run); it settled. Fitness has climbed every week of the block.")
trends += qtile("Am I consistent?","11 of 12 sessions","92 %",GRN_T,heatmap(),"Last 12 weeks, one square per day. Tuesday and Friday are your rest days; no gap longer than 3 days since June.")
trends += qtile("Am I on track for 13 Sep?","HM predicted 1:54:10","goal 1:55",GRN_T,pred_chart,"From best efforts, efficiency and load. Has improved 4:10 since June; the benchmark TT on 30 Aug will sharpen it.")
trends += END_BODY+tail("trends")

# ---------------- RECORDS ----------------
def rec(label, rows):
    # rows: (year, time, delta, pct, best)
    out=f'''  <div class="tile" style="gap: 10px;">
    <div style="display: flex; justify-content: space-between; align-items: center;"><div style="display: flex; align-items: center; gap: 10px;"><span class="num" style="font-size: 22px;">{label}</span>{pill("2026 best",AMB+"26",AMB_T)}</div>{CHEV}</div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
'''
    for yr,t,d,pct,best in rows:
        col = AMB if best else STL
        dcol = GRN_T if d.startswith("−") else MUT
        out+=f'      <div style="display: flex; align-items: center; gap: 10px;"><span class="k" style="width: 34px;">{yr}</span><div style="flex: 1; height: 6px; background: #eef0f3; border-radius: 3px;"><div style="width: {pct}%; height: 100%; background: {col}; border-radius: 4px;"></div></div><span class="num" style="font-size: 15px; width: 62px; text-align: right; color: {TXT if best else MUT};">{t}</span><span style="font-size: 11px; font-weight: 700; color: {dcol}; width: 44px; text-align: right;">{d}</span></div>\n'
    return out+"    </div>\n  </div>\n"
records = head()+header("Thursday 20 August","Records")+f'''  <div style="{HERO} flex-direction: row; justify-content: space-between; align-items: flex-end;">
    <div><div style="font-size: 12px; font-weight: 700; opacity: .85;">LATEST BEST · 10 KM</div><div class="num" style="font-size: 40px; margin-top: 6px;">53:50</div><div style="font-size: 12px; opacity: .85; margin-top: 4px;">16 Aug · inside the 16 km long run · <span style="color: {GRN_H}; font-weight: 800;">−1:12</span> on 2025</div></div>
    <div style="text-align: right;"><div class="num" style="font-size: 22px; color: {AMB_H};">1:54</div><div style="font-size: 11px; opacity: .85;">HM predicted</div></div>
  </div>
'''+chips(["Best times","Benchmarks","Predictions"],"Best times")
records += rec("5 km",[("2024","26:12","",100,False),("2025","24:51","−1:21",94,False),("2026","24:04","−0:47",90,True)])
records += rec("10 km",[("2024","58:40","",100,False),("2025","55:02","−3:38",93,False),("2026","53:50*","−1:12",90,True)])
records += rec("Half",[("2025","1:58:12","",100,True),("2026","—","13 Sep",0,False)])
records += f'  <div class="k" style="padding: 0 6px; font-size: 11px;">* estimated from lap splits · season = calendar year</div>\n'
records += END_BODY+tail("rec")

# ---------------- SETTINGS ----------------
def row(k,v,last=False):
    b = "" if last else f" border-bottom: 1px solid {BOR};"
    return f'    <div style="display: flex; align-items: center; justify-content: space-between; min-height: 44px;{b}"><span style="font-weight: 600;">{k}</span><div style="display: flex; align-items: center; gap: 8px; color: {MUT}; font-size: 13px; font-weight: 600;"><span>{v}</span>{CHEV}</div></div>\n'
def section(title, rows):
    return f'  <div class="k" style="padding: 4px 6px 0;">{title}</div>\n  <div class="tile" style="gap: 0; padding: 4px 18px;">\n'+"".join(row(k,v,i==len(rows)-1) for i,(k,v) in enumerate(rows))+"  </div>\n"
settings = head()+header("Ryan · rjmac","Account",avatar=False,right=f'<div style="width: 36px; height: 36px; border-radius: 8px; background: {TILE}; border: 1px solid {BOR}; display: flex; align-items: center; justify-content: center; color: {MUT};">{BACK}</div>')
settings += f'''  <div style="{HERO} flex-direction: row; align-items: center; gap: 14px;">
    <div style="width: 40px; height: 40px; border-radius: 8px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center;"><svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: #fff;"><path d="M10 2L4 14h4l2-4 2 4h4z"/><path d="M14 12l-2 4-2-4H7l5 9 5-9z" opacity=".55"/></svg></div>
    <div style="flex: 1;"><div style="font-weight: 800;">Strava connected</div><div style="font-size: 12px; opacity: .85;"><span style="color: {GRN_H}; font-weight: 700;">Synced</span> 19 Aug 20:14 · 142 runs</div></div>
    <span style="font-size: 12px; font-weight: 700; opacity: .85;">Disconnect</span>
  </div>
'''
settings += section("Athlete",[("Max heart rate","196 bpm"),("HR zones","125 · 145 · 160 · 178"),("Season starts","1 Jan")])
settings += section("Coach",[("Runs per week","4"),("Long run day","Sunday"),("Block length","8 weeks"),("Debrief after every run","On")])
settings += section("Data",[("Sync log","last 10 · all ok"),("Upload FIT / GPX","")])
settings += f'  <div style="display: flex; justify-content: center; font-size: 11px; color: {MUT}; font-weight: 600;">Powered by Strava</div>\n'
settings += END_BODY+tail("none")


# ---------------- MOVE SESSION SHEET ----------------
def daypick(n,d,state):
    if state=="sel": box=f'background: {TXT}; color: #fff;'
    elif state=="busy": box=f'background: {TILE}; color: {MUT}; opacity: .5; text-decoration: line-through;'
    elif state=="away": box=f'background: repeating-linear-gradient(135deg, {TILE} 0 4px, {BOR} 4px 6px); color: {MUT};'
    else: box=f'background: {TILE}; border: 1px solid {BOR}; color: {TXT};'
    return f'      <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;"><span class="k">{n}</span><div style="width: 40px; height: 40px; border-radius: 50%; box-sizing: border-box; {box} display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800;">{d}</div></div>\n'
sheet = head()+header("Thursday 20 August","Plan")
sheet += f'''  <div style="{HERO} opacity: .35;">
    <div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 12px; font-weight: 700;">HM BUILD · WEEK 5 OF 8</span></div>
    <div class="num" style="font-size: 40px;">141</div>
  </div>
  <div style="opacity: .35;">{sess("Mon 17","Easy","easy","6–7 km Z2 · ran 6.5 at 6:08, 144 bpm","6.5","On target",GRN_T)}</div>
'''+END_BODY
sheet += f'''  <div style="position: absolute; inset: 0; background: rgba(23,25,28,.35);"></div>
  <div style="position: absolute; left: 0; right: 0; bottom: 0; background: #fff; border-radius: 16px 16px 0 0; border-top: 1px solid {BOR}; padding: 10px 16px 20px; display: flex; flex-direction: column; gap: 12px;">
    <div style="width: 40px; height: 4px; border-radius: 2px; background: {BOR}; align-self: center;"></div>
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; flex-direction: column; gap: 4px;"><div style="display: flex; align-items: center; gap: 8px;">{tpill("long")}<span class="k">Sun 23 Aug</span></div><span class="num" style="font-size: 20px;">12–13 km long run</span></div>
    </div>
    <div class="tile" style="gap: 10px;">
      <span class="k">Move to</span>
      <div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px;">
{daypick("T",20,"busy")}{daypick("F",21,"free")}{daypick("S",22,"busy")}{daypick("S",23,"away")}{daypick("M",24,"sel")}{daypick("T",25,"free")}{daypick("W",26,"free")}      </div>
      <div style="font-size: 12px; color: {STL_T}; line-height: 1.5;">Mon 24 keeps 48 h after Saturday's medium run; Tuesday's easy run shifts to Wednesday.</div>
    </div>
    <div class="tile" style="gap: 0; padding: 4px 16px;">
      <div style="display: flex; align-items: center; justify-content: space-between; min-height: 44px; border-bottom: 1px solid {BOR};"><span style="font-weight: 600;">Target</span><div style="display: flex; align-items: center; gap: 8px; color: {MUT}; font-size: 13px; font-weight: 600;"><span>Long · 12–13 km · Z2</span>{CHEV}</div></div>
      <div style="display: flex; align-items: center; justify-content: space-between; min-height: 44px; border-bottom: 1px solid {BOR};"><span style="font-weight: 600;">Away · Sat 22 – Sun 23</span><div style="width: 40px; height: 24px; border-radius: 12px; background: {GRN}; position: relative;"><div style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; border-radius: 50%; background: #fff;"></div></div></div>
      <div style="display: flex; align-items: center; justify-content: space-between; min-height: 44px;"><span style="font-weight: 600; color: {RED};">Skip this session</span>{CHEV}</div>
    </div>
    <div style="display: flex; gap: 8px;">
      <div style="flex: 1; height: 46px; display: flex; align-items: center; justify-content: center; background: {ACC}; color: #fff; border-radius: 8px; font-weight: 800; font-size: 14px;">Move to Mon 24</div>
      <div style="height: 46px; padding: 0 16px; display: flex; align-items: center; justify-content: center; background: {TILE}; border: 1px solid {BOR}; border-radius: 8px; font-weight: 700; font-size: 13px;">Re-plan week</div>
    </div>
  </div>
</div>
</x-dc>
<script data-dc-script data-props='{{}}'>
class Component extends DCLogic {{ renderVals() {{ return {{}}; }} }}
</script>
</body>
</html>
'''


# ---------------- SESSION DETAIL ----------------
def seg(label,detail,km,col):
    return f'''    <div style="display: flex; align-items: center; gap: 12px; min-height: 40px; padding: 0 4px; border-bottom: 1px solid {BOR};"><div style="width: 8px; height: 8px; border-radius: 50%; background: {col}; flex-shrink: 0;"></div><div style="flex: 1;"><div style="font-weight: 700;">{label}</div><div style="font-size: 12px; color: {MUT};">{detail}</div></div><div class="num" style="font-size: 18px;">{km}</div></div>
'''
def tip(n,strong,rest):
    return f'      <div style="display: flex; gap: 10px;"><span class="num" style="font-size: 13px; color: {GRN_T}; width: 16px; flex-shrink: 0;">{n}</span><span><strong>{strong}</strong> {rest}</span></div>\n'
session = head()+header("Sun 23 Aug · Long run","Session",avatar=False,right=f'<div style="height: 36px; padding: 0 14px; border-radius: 8px; background: {TILE}; border: 1px solid {BOR}; display: flex; align-items: center; font-size: 13px; font-weight: 700;">Edit</div>')
session += f'''  <div style="{HERO} gap: 10px;">
    <div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 12px; font-weight: 700; opacity: .85;">WEEK 5 · SESSION 5 OF 5</span>{pill("Long","rgba(255,255,255,.18)")}</div>
    <div style="display: flex; align-items: baseline; gap: 10px;"><span class="num" style="font-size: 44px;">12–13 km</span><span style="font-size: 14px; opacity: .85;">about 1 h 15</span></div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px;">
      <div><div class="num" style="font-size: 20px;">6:00–6:20</div><div style="font-size: 11px; opacity: .85;">/km · first 9 km</div></div>
      <div><div class="num" style="font-size: 20px;">5:25–5:35</div><div style="font-size: 11px; opacity: .85;">/km · last 3 km</div></div>
      <div><div class="num" style="font-size: 20px; color: {AMB_H};">&lt; 145</div><div style="font-size: 11px; opacity: .85;">bpm until 9 km</div></div>
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.14); font-size: 12px;"><span style="opacity: .85;">Route · Mafra → Ericeira road · 12.6 km · 140 m</span><span style="font-weight: 700;">Change</span></div>
    <div style="display: flex; gap: 12px; font-size: 12px; opacity: .9;">{wx(WX_CLOUD,"Sun 08:00 · 17 °C")}{wx(WX_WIND,"12 km/h · tailwind home")}</div>
  </div>
  <div class="tile" style="gap: 0; padding: 4px 14px;">
{seg("Warm-up","Easy, find the rhythm · Z1–Z2","2 km",ZONE[1])}{seg("Steady","Z2 · conversational · under 145","7 km",ZONE[1])}{seg("HM effort","5:25–5:35 /km · Z3, not harder","3 km",ZONE[2])}{seg("Cool-down","Jog / walk","1 km",ZONE[0])}  </div>
  <div class="tile" style="gap: 8px;">
    <div style="display: flex; justify-content: space-between; align-items: center;"><span class="k">Coach tips for this run</span><span class="k" style="font-size: 11px;">from your last 6 long runs</span></div>
    <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; line-height: 1.45;">
{tip(1,"Start slower than feels right.","Your last two long runs opened at 5:40 and drifted over 145 by km 6. Aim for 6:15 early.")}{tip(2,"The finish is 3 km at HM effort, not a race.","If HR passes 170 before km 11, ease off.")}{tip(3,"Cool and a tailwind home:","good day for the HM-effort finish. Still drink at the turn.")}    </div>
  </div>
  <div style="display: flex; gap: 8px;">
    <div style="flex: 1; height: 46px; display: flex; align-items: center; justify-content: center; background: {ACC}; color: #fff; border-radius: 8px; font-weight: 800; font-size: 14px;">Brief me before the run</div>
    <div style="height: 46px; padding: 0 16px; display: flex; align-items: center; justify-content: center; background: {TILE}; border: 1px solid {BOR}; border-radius: 8px; font-weight: 700; font-size: 13px;">Move</div>
  </div>
'''+END_BODY+tail("plan")


# ---------------- CALENDAR (shared by Plan · Month and Runs · Calendar) ----------------
def calcell(d, done=None, plan=None, today=False, sel=False, faded=False):
    if d is None: return '<div></div>'
    dots=""
    if done: dots+=f'<i style="width: 7px; height: 7px; border-radius: 50%; background: {TYPE[done]};"></i>'
    if plan: dots+=f'<i style="width: 7px; height: 7px; border-radius: 50%; border: 1.5px solid {TYPE[plan]}; box-sizing: border-box;"></i>'
    box = f"background: {TXT}; color: #fff;" if sel else (f"box-shadow: inset 0 0 0 1.5px {TXT};" if today else "")
    col = MUT if faded else TXT
    return f'<div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 4px 0;"><div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: {col}; {box}">{d}</div><div style="display: flex; gap: 3px; height: 7px;">{dots}</div></div>'
# August 2026: 1 Aug is a Saturday → Mon-start grid offset 5
days=[None]*5+list(range(1,32))+[None]*(42-36)
cal_done={2:"long",4:"easy",6:"tempo",9:"long",11:"easy",13:"medium",16:"long",17:"easy",19:"tempo"}
cal_plan={20:"easy",22:"medium",23:"long",25:"easy",27:"tempo",29:"medium",30:"race"}
cells="".join(calcell(d, cal_done.get(d), cal_plan.get(d), today=(d==20), sel=(d==19), faded=(d is not None and d>20)) for d in days)
calendar = head()+header("August 2026","Plan",f'<div style="display: flex; border: 1px solid {BOR}; border-radius: 8px; overflow: hidden; height: 36px;"><span style="padding: 0 14px; display: flex; align-items: center; font-size: 13px; font-weight: 700; color: {MUT};">Week</span><span style="padding: 0 14px; display: flex; align-items: center; font-size: 13px; font-weight: 800; background: {TXT}; color: #fff;">Month</span></div>')
calendar += f'''  <div class="tile" style="gap: 6px; padding: 12px 10px;">
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 6px 4px;"><svg class="ic" viewBox="0 0 24 24" style="width: 18px; height: 18px; color: {MUT};"><path d="M15 6l-6 6 6 6"/></svg><span style="font-weight: 800;">August 2026</span><svg class="ic" viewBox="0 0 24 24" style="width: 18px; height: 18px; color: {MUT};"><path d="M9 6l6 6-6 6"/></svg></div>
    <div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); text-align: center;">{"".join(f'<span class="k" style="font-size: 10px;">{w}</span>' for w in "MTWTFSS")}</div>
    <div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr));">{cells}</div>
    <div style="display: flex; gap: 14px; justify-content: center; padding-top: 6px; border-top: 1px solid {BOR}; font-size: 11px; color: {MUT}; font-weight: 600;"><span style="display: flex; align-items: center; gap: 5px;"><i style="width: 7px; height: 7px; border-radius: 50%; background: {TYPE["long"]};"></i>done</span><span style="display: flex; align-items: center; gap: 5px;"><i style="width: 7px; height: 7px; border-radius: 50%; border: 1.5px solid {TYPE["long"]}; box-sizing: border-box;"></i>planned</span><span style="display: flex; align-items: center; gap: 5px;"><i style="width: 7px; height: 7px; border-radius: 50%; background: {TXT};"></i>race / TT</span></div>
  </div>
  <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 6px;"><span style="font-weight: 800;">Wed 19 Aug</span>{pill("On target","",GRN_T)}</div>
  <div class="tile" style="flex-direction: row; align-items: center; gap: 14px; padding: 12px 16px;">
    <div style="flex: 1; min-width: 0;"><div style="display: flex; align-items: center; gap: 8px;">{tpill("tempo")}<span class="k">18:02 · Mafra Corrida</span></div><div style="font-size: 12px; color: {MUT}; margin-top: 4px;">Planned 3 km @ 4:50–5:10 inside 7–8 km · ran 7.4 km</div></div>
    <div style="display: flex; gap: 12px;"><div style="text-align: right;"><div class="num" style="font-size: 20px;">5:26</div><div class="k" style="font-size: 10px;">/km</div></div><div style="text-align: right;"><div class="num" style="font-size: 20px; color: {STL_T};">158</div><div class="k" style="font-size: 10px;">bpm</div></div></div>
  </div>
  <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 6px;"><span style="font-weight: 800;">Month</span><span class="k">91 km · 12 runs · 11 at effort</span></div>
'''+END_BODY+tail("plan")

for name,content in [("Main",home),("Plan",plan),("Runs",acts),("RunDetail",detail),("Trends",trends),("Records",records),("Settings",settings),("MoveSession",sheet),("Session",session),("Calendar",calendar)]:
    open(f"{name}.dc.html","w").write(content)
json.dump({
 "artboards":[
  {"file":"Main.dc.html","title":"Home","x":0,"y":0,"w":390,"h":844},
  {"file":"Plan.dc.html","x":470,"y":0,"w":390,"h":844},
  {"file":"Runs.dc.html","x":940,"y":0,"w":390,"h":844},
  {"file":"RunDetail.dc.html","title":"Run detail","x":1410,"y":0,"w":390,"h":844},
  {"file":"Trends.dc.html","x":0,"y":940,"w":390,"h":844},
  {"file":"Records.dc.html","x":470,"y":940,"w":390,"h":844},
  {"file":"Settings.dc.html","title":"Account","x":940,"y":940,"w":390,"h":844},
  {"file":"Session.dc.html","title":"Plan · session","x":1410,"y":940,"w":390,"h":844},
  {"file":"MoveSession.dc.html","title":"Plan · move session","x":1880,"y":940,"w":390,"h":844},
  {"file":"Calendar.dc.html","title":"Calendar (Plan · Month / Runs)","x":1880,"y":0,"w":390,"h":844}],
 "annotations":[{"id":"note","x":2350,"y":0,"w":360,"text":"Ritmo · Midnight Citrus\nTop row is the daily loop (Home → Plan → Runs → Run detail); bottom row the review screens. Settings opens from the profile button.\n\nNavy carries the brand (hero, buttons, active tab, avatar). Sky = HR/fitness/medium, tangerine = load/fatigue/tempo, lime = on target/form/long — used in tinted metric tiles, bars, zone strips and chart lines."}],
 "launch":{"view":"canvas"}}, open("canvas.json","w"), indent=2)
print("ok")
