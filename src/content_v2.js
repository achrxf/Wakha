/* =========================================================
   CONTENT v2: path units, conversations, proverbs, guide, souk
   ========================================================= */

// tile names map to card palettes in CSS
const UNITS = [
  { id:"u1", d:"Salam", en:"Hello and how are you", fr:"Bonjour et ça va", tile:"majorelle",
    words:["salam","labas","hamdoulillah","bikhir","kidayr","sba7","merhba","bslama","tsb7"] },
  { id:"u2", d:"Bla mzyya", en:"Please, thanks and OK", fr:"S’il te plaît, merci, d’accord", tile:"emerald",
    words:["choukran","blamzyya","3afak","smeh","ma3lich","wakha","iyeh","la","safi"] },
  { id:"u3", d:"Achnou?", en:"Asking questions", fr:"Poser des questions", tile:"teal",
    words:["achnou","fin","kifach","3lach","imta","chkoun","wach","smiti","achsmitek"] },
  { id:"u4", d:"Atay", en:"Tea, food and the café", fr:"Thé, bouffe et café", tile:"saffron",
    words:["atay","na3na3","sokkar","9hwa","lma","khobz","bghit","fiyajjo3","bnin"] },
  { id:"u5", d:"Ssou9", en:"Shopping at the souk", fr:"Faire ses courses au souk", tile:"pomegranate", boss:"haggle",
    words:["chhal","ghali","rkhis","nqss","akhirtaman","lflous","bzzaf","chwiya"] },
  { id:"u6", d:"Daba", en:"Time and numbers", fr:"Le temps et les chiffres", tile:"night",
    words:["daba","lyoum","ghedda","lbare7","dghya","wa7ed","jouj","tlata","khamsa","3achra","mya"] },
  { id:"u7", d:"Lfamilia", en:"Family and feelings", fr:"Famille et sentiments", tile:"plum",
    words:["yemma","baba","khouya","khti","mima","sa7bi","kanbghik","mzyan","zwin","khayb"] },
  { id:"u8", d:"Trig", en:"Getting around", fr:"Se déplacer", tile:"teal",
    words:["wqef","nichan","limen","lisar","tobis","tomobil","kayn","makaynch","dar"] },
  { id:"u9", d:"Lhedra", en:"Keeping the conversation going", fr:"Tenir une conversation", tile:"emerald",
    words:["mafhemtch","3awed","hder","ma3reftch","yallah","inchallah","mabrouk","skhoun","lbrd","3yit","simana","kozina"] },
];

// split each unit into lessons of 3 to 4 words, then a review (or the souk boss)
function buildPath() {
  const nodes = [];
  UNITS.forEach((u, ui) => {
    const n = u.words.length, m = n % 3;
    const sizes = Array(Math.floor(n / 3)).fill(3);
    if (m === 1) sizes[sizes.length - 1] = 4;
    if (m === 2) { sizes[sizes.length - 1] = 4; sizes[sizes.length - 2] = 4; sizes.length = sizes.length; }
    // m===2 means one extra 3 must be dropped: e.g. 8 = 4 + 4, 11 = 3 + 4 + 4
    let fixed = sizes;
    if (m === 2) { fixed = Array(Math.floor(n / 3) - 2).fill(3).concat([4, 4]); }
    let k = 0, li = 0;
    for (const take of fixed) { nodes.push({ id:`${u.id}l${++li}`, unit:ui, kind:"lesson", words:u.words.slice(k, k + take) }); k += take; }
    nodes.push({ id:`${u.id}r`, unit:ui, kind:u.boss === "haggle" ? "boss" : "review", words:u.words.slice() });
  });
  return nodes;
}
const PATH = buildPath();

