# Latin-script Darija (Arabizi) -> voweled Arabic script, tuned for an Arabic TTS voice.
# Short vowels are spelled out and word-initial clusters get a light helper vowel,
# which tested best for intelligibility.
import re

FATHA, KASRA, DAMMA, SUKUN, SHADDA = "َ", "ِ", "ُ", "ْ", "ّ"

CONS = {
    "b": "ب", "t": "ت", "j": "ج", "7": "ح", "kh": "خ", "d": "د", "r": "ر", "z": "ز", "s": "س",
    "ch": "ش", "sh": "ش", "3": "ع", "gh": "غ", "f": "ف", "9": "ق", "q": "ق", "k": "ك", "l": "ل",
    "m": "م", "n": "ن", "h": "ه", "w": "و", "y": "ي", "g": "ك", "p": "ب", "v": "ف", "c": "ك", "x": "كس", "2": "ء",
}
SUN = set("t d r z s n l".split()) | {"ch"}
VOW = {"a", "e", "i", "o", "u", "ou", "é"}

# words whose letters (emphatics, fixed expressions) the rules can't guess
OVR = {
    "salam": "سَلَام", "safi": "صَافِي", "sa7bi": "صَاحْبِي", "sa7bti": "صَاحِبْتِي", "sba7": "صِبَاح", "lkhir": "الْخِير",
    "choukran": "شُكْرَان", "mouchkil": "مُشْكِيل", "machi": "مَاشِي", "tobis": "طُوبِيس", "ttobis": "الطُّوبِيس",
    "tomobil": "طُومُوبِيل", "lmghrib": "الْمَغْرِيب", "mghribi": "مَغْرِيبِي", "l7amdoulillah": "الْحَمْدُ لِلَّه",
    "inchallah": "إِنْ شَاءَ الله", "llah": "الله", "tbarkellah": "تْبَارْكَ الله", "3la": "عَلَى", "bismillah": "بِسْمِ الله",
    "hada": "هَادَا", "had": "هَاد", "hna": "هْنَا", "ana": "أَنَا", "nta": "نْتَا", "nti": "نْتِي", "howa": "هُوَّ",
    "hiya": "هِيَّ", "7na": "حْنَا", "ntouma": "نْتُومَا", "homa": "هُومَا", "sokkar": "سُكَّر", "khobz": "خُبْز",
    "bzzaf": "بْزَّاف", "wakha": "وَاخَّا", "atay": "أَتَاي", "lma": "الْمَا", "daba": "دَابَا", "labas": "لَابَاس",
    "mzyan": "مْزْيَان", "mzyana": "مْزْيَانَة", "ghedda": "غَدَّا", "chwiya": "شْوِيَّة", "khouya": "خُويَا", "khti": "خْتِي",
    "yemma": "يَمَّا", "baba": "بَابَا", "mima": "مِيمَة", "3afak": "عَافَاك", "ma3lich": "مَاعْلِيش", "smeh": "سْمَحْ",
    "liya": "لِيَّا", "fin": "فِين", "kayn": "كَايْن", "kayna": "كَايْنَة", "makaynch": "مَاكَايْنْش", "chhal": "شْحَال",
    "ghali": "غَالِي", "rkhis": "رْخِيص", "lflous": "الْفْلُوس", "flous": "فْلُوس", "dar": "دَار", "ddar": "الدَّار",
    "lyoum": "الْيُوم", "lbare7": "الْبَارَح", "dghya": "دْغْيَا", "wa7ed": "وَاحْد", "jouj": "جُوج", "tlata": "تْلَاتَة",
    "rb3a": "رْبْعَة", "khamsa": "خَمْسَة", "stta": "سْتَّة", "sb3a": "سْبْعَة", "tmenya": "تْمَنْيَة", "ts3ud": "تْسْعُود",
    "3achra": "عَشْرَة", "3chrin": "عْشْرِين", "mya": "مْيَة", "alf": "أَلْف", "kanbghik": "كَنْبْغِيك", "zwin": "زْوِين",
    "zwina": "زْوِينَة", "khayb": "خَايْب", "wqef": "وْقَفْ", "nichan": "نِيشَان", "limen": "لِيمِين", "lisar": "لِيسَر",
    "skhoun": "سْخُون", "lbrd": "الْبَرْد", "3yit": "عْيِيت", "simana": "سِيمَانَة", "kozina": "كُوزِينَة", "yallah": "يَالَّاه",
    "mabrouk": "مَبْرُوك", "mer7ba": "مَرْحْبَا", "bikhir": "بِيخِير", "bslama": "بْسْلَامَة", "tsb7": "تْصْبَحْ",
    "khir": "خِير", "9hwa": "قَهْوَة", "na3na3": "نَعْنَاع", "bnin": "بْنِين", "nqss": "نْقَّصْ", "akhir": "آخِر",
    "taman": "تْمَن", "lmdina": "الْمْدِينَة", "l9dima": "الْقْدِيمَة", "zzrbiya": "الزَّرْبِيَّة", "ttajin": "الطَّاجِين",
    "ssou9": "السُّوق", "nnas": "النَّاس", "dyal": "دْيَال", "dyali": "دْيَالِي", "dyalek": "دْيَالْك", "dyalo": "دْيَالُو",
    "dyalha": "دْيَالْهَا", "ki": "كِي", "dayr": "دَايْر", "dayra": "دَايْرَة", "3ndi": "عَنْدِي", "3ndek": "عَنْدْك",
    "3ndo": "عَنْدُو", "3ndha": "عَنْدْهَا", "3ndna": "عَنْدْنَا", "3ndich": "عَنْدِيش", "hakka": "هَاكَّا", "zaama": "زَعْمَا",
    "sa7a": "صَحَّة", "bssa7a": "بْصَّحَّة", "bssa7tek": "بْصَّحْتْك", "y3tik": "يْعْطِيك", "ybarek": "يْبَارَك", "fik": "فِيك",
    "y7fdek": "يْحْفْظْك", "ykhlik": "يْخَلِّيك", "yr7am": "يْرْحَمْ", "lwalidin": "الْوَالِدِين", "hchouma": "حْشُومَة",
    "mskin": "مْسْكِين", "drari": "دْرَارِي", "wa3er": "وَاعْر", "nadi": "نَادِي", "9afez": "قَافْز", "zzhr": "الزّْهَر",
    "tberguig": "تْبَرْكِيك", "chb3t": "شْبْعْت", "3otla": "عُطْلَة", "kol": "كُل", "khamsawkhmis": "خَمْسَة وْخْمِيس",
    "khmis": "خْمِيس", "jjem3a": "الْجُّمْعَة", "nhar": "نْهَار", "tri9": "طْرِيق", "trig": "طْرِيق", "b7er": "الْبْحَر",
    "lb7er": "الْبْحَر", "ljar": "الْجَار", "9bel": "قْبَل", "ssbr": "الصّْبَر", "mfta7": "مْفْتَاح", "lfaraj": "الْفَرَج",
    "kseksou": "كْسْكْسُو", "lmakla": "الْمَاكْلَة", "fermli": "فَرْمْلِي", "lfamilia": "الْفَامِيلْيَا", "lhedra": "الْهَضْرَة",
    "hder": "هْضَرْ", "kanhder": "كَنْهْضَرْ", "achnou": "أَشْنُو", "ach": "أَش", "smitek": "سْمِيتْك", "smiti": "سْمِيتِي",
    "chkoun": "شْكُون", "kifach": "كِيفَاش", "3lach": "عْلَاش", "imta": "إِمْتَى", "wach": "وَاش", "iyeh": "إِييه", "la": "لَا",
    "mafhemtch": "مَافْهَمْتْش", "fhemt": "فْهَمْت", "fhemtch": "فْهَمْتْش", "3awed": "عَاوْد", "ma3reftch": "مَا عْرَفْتْش",
    "3reft": "عْرَفْت", "3reftch": "عْرَفْتْش", "lwifi": "الْوِيفِي", "mtcharfin": "مْتْشَرّْفِين", "kaza": "كَازَا",
    "lbanka": "الْبَانْكَة", "b3ida": "بْعِيدَة", "9riba": "قْرِيبَة", "d9aye9": "دْقَايْق", "ykemmel": "يْكَمّْل",
    "khawi": "خَاوِي", "tla3": "طْلَعْ", "sghira": "صْغِيرَة", "kbira": "كْبِيرَة", "wla": "وْلَّا", "hak": "هَاك", "stta": "سْتَّة",
    "dirham": "دِرْهَم", "ryal": "رْيَال", "n9ass": "نْقَصّْ", "n9derch": "نْقْدَرْش", "ktar": "كْتَر", "wjhek": "وْجْهْك",
    "ghir": "غِير", "walakin": "وَلَاكِن", "aji": "أَجِي", "klma": "كْلْمَة", "ytla3": "يْطْلَعْ", "ghanakhodha": "غَانَاخُدْهَا",
    "ghanakhdou": "غَانَاخْدُو", "lbelgha": "الْبَلْغَة", "lfanar": "الْفَنَار", "lberrad": "الْبْرَّاد", "a7san": "أَحْسَن",
    "3ndi": "عَنْدِي", "ma": "مَا", "zid": "زِيد", "klamo": "كْلَامُو", "masous": "مَسُّوس", "lmektoub": "الْمَكْتُوب",
    "hroub": "هْرُوب", "fiha": "فِيهَا", "fih": "فِيه", "koul": "كُول", "bghiti": "بْغِيتِي", "lbes": "لْبَس", "y3jeb": "يْعْجْب",
    "snaye3": "صْنَايْع", "rrz9": "الرّْزْق", "dayi3": "ضَايْع", "l3sel": "الْعْسَل", "ysber": "يْصْبَر", "l9ris": "لْقْرِيص",
    "n7el": "النّْحَل", "lli": "لِّي", "li": "لِّي", "fat": "فَات", "mat": "مَات", "dir": "دِير", "nsah": "نْسَاه",
    "mcha": "مْشَا", "l7al": "الْحَال", "mchit": "مْشِيت", "klit": "كْلِيت", "nmchi": "نْمْشِي", "nakol": "نَاكُل",
    "nchoufek": "نْشُوفْك", "ghadi": "غَادِي", "kanfhem": "كَنْفْهَم", "katfhem": "كَتْفْهَم", "kayfhem": "كَيْفْهَم",
    "kanfehmou": "كَنْفَهْمُو", "lkisan": "الْكِيسَان", "alo": "أَلُو", "mnin": "مْنِين", "fransa": "فْرَانْسَا",
    "kolchi": "كُلْشِي", "hadchi": "هَادْشِي", "lblad": "الْبْلَاد", "jay": "جَاي", "yji": "يْجِي", "tji": "تْجِي",
    "dour": "دُور", "sir": "سِير", "bit": "بِيت", "3tini": "عْطِينِي", "jibli": "جِيبْلِي", "a": "آ", "w": "وْ",
}
NOART = {"la", "liya", "limen", "lisar", "li", "lli", "lbes", "l9ris"}

