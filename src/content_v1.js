const W = {}; const CORE = []; const COLL = [];
function w(id, d, ar, en, fr, cat, o = {}) {
  W[id] = Object.assign({ id, d, ar, en, fr, cat }, o);
  (o.rar ? COLL : CORE).push(id);
}
w("salam","Salam","سلام","hi","salut","hello",{grp:"hi",ex:["Salam, labas?","Hi, how are you?","Salut, ça va ?"],note:["Works with everyone, any time of day.","Marche avec tout le monde, à toute heure."]});
w("labas","Labas?","لاباس؟","how are you?","ça va ?","hello",{grp:"howru",lit:["literally “no harm?”","littéralement « pas de mal ? »"],ex:["Labas 3lik?","Are you OK?","Tu vas bien ?"],note:["The answer is “labas” too. Same word, no question mark.","La réponse, c’est aussi « labas ». Même mot, sans le point d’interrogation."]});
w("wakha","Wakha","واخا","OK","d’accord","basics",{grp:"yes",ex:["Wakha, yallah!","OK, let’s go!","D’accord, on y va !"],note:["You’ll hear it a hundred times a day.","Tu l’entendras cent fois par jour."]});
w("bzzaf","Bzzaf","بزاف","a lot / very","beaucoup / très","basics",{ex:["Zwin bzzaf!","So beautiful!","Trop beau !"],note:["Stretch it for drama: bzzzzaf.","Étire-le pour l’effet : bzzzzaf."]});
w("choukran","Choukran","شكرا","thank you","merci","polite",{grp:"thanks",ex:["Choukran bzzaf!","Thanks a lot!","Merci beaucoup !"]});
w("chwiya","Chwiya","شوية","a little","un peu","basics",{ex:["Kanhder chwiya d darija.","I speak a little Darija.","Je parle un peu darija."]});
w("iyeh","Iyeh","إيه","yes","oui","basics",{grp:"yes"});
w("la","La","لا","no","non","basics",{ex:["La, choukran.","No, thanks.","Non, merci."]});
w("bghit","Bghit","بغيت","I want","je veux","basics",{ex:["Bghit atay.","I want tea.","Je veux du thé."]});
w("atay","Atay","أتاي","tea","thé","food",{ex:["Atay b na3na3","Mint tea","Thé à la menthe"],note:["Served sweet. Very sweet. Saying no is not really an option.","Servi sucré. Très sucré. Refuser n’est pas vraiment une option."]});
w("chhal","B chhal?","بشحال؟","how much?","combien ?","souk",{ex:["B chhal hada?","How much is this?","C’est combien ?"]});
w("ghali","Ghali","غالي","expensive","cher","souk",{ex:["Ghali bzzaf!","Way too expensive!","Beaucoup trop cher !"],note:["Your best friend in the souk.","Ton meilleur ami au souk."]});
w("daba","Daba","دابا","now","maintenant","time",{grp:"now",ex:["Ana jay daba!","I’m coming now!","J’arrive maintenant !"],note:["A Moroccan “now” can last five minutes or five hours.","Un « maintenant » marocain peut durer cinq minutes ou cinq heures."]});
w("mzyan","Mzyan","مزيان","good","bien / bon","feel",{grp:"good",ex:["Kolchi mzyan?","Everything good?","Tout va bien ?"]});
w("bslama","Bslama","بسلامة","bye","au revoir","hello",{ex:["Bslama, nchoufek ghedda!","Bye, see you tomorrow!","Salut, à demain !"]});
w("fin","Fin?","فين؟","where?","où ?","q",{ex:["Fin kayn bit lma?","Where’s the bathroom?","Où sont les toilettes ?"]});
w("zwin","Zwin","زوين","beautiful / nice","beau / joli","feel",{grp:"good",ex:["Had lblad zwina.","This country is beautiful.","Ce pays est beau."]});
w("smeh","Smeh liya","سمح ليا","sorry / excuse me","pardon","polite",{ex:["Smeh liya, fin kayn ttobis?","Excuse me, where’s the bus?","Pardon, où est le bus ?"]});
w("3afak","3afak","عافاك","please","s’il te plaît","polite",{grp:"please",ex:["3tini lma, 3afak.","Give me water, please.","Donne-moi de l’eau, s’il te plaît."]});
w("ma3lich","Ma3lich","ماعليش","no worries","pas grave","polite",{ex:["Ma3lich, machi mouchkil.","No worries, it’s not a problem.","Pas grave, c’est pas un problème."]});
w("lma","Lma","الما","water","l’eau","food");
w("khobz","Khobz","خبز","bread","pain","food",{ex:["Khobz skhoun","Warm bread","Pain chaud"]});
w("hamdoulillah","L7amdoulillah","الحمد لله","thank God / all good","Dieu merci","hello",{grp:"good",note:["The standard reply to “labas?”","La réponse classique à « labas ? »"]});
w("kidayr","Ki dayr?","كيداير؟","how’s it going?","comment ça va ?","hello",{grp:"howru",note:["To a woman: ki dayra?","À une femme : ki dayra ?"]});
w("bikhir","Bikhir","بيخير","fine / well","bien","hello",{grp:"good",ex:["Ana bikhir, l7amdoulillah.","I’m good, thank God.","Je vais bien, Dieu merci."]});
w("merhba","Mer7ba","مرحبا","welcome","bienvenue","hello",{ex:["Mer7ba bik f lmghrib!","Welcome to Morocco!","Bienvenue au Maroc !"]});
w("smiti","Smiti…","سميتي","my name is…","je m’appelle…","hello",{ex:["Smiti Yasmine.","My name is Yasmine.","Je m’appelle Yasmine."]});
w("achsmitek","Ach smitek?","أش سميتك؟","what’s your name?","comment tu t’appelles ?","q");
w("achnou","Achnou?","أشنو؟","what?","quoi ?","q",{ex:["Achnou hada?","What’s this?","C’est quoi ça ?"]});
w("kifach","Kifach?","كيفاش؟","how?","comment ?","q",{ex:["Kifach ngoul… b darija?","How do I say… in Darija?","Comment on dit… en darija ?"]});
w("3lach","3lach?","علاش؟","why?","pourquoi ?","q");
w("imta","Imta?","إمتى؟","when?","quand ?","q");
w("chkoun","Chkoun?","شكون؟","who?","qui ?","q");
w("wach","Wach…?","واش","is it…? (question starter)","est-ce que… ?","q",{ex:["Wach nta mghribi?","Are you Moroccan?","Tu es marocain ?"]});
w("kayn","Kayn","كاين","there is","il y a","basics",{ex:["Wach kayn lwifi?","Is there wifi?","Il y a le wifi ?"]});
w("makaynch","Makaynch","ماكاينش","there isn’t","il n’y a pas","basics",{ex:["Makaynch mouchkil.","No problem.","Pas de problème."]});
w("mafhemtch","Ma fhemtch","ما فهمتش","I didn’t get it","j’ai pas compris","basics");
w("3awed","3awed","عاود","again / repeat","répète","basics",{ex:["3awed, 3afak?","Again, please?","Encore, s’il te plaît ?"]});
w("hder","Hder bchwiya","هضر بشوية","speak slowly","parle doucement","basics",{ex:["Hder bchwiya, 3afak.","Speak slowly, please.","Parle doucement, s’il te plaît."]});
w("ma3reftch","Ma3reftch","ما عرفتش","I don’t know","je sais pas","basics");
w("yallah","Yallah","يالاه","let’s go!","on y va !","basics");
w("safi","Safi","صافي","OK, enough","c’est bon, ça suffit","basics",{grp:"yes",ex:["Safi, chb3t!","Enough, I’m full!","C’est bon, j’ai bien mangé !"]});
w("lyoum","Lyoum","اليوم","today","aujourd’hui","time");
w("ghedda","Ghedda","غدا","tomorrow","demain","time");
w("lbare7","Lbare7","البارح","yesterday","hier","time");
w("bnin","Bnin","بنين","delicious","délicieux","food",{grp:"good",ex:["Had ttajin bnin bzzaf!","This tajine is so good!","Ce tajine est trop bon !"]});
w("fiyajjo3","Fiya jjo3","فيا الجوع","I’m hungry","j’ai faim","food",{lit:["literally “hunger is in me”","littéralement « la faim est en moi »"]});
w("na3na3","Na3na3","نعناع","mint","menthe","food");
w("sokkar","Sokkar","سكر","sugar","sucre","food",{note:["“Bla sokkar” (no sugar) is a brave request.","« Bla sokkar » (sans sucre), c’est une demande courageuse."]});
w("rkhis","Rkhis","رخيص","cheap","pas cher","souk");
w("nqss","Nqss chwiya","نقص شوية","lower it a bit","baisse un peu","souk");
w("akhirtaman","Akhir taman?","آخر ثمن؟","final price?","dernier prix ?","souk");
w("lflous","Lflous","الفلوس","money","l’argent","souk");
w("dar","Dar","دار","house / home","maison","basics",{ex:["Ana f ddar.","I’m at home.","Je suis à la maison."]});
w("yemma","Yemma","يما","mom","maman","family");
w("baba","Baba","بابا","dad","papa","family");
w("khouya","Khouya","خويا","my brother / bro","mon frère","family");
w("khti","Khti","ختي","my sister","ma sœur","family");
w("mima","Mima","ميمة","grandma","mamie","family",{note:["Some families say “henna” instead.","Certaines familles disent « henna »."]});
w("sa7bi","Sa7bi","صاحبي","my friend","mon pote","family",{note:["For a girl: sa7bti.","Pour une fille : sa7bti."]});
w("kanbghik","Kanbghik","كنبغيك","I love you","je t’aime","feel",{note:["Works for your partner, your mom and your favorite tajine.","Marche pour ton chéri, ta mère et ton tajine préféré."]});
w("mabrouk","Mabrouk!","مبروك","congrats!","félicitations !","polite");
w("inchallah","Inchallah","إن شاء الله","God willing / hopefully","si Dieu le veut","polite",{note:["Can mean yes, maybe or never. Watch the face.","Peut vouloir dire oui, peut-être ou jamais. Regarde le visage."]});
w("tobis","Tobis","طوبيس","bus","bus","remix",{note:["From the French “autobus”.","Du français « autobus »."]});
w("simana","Simana","سيمانة","week","semaine","remix",{note:["From the Spanish “semana”.","De l’espagnol « semana »."]});
w("kozina","Kozina","كوزينة","kitchen","cuisine","remix",{note:["From the Spanish “cocina”.","De l’espagnol « cocina »."]});
w("tomobil","Tomobil","طوموبيل","car","voiture","remix",{note:["From the French “automobile”.","Du français « automobile »."]});
w("wqef","Wqef hna","وقف هنا","stop here","arrête-toi ici","travel");
w("nichan","Sir nichan","سير نيشان","go straight","tout droit","travel");
w("limen","3la limen","على ليمن","to the right","à droite","travel");
w("lisar","3la lisar","على ليسار","to the left","à gauche","travel");
w("dghya","Dghya","دغيا","quickly","vite","basics",{grp:"now"});
w("khayb","Khayb","خايب","bad / ugly","mauvais / moche","feel",{ex:["Ljaw khayb lyoum.","The weather’s bad today.","Il fait moche aujourd’hui."]});
w("skhoun","Skhoun","سخون","hot","chaud","feel",{ex:["Atay skhoun!","The tea is hot!","Le thé est chaud !"]});
w("3yit","3yit","عييت","I’m tired","je suis fatigué(e)","feel");
w("wa7ed","Wa7ed","واحد","one","un","num");
w("jouj","Jouj","جوج","two","deux","num",{note:["Very Moroccan. Most other Arabic dialects say “tnin”.","Très marocain. La plupart des autres dialectes disent « tnin »."]});
w("tlata","Tlata","تلاتة","three","trois","num");
w("khamsa","Khamsa","خمسة","five","cinq","num",{note:["Also the hand charm against the evil eye.","C’est aussi la main contre le mauvais œil."]});
w("3achra","3achra","عشرة","ten","dix","num");
w("mya","Mya","مية","a hundred","cent","num");
w("lbrd","Lbrd","البرد","the cold","le froid","feel",{ex:["Kayn lbrd lyoum.","It’s cold today.","Il fait froid aujourd’hui."]});
w("9hwa","9hwa","قهوة","coffee","café","food");
w("tsb7","Tsb7 3la khir","تصبح على خير","good night","bonne nuit","hello");
w("sba7","Sba7 lkhir","صباح الخير","good morning","bonjour (le matin)","hello",{grp:"hi"});
w("blamzyya","Bla mzyya","بلا مزية","you’re welcome","de rien","polite",{lit:["literally “no favor”","littéralement « sans faveur »"]});
// collectibles (Kenz)
w("bssa7a","Bssa7a!","بالصحة","enjoy it! (new look, meal, hammam)","profite bien !","expr",{rar:"rare",note:["Reply: “Llah y3tik sa7a” (God give you health).","Réponse : « Llah y3tik sa7a » (que Dieu te donne la santé)."]});
w("hchouma","Hchouma","حشومة","shame! / so embarrassing","la honte !","expr",{rar:"rare"});
w("llahykhlik","Llah ykhlik","الله يخليك","please (the warm one)","s’il te plaît (chaleureux)","expr",{rar:"rare",grp:"please",lit:["literally “may God keep you”","littéralement « que Dieu te garde »"]});
w("mskin","Mskin","مسكين","poor thing","le pauvre","expr",{rar:"rare"});
w("drari","Drari","دراري","the kids / the guys","les gamins / les gars","slang",{rar:"rare"});
w("mchal7al","Mcha l7al","مشا الحال","it’s late","il est tard","expr",{rar:"rare",lit:["literally “the time has gone”","littéralement « le temps est parti »"]});
w("chb3t","Chb3t","شبعت","I’m full","j’ai bien mangé","food",{rar:"rare"});
w("wa3er","Wa3er","واعر","awesome / insane","trop fort","slang",{rar:"epic",grp:"good"});
w("nadi","Nadi","نادي","excellent","top / génial","slang",{rar:"epic",grp:"good"});
w("9afez","9afez","قافز","street-smart / sly","malin","slang",{rar:"epic"});
w("zzhr","Zzhr","الزهر","luck","la chance","slang",{rar:"epic",ex:["3ndek zzhr!","You’re so lucky!","T’as trop de chance !"]});
w("tberguig","Tberguig","تبركيك","nosy gossip","le commérage","slang",{rar:"epic"});
w("dabadaba","Daba daba","دابا دابا","right now, for real","tout de suite, vraiment","time",{rar:"epic",grp:"now"});
w("tbarkellah","Tbarkellah","تبارك الله","bless! / well done","bravo, que Dieu préserve","expr",{rar:"legend",note:["Praise that keeps the evil eye away. For babies, new cars and good grades.","Un compliment qui éloigne le mauvais œil. Pour les bébés, les voitures neuves et les bonnes notes."]});
w("lwalidin","Llah yr7am lwalidin","الله يرحم الوالدين","please / thanks (the magic one)","s’il te plaît / merci (la formule magique)","expr",{rar:"legend",grp:"please",lit:["literally “may God have mercy on your parents”","littéralement « que Dieu ait pitié de tes parents »"]});
w("zaama","Zaama","زعما","like… / yeah, right","genre… / soi-disant","slang",{rar:"legend",note:["The filler word of Morocco. Also the perfect sarcastic reply.","Le mot de remplissage du Maroc. Et la réplique sarcastique parfaite."]});
w("khamsawkhmis","Khamsa w khmis","خمسة وخميس","touch wood! (against the evil eye)","touche du bois !","expr",{rar:"legend",lit:["literally “five and Thursday”","littéralement « cinq et jeudi »"]});