// conversations: [speaker A|B, darija, en, fr]
const DIALOGS = [
  { id:"cafe", tile:"saffron", t:["At the café","Au café"], who:[["Waiter","Serveur"],["You","Toi"]], lines:[
    ["A","Salam, achnou bghiti?","Hi, what would you like?","Salut, qu’est-ce que tu veux ?"],
    ["B","Bghit wa7ed atay, 3afak.","I’d like a tea, please.","Je voudrais un thé, s’il te plaît."],
    ["A","B na3na3?","With mint?","À la menthe ?"],
    ["B","Iyeh, w chwiya d sokkar.","Yes, and a little sugar.","Oui, et un peu de sucre."],
    ["A","Wakha, daba yji.","OK, it’s coming right up.","D’accord, ça arrive."] ] },
  { id:"taxi", tile:"teal", t:["In a petit taxi","En petit taxi"], who:[["Driver","Chauffeur"],["You","Toi"]], lines:[
    ["B","Salam, wach khawi?","Hi, are you free?","Salut, vous êtes libre ?"],
    ["A","Iyeh, fin ghadi?","Yes, where are you going?","Oui, tu vas où ?"],
    ["B","L lmdina l9dima, 3afak.","To the old medina, please.","À l’ancienne médina, s’il te plaît."],
    ["A","Wakha, tla3.","OK, get in.","D’accord, monte."],
    ["B","Wqef hna, choukran!","Stop here, thanks!","Arrêtez-vous ici, merci !"] ] },
  { id:"meet", tile:"majorelle", t:["Meeting someone","Faire connaissance"], who:[["Yasmine","Yasmine"],["Adam","Adam"]], lines:[
    ["A","Salam, ana Yasmine. Ach smitek?","Hi, I’m Yasmine. What’s your name?","Salut, moi c’est Yasmine. Tu t’appelles comment ?"],
    ["B","Smiti Adam. Mtcharfin!","I’m Adam. Nice to meet you!","Je m’appelle Adam. Enchanté !"],
    ["A","Mtcharfin. Mnin nta?","Nice to meet you. Where are you from?","Enchantée. Tu viens d’où ?"],
    ["B","Ana mn Kaza.","I’m from Casa.","Je suis de Casa."] ] },
  { id:"mom", tile:"plum", t:["Mom on the phone","Maman au téléphone"], who:[["Mom","Maman"],["You","Toi"]], lines:[
    ["A","Alo, fin nta?","Hello, where are you?","Allô, t’es où ?"],
    ["B","Ana f tri9, yemma.","I’m on my way, mom.","Je suis en route, maman."],
    ["A","Imta ghadi tji?","When are you coming?","Tu arrives quand ?"],
    ["B","Daba, daba!","Right now!","Tout de suite !"],
    ["A","Zaama…","Yeah, right…","C’est ça…"] ] },
  { id:"hanout", tile:"emerald", t:["At the corner shop","À l’épicerie du coin"], who:[["Shopkeeper","Épicier"],["You","Toi"]], lines:[
    ["B","Salam, wach 3ndek lma?","Hi, do you have water?","Salut, vous avez de l’eau ?"],
    ["A","Iyeh, kbira wla sghira?","Yes, big or small?","Oui, grande ou petite ?"],
    ["B","Kbira. B chhal?","Big. How much?","Grande. C’est combien ?"],
    ["A","Stta dirham.","Six dirhams.","Six dirhams."],
    ["B","Hak, choukran.","Here you go, thanks.","Tenez, merci."] ] },
  { id:"lost", tile:"night", t:["Asking the way","Demander son chemin"], who:[["Passer-by","Passant"],["You","Toi"]], lines:[
    ["B","Smeh liya, fin kayna lbanka?","Excuse me, where’s the bank?","Pardon, où est la banque ?"],
    ["A","Sir nichan, w dour 3la limen.","Go straight, then turn right.","Va tout droit, puis tourne à droite."],
    ["B","Wach b3ida?","Is it far?","C’est loin ?"],
    ["A","La, 9riba. Khamsa d d9aye9.","No, it’s close. Five minutes.","Non, c’est près. Cinq minutes."],
    ["B","Choukran bzzaf!","Thanks a lot!","Merci beaucoup !"] ] },
  { id:"wedding", tile:"pomegranate", t:["At a wedding","À un mariage"], who:[["Guest","Invité"],["Host","Hôte"]], lines:[
    ["A","Mabrouk! Llah ykemmel bikhir.","Congrats! May it all go well.","Félicitations ! Que tout se passe bien."],
    ["B","Llah ybarek fik. Mer7ba bik!","God bless you. Welcome!","Que Dieu te bénisse. Bienvenue !"],
    ["A","Lmakla bnina bzzaf!","The food is so good!","La nourriture est trop bonne !"],
    ["B","Bssa7a! Zid chwiya.","Enjoy! Have some more.","Profite ! Reprends-en un peu."] ] },
  { id:"friend", tile:"saffron", t:["Weekend plans","Le programme du week-end"], who:[["Friend","Pote"],["You","Toi"]], lines:[
    ["A","Fin ghadi lyoum?","Where are you going today?","Tu vas où aujourd’hui ?"],
    ["B","Ma3reftch. W nta?","I don’t know. And you?","Je sais pas. Et toi ?"],
    ["A","Yallah l b7er!","Let’s go to the beach!","On va à la plage !"],
    ["B","Wakha, yallah!","OK, let’s go!","D’accord, on y va !"] ] },
];