NUM1 = ["", "wa7ed", "jouj", "tlata", "rb3a", "khamsa", "stta", "sb3a", "tmenya", "ts3ud"]
TEENS = {10: "3achra", 11: "7dach", 12: "tnach", 13: "tlettach", 14: "rbe3tach", 15: "khmestach", 16: "settach", 17: "sbe3tach", 18: "tmentach", 19: "tse3tach"}
TENS = {20: "3chrin", 30: "tlatin", 40: "rb3in", 50: "khamsin", 60: "sttin", 70: "sb3in", 80: "tmanin", 90: "ts3in"}
HUND = {1: "mya", 2: "mitin", 3: "tlatmya", 4: "rb3mya", 5: "khmsmya", 6: "sttmya", 7: "sb3mya", 8: "tmnmya", 9: "ts3mya"}
OVR.update({"7dach": "حْضَاش", "tnach": "طْنَاش", "tlatin": "تْلَاتِين", "rb3in": "رْبْعِين", "khamsin": "خَمْسِين", "sttin": "سْتِّين",
            "sb3in": "سْبْعِين", "tmanin": "تْمَانِين", "ts3in": "تْسْعِين", "mitin": "مِيتِين", "tlatmya": "تْلَاتْمْيَة", "rb3mya": "رْبْعْمْيَة",
            "khmsmya": "خْمْسْمْيَة", "sttmya": "سْتّْمْيَة", "sb3mya": "سْبْعْمْيَة", "tmnmya": "تْمْنْمْيَة", "ts3mya": "تْسْعْمْيَة",
            "alfin": "أَلْفِين", "alaf": "آلَاف"})

