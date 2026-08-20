import re, os, json, shutil, tempfile
SRC=open('../graphite/build.py').read()
tokline=re.search(r'^BG=.*$',SRC,re.M).group(0)
accline=re.search(r'^AMB=.*$',SRC,re.M).group(0)
zoneline=re.search(r'^ZONE=.*$',SRC,re.M).group(0)
BG,TILE,TXT,MUT,GA,GB,ACC="#ffffff","#f2f4f2","#121a16","#5d6862","#163a2c","#2f6b52","#163a2c"
# name, STL(HR/fitness/medium), AMB(load/fatigue/tempo), GRN(on target/form/long), and hero-bright variants, text-dark variants, note
V=[
 ("Citrus","#2f9ad0","#f08a24","#7ab648","#7fd0f7","#ffb25c","#b5e07a","#1f6f9a","#b85f0f","#4f8a22",
  "Pine · Citrus\nSky, tangerine, lime. Fresh and sporty; tangerine gives the warnings punch without reading as red."),
 ("Coral","#3fb8ad","#e8b83a","#f26b5b","#7fe0d6","#ffd36b","#ff9a8c","#1f8a80","#a8800f","#c2443a",
  "Pine · Coral\nAqua, gold, coral. Warmer and more playful; coral as 'on target' is unexpected but joyful."),
 ("Berry","#8b7fd6","#e5b432","#d9417a","#b8aef5","#ffd35c","#ff7fb0","#5c4fb0","#a8800f","#b0255c",
  "Pine · Berry\nLavender, mustard, raspberry. The most distinctive; strong contrast against the forest hero. Risk: least 'athletic'."),
 ("Copper","#2fa3a0","#e3c27a","#c8703a","#7fd8d4","#f5dca0","#f2a06b","#1f7a78","#a88a3a","#9a4f1f",
  "Pine · Copper\nTeal, sand, copper. Earthy and grown-up; pairs naturally with forest green. Risk: the quietest of the four."),
]
arts=[];notes=[]
for i,(n,STL,AMB,GRN,STL_H,AMB_H,GRN_H,STL_T,AMB_T,GRN_T,note) in enumerate(V):
    s=SRC.replace(tokline,f'BG="{BG}"; TILE="{TILE}"; TXT="{TXT}"; MUT="{MUT}"; GA="{GA}"; GB="{GB}"')
    s=s.replace(accline,f'AMB="{AMB}"; GRN="{GRN}"; STL="{STL}"; RED="#d9534f"; ACC="{ACC}"; GRN_T="{GRN_T}"; AMB_T="{AMB_T}"; AMB_H="{AMB_H}"; GRN_H="{GRN_H}"; STL_H="{STL_H}"')
    s=s.replace(zoneline,f'ZONE=["#cfd6d2",STL,GRN,AMB,"#d9534f"]')
    s=s.replace('TYPE_T={"easy":"#5f646b","medium":"#3f5f8a","tempo":"#a8740f","long":"#1f7a4f","race":TXT}',f'TYPE_T={{"easy":"#5f646b","medium":"{STL_T}","tempo":"{AMB_T}","long":"{GRN_T}","race":TXT}}')
    d=tempfile.mkdtemp(); cwd=os.getcwd(); os.chdir(d); exec(compile(s,'b','exec'),{}); os.chdir(cwd)
    for scr in ("Main","Trends"):
        out=f'{n}{scr}.dc.html'; shutil.copy(os.path.join(d,f'{scr}.dc.html'),out)
        arts.append({"file":out,"title":f"Pine · {n} · {'Home' if scr=='Main' else 'Trends'}","x":i*470,"y":2200+(0 if scr=='Main' else 900),"w":390,"h":844})
    notes.append({"id":f"v{i+1}","x":i*470,"y":2100,"w":390,"text":note})
c=json.load(open('canvas.json'))
c["artboards"]=[a for a in c["artboards"] if not a["file"].startswith(("Citrus","Coral","Berry","Copper"))]+arts
c["annotations"]=[a for a in c["annotations"] if not a["id"].startswith("v")]+notes
json.dump(c,open('canvas.json','w'),indent=2); print("ok")