// proverbs: [darija, literal en, literal fr, meaning en, meaning fr]
const PROVERBS = [
  ["proverb-honey","Li bgha l3sel ysber l9ris n7el.","Whoever wants honey puts up with bee stings.","Qui veut le miel supporte les piqûres d’abeilles.","Good things take some pain.","Les bonnes choses demandent des efforts."],
  ["proverb-delay","Kol 3otla fiha khir.","Every delay has some good in it.","Chaque retard a du bon.","When plans slip, there’s a reason.","Quand ça bloque, il y a une raison."],
  ["proverb-past","Lli fat mat.","What’s gone is dead.","Ce qui est passé est mort.","Let the past go.","Laisse le passé derrière toi."],
  ["proverb-good","Dir lkhir w nsah.","Do good and forget about it.","Fais le bien et oublie-le.","Help people without keeping score.","Aide sans compter."],
  ["proverb-money","Lli ma 3ndo flous, klamo masous.","Without money, your words have no taste.","Sans argent, ta parole n’a pas de goût.","Money talks.","L’argent parle."],
  ["proverb-neighbor","Ljar 9bel ddar.","The neighbor before the house.","Le voisin avant la maison.","Pick your neighbors before your home.","Choisis tes voisins avant ta maison."],
  ["proverb-patience","Ssbr mfta7 lfaraj.","Patience is the key to relief.","La patience est la clé du soulagement.","Hang in there.","Tiens bon."],
  ["proverb-fate","Lmektoub ma fih hroub.","There’s no running from what’s written.","On n’échappe pas à ce qui est écrit.","What will be, will be.","Ce qui doit arriver arrivera."],
  ["proverb-eat","Koul ma bghiti w lbes ma y3jeb nnas.","Eat what you like, wear what people like.","Mange ce que tu aimes, porte ce qui plaît aux gens.","Your plate is yours, your look is public.","Ton assiette est à toi, ton look est public."],
  ["proverb-trades","Sb3 snaye3 w rrz9 dayi3.","Seven trades and the money’s still lost.","Sept métiers et toujours fauché.","Jack of all trades, master of none.","Touche-à-tout, bon à rien."],
];

const BUILDS_MORE = [
  ["dunno","I don’t know","Je sais pas",["ma","3reft","ch"],["bghit","daba"],"ma3reftch"],
  ["goingwhere","Where are you going?","Tu vas où ?",["fin","ghadi"],["imta","safi"],"fin"],
  ["hottea","The tea is hot","Le thé est chaud",["atay","skhoun"],["lbrd","rkhis"],"skhoun"],
  ["sugar","I want a little sugar","Je veux un peu de sucre",["bghit","chwiya","d","sokkar"],["bzzaf","lma"],"sokkar"],
  ["stophere","Stop here, please","Arrête-toi ici, s’il te plaît",["wqef","hna","3afak"],["nichan","daba"],"wqef"],
  ["name","My name is Adam","Je m’appelle Adam",["smiti","Adam"],["chkoun","fin"],"smiti"],
  ["bus","Is there a bus?","Il y a un bus ?",["wach","kayn","tobis"],["tomobil","fin"],"wach"],
  ["lovemom","I love you, mom","Je t’aime, maman",["kanbghik","a","yemma"],["baba","khti"],"kanbghik"],
  ["tired","I’m very tired","Je suis très fatigué(e)",["3yit","bzzaf"],["chwiya","mzyan"],"3yit"],
];
BUILDS.push(...BUILDS_MORE);

REELS.push(
  ["couscous","t-saffron",["Friday is couscous day","Vendredi, c’est couscous"],[
    [null,"Nhar jjem3a","Friday.","Le vendredi."],
    ["🥘",null,"After Friday prayer, families sit around one big plate of couscous.","Après la prière du vendredi, la famille se retrouve autour d’un grand plat de couscous."],
    [null,"Bismillah","Everyone says bismillah, then eats from their own side of the plate.","Chacun dit bismillah, puis mange de son côté du plat."]]],
  ["pour","t-emerald",["The tea pour","Servir le thé"],[
    ["🫖",null,"Atay is poured from high up so it gets a foam on top.","On verse l’atay de haut pour qu’il mousse."],
    [null,"Atay","No foam? Pour it back into the pot and try again.","Pas de mousse ? On le reverse dans la théière et on recommence."],
    [null,"Bssa7a!","When someone serves you, say bssa7a.","Quand on te sert, dis bssa7a."]]],
  ["mnin","t-teal",["Where are you from?","Tu viens d’où ?"],[
    [null,"Mnin nta?","Where are you from? To a woman: mnin nti?","Tu viens d’où ? À une femme : mnin nti ?"],
    [null,"Ana mn Kaza","I’m from Casa. Casablanca is just Kaza.","Je suis de Casa. Casablanca, c’est Kaza."],
    [null,"Ana mn Fransa","I’m from France.","Je viens de France."]]]
);

// big reel text that is not Darija gets no audio
const NO_SAY = new Set(["3 7 9","3 = ع","7 = ح","9 = ق","gh = غ","1 DH = 20 ryal","= 50 DH","…or 5 hours","Daba?"]);

