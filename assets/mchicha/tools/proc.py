import numpy as np, os, json
from PIL import Image
from scipy import ndimage
os.makedirs("out", exist_ok=True)
def key(path):
    im=np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    r,g,b=im[...,0],im[...,1],im[...,2]; mx=np.maximum(r,b); green=g-mx
    a=np.clip(1-(green-40)/70,0,1); g2=np.where(green>0,np.minimum(g,mx+6),g)
    return np.dstack([r,g2,b,a*255])
def comps(rgba, minarea=4000):
    m=ndimage.binary_opening(rgba[...,3]>128,iterations=1)
    lab,n=ndimage.label(ndimage.binary_dilation(m,iterations=6))
    boxes=[]
    for sl in ndimage.find_objects(lab):
        if (sl[0].stop-sl[0].start)*(sl[1].stop-sl[1].start)<minarea: continue
        boxes.append((sl[0].start,sl[1].start,sl[0].stop,sl[1].stop))
    boxes.sort(key=lambda b:(round(b[0]/120),b[1])); return boxes
def crop(rgba,box,pad=8):
    y0,x0,y1,x1=box; H,W=rgba.shape[:2]
    return rgba[max(0,y0-pad):min(H,y1+pad),max(0,x0-pad):min(W,x1+pad)].copy()
def save(a,name): Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save(f"out/{name}.png")
def union(bs):
    return (min(b[0] for b in bs),min(b[1] for b in bs),max(b[2] for b in bs),max(b[3] for b in bs))
def near(box,boxes):
    cy,cx=(box[0]+box[2])/2,(box[1]+box[3])/2
    return min(boxes,key=lambda b:((b[0]+b[2])/2-cy)**2+((b[1]+b[3])/2-cx)**2)
def isolate(a, keep_center=True):
    # drop stray bits that belong to neighbours: keep components touching the crop centre region
    m=a[...,3]>40; lab,n=ndimage.label(ndimage.binary_dilation(m,iterations=3))
    if n<=1: return a
    sizes=ndimage.sum(m,lab,range(1,n+1)); big=np.argmax(sizes)+1
    keep=np.zeros_like(m); H,W=m.shape
    for i in range(1,n+1):
        reg=lab==i; ys,xs=np.where(reg)
        border=ys.min()<=2 or xs.min()<=2 or ys.max()>=H-3 or xs.max()>=W-3
        if sizes[i-1]>sizes[big-1]*0.02 and not (border and sizes[i-1]<sizes[big-1]*0.3): keep|=reg
    a=a.copy(); a[...,3]=np.where(keep,a[...,3],0); return a
report={}
# ---- portraits: open / half / closed, same boxes ----
P=["sassy","happy","playful","grumpy","annoyed","sad","curious","wow","mischievous","f_sleepy2","f_unimpressed2","f_love2","f_wink2"]
O,Hh,Cc=key("in/16_0d2a8780.jpg"),key("in/00_8438a8a3.jpg"),key("in/12_a9043a10.jpg")
bo,bh,bc=comps(O),comps(Hh),comps(Cc)
print("portrait comps",len(bo),len(bh),len(bc))
for i,b in enumerate(bo):
    u=union([b,near(b,bh),near(b,bc)])
    for arr,suf in [(O,""),(Hh,"_h"),(Cc,"_c")]:
        save(isolate(crop(arr,u)),f"p_{P[i]}{suf}")
# ---- hat sheets: sassy(old), grumpy, wow, sad, happy + old blink cell, same boxes per cell ----
HATS=["none","tarbouche","tagiya","terrazza","cheche","beanie","bucket","rose","shades"]
sheets={"s":"in/14_82d53c13.jpg","g":"in/01_7dcac596.jpg","w":"in/02_d68243c7.jpg","d":"in/03_304068a9.jpg","h":"in/04_d47e523c.jpg"}
K={k:key(v) for k,v in sheets.items()}; BL=key("in/13_6205cb12.jpg"); EAR=key("in/09_3e9427dc.jpg")
cell=1024/3
for idx,h in enumerate(HATS):
    r,c=divmod(idx,3)
    y0,x0=int(r*cell)-50,int(c*cell)-60; y1,x1=int((r+1)*cell)+60,int((c+1)*cell)+60
    bs=[]
    for k,a in K.items():
        sub=a.copy(); m=np.zeros(sub.shape[:2],bool); m[max(0,y0):y1,max(0,x0):x1]=True; sub[...,3]*=m
        cb=comps(sub,2000)
        cy,cx=(r+.5)*cell,(c+.5)*cell
        cb=[b for b in cb if b[0]<cy<b[2]+40 and b[1]-30<cx<b[3]+30] or cb
        bs.append(union(cb))
    u=union(bs)
    for k,a in K.items():
        sub=a.copy(); m=np.zeros(sub.shape[:2],bool); m[max(0,y0):y1,max(0,x0):x1]=True; sub[...,3]*=m
        save(isolate(crop(sub,u)),f"h{k}_{h}")
    if idx==0:
        for arr,name in [(BL,"hs_none_c")]+[(EAR,f"ear_{j}") for j in range(3)]:
            pass
    report[h]=u
json.dump({k:[int(x) for x in v] for k,v in report.items()},open("hatboxes.json","w"))
# closed-eye sassy no-hat and the ear-twitch cells, cut with the same box as the no-hat cell
u=report["none"]
m=np.zeros(BL.shape[:2],bool); m[:int(cell)+60,:int(cell)+60]=True
b2=BL.copy(); b2[...,3]*=m; save(isolate(crop(b2,u)),"hs_none_c")
for j in range(3):
    m=np.zeros(EAR.shape[:2],bool); m[:int(cell)+60,max(0,int(j*cell)-60):int((j+1)*cell)+60]=True
    e=EAR.copy(); e[...,3]*=m
    uj=(u[0],u[1]+int(j*cell),u[2],u[3]+int(j*cell))
    save(isolate(crop(e,uj)),f"ear_{j}")
# ---- jump flipbook from sheet 07 ----
J=key("in/08_4e178b79.jpg"); bj=comps(J)
print("jump frames",len(bj))
for i,b in enumerate(bj): save(isolate(crop(J,b)),f"jump_{i}")
J2=key("in/05_3d769da1.jpg"); bj2=comps(J2)
for i,b in enumerate(bj2): save(isolate(crop(J2,b)),f"jumpw_{i}")
print("done")