const CAT = {hello:["Greetings","Salutations"],polite:["Manners","Politesse"],basics:["Basics","Bases"],q:["Questions","Questions"],food:["Food","Bouffe"],souk:["Souk","Souk"],family:["Family","Famille"],time:["Time","Temps"],travel:["Getting around","Se déplacer"],feel:["Vibes","Ressenti"],num:["Numbers","Chiffres"],foot:["Football","Foot"],remix:["Loanwords","Mots empruntés"],slang:["Street","Rue"],expr:["Expression","Expression"]};
const RAR = {rare:["Rare","Rare"],epic:["Epic","Épique"],legend:["Legendary","Légendaire"]};

// situations: [id, emoji, prompt[en,fr], answerWord, options [[darija,en,fr]...] first = correct]
const SITS = [
  ["haircut","💈",["Your friend just got a fresh haircut. You say…","Ton pote sort de chez le coiffeur. Tu dis…"],"bssa7a",[["Bssa7a!","Enjoy it!","Profite bien !"],["Ghali bzzaf!","Too expensive!","Trop cher !"],["Bslama!","Bye!","Salut !"],["Fiya jjo3.","I’m hungry.","J’ai faim."]]],
  ["vase","🏺",["A vendor wants 400 DH for a tiny vase. You say…","Un vendeur veut 400 DH pour un petit vase. Tu dis…"],"ghali",[["Ghali bzzaf!","Way too expensive!","Beaucoup trop cher !"],["Wakha, choukran!","OK, thanks!","D’accord, merci !"],["Kanbghik.","I love you.","Je t’aime."],["Tsb7 3la khir.","Good night.","Bonne nuit."]]],
  ["lost","🧭",["You’re lost in the medina.","Tu es perdu(e) dans la médina."],"smeh",[["Smeh liya, fin kayn lbab?","Excuse me, where’s the gate?","Pardon, où est la porte ?"],["Mabrouk!","Congrats!","Félicitations !"],["Safi, chb3t.","Enough, I’m full.","Ça suffit, j’ai bien mangé."],["Bzzaf!","A lot!","Beaucoup !"]]],
  ["dinner","🍲",["Your mom calls you to dinner. You’re on your way.","Ta mère t’appelle pour manger. Tu arrives."],"daba",[["Ana jay daba!","I’m coming now!","J’arrive tout de suite !"],["Ma3reftch.","I don’t know.","Je sais pas."],["Ghali bzzaf.","Too expensive.","Trop cher."],["Wqef hna.","Stop here.","Arrête-toi ici."]]],
  ["taxi","🚕",["Your petit taxi reaches your street.","Ton petit taxi arrive dans ta rue."],"wqef",[["Wqef hna, 3afak.","Stop here, please.","Arrête-toi ici, s’il te plaît."],["Sir nichan!","Go straight!","Tout droit !"],["Bssa7a!","Enjoy!","Profite bien !"],["Achnou hada?","What’s this?","C’est quoi ça ?"]]],
  ["thanks","🙏",["Someone says “choukran” to you.","Quelqu’un te dit « choukran »."],"blamzyya",[["Bla mzyya.","You’re welcome.","De rien."],["Choukran.","Thank you.","Merci."],["Ma fhemtch.","I didn’t get it.","J’ai pas compris."],["Ghedda.","Tomorrow.","Demain."]]],
  ["night","🌙",["You’re leaving your aunt’s house late at night.","Tu quittes la maison de ta tante tard le soir."],"tsb7",[["Tsb7 3la khir!","Good night!","Bonne nuit !"],["Sba7 lkhir!","Good morning!","Bonjour !"],["Mer7ba!","Welcome!","Bienvenue !"],["B chhal?","How much?","Combien ?"]]],
  ["license","🎉",["Your cousin just passed her driving test.","Ta cousine vient d’avoir son permis."],"mabrouk",[["Mabrouk!","Congrats!","Félicitations !"],["Mskina.","Poor thing.","La pauvre."],["Hchouma!","Shame on you!","La honte !"],["Fin?","Where?","Où ?"]]],
  ["baby","👶",["Your cousin shows you her newborn baby.","Ta cousine te montre son nouveau-né."],"tbarkellah",[["Tbarkellah!","Bless! (no evil eye)","Que Dieu le préserve !"],["Ghali!","Expensive!","Cher !"],["Khayb.","Ugly.","Moche."],["Yallah!","Let’s go!","On y va !"]]],
  ["couscous","🥘",["Mima keeps adding couscous to your plate. You’re done.","Mima remet du couscous dans ton assiette. T’en peux plus."],"chb3t",[["Safi, chb3t!","Enough, I’m full!","Stop, j’ai bien mangé !"],["Zid!","More!","Encore !"],["Fiya jjo3!","I’m hungry!","J’ai faim !"],["Ghedda.","Tomorrow.","Demain."]]],
  ["bags","🧳",["A stranger helps you carry your heavy bags.","Un inconnu t’aide à porter tes valises."],"lwalidin",[["Llah yr7am lwalidin!","Bless your parents! (thank you)","Paix à tes parents ! (merci)"],["Hchouma!","Shame!","La honte !"],["Ghali bzzaf.","Too expensive.","Trop cher."],["Ma3reftch.","I don’t know.","Je sais pas."]]],
  ["fast","🗣️",["The shopkeeper talks way too fast.","Le commerçant parle beaucoup trop vite."],"hder",[["Hder bchwiya, 3afak.","Speak slowly, please.","Parle doucement, s’il te plaît."],["Dghya, dghya!","Faster, faster!","Plus vite !"],["Mabrouk!","Congrats!","Félicitations !"],["Atay!","Tea!","Du thé !"]]],
  ["goal","⚽",["Your friend scores an impossible goal.","Ton pote marque un but impossible."],"wa3er",[["Wa3er!","Insane!","Trop fort !"],["Mskin.","Poor guy.","Le pauvre."],["Smeh liya.","Excuse me.","Pardon."],["Lbare7.","Yesterday.","Hier."]]],
  ["neighbor","👋",["Your neighbor asks: “Labas?”","Ton voisin te demande : « Labas ? »"],"hamdoulillah",[["Labas, l7amdoulillah.","Fine, thank God.","Ça va, Dieu merci."],["Bla mzyya.","You’re welcome.","De rien."],["Ghali.","Expensive.","Cher."],["Imta?","When?","Quand ?"]]],
  ["wedding","⏰",["It’s 1 a.m. and the wedding party is still going. You want to leave.","Il est 1 h du matin et le mariage continue. Tu veux partir."],"mchal7al",[["Mcha l7al, ghadi nmchi.","It’s late, I’m heading out.","Il est tard, je vais y aller."],["Daba daba!","Right now!","Tout de suite !"],["Zid atay!","More tea!","Encore du thé !"],["Sba7 lkhir!","Good morning!","Bonjour !"]]],
  ["eye","🧿",["Someone says your new car is stunning. You want to block the evil eye.","Quelqu’un dit que ta nouvelle voiture est magnifique. Tu veux éviter le mauvais œil."],"khamsawkhmis",[["Khamsa w khmis!","Touch wood!","Touche du bois !"],["Ghali bzzaf!","Too expensive!","Trop cher !"],["Kanbghik!","I love you!","Je t’aime !"],["Yallah!","Let’s go!","On y va !"]]],
  ["raffle","🍀",["Your friend wins a phone in a raffle.","Ton pote gagne un téléphone à la tombola."],"zzhr",[["3ndek zzhr!","You’re so lucky!","T’as trop de chance !"],["Hchouma!","Shame!","La honte !"],["Ma fhemtch.","I didn’t get it.","J’ai pas compris."],["Bslama.","Bye.","Salut."]]],
  ["auntie","👀",["Your aunt wants every detail about your love life.","Ta tante veut tous les détails sur ta vie amoureuse."],"tberguig",[["Hadchi tberguig!","That’s just nosy gossip!","C’est du commérage, ça !"],["Mabrouk!","Congrats!","Félicitations !"],["Atay b na3na3.","Mint tea.","Thé à la menthe."],["Sir nichan.","Go straight.","Tout droit."]]],
  ["chores","🧠",["Your little brother talks his way out of chores. Again.","Ton petit frère échappe encore aux corvées avec son baratin."],"9afez",[["Nta 9afez!","You’re so sly!","T’es malin, toi !"],["Bssa7a!","Enjoy!","Profite bien !"],["Wqef hna.","Stop here.","Arrête-toi ici."],["Fin?","Where?","Où ?"]]],
  ["kids","👦",["Mima asks where the kids went.","Mima demande où sont passés les enfants."],"drari",[["Drari f zzen9a.","The kids are out in the street.","Les gamins sont dans la rue."],["Ghali bzzaf.","Too expensive.","Trop cher."],["Tsb7 3la khir.","Good night.","Bonne nuit."],["Kanbghik.","I love you.","Je t’aime."]]],
  ["bucket","😢",["Your friend’s phone fell into the hammam bucket.","Le téléphone de ton pote est tombé dans le seau du hammam."],"mskin",[["Mskin!","Poor thing!","Le pauvre !"],["Wa3er!","Awesome!","Trop fort !"],["Mer7ba!","Welcome!","Bienvenue !"],["3ndek zzhr!","You’re lucky!","T’as de la chance !"]]],
  ["tacos","🌯",["Your cousin asks how the new tacos place was. It was amazing.","Ton cousin demande comment était le nouveau tacos. C’était top."],"nadi",[["Nadi!","Excellent!","Top !"],["Khayb.","Bad.","Nul."],["Ma3reftch.","I don’t know.","Je sais pas."],["Ghedda.","Tomorrow.","Demain."]]],
  ["running","🏃",["Your friend swears he’ll wake up at 6 to go running. You doubt it.","Ton pote jure qu’il va se lever à 6 h pour courir. T’y crois pas."],"zaama",[["Zaama?","Yeah, right?","Ouais, c’est ça ?"],["Mabrouk!","Congrats!","Félicitations !"],["Bslama.","Bye.","Salut."],["3afak.","Please.","S’il te plaît."]]],
  ["coffee","☕",["You want your sister to bring you a coffee. Ask nicely.","Tu veux que ta sœur te ramène un café. Demande gentiment."],"llahykhlik",[["Jibli 9hwa, llah ykhlik.","Bring me a coffee, please.","Ramène-moi un café, s’il te plaît."],["Jibli 9hwa, daba!","Bring me a coffee. NOW!","Ramène-moi un café. MAINTENANT !"],["Ma bghitch.","I don’t want it.","Je veux pas."],["Bslama.","Bye.","Salut."]]],
];

