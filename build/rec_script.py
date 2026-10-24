# Recording script: splits every clip into Neutral, Male and Female, numbers them in batches, writes HTML + CSV.
import json, re, os, csv, html, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from ex_ar import arabic
items = json.load(open(os.path.join(HERE, "rec_meta.json")))
FEM = re.compile(r"\b(rajli|ana (jaya|sakna|fer7ana|mqell9a|3yana))\b", re.I)
MASC = re.compile(r"\b(mrati|ana (jay|sakn|fer7an|mqelle9|3yan))\b", re.I)
groups = {"N": [], "M": [], "F": []}
for it in items:
    t = it["text"]
    if it["kind"] == "story": g = "F" if it.get("g") == "f" else "M"
    elif it["kind"] in ("souk", "other") and it["voice"] == "v": g = "M"
    elif it["kind"] == "other": g = "M" if not re.match(r"^(Kanfhem|Mn l7ouma|Sandou9|Atay wajed)", t) else "N"
    elif it["kind"] in ("word", "title", "guide"): g = "N"
    elif FEM.search(t): g = "F"
    elif MASC.search(t) and it["kind"] not in ("word",): g = "M"
    else: g = "N"
    it["ar"] = it.get("ar") or arabic(t)
    groups[g].append(it)
KORDER = {"word":1, "title":2, "mchicha":2, "example":3, "situation":4, "sentence":4, "proverb":5, "guide":6, "reel":6, "other":7, "story":3, "souk":8}
for g in groups:
    groups[g].sort(key=lambda x: (KORDER.get(x["kind"], 9), x.get("story", ""), x.get("line", 0)))
SEC = {"word":"Words and short phrases", "title":"Words and short phrases", "mchicha":"Words and short phrases", "example":"Example sentences", "situation":"Things you say in situations", "sentence":"Things you say in situations",
       "proverb":"Proverbs", "guide":"Sound guide and grammar examples", "reel":"Sound guide and grammar examples", "story":"Stories (conversations)", "other":"At the souk (what you say)", "souk":"At the souk (the vendor)"}
TIPS = {"word":"Say it clearly, like teaching a friend. Questions go up at the end.", "example":"Natural speed, like talking to a friend.", "story":"Act it a little: you are this person in this scene. If you voice both people in one conversation, give the other character (waiter, driver, Karim...) a slightly different tone from \x27You\x27.",
        "souk":"You are 3mmi Hmad, a friendly, cheeky souk vendor. Older, warm, a bit dramatic about prices.", "proverb":"Calm, like an aunt giving advice.", "guide":"Slow and very clear: this teaches the sound.",
        "situation":"Natural, like you really are in that moment.", "other":"You are bargaining: polite but firm."}
BATCH = 25
rows = []
for g, lst in groups.items():
    for i, it in enumerate(lst):
        it["no"] = f"{g}{i+1:03d}"; it["batch"] = f"{g}-{(i//BATCH)*BATCH+1:03d}-{min(len(lst),(i//BATCH+1)*BATCH):03d}"
        rows.append(it)
with open(os.path.join(HERE, "recording_map.csv"), "w", newline="") as f:
    w = csv.writer(f); w.writerow(["no", "batch_file", "voice_list", "darija", "arabic", "english", "kind", "who", "app_key"])
    for it in rows: w.writerow([it["no"], it["batch"], {"N":"neutral","M":"male","F":"female"}[it["no"][0]], it["text"], it["ar"], it.get("en", ""), it["kind"], it.get("who", ""), it["key"]])
e = html.escape
TITLE = {"N":"Neutral voice (you)", "M":"Male voice (you)", "F":"Female voice (to find)"}
INTRO = {"N":"Words, example sentences, Mchicha's lines, the guide. Nothing here is said by a man or a woman in particular, so say it in your normal, friendly teaching voice.",
         "M":"Lines said by men in the stories (the waiter, Karim, the guide, the vendor 3mmi Hmad...), what 'you' say in the app (the player is a man for now), and sentences that only a man would say (\"Hadi mrati\", \"Ana jay\").",
         "F":"Lines said by women in the stories (Yasmine, Salma, Mom, Jeddati...) and sentences only a woman would say (\"Rajli kaybghi lkoura\"). Give this part to the woman who records."}
