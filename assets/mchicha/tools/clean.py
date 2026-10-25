# remove small stray pieces near the top or bottom edge (bits of neighbouring cells)
import numpy as np, os
from PIL import Image
from scipy import ndimage
n=0
for f in os.listdir("out"):
    if not f.endswith(".png"): continue
    a=np.asarray(Image.open("out/"+f).convert("RGBA")).copy()
    m=a[...,3]>40; lab,k=ndimage.label(ndimage.binary_dilation(m,iterations=2))
    if k<=1: continue
    sizes=ndimage.sum(m,lab,range(1,k+1)); big=sizes.max(); H=m.shape[0]; ch=False
    for i in range(1,k+1):
        if sizes[i-1]>=big*0.2: continue
        cy=ndimage.center_of_mass(m,lab,i)[0]/H
        if cy<0.14 or cy>0.78:
            a[...,3][lab==i]=0; ch=True
    if ch:
        Image.fromarray(a).save("out/"+f); n+=1   # same canvas size, so frames stay aligned
print("cleaned",n)