// builds: [id, en, fr, tokens, extras, creditWord, alt?]
const BUILDS = [
  ["tea","I want mint tea","Je veux un thé à la menthe",["bghit","atay","b","na3na3"],["fin","ghali"],"bghit"],
  ["wc","Where is the bathroom?","Où sont les toilettes ?",["fin","kayn","bit","lma"],["daba","chhal"],"fin"],
  ["much","How much is this?","C’est combien ?",["b","chhal","hada"],["wakha","ghedda"],"chhal"],
  ["didnt","I didn’t understand","J’ai pas compris",["ma","fhemt","ch"],["bghit","zwin"],"mafhemtch"],
  ["slow","Speak slowly, please","Parle doucement, s’il te plaît",["hder","bchwiya","3afak"],["dghya","bzzaf"],"hder"],
  ["pretty","This is very beautiful","C’est très beau",["hada","zwin","bzzaf"],["chwiya","ghali"],"zwin",[["zwin","bzzaf","hada"]]],
  ["home","I’m going home","Je rentre à la maison",["ana","ghadi","l","ddar"],["jay","lbare7"],"dar"],
  ["dontwant","I don’t want it","Je veux pas",["ma","bghit","ch"],["kayn","safi"],"bghit"],
  ["tomorrow","See you tomorrow","À demain",["nchoufek","ghedda"],["lbare7","daba"],"ghedda"],
  ["water","Give me water, please","Donne-moi de l’eau, s’il te plaît",["3tini","lma","3afak"],["khobz","atay"],"lma"],
  ["wifi","There’s no wifi","Il n’y a pas de wifi",["makaynch","lwifi"],["kayn","bzzaf"],"makaynch"],
  ["welcome","Welcome to Morocco","Bienvenue au Maroc",["mer7ba","bik","f","lmghrib"],["bslama","lyoum"],"merhba"],
  ["allgood","Everything’s good, thank God","Tout va bien, Dieu merci",["kolchi","mzyan","l7amdoulillah"],["khayb","imta"],"mzyan"],
];

