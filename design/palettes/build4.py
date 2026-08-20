import re, os, json, shutil, tempfile
SRC=open('../graphite/build.py').read()
tokline=re.search(r'^BG=.*$',SRC,re.M).group(0)
accline=re.search(r'^AMB=.*$',SRC,re.M).group(0)
zoneline=re.search(r'^ZONE=.*$',SRC,re.M).group(0)
# name, GA, GB, STL, AMB, GRN, STL_H, AMB_H, GRN_H, STL_T, AMB_T, GRN_T, tint(bool), note
V=[
 ("Aurora","#141f3d","#1f5f6b","#2bb3a3","#f2a33a","#8a6cf0","#6fe3d4","#ffc36b","#b9a6ff","#1a8a7c","#b06f0f","#5a3fd0",True,
  "Midnight · Aurora\nHero shifts navy→teal. Mint, amber, violet secondaries; metric tiles tinted with their own colour. Northern-lights feel."),
 ("Neon","#131a3a","#3a2f8a","#18c4e8","#c6f03a","#ff4fa3","#7fe6ff","#e4ff7a","#ff9bd0","#0f8aa8","#6f8f0a","#c21f70",True,
  "Midnight · Neon\nHero navy→indigo. Cyan, lime, magenta — the loud one. Tinted tiles keep the page from feeling cold."),
 ("Sunset","#15203f","#5a2a4e","#ff7a59","#ffc145","#35c4b5","#ffa48c","#ffd77a","#7fe3d8","#c24f2e","#a8780f","#1f8a80",True,
  "Midnight · Sunset\nHero navy→plum. Coral, gold, turquoise; warm data on a cool hero. The most 'evening run' of the set."),
 ("Glacier","#172542","#2f5a8a","#6fb7ff","#c9a0ff","#ffb084","#b3dbff","#e0c8ff","#ffcdb0","#2a6fb8","#7a4fc8","#c26b3a",False,
  "Midnight · Glacier\nHero navy→steel blue. Ice blue, lilac, peach; softer and more tonal, no tinting. Calmest of the four."),
]
BG,TILE,TXT,MUT,ACC="#ffffff","#f3f4f6","#141a26","#5f6776","#16223d"
arts=[];notes=[]
for i,(n,GA,GB,STL,AMB,GRN,STL_H,AMB_H,GRN_H,STL_T,AMB_T,GRN_T,tint,note) in enumerate(V):
    s=SRC.replace(tokline,f'BG="{BG}"; TILE="{TILE}"; TXT="{TXT}"; MUT="{MUT}"; GA="{GA}"; GB="{GB}"')
    s=s.replace(accline,f'AMB="{AMB}"; GRN="{GRN}"; STL="{STL}"; RED="#d9534f"; ACC="{ACC}"; GRN_T="{GRN_T}"; AMB_T="{AMB_T}"; AMB_H="{AMB_H}"; GRN_H="{GRN_H}"; STL_H="{STL_H}"')
    s=s.replace(zoneline,f'ZONE=["#d0d5de",STL,GRN,AMB,"#d9534f"]')
    s=s.replace('TYPE_T={"easy":"#5f646b","medium":"#3f5f8a","tempo":"#a8740f","long":"#1f7a4f","race":TXT}',f'TYPE_T={{"easy":"#5f646b","medium":"{STL_T}","tempo":"{AMB_T}","long":"{GRN_T}","race":TXT}}')
    if tint:
        s=s.replace('''def stat(v,k,col=TXT,size=30): return f'<div class="tile" style="padding: 14px; gap: 6px;"><span class="num" style="font-size: {size}px; color: {col};">{v}</span><span class="k">{k}</span></div>\'''',
                    '''def stat(v,k,col=TXT,size=30):
    bg = TILE if col==TXT else col+"1f"
    return f'<div class="tile" style="padding: 14px; gap: 6px; background: {bg};"><span class="num" style="font-size: {size}px; color: {col};">{v}</span><span class="k">{k}</span></div>\'''')
        s=s.replace('stat("6","streak at effort",GRN_T)','stat("6","streak at effort",GRN)').replace('stat("24","days to HM",AMB_T)','stat("24","days to HM",AMB)')
        # tint the tempo/on-target pill on Home
    d=tempfile.mkdtemp(); cwd=os.getcwd(); os.chdir(d); exec(compile(s,'b','exec'),{}); os.chdir(cwd)
    for scr in ("Main","Trends"):
        out=f'X{n}{scr}.dc.html'; shutil.copy(os.path.join(d,f'{scr}.dc.html'),out)
        arts.append({"file":out,"title":f"Midnight · {n} · {'Home' if scr=='Main' else 'Trends'}","x":i*470,"y":6200+(0 if scr=='Main' else 900),"w":390,"h":844})
    notes.append({"id":f"x{i+1}","x":i*470,"y":6100,"w":390,"text":note})
c=json.load(open('canvas.json'))
c["artboards"]=[a for a in c["artboards"] if not a["file"].startswith("X")]+arts
c["annotations"]=[a for a in c["annotations"] if not a["id"].startswith("x")]+notes
json.dump(c,open('canvas.json','w'),indent=2); print("ok")
