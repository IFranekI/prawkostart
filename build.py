import pandas as pd, json, re, csv
df=pd.read_excel('/mnt/user-data/uploads/KATALOG_dla_kandydatów_na_kierowców_072026.xlsx',sheet_name='katalog',dtype=str).fillna('')
df=df[df['Kategorie'].apply(lambda s:'B' in [x.strip() for x in s.split(',')])]
CATS=[("przepisy-ogolne","Przepisy ruchu drogowego",[]),
("znaki","Znaki i sygnały drogowe",["znak","sygnał","sygnaliz","tablic","linia","oznakowani","strzałk"]),
("pierwszenstwo","Pierwszeństwo przejazdu",["pierwszeństw","ustąpić"]),
("skrzyzowania","Skrzyżowania",["skrzyżowani","rondo","ronda","zawracani","skręc"]),
("piesi","Zachowanie wobec pieszych",["pieszy","pieszych","pieszego","przejści","rowerzyst","hulajnog"]),
("predkosc","Prędkość i ograniczenia prędkości",["prędkoś","km/h","szybkoś"]),
("wyprzedzanie","Wyprzedzanie, omijanie i wymijanie",["wyprzedz","omijan","wymijan","omijani"]),
("postoj","Zatrzymywanie i postój",["postój","postoj","zatrzymani","parkow","zatrzymać pojazd"]),
("bezpieczenstwo","Bezpieczeństwo jazdy",["odstęp","pas bezpiecz","fotelik","zmęcz","alkohol","widoczno","śliskie","mgł","hamowan"]),
("pierwsza-pomoc","Pierwsza pomoc",["poszkodowan","resuscyt","reanimac","krwotok","wypadk","pierwszej pomocy","ranny","rannego","nieprzytomn","apteczk"]),
("pojazd","Budowa i obsługa pojazdu",["opon","hamulc","olej","akumulator","silnik","układ ","żarów","oświetleni","ciśnieni","amortyz","tłumik","kontrolk","przegląd"]),
("technika","Technika jazdy",["bieg","sprzęgł","kierownic","zakręt","pochyło","wzniesieni","podjazd","ruszani"]),
("awarie","Zachowanie w sytuacjach awaryjnych",["awari","trójkąt","holow","pożar","kolizj","uszkodz","zepsut","poślizg"]),
("obowiazki","Obowiązki kierowcy",["dokument","prawo jazdy","ubezpiecz","obowiązek kierując","badanie techniczne","dowód rejestr","mandat","punkt"]),
("autostrady","Przepisy dotyczące autostrad i dróg ekspresowych",["autostrad","ekspres","pas awaryjn"])]
order=["pierwsza-pomoc","autostrady","wyprzedzanie","piesi","skrzyzowania","pierwszenstwo","predkosc","postoj","awarie","pojazd","technika","obowiazki","znaki","bezpieczenstwo"]
cd={c[0]:c for c in CATS}
def cat(t):
    l=t.lower()
    for k in order:
        if any(w in l for w in cd[k][2]): return k
    return "przepisy-ogolne"
def scope(s):
    return 'basic' if s.strip().lower().startswith('p') else 'specialist'
out=[]
for _,r in df.iterrows():
    sc=scope(r['Zakres struktury'])
    out.append(dict(number=int(r['Numer pytania']),category=cat(r['Pytanie']),text=r['Pytanie'].strip(),
      kind=sc,answers=None if sc=='basic' else {k:r['Odpowiedź '+k] for k in 'ABC'},
      correct=r['Poprawna odp'].strip(),media=r['Media'].strip() or None,points=int(r['Liczba punktów']),
      explanation=None,source='KATALOG 07/2026'))
json.dump(dict(categories=[dict(slug=c[0],name=c[1],position=i+1) for i,c in enumerate(CATS)],questions=out),
  open('questions_b.json','w',encoding='utf-8'),ensure_ascii=False)
from collections import Counter
print(len(out),Counter(q['category'] for q in out),Counter((q['kind'],q['points']) for q in out))
print(Counter(q['correct'] for q in out))