// reels: [id, tile, title[en,fr], slides [[emoji|null, big, en, fr]], collectible?]
const REELS = [
  ["letters","t-cobalt",["Numbers are letters","Les chiffres sont des lettres"],[
    [null,"3 7 9","In Darija texts, some numbers are letters.","Dans les textos en darija, certains chiffres sont des lettres."],
    [null,"3 = ع","A deep “a” from the throat. Like in 3afak (please).","Un « a » profond, de la gorge. Comme dans 3afak (s’il te plaît)."],
    [null,"7 = ح","A breathy h, like fogging up a mirror. Like in 7out (fish).","Un h soufflé, comme pour faire de la buée. Comme dans 7out (poisson)."],
    [null,"9 = ق","A k from deep in the throat. Like in 9hwa (coffee).","Un k du fond de la gorge. Comme dans 9hwa (café)."],
    [null,"gh = غ","gh sounds like the French R. kh sounds like the ch in Bach.","gh se prononce comme le R français. kh comme la jota espagnole."]]],
  ["daba","t-rose",["Daba ≠ now","Daba ≠ maintenant"],[
    [null,"Daba","It means “now”.","Ça veut dire « maintenant »."],
    ["⏳","Daba?","But a Moroccan “daba” can mean in five minutes…","Mais un « daba » marocain peut vouloir dire dans cinq minutes…"],
    ["🫠","…or 5 hours","…or in five hours. Or next week.","…ou dans cinq heures. Ou la semaine prochaine."],
    ["⚡","Daba daba!","Need it right now, for real? Say it twice.","Tu le veux vraiment tout de suite ? Dis-le deux fois."]],"dabadaba"],
  ["bssa7a","t-emerald",["The magic word","Le mot magique"],[
    ["💈","Bssa7a!","Fresh haircut? Bssa7a!","Nouvelle coupe ? Bssa7a !"],
    ["👟","Bssa7a!","New shoes? Bssa7a!","Nouvelles baskets ? Bssa7a !"],
    ["🛁","Bssa7a!","Back from the hammam? Bssa7a!","Tu sors du hammam ? Bssa7a !"],
    [null,"Llah y3tik sa7a","The reply: “God give you health.”","La réponse : « Que Dieu te donne la santé. »"]],"bssa7a"],
  ["remix","t-teal",["Darija is a remix","La darija est un remix"],[
    ["🎧",null,"Darija borrows words from French and Spanish.","La darija emprunte des mots au français et à l’espagnol."],
    [null,"Tobis","Bus, from the French “autobus”.","Le bus, du français « autobus »."],
    [null,"Simana","Week, from the Spanish “semana”.","La semaine, de l’espagnol « semana »."],
    [null,"Kozina","Kitchen, from the Spanish “cocina”.","La cuisine, de l’espagnol « cocina »."],
    [null,"Fermli","Nurse, from the French “infirmier”.","L’infirmier, du français « infirmier »."]]],
  ["neg","t-saffron",["The ma…ch sandwich","Le sandwich ma…ch"],[
    ["🥪",null,"To say “not”, wrap the verb: ma + verb + ch.","Pour dire « ne… pas », on entoure le verbe : ma + verbe + ch."],
    [null,"ma fhemt ch","fhemt = I understood. ma fhemtch = I didn’t understand.","fhemt = j’ai compris. ma fhemtch = j’ai pas compris."],
    [null,"ma bghit ch","bghit = I want. ma bghitch = I don’t want.","bghit = je veux. ma bghitch = je veux pas."],
    [null,"ma kayn ch","kayn = there is. makaynch = there isn’t.","kayn = il y a. makaynch = il n’y a pas."]]],
  ["ryal","t-fez",["Grandma’s money math","Les maths de Mima"],[
    ["👵","Alf ryal?","Mima says something costs “alf ryal”. Panic?","Mima dit que ça coûte « alf ryal ». Panique ?"],
    [null,"1 DH = 20 ryal","In much of Morocco, people still count in ryal.","Dans une grande partie du Maroc, on compte encore en ryal."],
    [null,"= 50 DH","So alf ryal (1,000 ryal) is 50 dirhams.","Donc alf ryal (1 000 ryal), c’est 50 dirhams."],
    ["🧮",null,"Yes, everyone needs a second to calculate.","Oui, tout le monde a besoin d’une seconde pour calculer."]]],
  ["inch","t-cobalt",["Inchallah has levels","Les niveaux d’inchallah"],[
    [null,"Inchallah","It means “God willing”.","Ça veut dire « si Dieu le veut »."],
    ["😄",null,"Said fast with a smile: probably yes.","Dit vite avec le sourire : sûrement oui."],
    ["😐",null,"Said slowly, looking away: probably no.","Dit lentement en regardant ailleurs : sûrement non."],
    ["🎮",null,"Said by mom about buying a console: never.","Dit par maman pour une console : jamais."]]],
  ["walidin","t-emerald",["The ultimate please","Le s’il te plaît ultime"],[
    [null,"Llah yr7am lwalidin","Literally: “May God have mercy on your parents.”","Littéralement : « Que Dieu ait pitié de tes parents. »"],
    ["🙏",null,"Use it to ask a favor. Nobody can say no.","Utilise-le pour demander un service. Personne ne peut refuser."],
    ["🤝",null,"Use it to say thanks when someone helps you.","Utilise-le pour remercier quelqu’un qui t’aide."]],"lwalidin"],
  ["yes","t-saffron",["Four ways to say yes","Quatre façons de dire oui"],[
    [null,"Iyeh","Yes. The standard.","Oui. Le classique."],
    [null,"Ah","Yeah. Super casual.","Ouais. Très détendu."],
    [null,"Wakha","OK, deal.","D’accord, ça marche."],
    [null,"Safi","OK, done, enough. End of discussion.","C’est bon. Fin de la discussion."]]],
  ["hchouma","t-rose",["Hchouma","Hchouma"],[
    [null,"Hchouma","Shame, embarrassment, “what will people say”.","La honte, la gêne, le « qu’est-ce que les gens vont dire »."],
    ["👵",null,"A kid talks back to an adult? Hchouma!","Un enfant répond à un adulte ? Hchouma !"],
    ["🍽️",null,"It’s why guests say “no thanks” twice before eating. The host always insists.","C’est pour ça que l’invité refuse deux fois avant de manger. L’hôte insiste toujours."]],"hchouma"],
  ["khamsa","t-night",["The number five","Le chiffre cinq"],[
    [null,"Khamsa","It means five.","Ça veut dire cinq."],
    ["✋",null,"It’s also the hand charm that blocks the evil eye.","C’est aussi la main qui protège du mauvais œil."],
    [null,"Khamsa w khmis","“Five and Thursday.” Moroccans say it the way you’d say “touch wood”.","« Cinq et jeudi. » Les Marocains le disent comme on dit « touche du bois »."]],"khamsawkhmis"],
  ["taxi","t-saffron",["Petit taxi survival kit","Kit de survie en petit taxi"],[
    ["🚕",null,"Three phrases and you run the back seat.","Trois phrases et c’est toi qui commandes."],
    [null,"Sir nichan","Go straight.","Tout droit."],
    [null,"3la limen","To the right. Left is 3la lisar.","À droite. À gauche, c’est 3la lisar."],
    [null,"Wqef hna","Stop here.","Arrête-toi ici."]]],
];


