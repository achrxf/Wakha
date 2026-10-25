# Assign recorded pieces to script lines by dynamic programming.
# A line may take 1-3 neighbouring pieces (a pause inside a phrase) or none (not recorded); a piece may be noise.
import soundfile as sf, numpy as np, json, re, math
exec(open('seg.py').read().split("out={}")[0])
rep = json.load(open('segreport.json'))
NUMW = {"0":2,"1":2,"2":2,"3":3,"4":3,"5":3,"6":3,"7":3,"8":3,"9":3}
def weight(t):
    t = t.replace("ar:", "")
    if re.search(r"[؀-ۿ]", t) and not re.search(r"[a-z]", t, re.I): return 4.0
    n = sum(NUMW.get(c, 0) * 2.2 for c in t if c.isdigit())
    return len(re.sub(r"[^A-Za-z']", "", t)) + n + 2 * len(re.findall(r"[.?!,]", t))
def pieces(f):
    r = rep[f]; x, sr = sf.read(f"wav/{f}.wav")
    segs, db, _ = segments(x, sr, 0.22, None)      # fine split: every pause becomes a boundary, the DP decides
    fl = np.percentile(db, 10); pk = np.percentile(db, 99)
    segs, db, _ = segments(x, sr, 0.22, fl + r['k'] * (pk - fl))
    return [(s * 0.01, e * 0.01) for s, e in segs]
def align(f):
    exp = expected(f); P = pieces(f); W = [weight(e['darija']) for e in exp]
    # speaking rate: robust fit from a first pass of the simple one-to-one split
    durs = np.array([e - s for s, e in P]); rate = np.median(durs) / max(np.median(W), 1)
    for _ in range(2):
        INF = 1e9; n, m = len(exp), len(P)
        D = np.full((n + 1, m + 1), INF); B = {}
        D[0, 0] = 0
        for j in range(1, m + 1):   # leading noise pieces
            D[0, j] = D[0, j - 1] + 3 + 2 * (P[j - 1][1] - P[j - 1][0]); B[(0, j)] = ("noise", 0, j - 1)
        for i in range(1, n + 1):
            pred = rate * W[i - 1] + 0.25
            D[i, 0] = D[i - 1, 0] + 25; B[(i, 0)] = ("skip", i - 1, 0)
            for j in range(1, m + 1):
                best = (D[i - 1, j] + 25, ("skip", i - 1, j))             # line not recorded
                c = D[i, j - 1] + 3 + 2 * (P[j - 1][1] - P[j - 1][0])        # piece is noise
                if c < best[0]: best = (c, ("noise", i, j - 1))
                for k in (1, 2, 3):
                    if j - k < 0: break
                    s, e = P[j - k][0], P[j - 1][1]
                    gaps = [P[q + 1][0] - P[q][1] for q in range(j - k, j - 1)]
                    if any(g > 0.95 for g in gaps): break
                    cost = 6 * (math.log(max(e - s, 0.1)) - math.log(pred)) ** 2 + sum(4 * g for g in gaps) + (k - 1) * 1.2
                    c = D[i - 1, j - k] + cost
                    if c < best[0]: best = (c, ("take", i - 1, j - k, k))
                D[i, j], B[(i, j)] = best
        # trailing noise
        j = m; i = n; path = []
        while i > 0 or j > 0:
            op = B[(i, j)]
            if op[0] == "take": path.append((i - 1, op[2], op[3])); i, j = i - 1, op[2]
            elif op[0] == "skip": path.append((i - 1, None, 0)); i = i - 1
            else: j = j - 1
        path.reverse()
        took = [(W[a], P[b + k - 1][1] - P[b][0]) for a, b, k in path if b is not None]
        rate = np.median([d / w for w, d in took if w > 0]) if took else rate
    out = []
    for a, b, k in path:
        e = exp[a]
        if b is None: out.append((e, None, None, None)); continue
        s, t = P[b][0], P[b + k - 1][1]; pred = rate * W[a] + 0.25
        out.append((e, s, t, abs(math.log((t - s) / pred))))
    return out
if __name__ == "__main__":
    import sys
    files = sys.argv[1:] or sorted(rep)
    allres = {}; flagged = []
    for f in files:
        res = align(f); allres[f] = [(e['no'], s, t, d) for e, s, t, d in res]
        skipped = [e['no'] for e, s, t, d in res if s is None]
        loose = [(e['no'], e['darija'][:24], round(t - s, 2)) for e, s, t, d in res if s is not None and d > 0.9]
        print(f, "aligned", sum(1 for r in res if r[1] is not None), "/", len(res), "skipped", skipped, "loose", loose)
    json.dump(allres, open("alignment.json", "w"))
