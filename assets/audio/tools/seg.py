import soundfile as sf, numpy as np, csv, os, re, json, sys
rows=list(csv.DictReader(open('../Wakha/build/recording_map.csv')))
def expected(fname):
    m=re.match(r'([MNF])-?(\d+)-(\d+)',fname); v,a,b=m.group(1),int(m.group(2)),int(m.group(3))
    ids=[r for r in rows if r['no'][0]==v and max(a,1)<=int(r['no'][1:])<=b]
    return ids
from scipy.signal import butter, sosfiltfilt
from scipy.ndimage import median_filter
_env_cache={}
def envelope(x, sr):
    """speech-band energy per 10 ms, with clicks (shorter than ~60 ms) filtered out"""
    k=(len(x), float(x[::997].sum()))      # content fingerprint, not object id
    if k in _env_cache: return _env_cache[k]
    sos=butter(4,[150,3500],btype="band",fs=sr,output="sos"); y=sosfiltfilt(sos,x)
    hop=int(sr*0.01); n=len(y)//hop
    e=np.sqrt(np.mean(y[:n*hop].reshape(n,hop)**2,axis=1)+1e-12)
    db=median_filter(20*np.log10(e),size=7)
    _env_cache[k]=db; return db
def segments(x, sr, min_sil=0.35, thr_db=None):
    db=envelope(x,sr); n=len(db)
    floor=np.percentile(db,10); peak=np.percentile(db,99)
    thr = thr_db if thr_db is not None else floor+0.35*(peak-floor)
    on=db>thr
    # close small gaps (inside a phrase) and drop tiny blips
    segs=[]; i=0
    while i<n:
        if on[i]:
            j=i
            while j<n and on[j]: j+=1
            segs.append([i,j]); i=j
        else: i+=1
    merged=[]
    for s in segs:
        if merged and (s[0]-merged[-1][1])*0.01<min_sil: merged[-1][1]=s[1]
        else: merged.append(s)
    merged=[s for s in merged if (s[1]-s[0])*0.01>0.2]
    return merged, db, thr
out={}
for f in sorted(os.listdir('wav')):
    x,sr=sf.read('wav/'+f); exp=expected(f[:-4])
    best=None
    for ms in [0.25,0.3,0.35,0.45,0.55,0.7,0.85,1.0,1.2]:
        for k in [0.25,0.3,0.35,0.42,0.5]:
            hop=0
            segs,db,_=segments(x,sr,ms,None) if k==0.35 else (None,None,None)
            if segs is None:
                floor=None
                segs,db,thr=segments(x,sr,ms,None)
                fl=np.percentile(db,10); pk=np.percentile(db,99); segs,db,thr=segments(x,sr,ms,fl+k*(pk-fl))
            d=abs(len(segs)-len(exp))
            if best is None or d<best[0]: best=(d,ms,k,segs)
            if d==0: break
        if best[0]==0: break
    out[f[:-4]]={"exp":len(exp),"got":len(best[3]),"ms":best[1],"k":best[2],"dur":round(len(x)/sr,1)}
    print(f[:-4], "expected",len(exp),"got",len(best[3]),"(gap",best[1],"thr",best[2],")", round(len(x)/sr,1),"s")
json.dump(out,open('segreport.json','w'))