const LEVELS = [
  [0,"Tourist","Touriste"],[60,"Kanfhem chwiya","Kanfhem chwiya"],[180,"Mn l7ouma","Mn l7ouma"],[380,"Souk haggler","Pro du marchandage"],
  [650,"Taxi philosopher","Philosophe du taxi"],[1000,"Mima’s favorite","Le chouchou de Mima"],[1450,"9afez","9afez"],[2000,"Darija legend","Légende de la darija"]
];
const LEVEL_STEP = 800;
const LEVEL_SUB = {"Kanfhem chwiya":["“I get a little”","« je comprends un peu »"],"Mn l7ouma":["“from the neighborhood”","« du quartier »"],"9afez":["“street-smart”","« malin »"]};

const PRAISE = [["Zwin!","Nice!","Bien !"],["Tbarkellah 3lik!","Well done!","Bien joué !"],["Wa3er!","Awesome!","Trop fort !"],["Nadi!","Excellent!","Top !"],["Mzyan bzzaf!","Very good!","Très bien !"]];
const COMFORT = [["Ma3lich!","No worries.","Pas grave."],["Machi mouchkil.","Not a problem.","C’est pas un problème."],["3awed!","Try again next time.","On réessaiera."]];

const UI = {
  en:{feed:"Feed",words:"Words",kenz:"Kenz",me:"Me",newWord:"New word",review:"Review",whatMeans:"What does this mean?",howSay:"How do you say",whatSay:"What do you say?",
    buildK:"Build it",say:"Say it in Darija:",swipe:"Swipe up",next:"Next",doubleTap:"Double-tap to save",save:"Save",saved:"Saved to your words",listen:"Listen",share:"Share",
    copied:"Copied. Paste it anywhere.",shareFail:"Sharing isn’t available here.",imgSaved:"Image saved. Post it to your story.",answer:"Answer:",tryAgain:"Not quite. Try again.",
    shown:"Here’s the right order.",reel:"Culture reel",gotIt:"Got it",mystery:"Mystery box",sandou9:"Sandou9!",tapOpen:"Tap the box to open it",
    boostT:"Atay boost!",boostS:"Double XP on your next 5 answers.",shieldT:"Streak shield",shieldS:"Miss a day, keep your streak. You have {n}.",xpT:"+{n} XP",xpS:"Free XP. No questions asked.",
    foundT:"New word for your Kenz!",rareDrop:"Rare drop",tapFlip:"Tap the card to reveal it",lightning:"Lightning round",lightningS:"{n} words, {s} seconds. True or false?",
    start:"Start",tru:"True",fal:"False",score:"{a} out of {b}",perfect:"Perfect round!",timeUp:"Time’s up!",haggleK:"Souk battle",haggleS:"Get the best price. In Darija.",
    vendor:"3mmi Hmad",vendorS:"Babouches, rugs, lanterns",start2:"Start haggling",deal:"Deal!",paid:"You paid {p} DH instead of {s} DH.",savedDH:"You saved {x} DH",
    stars3:"Souk legend. 3mmi Hmad respects you.",stars2:"Not bad. You’ll eat well tonight.",stars1:"3mmi Hmad thanks you for his new car.",saveImg:"Save story image",copy:"Copy",
    goalK:"Daily goal",goalT:"Pick your daily atay",goalS:"XP fills your tea glass. A full glass lights your streak.",chill:"Chill",regular:"Regular",serious:"Serious",perDay:"{n} XP a day",
    goalNote:"You can change it anytime in Me.",welcomeK:"Welcome to Wakha",welcomeS:"This is how Moroccans say hi.",whyQ:"Why Darija?",
    vibes:["Family","Travel","Love","Just for fun"],welcomeGo:"Yallah! Swipe up.",comebackK:"Welcome back",dayN:"Day {n}",comebackS:"Your streak is waiting. {n} words want a review.",
    comebackS0:"Fill today’s glass to keep the streak going.",comebackNew:"New day, new words.",
    goalDoneK:"Daily goal done",goalDoneT:"Atay wajed!",goalDoneS:"Your glass is full. {n}-day streak.",shieldUsed:"A streak shield saved your streak.",
    levelK:"Level up",levelT:"Level {n}",keepGoing:"Yallah!",
    wordsT:"Your words",wordsS:"{a} learned, {b} mastered",reviewDue:"Review {n} due words",nothingDue:"Nothing due right now",all:"All",dueTab:"Due",
    emptyWords:"No words yet. Scroll the feed and your words land here.",emptyDue:"Nothing to review. Mchicha is impressed.",
    kenzT:"Kenz",kenzS:"Rare words you’ve found. Hunt them in mystery boxes, rare drops, reels and tricky situations.",found:"{a} of {b} found",hidden:"Still hidden",
    meLevel:"Level {n}",xpToNext:"{n} XP to level {l}",maxed:"Top level reached",stStreak:"day streak",stBest:"best streak",stWords:"words learned",stAcc:"accuracy",
    week:"This week",settings:"Settings",lang:"Language",sound:"Sounds",goalSet:"Daily goal",reset:"Reset progress",resetQ:"Erase all your progress? This can’t be undone.",
    erase:"Erase everything",cancel:"Cancel",bestDeal:"Best souk deal",none:"none yet",audioNote:"Audio uses your device’s Arabic voice, so pronunciation is approximate.",
    combo:"combo",streakTip:"Fill your daily atay to grow the streak.",shareWord:"“{d}” ({ar}) means “{m}” in Darija. Learning it on Wakha.",
    shareHaggle:"I just haggled {it} from {s} DH down to {p} DH. In Darija. Wakha.",shareLevel:"Level {n} in Darija: {t}. Wakha.",milestone:"{n} Darija words. Tbarkellah!",daysShort:["S","M","T","W","T","F","S"],today:"today"},
  fr:{feed:"Fil",words:"Mots",kenz:"Kenz",me:"Moi",newWord:"Nouveau mot",review:"Révision",whatMeans:"Ça veut dire quoi ?",howSay:"Comment on dit",whatSay:"Tu dis quoi ?",
    buildK:"Construis",say:"Dis-le en darija :",swipe:"Glisse vers le haut",next:"Suivant",doubleTap:"Tape deux fois pour garder",save:"Garder",saved:"Ajouté à tes mots",listen:"Écouter",share:"Partager",
    copied:"Copié. Colle-le où tu veux.",shareFail:"Le partage n’est pas disponible ici.",imgSaved:"Image enregistrée. Poste-la en story.",answer:"Réponse :",tryAgain:"Pas tout à fait. Réessaie.",
    shown:"Voici le bon ordre.",reel:"Reel culture",gotIt:"Compris",mystery:"Boîte mystère",sandou9:"Sandou9 !",tapOpen:"Touche la boîte pour l’ouvrir",
    boostT:"Boost atay !",boostS:"XP doublés sur tes 5 prochaines réponses.",shieldT:"Bouclier de série",shieldS:"Rate un jour sans perdre ta série. Tu en as {n}.",xpT:"+{n} XP",xpS:"Des XP gratuits. Sans conditions.",
    foundT:"Nouveau mot pour ton Kenz !",rareDrop:"Drop rare",tapFlip:"Touche la carte pour la révéler",lightning:"Round éclair",lightningS:"{n} mots, {s} secondes. Vrai ou faux ?",
    start:"C’est parti",tru:"Vrai",fal:"Faux",score:"{a} sur {b}",perfect:"Sans faute !",timeUp:"Temps écoulé !",haggleK:"Bataille au souk",haggleS:"Obtiens le meilleur prix. En darija.",
    vendor:"3mmi Hmad",vendorS:"Babouches, tapis, lanternes",start2:"Commencer à marchander",deal:"Marché conclu !",paid:"Tu as payé {p} DH au lieu de {s} DH.",savedDH:"Tu as économisé {x} DH",
    stars3:"Légende du souk. 3mmi Hmad te respecte.",stars2:"Pas mal. Tu vas bien manger ce soir.",stars1:"3mmi Hmad te remercie pour sa nouvelle voiture.",saveImg:"Enregistrer l’image",copy:"Copier",
    goalK:"Objectif du jour",goalT:"Choisis ton atay du jour",goalS:"Les XP remplissent ton verre de thé. Un verre plein allume ta série.",chill:"Tranquille",regular:"Régulier",serious:"Sérieux",perDay:"{n} XP par jour",
    goalNote:"Tu peux le changer quand tu veux dans Moi.",welcomeK:"Bienvenue sur Wakha",welcomeS:"C’est comme ça qu’on dit salut au Maroc.",whyQ:"Pourquoi la darija ?",
    vibes:["Famille","Voyage","Amour","Pour le fun"],welcomeGo:"Yallah ! Glisse vers le haut.",comebackK:"Bon retour",dayN:"Jour {n}",comebackS:"Ta série t’attend. {n} mots veulent une révision.",
    comebackS0:"Remplis le verre du jour pour garder ta série.",comebackNew:"Nouveau jour, nouveaux mots.",
    goalDoneK:"Objectif du jour atteint",goalDoneT:"Atay wajed !",goalDoneS:"Ton verre est plein. Série de {n} jours.",shieldUsed:"Un bouclier a sauvé ta série.",
    levelK:"Niveau supérieur",levelT:"Niveau {n}",keepGoing:"Yallah !",
    wordsT:"Tes mots",wordsS:"{a} appris, {b} maîtrisés",reviewDue:"Réviser {n} mots",nothingDue:"Rien à réviser pour l’instant",all:"Tous",dueTab:"À réviser",
    emptyWords:"Pas encore de mots. Fais défiler le fil et ils arrivent ici.",emptyDue:"Rien à réviser. Mchicha est impressionné.",
    kenzT:"Kenz",kenzS:"Les mots rares que tu as trouvés. Cherche-les dans les boîtes mystère, les drops rares, les reels et les situations piégeuses.",found:"{a} sur {b} trouvés",hidden:"Encore caché",
    meLevel:"Niveau {n}",xpToNext:"{n} XP avant le niveau {l}",maxed:"Niveau max atteint",stStreak:"jours de suite",stBest:"meilleure série",stWords:"mots appris",stAcc:"précision",
    week:"Cette semaine",settings:"Réglages",lang:"Langue",sound:"Sons",goalSet:"Objectif du jour",reset:"Réinitialiser",resetQ:"Effacer toute ta progression ? C’est définitif.",
    erase:"Tout effacer",cancel:"Annuler",bestDeal:"Meilleure affaire au souk",none:"pas encore",audioNote:"L’audio utilise la voix arabe de ton appareil, la prononciation est donc approximative.",
    combo:"combo",streakTip:"Remplis ton atay du jour pour faire grandir ta série.",shareWord:"« {d} » ({ar}) veut dire « {m} » en darija. Je l’apprends sur Wakha.",
    shareHaggle:"Je viens de marchander {it} de {s} DH à {p} DH. En darija. Wakha.",shareLevel:"Niveau {n} en darija : {t}. Wakha.",milestone:"{n} mots de darija. Tbarkellah !",daysShort:["D","L","M","M","J","V","S"],today:"aujourd’hui"}
};

