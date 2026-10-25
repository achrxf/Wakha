import numpy as np, json
from PIL import Image
from scipy import ndimage
from align2 import align2, paste, rs
L=lambda n: np.asarray(Image.open(f"out/{n}.png").convert("RGBA")).astype(np.float32)
def S(a,n): Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save(f"out/{n}.png")
O=L("hs_none"); C=L("hs_none_c"); h,w=O.shape[:2]
def diffmask(A,B,y0f,y1f,thr=60,dil=5,blur=2.5,alpha=False):
    hh=min(A.shape[0],B.shape[0]); ww=min(A.shape[1],B.shape[1])
    d=np.abs(A[:hh,:ww,:3]-B[:hh,:ww,:3]).sum(-1)+(np.abs(A[:hh,:ww,3]-B[:hh,:ww,3]) if alpha else 0)
    m=d>thr; m[:int(hh*y0f)]=False; m[int(hh*y1f):]=False
    m=ndimage.binary_dilation(ndimage.binary_opening(m,iterations=1),iterations=dil)
    out=np.zeros(A.shape[:2],np.float32); out[:hh,:ww]=ndimage.gaussian_filter(m.astype(np.float32),blur); return out
eye=diffmask(O,C,.25,.72)
FACE=(.56,.74,.36,.64)   # nose, mouth, chin: never covered by a hat
offs={}
for hat in ["none","tarbouche","tagiya","terrazza","cheche","beanie","bucket","rose","shades"]:
    H=L(f"hs_{hat}"); e,s,dy,dx=align2(H,O,FACE); offs[hat]=[float(s),int(dy),int(dx)]; print(hat,round(s,2),dy,dx,round(e,1))
    if hat!="shades":
        Cs=rs(C,s); es=np.asarray(Image.fromarray((eye*255).astype(np.uint8)).resize((Cs.shape[1],Cs.shape[0]),Image.LANCZOS)).astype(np.float32)/255
        S(paste(H,Cs,es,dy,dx),f"hsb_{hat}")
json.dump(offs,open("offs.json","w"))
# ear twitch: twitch cells -> plain closed cell gives the ear pixels; place them on the open face
E0=L("ear_0"); e,s,dy,dx=align2(E0,O,FACE); print("ear sheet vs open face",round(s,2),dy,dx,round(e,1))
for j in (1,2):
    Ej=L(f"ear_{j}"); m=diffmask(E0,Ej,0,.45,dil=6,blur=2,alpha=True)
    # bring the ear cell into the open face's frame: inverse transform (scale 1/s, offset -dy,-dx)
    inv=1/s; Ejs=rs(Ej,inv); ms=np.asarray(Image.fromarray((m*255).astype(np.uint8)).resize((Ejs.shape[1],Ejs.shape[0]),Image.LANCZOS)).astype(np.float32)/255
    S(paste(O,Ejs,ms,int(round(-dy*inv)),int(round(-dx*inv)),with_alpha=True),f"hst_none_{j}")
