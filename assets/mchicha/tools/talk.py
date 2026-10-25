import numpy as np, json
from PIL import Image
from scipy import ndimage
from align2 import align2, paste, rs, gray
L=lambda n: np.asarray(Image.open(f"out/{n}.png").convert("RGBA")).astype(np.float32)
def S(a,n): Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save(f"out/{n}.png")
def key(img):
    im=np.asarray(img.convert("RGB")).astype(np.float32); r,g,b=im[...,0],im[...,1],im[...,2]; mx=np.maximum(r,b); green=g-mx
    a=np.clip(1-(green-40)/70,0,1); g2=np.where(green>0,np.minimum(g,mx+6),g); return np.dstack([r,g2,b,a*255])
O=L("hs_none"); offs=json.load(open("offs.json"))
mouths={"t1":"m_br1","t2":"m_bm1","t3":"m_bl1"}
for tag,src in mouths.items():
    A=key(Image.open(f"out/{src}_raw.png"))
    al=A[...,3]>128; ys,xs=np.where(al); fw=xs.max()-xs.min()
    ow=np.where(O[...,3]>128)[1]; ow=ow.max()-ow.min()
    f=ow/fw; Au=rs(A,f)
    # where does O (scaled s) sit inside the upscaled source? match eyes and ears, not the mouth
    e,s,dy,dx=align2(Au,O,(.12,.56,.12,.88),scales=np.arange(.9,1.11,.02)); print(tag,"fit",round(f,2),round(s,2),dy,dx,round(e,1))
    # bring source into O's frame
    inv=1/s; Ai=rs(Au,inv); oy,ox=int(round(-dy*inv)),int(round(-dx*inv))
    canvas=np.zeros_like(O)
    hh,ww=Ai.shape[:2]
    ys0,ys1=max(0,oy),min(O.shape[0],oy+hh); xs0,xs1=max(0,ox),min(O.shape[1],ox+ww)
    canvas[ys0:ys1,xs0:xs1]=Ai[ys0-oy:ys1-oy,xs0-ox:xs1-ox]
    h,w=O.shape[:2]
    d=np.abs(canvas[...,:3]-O[...,:3]).sum(-1); m=d>70
    mm=np.zeros_like(m); mm[int(h*.60):int(h*.86),int(w*.33):int(w*.67)]=True; m&=mm
    m=ndimage.binary_dilation(ndimage.binary_opening(m,iterations=1),iterations=4); soft=ndimage.gaussian_filter(m.astype(np.float32),1.8)
    S(paste(O,canvas,soft,0,0),f"hsm_none_{tag}")
    np.save(f"out/mouth_{tag}.npy",np.dstack([canvas,soft[...,None]*255]))
    for hat,(sc,hy,hx) in offs.items():
        if hat=="none": continue
        H=L(f"hs_{hat}"); C2=rs(canvas,sc); s2=np.asarray(Image.fromarray((soft*255).astype(np.uint8)).resize((C2.shape[1],C2.shape[0]),Image.LANCZOS)).astype(np.float32)/255
        # never paint over the hat or scarf: skip strongly coloured pixels of the target
        sat=H[...,:3].max(-1)-H[...,:3].min(-1); keep=(sat<70).astype(np.float32)
        hh2,ww2=s2.shape; ys0,ys1=max(0,hy),min(H.shape[0],hy+hh2); xs0,xs1=max(0,hx),min(H.shape[1],hx+ww2)
        s2c=s2.copy(); s2c[ys0-hy:ys1-hy,xs0-hx:xs1-hx]*=ndimage.minimum_filter(keep,3)[ys0:ys1,xs0:xs1]
        S(paste(H,C2,s2c,hy,hx),f"hsm_{hat}_{tag}")