// guide: sounds
const SOUNDS = [
  { id:"3", key:"3", ar:"ع", say:"ar:عَا", t:["The 3","Le 3"],
    how:["A tight “a” from deep in the throat. Squeeze your throat as if you’re about to gag, then say “a”.","Un « a » serré, du fond de la gorge. Serre la gorge comme si tu allais avoir un haut-le-cœur, puis dis « a »."],
    like:["English has no sound like it. It’s the one learners skip most.","Le français n’a pas ce son. C’est celui que les apprenants oublient le plus."],
    ex:["3afak","3achra","Ma3lich"] },
  { id:"7", key:"7", ar:"ح", say:"ar:حَا", t:["The 7","Le 7"],
    how:["A strong, breathy h. Breathe out like you’re fogging up a mirror, but squeeze your throat a little.","Un h fort et soufflé. Souffle comme pour faire de la buée sur un miroir, en serrant un peu la gorge."],
    like:["Stronger than the h in “hello”.","Plus fort que le h aspiré anglais."],
    ex:["Mer7ba","Sa7bi","L7amdoulillah"] },
  { id:"9", key:"9", ar:"ق", say:"ar:قَا", t:["The 9","Le 9"],
    how:["A k made far back in the throat, where you’d swallow.","Un k prononcé tout au fond de la gorge, là où tu avales."],
    like:["Say “k”, then slide it further back.","Dis « k », puis recule-le dans la gorge."],
    ex:["9hwa","9afez","Nqss chwiya"] },
  { id:"gh", key:"gh", ar:"غ", say:"ar:غَا", t:["gh","gh"],
    how:["A soft gargle at the back of the mouth.","Un léger gargarisme au fond de la bouche."],
    like:["Exactly the French R in “Paris”.","Exactement le R français de « Paris »."],
    ex:["Ghali","Ghedda","Bghit"] },
  { id:"kh", key:"kh", ar:"خ", say:"ar:خَا", t:["kh","kh"],
    how:["A scratchy h, like clearing your throat gently.","Un h qui gratte, comme pour se racler doucement la gorge."],
    like:["Like “ch” in German “Bach” or the Spanish “j” in “jamón”.","Comme le « ch » allemand de « Bach » ou la jota espagnole."],
    ex:["Khobz","Khouya","Wakha"] },
  { id:"ch", key:"ch", ar:"ش", say:"ar:شَا", t:["ch","ch"],
    how:["Just like “sh” in “shoe”.","Comme le « ch » de « chat »."],
    like:["Darija writes it ch, like French.","La darija l’écrit ch, comme en français."],
    ex:["Chhal","Chwiya","Choukran"] },
  { id:"j", key:"j", ar:"ج", say:"ar:جَا", t:["j","j"],
    how:["Like the “s” in “measure”.","Comme le « j » de « jour »."],
    like:["Softer than the English j in “jam”.","Plus doux que le j anglais de « jam »."],
    ex:["Jouj","Ana jay daba!"] },
  { id:"heavy", key:"s t d", ar:"ص ط ض", say:"ar:صَا", t:["Heavy s, t, d","Les s, t, d lourds"],
    how:["Darker versions of s, t and d. Pull your tongue back and let the vowel next to it sound deeper.","Des s, t et d plus sombres. Recule la langue et laisse la voyelle sonner plus grave."],
    like:["Darija writes them like normal letters, so learn them word by word.","La darija les écrit comme des lettres normales, il faut les apprendre mot par mot."],
    ex:["Safi","Tobis","Sba7 lkhir"] },
  { id:"double", key:"zz", ar:"ّ", say:"Bzzaf", t:["Double letters","Les lettres doublées"],
    how:["A doubled letter is held a beat longer. Bzzaf is b, then a long zz, then af.","Une lettre doublée se tient un temps de plus. Bzzaf, c’est b, puis un long zz, puis af."],
    like:["Like the two t’s in Italian “gatto”.","Comme les deux t de l’italien « gatto »."],
    ex:["Bzzaf","Ghedda","Sokkar"] },
  { id:"clusters", key:"mz", ar:"مز", say:"Mzyan", t:["Missing vowels","Les voyelles qui manquent"],
    how:["Darija drops short vowels, so many words start with two consonants. Say them together as one quick block.","La darija avale les voyelles courtes, donc beaucoup de mots commencent par deux consonnes. Dis-les ensemble, d’un seul bloc."],
    like:["Don’t add an “e” in front: it’s mzyan, not emzyan.","N’ajoute pas de « e » devant : c’est mzyan, pas emzyan."],
    ex:["Mzyan","Bghit","Ma fhemtch"] },
];