def num_words(n):
    out = []
    th, n = divmod(n, 1000)
    if th == 1: out.append("alf")
    elif th == 2: out.append("alfin")
    elif th > 2: out.append(NUM1[th] + " alaf")
    h, n = divmod(n, 100)
    if h: out.append(HUND[h])
    if n:
        if n < 10: out.append(NUM1[n])
        elif n < 20: out.append(TEENS[n])
        else:
            t, u = divmod(n, 10)
            out.append((NUM1[u] + " w " if u else "") + TENS[t * 10])
    return " w ".join(out)

def tokenize(word):
    out, i = [], 0
    while i < len(word):
        two = word[i:i + 2]
        if two in ("ch", "sh", "kh", "gh", "ou"):
            out.append(two); i += 2
        else:
            out.append(word[i]); i += 1
    return out

def conv_core(word):
    toks = tokenize(word)
    res, i, n = [], 0, len(toks)
    first_cons_done = False
    while i < n:
        t = toks[i]
        if t in VOW:
            # vowel with no consonant before it: needs a seat
            if t in ("a",): res.append("أَ")
            elif t in ("i", "e", "é"): res.append("إِ")
            else: res.append("أُ")
            i += 1; first_cons_done = True
            continue
        letter = CONS.get(t, "")
        if not letter:
            i += 1; continue
        doubled = i + 1 < n and toks[i + 1] == t
        j = i + 2 if doubled else i + 1
        nxt = toks[j] if j < n else None
        mark = SHADDA if doubled else ""
        if nxt in VOW:
            if nxt == "a": v = FATHA + ("" if (j + 1 < n and j + 2 < n and toks[j + 1] == toks[j + 2] and toks[j + 1] not in VOW) else "ا")
            elif nxt in ("i",): v = KASRA + ("" if (j + 1 < n and toks[j + 1] == "y") else "ي")
            elif nxt in ("e", "é"): v = KASRA
            else: v = DAMMA + ("" if (j + 1 < n and toks[j + 1] == "w") else "و")
            res.append(letter + mark + v)
            i = j + 1
        else:
            if not first_cons_done and nxt is not None and not doubled:
                res.append(letter + KASRA)  # helper vowel for a word-initial cluster
            elif nxt is None:
                res.append(letter + mark)
            else:
                res.append(letter + mark + SUKUN)
            i = j
        first_cons_done = True
    return "".join(res)

