import os, io, base64
from PIL import Image
D="out"; OLD="../sprites/named"; pick={}
for p in ["sassy","happy","playful","grumpy","annoyed","sad","curious","wow","mischievous"]: pick[f"p_{p}"]=f"{D}/p_{p}.png"
for p in ["sassy","playful","grumpy","annoyed","sad","curious","wow","mischievous"]:
    pick[f"p_{p}_h"]=f"{D}/pb_{p}_h.png"; pick[f"p_{p}_c"]=f"{D}/pb_{p}_c.png"
HATS=["none","tarbouche","tagiya","terrazza","cheche","beanie","bucket","rose","shades"]
for h in HATS:
    for k in "sgwdh": pick[f"h{k}_{h}"]=f"{D}/h{k}_{h}.png"
    if h!="shades": pick[f"hs_{h}_c"]=f"{D}/hsb_{h}.png"
    for t in (1,2,3): pick[f"hs_{h}_t{t}"]=f"{D}/hsm_{h}_t{t}.png"
pick["hs_none_e1"]=f"{D}/hst_none_1.png"; pick["hs_none_e2"]=f"{D}/hst_none_2.png"
for k in ["b_love","b_wink","b_happy","b_sassy"]: pick[k]=f"{OLD}/{k}.png"
for f in os.listdir(OLD):
    if f[:2] in ("f_","a_"): pick[f[:-4]]=f"{OLD}/{f}"
pick["f_unimpressed"]=f"{D}/p_f_unimpressed2.png"; pick["f_unimpressed_h"]=f"{D}/pb_f_unimpressed2_h.png"; pick["f_unimpressed_c"]=f"{D}/pb_f_unimpressed2_c.png"
for i,src in enumerate([2,3,0,4,1,5,6]): pick[f"j_{i}"]=f"{D}/jump_{src}.png"
os.makedirs("final",exist_ok=True)
out=["// generated from the green-screen sheets in assets/mchicha/sheets by assets/mchicha/tools (WebP data URIs)","const CAT_IMG = {"]; tot=0
for k in sorted(pick):
    im=Image.open(pick[k]).convert("RGBA"); lim=480 if k[0] in "faj" else 260
    if max(im.size)>lim: r=lim/max(im.size); im=im.resize((round(im.width*r),round(im.height*r)),Image.LANCZOS)
    im.save(f"final/{k}.png"); b=io.BytesIO(); im.save(b,"WEBP",quality=82,method=6); d=b.getvalue(); tot+=len(d)
    out.append(f'  {k}:"data:image/webp;base64,{base64.b64encode(d).decode()}",')
out.append("};"); open("../Wakha/src/cat_sprites.js","w").write("\n".join(out)+"\n")
print(len(pick),"sprites",round(tot/1024),"KB")