// guide: grammar rules. ex = [darija, en, fr]
const RULES = [
  { id:"neg", t:["Saying no: ma…ch","Dire non : ma…ch"],
    body:["Wrap the verb: ma in front, ch at the end.","On entoure le verbe : ma devant, ch derrière."],
    ex:[["Fhemt","I understood","J’ai compris"],["Ma fhemtch","I didn’t understand","J’ai pas compris"],["Bghit","I want","Je veux"],["Ma bghitch","I don’t want","Je veux pas"],["Kayn","There is","Il y a"],["Makaynch","There isn’t","Il n’y a pas"]] },
  { id:"q", t:["Asking questions","Poser des questions"],
    body:["Start a yes or no question with wach. For everything else, use a question word.","Une question oui ou non commence par wach. Pour le reste, on utilise un mot interrogatif."],
    ex:[["Wach nta mghribi?","Are you Moroccan?","Tu es marocain ?"],["Fin ghadi?","Where are you going?","Tu vas où ?"],["Achnou hada?","What’s this?","C’est quoi ça ?"],["Kifach?","How?","Comment ?"],["3lach?","Why?","Pourquoi ?"],["Imta?","When?","Quand ?"],["Chkoun?","Who?","Qui ?"],["B chhal?","How much?","Combien ?"]] },
  { id:"pron", t:["I, you, he, she","Je, tu, il, elle"],
    body:["There’s a different “you” for a man, a woman and a group.","Il y a un « tu » pour un homme, un pour une femme, et un pour un groupe."],
    ex:[["Ana","I","je"],["Nta","you, to a man","tu, à un homme"],["Nti","you, to a woman","tu, à une femme"],["Howa","he","il"],["Hiya","she","elle"],["7na","we","nous"],["Ntouma","you, to a group","vous"],["Homa","they","ils, elles"]] },
  { id:"gender", t:["Talking to a woman","Parler à une femme"],
    body:["Many words add an a when you talk to or about a woman.","Beaucoup de mots prennent un a quand on parle à une femme, ou d’une femme."],
    ex:[["Ki dayr?","How are you? (to a man)","Ça va ? (à un homme)"],["Ki dayra?","How are you? (to a woman)","Ça va ? (à une femme)"],["Mzyan","good (masculine)","bien (masculin)"],["Mzyana","good (feminine)","bien (féminin)"],["Sa7bi","my friend (a guy)","mon pote"],["Sa7bti","my friend (a girl)","ma copine"]] },
  { id:"have", t:["Having: 3nd","Avoir : 3nd"],
    body:["To say “I have”, use 3nd plus an ending for the person.","Pour dire « j’ai », on utilise 3nd avec une terminaison selon la personne."],
    ex:[["3ndi","I have","j’ai"],["3ndek","you have","tu as"],["3ndo","he has","il a"],["3ndha","she has","elle a"],["3ndna","we have","nous avons"],["Ma 3ndich","I don’t have","je n’ai pas"],["3ndi khouya w khti.","I have a brother and a sister.","J’ai un frère et une sœur."]] },
  { id:"mine", t:["Mine and yours: dyal","À moi, à toi : dyal"],
    body:["Put dyal after a thing to say whose it is.","On met dyal après une chose pour dire à qui elle est."],
    ex:[["Dyali","mine","à moi"],["Dyalek","yours","à toi"],["Dyalo","his","à lui"],["Dyalha","hers","à elle"],["Tomobil dyali","my car","ma voiture"],["Wach hada dyalek?","Is this yours?","C’est à toi ?"]] },
  { id:"now", t:["Right now: ka-","Le présent : ka-"],
    body:["Put ka- in front of a verb for things happening now, or that happen usually. It changes with the person.","On met ka- devant le verbe pour ce qui se passe maintenant, ou d’habitude. Ça change selon la personne."],
    ex:[["Kanfhem","I understand","je comprends"],["Katfhem","you understand","tu comprends"],["Kayfhem","he understands","il comprend"],["Kanfehmou","we understand","nous comprenons"],["Kanhder chwiya d darija.","I speak a little Darija.","Je parle un peu darija."]] },
  { id:"future", t:["What’s next: ghadi","Le futur : ghadi"],
    body:["Put ghadi before the verb to say what you’re going to do.","On met ghadi devant le verbe pour dire ce qu’on va faire."],
    ex:[["Ghadi nmchi.","I’m going to go.","Je vais y aller."],["Ghadi nakol.","I’m going to eat.","Je vais manger."],["Ghadi nchoufek ghedda.","I’ll see you tomorrow.","Je te vois demain."]] },
  { id:"past", t:["What happened: -t","Le passé : -t"],
    body:["For “I” in the past, most verbs end in -t or -it.","Pour « je » au passé, la plupart des verbes finissent en -t ou -it."],
    ex:[["Klit","I ate","j’ai mangé"],["Mchit","I went","je suis allé(e)"],["Fhemt","I understood","j’ai compris"],["Mchit l ssou9 lbare7.","I went to the souk yesterday.","Je suis allé(e) au souk hier."]] },
  { id:"num", t:["Numbers","Les chiffres"],
    body:["Jouj (two) is very Moroccan. Before a noun, add d: jouj d lkisan, two glasses.","Jouj (deux) est très marocain. Devant un nom, on ajoute d : jouj d lkisan, deux verres."],
    ex:[["Wa7ed","1","1"],["Jouj","2","2"],["Tlata","3","3"],["Rb3a","4","4"],["Khamsa","5","5"],["Stta","6","6"],["Sb3a","7","7"],["Tmenya","8","8"],["Ts3ud","9","9"],["3achra","10","10"],["3chrin","20","20"],["Mya","100","100"],["Jouj d lkisan","two glasses","deux verres"]] },
  { id:"money", t:["Money: dirham and ryal","L’argent : dirham et ryal"],
    body:["Many Moroccans still count in ryal. 1 dirham is 20 ryal, so alf ryal (1,000 ryal) is 50 dirhams.","Beaucoup de Marocains comptent encore en ryal. 1 dirham vaut 20 ryal, donc alf ryal (1 000 ryal) font 50 dirhams."],
    ex:[["B chhal hada?","How much is this?","C’est combien ?"],["Alf ryal","1,000 ryal (50 DH)","1 000 ryal (50 DH)"],["3chrin dirham","20 dirhams","20 dirhams"]] },
  { id:"magic", t:["Magic phrases","Les formules magiques"],
    body:["These little blessings come up all day. Use them and people light up.","Ces petites bénédictions reviennent toute la journée. Utilise-les et les gens s’illuminent."],
    ex:[["Llah y7fdek","God keep you (thank you)","Que Dieu te garde (merci)"],["Llah ybarek fik","God bless you","Que Dieu te bénisse"],["Bssa7a","Enjoy it","Profite bien"],["Llah y3tik sa7a","God give you health","Que Dieu te donne la santé"],["Tbarkellah 3lik","Well done","Bravo"]] },
  { id:"loan", t:["Borrowed words","Les mots empruntés"],
    body:["Darija mixes in French and Spanish words, said the Moroccan way.","La darija mélange des mots français et espagnols, prononcés à la marocaine."],
    ex:[["Tobis","bus (French autobus)","bus (autobus)"],["Simana","week (Spanish semana)","semaine (espagnol semana)"],["Kozina","kitchen (Spanish cocina)","cuisine (espagnol cocina)"],["Tomobil","car (French automobile)","voiture (automobile)"],["Fermli","nurse (French infirmier)","infirmier"]] },
];