def helper(a):
    # a word-initial consonant cluster sounds best with a light helper vowel
    if len(a) >= 2 and not a.startswith("ال") and a[1] == SUKUN: return a[0] + KASRA + a[2:]
    return a

def conv_word(w):
    return helper(_conv_word(w))

def _conv_word(w):
    lw = w.lower().replace("’", "").replace("'", "")
    if lw in OVR: return OVR[lw]
    if not lw: return ""
    toks = tokenize(lw)
    # definite article: l + consonant, or a doubled sun letter
    if len(toks) >= 3 and toks[0] == toks[1] and toks[0] in SUN and lw not in NOART:
        return "ال" + conv_core(lw[len(toks[0]):]).replace("ْ", "", 0)
    if len(toks) >= 3 and toks[0] == "l" and toks[1] not in VOW and lw not in NOART:
        return "الْ" + conv_core(lw[1:])
    return conv_core(lw)

PREP = {"b": "بِ", "l": "لِ", "f": "فِ", "d": "دْ", "w": "وْ"}

def translit(text):
    if text.startswith("ar:"): return text[3:]
    s = text.replace("…", "").replace("“", "").replace("”", "").replace('"', "")
    s = re.sub(r"\b(\d{2,})\b", lambda m: num_words(int(m.group(1))), s)
    parts = re.findall(r"[A-Za-z0-9’'éÉ]+|[?!.,]", s)
    out, k = [], 0
    while k < len(parts):
        p = parts[k]
        if p in "?!.,":
            out.append({"?": "؟", ",": "،", "!": "!", ".": "."}[p]); k += 1; continue
        lp = p.lower()
        if lp in PREP and k + 1 < len(parts) and parts[k + 1] not in "?!.,":
            nxt = conv_word(parts[k + 1])
            if lp == "l" and nxt.startswith("ال"): nxt = "ل" + nxt[2:]
            out.append(PREP[lp] + nxt); k += 2; continue
        out.append(conv_word(p)); k += 1
    txt = ""
    for o in out:
        if o in ("؟", "،", "!", "."): txt += o
        else: txt += (" " if txt else "") + o
    return txt

if __name__ == "__main__":
    for t in ["Salam, labas?", "Bghit wa7ed atay, 3afak.", "B chhal hada?", "Ana jay daba!", "Ghanakhodha b 110.", "Mer7ba bik! Had lbelgha ghir b 300 dirham.",
              "Wqef hna, choukran!", "L lmdina l9dima, 3afak.", "Kanhder chwiya d darija.", "Fin kayn bit lma?", "Llah yr7am lwalidin", "Nqss chwiya",
              "Smiti Yasmine.", "Ma fhemtch", "Kifach ngoul… b darija?", "Ssbr mfta7 lfaraj.", "Mchit l ssou9 lbare7.", "Akhir taman?", "Ki dayra?", "Ts3ud", "2400"]:
        print(f"{t:45s} -> {translit(t)}")
