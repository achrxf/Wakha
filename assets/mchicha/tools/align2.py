import numpy as np
from PIL import Image
def rs(a, s):
    h,w=a.shape[:2]; return np.asarray(Image.fromarray(np.clip(a,0,255).astype(np.uint8)).resize((max(1,int(w*s)),max(1,int(h*s))),Image.LANCZOS)).astype(np.float32)
def gray(a): return a[...,:3].mean(-1)*(a[...,3]/255)+255*(1-a[...,3]/255)
def align2(H, ref, boxf, scales=np.arange(.84,1.17,.02)):
    """find scale s and offset (dy,dx) so that ref scaled by s, placed at (dy,dx) in H, matches inside ref's box (fractions)."""
    Hg=gray(H); best=None
    def err(Rb,y0,y1,x0,x1,dy,dx):
        if dy+y0<0 or dx+x0<0 or dy+y1>Hg.shape[0] or dx+x1>Hg.shape[1]: return None
        return ((Hg[dy+y0:dy+y1,dx+x0:dx+x1]-Rb)**2).mean()
    for s in list(scales)+[1.0]:
        R=gray(rs(ref,s)); h,w=R.shape
        y0,y1,x0,x1=int(h*boxf[0]),int(h*boxf[1]),int(w*boxf[2]),int(w*boxf[3]); Rb=R[y0:y1,x0:x1]
        cand=[]
        for dy in range(-y0, Hg.shape[0]-y1+1, 3):
            for dx in range(-x0, Hg.shape[1]-x1+1, 3):
                e=err(Rb,y0,y1,x0,x1,dy,dx); cand.append((e,dy,dx))
        cand.sort(); 
        for e,dy,dx in cand[:3]:
            for ddy in range(dy-3,dy+4):
                for ddx in range(dx-3,dx+4):
                    e2=err(Rb,y0,y1,x0,x1,ddy,ddx)
                    if e2 is not None and (best is None or e2<best[0]): best=(e2,s,ddy,ddx)
    return best
def paste(H, src, alpha, dy, dx, with_alpha=False):
    out=H.copy(); hh,ww=alpha.shape
    ys0,ys1=max(0,dy),min(H.shape[0],dy+hh); xs0,xs1=max(0,dx),min(H.shape[1],dx+ww)
    a=alpha[ys0-dy:ys1-dy,xs0-dx:xs1-dx,None]
    ch=4 if with_alpha else 3
    out[ys0:ys1,xs0:xs1,:ch]=out[ys0:ys1,xs0:xs1,:ch]*(1-a)+src[ys0-dy:ys1-dy,xs0-dx:xs1-dx,:ch]*a
    return out