parts = []
for g in ["N", "M", "F"]:
    lst = groups[g]; cur = None; body = []
    for it in lst:
        sec = SEC.get(it["kind"], "Other")
        sub = sec + (f": {it['story']}" if it["kind"] == "story" else "")
        if sub != cur:
            if cur is not None: body.append("</tbody></table>")
            tip = TIPS.get(it["kind"], "")
            body.append(f'<h3>{e(sub)}</h3>' + (f'<p class="tip">{e(tip)}</p>' if tip else "") + '<table><tbody>'); cur = sub
        who = f'<span class="who">{e(it["who"])}</span>' if it.get("who") else ""
        bstart = it["no"][1:] == it["batch"].split("-")[1]
        brow = f'<tr class="bt"><td colspan="4">File <b>{e(it["batch"])}.m4a</b>: record lines {e(it["batch"][2:].replace("-", " to "))} in one go, pausing 2 seconds between lines</td></tr>' if bstart else ""
        body.append(f'{brow}<tr><td class="no">{e(it["no"])}</td><td class="d">{who}{e(it["text"])}</td><td class="ar" dir="rtl" lang="ar">{e(it["ar"])}</td><td class="en">{e(it.get("en", ""))}</td></tr>')
    body.append("</tbody></table>")
    parts.append(f'<section id="{g}"><h2>{TITLE[g]} <span class="n">{len(lst)} lines</span></h2><p>{INTRO[g]}</p>{"".join(body)}</section>')
counts = {g: len(v) for g, v in groups.items()}
doc = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wakha recording script</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600&display=swap" rel="stylesheet">
<style>:root{{--bg:#fff;--ink:#1f201d;--soft:#5c5c58;--line:#e7e5e0;--card:#f6f5f2;--acc:#17655e}}
@media (prefers-color-scheme:dark){{:root{{--bg:#111;--ink:#f4f3ef;--soft:#b4b4ae;--line:#2c2c2a;--card:#1c1c1a;--acc:#5dbdb0}}}}
body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif}}main{{max-width:960px;margin:0 auto;padding:24px 16px 60px}}
h1{{margin:0 0 6px}}h2{{margin:40px 0 6px;padding-top:12px;border-top:3px solid var(--acc)}}h2 .n{{font-size:14px;color:var(--soft);font-weight:400}}h3{{margin:26px 0 4px;font-size:16px}}
.tip{{margin:0 0 8px;color:var(--soft);font-size:13px}}table{{width:100%;border-collapse:collapse}}td{{padding:7px 8px;border-bottom:1px solid var(--line);vertical-align:top}}
.no{{width:52px;color:var(--soft);font:12px ui-monospace,monospace;padding-top:10px}}.d{{font-size:17px;font-weight:600}}.ar{{font:20px/1.5 "Noto Naskh Arabic",serif;text-align:right;width:28%}}.en{{color:var(--soft);font-size:13px;width:28%}}
.who{{display:inline-block;font-size:11px;font-weight:600;background:var(--card);border-radius:99px;padding:1px 7px;margin-right:6px;color:var(--soft);vertical-align:2px}}
.bt td{{background:var(--card);font-size:13px;color:var(--soft);border-radius:6px}}.box{{background:var(--card);border-radius:14px;padding:14px 18px;margin:14px 0}}.box li{{margin:3px 0}}
nav a{{color:var(--acc);margin-right:14px}}@media(max-width:640px){{td.ar,td.en{{display:block;width:auto;text-align:left;border:0;padding:0 8px 6px 60px}}td.ar{{text-align:right}}tr td.no{{float:left}}}}
@media print{{.bt td{{background:#eee}}h2{{page-break-before:always}}}}</style></head><body><main>
<h1>Wakha recording script</h1>
<p>{len(rows)} lines: <b>{counts["N"]}</b> neutral and <b>{counts["M"]}</b> male (both you), <b>{counts["F"]}</b> female. Arabic script and English are there to help you read; say only the Darija.</p>
<nav><a href="#N">Neutral</a><a href="#M">Male</a><a href="#F">Female</a></nav>
<div class="box"><b>How to record (the easy way)</b><ol>
<li>Record in batches: each grey bar is one audio file, about 25 lines. Name the file exactly as shown (for example <b>N-001-025.m4a</b>).</li>
<li>Read the lines in order, once each, with a clear <b>2-second pause</b> between lines. If you make a mistake, pause 4 seconds and say that line again; I keep the last take.</li>
<li>Quiet room, phone 20–30 cm from your mouth, same place and distance every time. Any format is fine (m4a, mp3, wav).</li>
<li>Send the files back (Downloads folder works). I cut them by the pauses, check each line, and put them in the app.</li>
</ol>Start with the <b>Neutral words</b> (the first {sum(1 for x in groups["N"] if x["kind"] in ("word","title","mchicha"))} lines): they are heard the most. The vendor lines (<b>At the souk</b>) can wait; until they're recorded the AI voice keeps doing them.</div>
{"".join(parts)}
</main></body></html>'''
open(os.path.join(HERE, "..", "..", "wakha-recording-script.html"), "w").write(doc)
print(counts, len(rows))