// souk battle. Fixed starting prices so every price the vendor can say has a recording.
const HAGGLE = [
  {id:"belgha",d:"lbelgha",en:"these babouches",fr:"ces babouches",enIt:"them",frIt:"les",start:300,verb:"Ghanakhodha"},
  {id:"zrbiya",d:"zzrbiya",en:"this rug",fr:"ce tapis",enIt:"it",frIt:"le",start:2400,verb:"Ghanakhodha"},
  {id:"fanar",d:"lfanar",en:"this lantern",fr:"cette lanterne",enIt:"it",frIt:"la",start:450,verb:"Ghanakhdou"},
  {id:"berrad",d:"lberrad",en:"this teapot",fr:"cette théière",enIt:"it",frIt:"la",start:600,verb:"Ghanakhdou"},
  {id:"tajine",d:"ttajin",en:"this tajine pot",fr:"ce plat à tajine",enIt:"it",frIt:"le",start:250,verb:"Ghanakhdou"},
];
const round10 = (x) => Math.max(10, Math.round(x / 10) * 10);
const HAGGLE_OPEN = ["3ndi a7san taman f ssou9!","I have the best price in the souk!","J’ai le meilleur prix du souk !"];
function haggleRounds(it) {
  const offer = round10(it.start * 0.35);
  return { offer, rounds:[
    { v:(p) => [`Mer7ba bik! Had ${it.d} ghir b ${p} dirham.`, `Welcome! Only ${p} dirhams for ${it.en}.`, `Bienvenue ! Seulement ${p} dirhams pour ${it.fr}.`],
      o:[ { d:["Ghali bzzaf! Nqss chwiya.","Way too expensive! Lower it a bit.","Beaucoup trop cher ! Baisse un peu."], f:0.75, r:(p) => [`Wakha, 3la wjhek: ${p}.`,`OK, just for you: ${p}.`,`D’accord, rien que pour toi : ${p}.`] },
          { d:["Wakha, mzyan!","OK, sounds good!","D’accord, c’est bien !"], accept:true, r:() => ["Bssa7tek! Llah ybarek fik.","Enjoy! God bless you. (He can’t believe his luck.)","Profite bien ! Que Dieu te bénisse. (Il n’en revient pas.)"] },
          { d:["Kanbghik!","I love you!","Je t’aime !"], f:1, r:() => ["Hhh, 7tta ana! Walakin taman howa howa.","Haha, me too! But the price stays the same.","Haha, moi aussi ! Mais le prix reste le même."] } ] },
    { v:(p) => [`Ma n9derch n9ass ktar. ${p} w safi.`, `I can’t go lower. ${p}, final.`, `Je peux pas baisser plus. ${p}, point final.`],
      o:[ { d:["Akhir taman?","Final price?","Dernier prix ?"], f:0.82, r:(p) => [`Akhir taman: ${p}.`,`Final price: ${p}.`,`Dernier prix : ${p}.`] },
          { d:["Safi, bslama!","Fine, bye!","Bon, salut !"], f:0.7, r:(p) => [`Aji, aji! ${p}, 3la wjhek!`,`Wait, come back! ${p}, just for you!`,`Attends, reviens ! ${p}, rien que pour toi !`] },
          { d:["Fiya jjo3.","I’m hungry.","J’ai faim."], f:1, r:(p) => [`7tta ana! Walakin ${p}.`,`Me too! Still ${p}.`,`Moi aussi ! Toujours ${p}.`] } ] },
    { v:(p) => [`Safi, akhir klma: ${p}.`, `OK, last word: ${p}.`, `Bon, dernier mot : ${p}.`],
      o:[ { d:[`${it.verb} b ${offer}.`, `I’ll take ${it.enIt} for ${offer}.`, `Je ${it.frIt} prends à ${offer}.`], counter:true, r:(p) => [`Tbarkellah 3lik! Safi, ${p}. Bssa7tek!`,`Well played! Fine, ${p}. Enjoy!`,`Bien joué ! Bon, ${p}. Profites-en !`] },
          { d:["Wakha.","OK.","D’accord."], accept:true, r:(p) => [`Mabrouk 3lik! ${p}.`,`Congrats! ${p}.`,`Félicitations ! ${p}.`] },
          { d:["Ghedda.","Tomorrow.","Demain."], f:1.06, final:true, r:(p) => [`Ghedda taman ghadi ytla3! Yallah, ${p}.`,`Tomorrow the price goes up! Come on, ${p}.`,`Demain le prix monte ! Allez, ${p}.`] } ] },
  ] };
}
// next price after a choice, shared by the app and the audio build
function hagglePrice(price, offer, o) {
  if (o.counter) return round10((offer + price) / 2);
  if (o.f) return round10(price * o.f);
  return price;
}

