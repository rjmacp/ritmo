import re, os, subprocess, json, shutil, tempfile
SRC=open('../graphite/build.py').read()
# name, BG, TILE, TXT, MUT, GA, GB, STL, AMB, GRN, ACC, STL_H, AMB_H, GRN_H, note
P=[
 ("Midnight","#ffffff","#f3f4f6","#141a26","#5f6776","#16223d","#2c4570","#3b6fb0","#d9a03a","#2d9a6a","#16223d","#8fb3e8","#f2bd4a","#5fcf96",
  "P1 · Midnight\nDeep navy hero, white page, cool grey tiles. Serious, nautical; blue is the most 'trusted' colour for data apps. Risk: the most common choice."),
 ("Espresso","#fcfaf6","#f3efe8","#241c18","#6b6058","#2b2320","#5a4a42","#4d6e8f","#c77d3a","#5f8a4a","#2b2320","#9fb9d6","#f0a868","#9fcf7a",
  "P2 · Espresso\nWarm brown hero on cream, terracotta/olive/gold data colours. Cosy and distinctive — nobody's running app is brown. Risk: can read 'coffee shop'."),
 ("Pine","#ffffff","#f2f4f2","#121a16","#5d6862","#163a2c","#2f6b52","#3b7bb8","#d6a13a","#7ab648","#163a2c","#8fc6ee","#f2c55a","#b5e07a",
  "P3 · Pine\nDeep forest hero, white page. Outdoors without being 'trail-brown'; green as brand rather than as a data colour. Risk: 'on target' green needs to shift to lime so it stays distinct."),
 ("Burgundy","#fdfbfb","#f5f0f1","#1f141a","#6e5f66","#471a2a","#7a3446","#4a6d9c","#d4a640","#3f9a72","#471a2a","#a4bde4","#f2c55a","#6fd1a0",
  "P4 · Burgundy\nWine-red hero, blush page. Confident, premium, unusual for sport. Risk: red family — keep 'too hard' warnings amber rather than red to avoid clashing."),
 ("Indigo","#ffffff","#f3f3f8","#15152b","#62627a","#26286e","#4d51c2","#2fa0c8","#f0a030","#2fb87a","#26286e","#7fd6f2","#ffc46b","#6fe0a8",
  "P5 · Indigo\nElectric indigo hero, white page, cyan/orange/green data. The most energetic; reads 'tech'. Risk: least calm of the set."),
 ("Sand","#ffffff","#f5f2ea","#1d1a14","#6b6558","#e6d9bf","#d3c19c","#3f5f8a","#b56a2a","#5f8a4a","#1d1a14","#3f5f8a","#9c4f18","#3e6a2c",
  "P6 · Sand\nInverts the idea: a light sand hero with dark text, black buttons, white page. Calm, editorial, very different feel from the charcoal. Risk: less contrast for the hero numbers at a glance."),
]
tokline=re.search(r'^BG=.*$',SRC,re.M).group(0)
accline=re.search(r'^AMB=.*$',SRC,re.M).group(0)
arts=[];notes=[]
for i,(n,BG,TILE,TXT,MUT,GA,GB,STL,AMB,GRN,ACC,STL_H,AMB_H,GRN_H,note) in enumerate(P):
    s=SRC.replace(tokline,f'BG="{BG}"; TILE="{TILE}"; TXT="{TXT}"; MUT="{MUT}"; GA="{GA}"; GB="{GB}"')
    s=s.replace(accline,f'AMB="{AMB}"; GRN="{GRN}"; STL="{STL}"; RED="#d9534f"; ACC="{ACC}"; GRN_T="{GRN}"; AMB_T="{AMB}"; AMB_H="{AMB_H}"; GRN_H="{GRN_H}"; STL_H="{STL_H}"')
    if n=="Sand":  # dark text on light hero
        s=s.replace('color: #fff; display: flex; flex-direction: column; gap: 14px;','color: #1d1a14; display: flex; flex-direction: column; gap: 14px;')
        s=s.replace('background: rgba(255,255,255,.18);">HM Build','background: rgba(0,0,0,.08);">HM Build')
        s=s.replace('stroke="rgba(255,255,255,.18)" stroke-width="10"','stroke="rgba(0,0,0,.08)" stroke-width="10"')
        s=s.replace('background: rgba(255,255,255,.94); color: {TXT}; border-radius: 8px; font-weight: 800; font-size: 14px;">Pre-session brief','background: {ACC}; color: #fff; border-radius: 8px; font-weight: 800; font-size: 14px;">Pre-session brief')
    d=tempfile.mkdtemp(); cwd=os.getcwd(); os.chdir(d)
    exec(compile(s,'b','exec'),{})
    os.chdir(cwd); shutil.copy(os.path.join(d,'Main.dc.html'), f'{n}.dc.html')
    fname = "Main.dc.html" if i==0 else f"{n}.dc.html"
    if i==0: shutil.move(f'{n}.dc.html','Main.dc.html')
    arts.append({"file":fname,"title":f"P{i+1} · {n}","x":(i%3)*470,"y":(i//3)*1000,"w":390,"h":844})
    notes.append({"id":f"p{i+1}","x":(i%3)*470,"y":(i//3)*1000+870,"w":390,"text":note})
json.dump({"artboards":arts,"annotations":notes,"launch":{"view":"canvas"}},open('canvas.json','w'),indent=2)
print("ok")
