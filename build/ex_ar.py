# Arabic-script versions of every example sentence, for the "In a sentence" panel.
# Words that are in the dictionary use their hand-written Arabic (whole phrases first, longest match);
# anything else falls back to the audio transliteration with the short-vowel marks removed,
# because Moroccans write Darija without them.
# Run after changing example sentences:  python build/ex_ar.py
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from translit import translit

data = json.loads(subprocess.check_output(["node", "-e",
    "const C=require('./load.js')();console.log(JSON.stringify({ex:Object.values(C.W).filter(w=>w.ex).map(w=>w.ex[0]),dict:Object.values(C.W).map(w=>[w.d,w.ar])}))"],
    cwd=HERE))
HARAKAT = re.compile("[ً-ْٰ]")
WORD = re.compile(r"[\w'’]+")

def norm(x):
    return re.sub(r"[^a-z0-9' ]", "", x.lower()).strip()

# spellings the audio transliteration gets wrong for reading
D = {"l7em": "اللحم", "fes": "فاس", "adam": "آدم", "sarf": "الصرف", "f d9i9a": "فالدقيقة", "d9i9a": "الدقيقة", "lkhra": "اللخرة",
     "mghrib": "مغريب", "darija": "الدارجة", "salma": "سلمى", "lmatch": "الماتش", "casa": "كازا", "merzouga": "مرزوكة", "essaouira": "الصويرة", "m’gouna": "مكونة", "mgouna": "مكونة"}
for d, ar in data["dict"]:
    k = norm(d)
    if k and ar:
        D.setdefault(k, re.sub(r"[؟!?.,،]", "", ar).strip())

def arabic(sentence):
    toks = re.findall(r"[\w'’]+|[^\w\s]+|\s+", sentence)
    out, i = [], 0
    while i < len(toks):
        w = toks[i]
        if not WORD.match(w):
            out.append(w.replace("?", "؟").replace(",", "،"))
            i += 1
            continue
        hit = None
        for span in (4, 3, 2):
            seg = toks[i:i + span * 2 - 1]
            if len(seg) == span * 2 - 1 and all(x.isspace() for x in seg[1::2]) and norm("".join(seg)) in D:
                hit = (D[norm("".join(seg))], len(seg))
                break
        if not hit and norm(w) in D:
            hit = (D[norm(w)], 1)
        if hit:
            out.append(hit[0]); i += hit[1]
        else:
            out.append(HARAKAT.sub("", translit(w))); i += 1
    # one-letter prepositions join the next word, as Darija is usually written: ف الدار -> فالدار
    return re.sub(r"(^|\s)([بفلد]) (?=\S)", r"\1\2", "".join(out))

if __name__ == "__main__":
    out = {s: arabic(s) for s in data["ex"]}
    json.dump(out, open(os.path.join(HERE, "ex_ar.json"), "w"), ensure_ascii=False, indent=0)
    print(len(out), "example sentences")