// one key per spoken phrase, shared by the app and the audio build
const buildSay = (toks) => toks.join(" ").replace(/ ch\b/g, "ch");
function audioKey(s) { return String(s).toLowerCase().replace(/^ar:/, "ar:").replace(/[“”"…?!.,:;()]/g, " ").replace(/[’']/g, "").replace(/\s+/g, " ").trim(); }
const PRAISE2 = [["Zwin!","Nice!","Bien !"],["Tbarkellah 3lik!","Well done!","Bien joué !"],["Wa3er!","Awesome!","Trop fort !"],["Nadi!","Excellent!","Top !"],["Mzyan bzzaf!","Very good!","Très bien !"],["Hakka!","That’s it!","C’est ça !"]];

Object.assign(UI.en, {
  learn:"Learn", feed:"Feed", guide:"Guide", kenz:"Kenz", me:"Me",
  unit:"Unit {n}", lesson:"Lesson {n}", review2:"Unit review", boss:"Souk boss", start:"Start", continueL:"Continue", practiceAgain:"Practice again",
  locked:"Finish the lesson before this one to unlock it.", lessonWords:"New words", done:"Done", startHere:"Start here",
  jump:"Jump back in", practiceDue:"Practice {n} words", allCaught:"All caught up",
  check:"Check", correctAns:"Correct answer", hearIt:"Hear it", slow:"Slow", listenPick:"What did you hear?", listenMean:"What does it mean?", tapPairs:"Tap the matching pairs", matchK:"Pairs",
  matchDone:"All matched!", lessonDone:"Lesson complete!", perfectL:"Perfect lesson!", accuracy:"accuracy", timeL:"time", xpL:"XP", quit:"Quit lesson",
  quitQ:"Leave this lesson? You’ll lose this lesson’s progress.", keepLearning:"Keep learning", leave:"Leave",
  nextUnit:"Unit {n} unlocked", comingSoon:"More units are on the way.", unitDone:"{a} of {b} done",
  welcomeT:"Learn Darija the fun way", welcomeS:"Short lessons, real Moroccan phrases, and every word spoken out loud.", getStarted:"Get started", haveFun:"Pick your daily goal",
  goalChill:"Chill", goalReg:"Regular", goalSer:"Serious", aboutLesson:"about {n} lesson a day", aboutLessons:"about {n} lessons a day",
  sounds:"Sounds", rules:"Rules", phrasebook:"Phrasebook", soundsS:"The letters English doesn’t have. Tap to hear them.", rulesS:"The few rules that unlock most of Darija.",
  phraseS:"Every word in Wakha, with audio.", search:"Search words", learnedOnly:"Learned", allWords:"All", examples:"Examples", soundsLike:"Sounds like",
  playSound:"Play the sound", conv:"Conversation", playAll:"Play all", proverb:"Moroccan proverb", literally:"Literally", means:"Means",
  voice:"Voice", voiceAuto:"Play words automatically", sfx:"Sound effects", audioNote2:"Darija audio is generated by a computer voice. It’s close, but a native speaker will sound more natural.",
  startLesson1:"Start your first lesson", feedLocked:"Your feed fills up with your words as you learn. For now, enjoy some culture.", wordsLearnedN:"{n} words learned",
  heard:"Listen", navHint:"Or use the arrow keys", noResults:"No words match that.", rare:"Rare", tapToHear:"Tap any Darija to hear it",
});
Object.assign(UI.fr, {
  learn:"Apprendre", feed:"Fil", guide:"Guide", kenz:"Kenz", me:"Moi",
  unit:"Unité {n}", lesson:"Leçon {n}", review2:"Révision de l’unité", boss:"Boss du souk", start:"Commencer", continueL:"Continuer", practiceAgain:"Refaire",
  locked:"Termine la leçon d’avant pour débloquer celle-ci.", lessonWords:"Nouveaux mots", done:"Fait", startHere:"Commence ici",
  jump:"Reprendre", practiceDue:"Réviser {n} mots", allCaught:"Tout est à jour",
  check:"Vérifier", correctAns:"Bonne réponse", hearIt:"Écouter", slow:"Lent", listenPick:"Qu’as-tu entendu ?", listenMean:"Ça veut dire quoi ?", tapPairs:"Relie les paires", matchK:"Paires",
  matchDone:"Tout est relié !", lessonDone:"Leçon terminée !", perfectL:"Leçon parfaite !", accuracy:"précision", timeL:"temps", xpL:"XP", quit:"Quitter la leçon",
  quitQ:"Quitter cette leçon ? Ta progression dans la leçon sera perdue.", keepLearning:"Continuer", leave:"Quitter",
  nextUnit:"Unité {n} débloquée", comingSoon:"D’autres unités arrivent.", unitDone:"{a} sur {b} faites",
  welcomeT:"Apprends la darija en t’amusant", welcomeS:"Des leçons courtes, de vraies phrases marocaines, et chaque mot prononcé à voix haute.", getStarted:"C’est parti", haveFun:"Choisis ton objectif du jour",
  goalChill:"Tranquille", goalReg:"Régulier", goalSer:"Sérieux", aboutLesson:"environ {n} leçon par jour", aboutLessons:"environ {n} leçons par jour",
  sounds:"Sons", rules:"Règles", phrasebook:"Lexique", soundsS:"Les lettres qui n’existent pas en français. Touche pour les entendre.", rulesS:"Les quelques règles qui débloquent presque toute la darija.",
  phraseS:"Tous les mots de Wakha, avec l’audio.", search:"Chercher un mot", learnedOnly:"Appris", allWords:"Tous", examples:"Exemples", soundsLike:"Ça ressemble à",
  playSound:"Écouter le son", conv:"Conversation", playAll:"Tout écouter", proverb:"Proverbe marocain", literally:"Littéralement", means:"Ça veut dire",
  voice:"Voix", voiceAuto:"Lire les mots automatiquement", sfx:"Effets sonores", audioNote2:"L’audio en darija est généré par une voix de synthèse. C’est proche, mais un natif sonnera plus naturel.",
  startLesson1:"Commence ta première leçon", feedLocked:"Ton fil se remplit avec tes mots au fil des leçons. En attendant, un peu de culture.", wordsLearnedN:"{n} mots appris",
  heard:"Écoute", navHint:"Ou les flèches du clavier", noResults:"Aucun mot ne correspond.", rare:"Rare", tapToHear:"Touche n’importe quel mot en darija pour l’entendre",
});

if (typeof module !== "undefined") module.exports = { buildSay, audioKey, LEVELS, W, CORE, COLL, SITS, BUILDS, REELS, DIALOGS, PROVERBS, SOUNDS, RULES, HAGGLE, haggleRounds, hagglePrice, HAGGLE_OPEN, PRAISE, PRAISE2, COMFORT, NO_SAY, UNITS, PATH };
