'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { sb } from '@/lib/supabase'

type Q = { id: number; number: number; category_id: number; text: string; kind: string; answer_a: string; answer_b: string; answer_c: string; correct: string; media: string; points: number; explanation: string }
const NAV = [['home','Strona główna'],['learn','Nauka'],['all','Wszystkie pytania'],['cats','Kategorie'],['exam','Egzamin państwowy'],['wrong','Błędne pytania'],['favs','Ulubione'],['stats','Statystyki'],['profile','Profil']]
const card = 'rounded-3xl bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 shadow-[0_2px_24px_rgba(20,33,61,0.06)] p-6'
const btn = 'rounded-2xl px-5 py-2.5 font-semibold transition active:scale-[.98] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed '
const green = btn + 'bg-emerald-600 text-white shadow-sm', navy = btn + 'bg-[#14213d] text-white dark:bg-slate-600', ghost = btn + 'border border-stone-300 dark:border-slate-600 bg-white/60 dark:bg-transparent'
const inp = 'rounded-2xl border border-stone-300 dark:border-slate-600 bg-white dark:bg-transparent px-4 py-2.5 outline-none focus:ring-2 ring-emerald-300 '
const MEDIA = (process.env.NEXT_PUBLIC_SUPABASE_URL || '') + '/storage/v1/object/public/media/'
const shuffle = <T,>(a: T[]) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }
const mmss = (s: number) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
async function fetchAll(t: string, order: string) {
  let r: any[] = [], f = 0
  for (;;) { const { data, error } = await sb.from(t).select('*').order(order).range(f, f + 999); if (error) throw error; r = r.concat(data || []); if (!data || data.length < 1000) break; f += 1000 }
  return r
}

function Auth() {
  const [e, setE] = useState(''), [p, setP] = useState(''), [m, setM] = useState('')
  const go = async (k: string) => {
    setM('')
    if (k === 'in') { const { error } = await sb.auth.signInWithPassword({ email: e, password: p }); if (error) setM(error.message) }
    if (k === 'up') { const { data, error } = await sb.auth.signUp({ email: e, password: p }); setM(error ? error.message : data.session ? '' : 'Sprawdź skrzynkę e-mail i potwierdź konto.') }
    if (k === 'rs') { const { error } = await sb.auth.resetPasswordForEmail(e, { redirectTo: location.origin }); setM(error ? error.message : 'Wysłano link do resetu hasła.') }
  }
  return <div className="min-h-screen grid place-items-center bg-gradient-to-br from-emerald-50 to-stone-100 dark:from-slate-900 dark:to-slate-900 p-4"><div className={card + ' w-full max-w-sm space-y-3'}>
    <h1 className="text-2xl font-bold">Prawko<span className="text-emerald-500">Start</span></h1>
    <p className="text-sm text-slate-500">Zdaj prawo jazdy za pierwszym razem!</p>
    <input className={inp + 'w-full'} placeholder="E-mail" type="email" value={e} onChange={x => setE(x.target.value)} />
    <input className={inp + 'w-full'} placeholder="Hasło (min. 6 znaków)" type="password" value={p} onChange={x => setP(x.target.value)} />
    <div className="flex gap-2"><button className={green + 'flex-1'} onClick={() => go('in')}>Zaloguj</button><button className={navy + 'flex-1'} onClick={() => go('up')}>Rejestracja</button></div>
    <button className="text-sm underline text-slate-500" onClick={() => go('rs')}>Zapomniałem hasła</button>
    {m && <p className="text-sm text-emerald-600">{m}</p>}
  </div></div>
}

function QCard({ q, cat, sel, reveal, onPick, extra }: any) {
  const opts = q.kind === 'basic' ? [['T', 'TAK'], ['N', 'NIE']] : [['A', q.answer_a], ['B', q.answer_b], ['C', q.answer_c]]
  const m: string = q.media
  return <div className={card}>
    <div className="flex flex-wrap gap-2 text-xs mb-3">
      <span className="px-2 py-1 rounded-full bg-[#14213d] text-white">#{q.number}</span>
      <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">{cat}</span>
      <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700">{q.kind === 'basic' ? 'Podstawowe' : 'Specjalistyczne'} · {q.points} pkt</span>
    </div>
    {m && (/\.(jpe?g|png|gif|webp)$/i.test(m)
      ? <img src={MEDIA + m} alt="" className="rounded-xl mb-3 max-h-80" />
      : <video src={MEDIA + m.replace(/\.\w+$/, '.mp4')} controls autoPlay muted loop playsInline className="rounded-xl mb-3 max-h-80" />)}
    <h2 className="text-lg font-semibold mb-4">{q.text}</h2>
    <div className="grid gap-2">{opts.map(([k, t]: any) => {
      let c = 'border-slate-300 dark:border-slate-600'
      if (reveal && sel) { if (k === q.correct) c = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/40'; else if (k === sel) c = 'border-red-500 bg-red-50 dark:bg-red-900/40' }
      else if (sel === k) c = 'border-slate-800 bg-slate-100 dark:bg-slate-700'
      return <button key={k} onClick={() => onPick && onPick(k)} disabled={reveal && !!sel} className={'text-left rounded-2xl border-2 px-4 py-3.5 transition enabled:hover:border-emerald-400 ' + c}>
        <b className="mr-2">{q.kind === 'basic' ? '' : k + '.'}</b>{t}</button>
    })}</div>
    {reveal && sel && <div className="mt-4 text-sm">{sel === q.correct ? '✅ Poprawnie!' : '❌ Błędnie.'} Poprawna odpowiedź: <b>{q.correct === 'T' ? 'TAK' : q.correct === 'N' ? 'NIE' : q.correct}</b>
      <p className="mt-1 text-slate-500">{q.explanation || 'Brak wyjaśnienia (uzupełnij w tabeli questions).'}</p></div>}
    {extra}
  </div>
}

function Practice({ pool, cn, favs, onAnswer, toggleFav, report, seq, start = 0 }: any) {
  const [order] = useState(() => seq ? pool : shuffle(pool)), [i, setI] = useState(Math.min(start, Math.max(pool.length - 1, 0))), [sels, setSels] = useState<any>({})
  if (!order.length) return <div className={card}>Brak pytań do rozwiązania.</div>
  const q = order[i], sel = sels[q.id]
  return <div className="space-y-3">
    <div className="text-sm text-slate-500">Pytanie {i + 1} / {order.length}</div>
    <QCard q={q} cat={cn(q.category_id)} sel={sel} reveal onPick={(a: string) => { setSels({ ...sels, [q.id]: a }); onAnswer(q, a) }} extra={
      <div className="flex flex-wrap gap-2 mt-4">
        <button className={ghost} disabled={i === 0} onClick={() => setI(i - 1)}>← Poprzednie</button>
        <button className={green} disabled={i >= order.length - 1} onClick={() => setI(i + 1)}>Następne pytanie →</button>
        <button className={ghost} onClick={() => toggleFav(q.id)}>{favs.includes(q.id) ? '★ Usuń z ulubionych' : '☆ Dodaj do ulubionych'}</button>
        <button className={ghost} onClick={() => report(q)}>Zgłoś błąd w pytaniu</button>
      </div>} />
  </div>
}

function Ring({ left, total }: any) {
  const r = 34, c = 2 * Math.PI * r, warn = left <= 5
  return <div className="relative w-28 h-28 shrink-0"><svg viewBox="0 0 80 80" className="w-28 h-28 -rotate-90">
    <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-stone-200 dark:stroke-slate-700" />
    <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - left / total)} className={warn ? 'stroke-amber-500' : 'stroke-emerald-600'} style={{ transition: 'stroke-dashoffset .3s linear' }} /></svg>
    <div className={'absolute inset-0 grid place-items-center text-4xl font-bold tabular-nums ' + (warn ? 'text-amber-600' : '')}>{left}</div></div>
}

function Exam({ qs, cn, onFinish }: any) {
  const [st, setSt] = useState<any>(null), [pos, setPos] = useState({ i: 0, stage: 'learn' }), [now, setNow] = useState(Date.now()), [res, setRes] = useState<any>(null)
  const [sel, setSel] = useState(''), [vid, setVid] = useState<'idle' | 'playing' | 'done'>('idle'), [pre, setPre] = useState(false)
  const ans = useRef<any>({}), fin = useRef(false), dl = useRef(0), posR = useRef({ i: -1, stage: 'learn' }), listR = useRef<Q[]>([]), selR = useRef(''), lastGo = useRef(0), t0 = useRef(0), vref = useRef<HTMLVideoElement>(null)
  const first = (q: Q) => q.kind === 'basic' ? 'learn' : 'answer'
  const limit = (q: Q, s: string) => q.kind === 'basic' ? (s === 'learn' ? 20 : 15) : 50

  const go = (i: number, stage: string) => {
    const q = listR.current[i]
    posR.current = { i, stage }; dl.current = Date.now() + limit(q, stage) * 1000; lastGo.current = Date.now()
    selR.current = ''; setSel('')
    if (stage === 'learn' || q.kind === 'specialist') setVid('idle')
    setPos({ i, stage }); setNow(Date.now())
  }
  const finish = async () => {
    if (fin.current) return; fin.current = true
    const list = listR.current; let score = 0
    list.forEach(q => { if (ans.current[q.id] === q.correct) score += q.points })
    const secs = Math.round((Date.now() - t0.current) / 1000)
    setRes({ score, secs, passed: score >= 68, list })
    await onFinish(list, ans.current, score, secs)
  }
  const next = (a?: string) => {
    const { i } = posR.current, list = listR.current
    if (a) ans.current[list[i].id] = a
    if (i >= list.length - 1) return finish()
    go(i + 1, first(list[i + 1]))
  }
  const start = () => {
    const p = (k: string, pt: number, n: number): Q[] => shuffle<Q>(qs.filter((q: Q) => q.kind === k && q.points === pt)).slice(0, n)
    const list: Q[] = [...shuffle<Q>([...p('basic', 3, 10), ...p('basic', 2, 6), ...p('basic', 1, 4)]), ...shuffle<Q>([...p('specialist', 3, 6), ...p('specialist', 2, 4), ...p('specialist', 1, 2)])]
    if (list.length < 32) return alert('Za mało pytań w bazie. Zaimportuj pytania (pliki seed w Supabase).')
    ans.current = {}; fin.current = false; listR.current = list; t0.current = Date.now(); posR.current = { i: -1, stage: 'learn' }
    setRes(null); setPre(false); setSt({ list }); go(0, first(list[0]))
  }
  // Czas liczony od znacznika czasu (Date.now), więc nie da się go zatrzymać ani zresetować klikaniem.
  useEffect(() => {
    if (!st || res) return
    const t = setInterval(() => {
      setNow(Date.now())
      if (Date.now() >= dl.current && !fin.current) {
        const { i, stage } = posR.current
        if (stage === 'learn') go(i, 'answer'); else next(selR.current || undefined)
      }
    }, 200)
    return () => clearInterval(t)
  }, [st, res])

  const pick = (k: string) => {
    if (Date.now() - lastGo.current < 500 || posR.current.stage !== 'answer') return  // ochrona przed podwójnym kliknięciem
    const q = listR.current[posR.current.i]
    if (q.kind === 'basic') next(k); else { selR.current = k; setSel(k) }
  }
  const confirm = () => { if (selR.current && Date.now() - lastGo.current >= 500) next(selR.current) }
  const play = () => { if (vid === 'idle') { vref.current?.play(); setVid('playing') } }

  if (!st && !pre) return <div className={card + ' space-y-4'}><h2 className="text-2xl font-bold">Egzamin państwowy – kat. B</h2>
    <p>32 pytania: 20 z wiedzy podstawowej (TAK/NIE, 46 pkt) i 12 specjalistycznych (A/B/C, 28 pkt). Maks. 74 pkt, próg zaliczenia 68 pkt.</p>
    <ul className="list-disc ml-5 text-sm space-y-1"><li>Pytanie podstawowe: 20 s na zapoznanie się z pytaniem i filmem, potem 15 s na odpowiedź TAK lub NIE.</li><li>Pytanie specjalistyczne: 50 s na odpowiedź A, B lub C.</li><li>Czasu nie można zatrzymać, a do poprzednich pytań nie można wrócić.</li><li>Poprawne odpowiedzi poznasz dopiero po zakończeniu egzaminu.</li></ul>
    <button className={green} onClick={() => setPre(true)}>Przejdź do egzaminu</button></div>
  if (!st) return <div className="fixed inset-0 z-50 grid place-items-center bg-[#f7f6f2] dark:bg-slate-900 p-6"><div className="text-center space-y-6 max-w-md">
    <div className="mx-auto h-36 w-36 rounded-full bg-emerald-100 dark:bg-emerald-900/40 animate-pulse grid place-items-center text-emerald-700 dark:text-emerald-300 font-semibold">Wdech… wydech…</div>
    <h2 className="text-2xl font-bold">Masz czas, nie spiesz się</h2>
    <p className="text-slate-600 dark:text-slate-300">Weź kilka spokojnych oddechów. Kiedy będziesz gotowy, zacznij egzamin.</p>
    <div className="flex gap-3 justify-center"><button className={ghost} onClick={() => setPre(false)}>Wróć</button><button className={green} onClick={start}>Jestem gotowy</button></div></div></div>
  if (res) {
    const sum = (k: string) => res.list.filter((q: Q) => q.kind === k && ans.current[q.id] === q.correct).reduce((s: number, q: Q) => s + q.points, 0)
    const bad = res.list.filter((q: Q) => ans.current[q.id] !== q.correct)
    const byCat: any = {}; bad.forEach((q: Q) => { const n = cn(q.category_id); byCat[n] = (byCat[n] || 0) + 1 })
    const top = Object.entries(byCat).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3)
    return <div className="space-y-4"><div className={'rounded-3xl p-8 text-center space-y-2 border ' + (res.passed ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800')}>
      <div className={'text-4xl font-bold ' + (res.passed ? 'text-emerald-700' : 'text-amber-700')}>{res.passed ? '🎉 Zdane!' : 'Jeszcze nie tym razem'}</div>
      <p className="text-2xl">{res.score} / 74 pkt <span className="text-base text-slate-500">(próg: 68)</span></p>
      <p className="font-semibold">Wynik: {res.passed ? 'ZDANY' : 'NIEZDANY'}</p>
      <p className="text-sm text-slate-500">Czas: {mmss(res.secs)} · Podstawowe: {sum('basic')}/46 · Specjalistyczne: {sum('specialist')}/28 · Błędne lub bez odpowiedzi: {bad.length}</p>
      {top.length > 0 && <p className="text-sm">Najczęstsze błędy: {top.map(([n, c]: any) => n + ' (' + c + ')').join(', ')}. Warto je poćwiczyć.</p>}
      <button className={green + ' mt-3'} onClick={() => setSt(null)}>Nowy egzamin</button></div>
      {bad.map((q: Q) => <QCard key={q.id} q={q} cat={cn(q.category_id)} sel={ans.current[q.id] || '-'} reveal />)}</div>
  }

  const q: Q = st.list[pos.i], left = Math.max(0, Math.ceil((dl.current - now) / 1000)), m: string = q.media
  const isVid = !!m && !/\.(jpe?g|png|gif|webp)$/i.test(m), basic = q.kind === 'basic', canAns = pos.stage === 'answer'
  const hint = pos.i >= 27 ? 'Ostatnie pytania, prawie koniec.' : basic && !canAns ? 'Spokojnie przeczytaj pytanie.' : ''
  return <div className="fixed inset-0 z-50 overflow-auto bg-[#f7f6f2] dark:bg-slate-900 p-4 md:p-8"><div className="max-w-4xl mx-auto space-y-4">
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-2"><div className="text-2xl font-bold">Pytanie {pos.i + 1}/32</div>
        <div className="text-sm text-slate-500">{basic ? 'Wiedza podstawowa' : 'Wiedza specjalistyczna'} · {basic && !canAns ? 'zapoznanie z pytaniem' : 'czas na odpowiedź'}</div>
        <div className="flex flex-wrap gap-1.5 max-w-xs">{st.list.map((_: any, k: number) => <span key={k} className={'h-2.5 w-2.5 rounded-full ' + (k < pos.i ? 'bg-emerald-600' : k === pos.i ? 'bg-[#14213d] dark:bg-white scale-125' : 'bg-stone-300 dark:bg-slate-600')} />)}</div></div>
      <Ring left={left} total={limit(q, pos.stage)} /></div>
    {hint && <p className="text-sm text-slate-500">{hint}</p>}
    <div className={card + ' space-y-4'}>
      <h2 className="text-xl font-semibold">{q.text}</h2>
      {m && (isVid
        ? <div className="space-y-3"><div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-96 w-full">
            <video key={q.id} ref={vref} src={MEDIA + m.replace(/\.\w+$/, '.mp4')} playsInline preload="auto" onEnded={() => setVid('done')} className="w-full h-full object-contain" />
            {vid === 'idle' && <div className="absolute inset-0 bg-black grid place-items-center text-slate-400 text-sm">Kliknij ZOBACZ FILM</div>}</div>
          <button className={green + ' text-lg'} disabled={vid !== 'idle' || (basic && !(pos.stage === 'learn'))} onClick={play}>{vid === 'playing' ? 'FILM TRWA…' : vid === 'done' ? 'FILM OBEJRZANY' : 'ZOBACZ FILM'}</button></div>
        : <img src={MEDIA + m} alt="" className="rounded-xl max-h-96 mx-auto" />)}
      {basic ? <>
        {!canAns && <p className="text-sm text-slate-500">Przeczytaj pytanie{isVid ? ' i obejrzyj film' : ''}. Odpowiedź będzie możliwa po zakończeniu odliczania.</p>}
        <div className="grid grid-cols-2 gap-4">{[['T', 'TAK'], ['N', 'NIE']].map(([k, t]) => <button key={k} disabled={!canAns} onClick={() => pick(k)} className={btn + 'py-6 text-2xl font-bold bg-[#14213d] text-white dark:bg-slate-600'}>{t}</button>)}</div></>
      : <>
        <div className="grid gap-2">{[['A', q.answer_a], ['B', q.answer_b], ['C', q.answer_c]].map(([k, t]) => <button key={k} onClick={() => pick(k)} className={'text-left rounded-2xl border-2 px-4 py-3.5 transition enabled:hover:border-emerald-400 ' + (sel === k ? 'border-slate-800 bg-slate-100 dark:bg-slate-700' : 'border-slate-300 dark:border-slate-600')}><b className="mr-2">{k}.</b>{t}</button>)}</div>
        <button className={green + ' text-lg'} disabled={!sel} onClick={confirm}>ZATWIERDŹ ODPOWIEDŹ</button></>}
    </div></div></div>
}

export default function App() {
  const [user, setUser] = useState<any>(null), [ready, setReady] = useState(false), [view, setView] = useState('home'), [dark, setDark] = useState(false)
  const [qs, setQs] = useState<Q[]>([]), [cats, setCats] = useState<any[]>([]), [att, setAtt] = useState<any[]>([]), [wrong, setWrong] = useState<any>({}), [favs, setFavs] = useState<number[]>([]), [exams, setExams] = useState<any[]>([])
  const [prof, setProf] = useState<any>({ daily_goal: 20, remove_correct_from_wrong: false, display_name: '' })
  const [catF, setCatF] = useState(0), [seq, setSeq] = useState(false), [wCat, setWCat] = useState(0), [sub, setSub] = useState<Q[] | null>(null)
  const [sq, setSq] = useState(''), [aCat, setACat] = useState(0), [openNo, setOpenNo] = useState(0), [newPw, setNewPw] = useState(''), [msg, setMsg] = useState('')
  const uid = user?.id

  useEffect(() => {
    setDark(localStorage.getItem('dark') === '1')
    sb.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true) })
    const { data: l } = sb.auth.onAuthStateChange((e, s) => { setUser(s?.user ?? null); if (e === 'PASSWORD_RECOVERY') setView('profile') })
    return () => l.subscription.unsubscribe()
  }, [])
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('dark', dark ? '1' : '0') }, [dark])
  useEffect(() => {
    if (!uid) return
    ;(async () => {
      const [c, q, a, w, f, e, p] = await Promise.all([fetchAll('categories', 'position'), fetchAll('questions', 'number'), fetchAll('attempts', 'id'), fetchAll('wrong_questions', 'question_id'), fetchAll('favorites', 'question_id'), fetchAll('exams', 'started_at'), sb.from('profiles').select('*').eq('id', uid).maybeSingle()])
      setCats(c); setQs(q); setAtt(a); setFavs(f.map((x: any) => x.question_id)); setExams(e)
      setWrong(Object.fromEntries(w.map((x: any) => [x.question_id, { a: x.last_answer, n: x.wrong_count }])))
      if (p.data) setProf(p.data); else await sb.from('profiles').insert({ id: uid })
    })().catch(err => alert('Błąd ładowania danych: ' + err.message))
  }, [uid])

  const qById = useMemo(() => Object.fromEntries(qs.map(q => [q.id, q])), [qs])
  const poolLearn = useMemo(() => qs.filter(q => !catF || q.category_id === catF), [qs, catF])
  const cn = (id: number) => cats.find(c => c.id === id)?.name || ''

  async function record(q: Q, a: string, mode: string) {
    const ok = a === q.correct
    const { data } = await sb.from('attempts').insert({ user_id: uid, question_id: q.id, answer: a, is_correct: ok, mode }).select().single()
    if (data) setAtt(x => [...x, data])
    if (!ok) { const n = (wrong[q.id]?.n || 0) + 1; await sb.from('wrong_questions').upsert({ user_id: uid, question_id: q.id, last_answer: a, wrong_count: n, updated_at: new Date().toISOString() }); setWrong((w: any) => ({ ...w, [q.id]: { a, n } })) }
    else if (prof.remove_correct_from_wrong && wrong[q.id]) await unwrong(q.id)
  }
  async function unwrong(id: number) { await sb.from('wrong_questions').delete().eq('user_id', uid).eq('question_id', id); setWrong((w: any) => { const n = { ...w }; delete n[id]; return n }) }
  async function toggleFav(id: number) {
    if (favs.includes(id)) { await sb.from('favorites').delete().eq('user_id', uid).eq('question_id', id); setFavs(f => f.filter(x => x !== id)) }
    else { await sb.from('favorites').insert({ user_id: uid, question_id: id }); setFavs(f => [...f, id]) }
  }
  async function report(q: Q) {
    const m = prompt('Opisz błąd w pytaniu #' + q.number); if (!m) return
    const { error } = await sb.from('question_reports').insert({ user_id: uid, question_id: q.id, message: m }); alert(error ? error.message : 'Dziękujemy, zgłoszenie zapisane.')
  }
  async function finishExam(list: Q[], ans: any, score: number, secs: number) {
    const { data: ex } = await sb.from('exams').insert({ user_id: uid, started_at: new Date(Date.now() - secs * 1000).toISOString(), finished_at: new Date().toISOString(), score, passed: score >= 68, question_ids: list.map(q => q.id) }).select().single()
    const rows = list.map(q => ({ user_id: uid, question_id: q.id, answer: ans[q.id] || '-', is_correct: ans[q.id] === q.correct, mode: 'exam', exam_id: ex?.id }))
    const { data: ins } = await sb.from('attempts').insert(rows).select()
    const wr = rows.filter(r => !r.is_correct).map(r => ({ user_id: uid, question_id: r.question_id, last_answer: r.answer, wrong_count: (wrong[r.question_id]?.n || 0) + 1, updated_at: new Date().toISOString() }))
    if (wr.length) await sb.from('wrong_questions').upsert(wr)
    setWrong((w: any) => { const n = { ...w }; wr.forEach(r => n[r.question_id] = { a: r.last_answer, n: r.wrong_count }); return n })
    setAtt(a => [...a, ...(ins || [])]); if (ex) setExams(e => [...e, ex])
  }

  const pct = (a: number, b: number) => b ? Math.round(a / b * 100) : 0
  const solved = new Set(att.map(a => a.question_id)), okN = att.filter(a => a.is_correct).length
  const catStat = (id: number) => { const ids = qs.filter(q => q.category_id === id), at = att.filter(a => qById[a.question_id]?.category_id === id); return { total: ids.length, solved: ids.filter(q => solved.has(q.id)).length, n: at.length, pct: pct(at.filter(a => a.is_correct).length, at.length) } }
  const onAns = (q: Q, a: string) => record(q, a, view === 'wrong' ? 'review' : 'learn')
  const pr = { cn, favs, toggleFav, report, onAnswer: onAns }
  const Sel = ({ v, set }: any) => <select className={inp} value={v} onChange={e => set(+e.target.value)}><option value={0}>Wszystkie kategorie</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>

  if (!ready) return null
  if (!user) return <Auth />
  const todayStr = new Date().toISOString().slice(0, 10), today = att.filter(a => a.created_at.slice(0, 10) === todayStr).length
  const lastNo = att.length ? qById[att[att.length - 1].question_id]?.number || 0 : 0
  const done = exams.filter(e => e.finished_at)

  let body: any = null
  if (view === 'home') {
    const l5 = done.slice(-5), passed = l5.filter(e => e.passed).length
    body = <>
      <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-stone-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 border border-emerald-100 dark:border-slate-700 p-8"><h1 className="text-3xl md:text-4xl font-bold">Zdaj prawo jazdy za pierwszym razem!</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Ucz się codziennie, poprawiaj błędy i sprawdzaj się na egzaminach próbnych.</p>
        <div className="flex gap-2 mt-4 flex-wrap"><button className={green} onClick={() => setView('learn')}>Rozpocznij naukę</button><button className={navy} onClick={() => setView('exam')}>Rozwiąż egzamin</button></div></div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className={card}><div className="text-sm text-slate-500">Rozwiązane pytania</div><div className="text-3xl font-bold">{att.length}</div></div>
        <div className={card}><div className="text-sm text-slate-500">Poprawne odpowiedzi</div><div className="text-3xl font-bold text-emerald-500">{pct(okN, att.length)}%</div></div>
        <div className={card}><div className="text-sm text-slate-500">Cel dzienny</div><div className="text-3xl font-bold">{today} / {prof.daily_goal}</div>{today >= prof.daily_goal && <div className="text-sm text-emerald-500">🎉 Cel osiągnięty!</div>}</div></div>
      <div className={card}><div className="flex justify-between text-sm mb-1"><span>Postęp nauki (unikalne pytania)</span><span>{solved.size} / {qs.length}</span></div>
        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-3 rounded-full bg-emerald-500" style={{ width: pct(solved.size, qs.length) + '%' }} /></div>
        <p className="mt-3 text-sm">{l5.length < 3 ? 'Zrób co najmniej 3 egzaminy próbne, aby ocenić gotowość do egzaminu.' : `Zdane egzaminy w ostatnich ${l5.length}: ${passed}. ${passed >= l5.length - 0 ? 'Jesteś gotowy!' : 'Jeszcze trochę nauki.'}`}</p></div>
      <div className={card}><h3 className="font-semibold mb-2">Ostatnio rozwiązywane</h3>{[...att].reverse().slice(0, 5).map(a => <div key={a.id} className="text-sm py-1 border-b border-slate-100 dark:border-slate-700">{a.is_correct ? '✅' : '❌'} #{qById[a.question_id]?.number} {qById[a.question_id]?.text.slice(0, 80)}</div>)}{!att.length && <p className="text-sm text-slate-500">Brak historii.</p>}</div></>
  } else if (view === 'learn') {
    body = <><div className="flex flex-wrap gap-3 items-center"><Sel v={catF} set={setCatF} /><label className="text-sm"><input type="checkbox" checked={seq} onChange={e => setSeq(e.target.checked)} /> Po kolei (kontynuuj od ostatniego pytania)</label></div>
      <Practice key={catF + '-' + seq + '-' + qs.length} pool={poolLearn} seq={seq} start={seq ? Math.max(0, poolLearn.findIndex(q => q.number > lastNo)) : 0} {...pr} /></>
  } else if (view === 'all') {
    const list = qs.filter(q => (!aCat || q.category_id === aCat) && (!sq || String(q.number).includes(sq.trim()))).slice(0, 50)
    body = <><div className="flex flex-wrap gap-3"><input className={inp} placeholder="Szukaj po numerze pytania" value={sq} onChange={e => setSq(e.target.value)} /><Sel v={aCat} set={setACat} /></div>
      {list.map(q => openNo === q.number ? <QCard key={q.id} q={q} cat={cn(q.category_id)} sel={q.correct} reveal extra={<button className={ghost + ' mt-3'} onClick={() => setOpenNo(0)}>Zwiń</button>} />
        : <button key={q.id} onClick={() => setOpenNo(q.number)} className={card + ' w-full text-left hover:ring-2 ring-emerald-400'}><b>#{q.number}</b> · <span className="text-xs text-slate-500">{cn(q.category_id)}</span><div>{q.text}</div></button>)}
      <p className="text-xs text-slate-500">Pokazano maks. 50 pytań – użyj wyszukiwarki lub filtra.</p></>
  } else if (view === 'cats') {
    body = <div className="grid sm:grid-cols-2 gap-3">{cats.map(c => { const s = catStat(c.id); return <div key={c.id} className={card + ' space-y-2'}><h3 className="font-semibold">{c.name}</h3>
      <p className="text-sm text-slate-500">Pytań: {s.total} · rozwiązanych: {s.solved} · poprawnych: {s.pct}%</p>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-2 rounded-full bg-emerald-500" style={{ width: pct(s.solved, s.total) + '%' }} /></div>
      <button className={green} onClick={() => { setCatF(c.id); setView('learn') }}>Ucz się</button></div> })}</div>
  } else if (view === 'exam') {
    body = <Exam qs={qs} cn={cn} onFinish={finishExam} />
  } else if (view === 'wrong' || view === 'favs') {
    const isW = view === 'wrong'
    const list = qs.filter(q => (isW ? wrong[q.id] : favs.includes(q.id)) && (!wCat || q.category_id === wCat))
    body = sub ? <><button className={ghost} onClick={() => setSub(null)}>← Wróć do listy</button><Practice key={sub.map(q => q.id).join()} pool={sub} {...pr} /></> : <>
      <div className="flex flex-wrap gap-3 items-center"><Sel v={wCat} set={setWCat} /><button className={green} disabled={!list.length} onClick={() => setSub(list)}>{isW ? 'Ćwicz błędne pytania' : 'Rozwiąż ulubione'} ({list.length})</button></div>
      {!list.length && <div className={card}>{isW ? 'Brak błędnych pytań – świetnie!' : 'Nie masz jeszcze ulubionych pytań.'}</div>}
      {list.map(q => <QCard key={q.id} q={q} cat={cn(q.category_id)} sel={isW ? wrong[q.id].a : q.correct} reveal extra={<div className="flex flex-wrap gap-2 mt-4">
        <button className={green} onClick={() => setSub([q])}>Rozwiąż ponownie</button>
        {isW ? <button className={ghost} onClick={() => unwrong(q.id)}>Usuń z błędnych</button> : <button className={ghost} onClick={() => toggleFav(q.id)}>Usuń z ulubionych</button>}</div>} />)}</>
  } else if (view === 'stats') {
    const cs = cats.map(c => ({ c, ...catStat(c.id) })).filter(x => x.n >= 5).sort((a, b) => b.pct - a.pct)
    const days = Array.from({ length: 14 }, (_, k) => { const d = new Date(Date.now() - (13 - k) * 864e5).toISOString().slice(0, 10), a = att.filter(x => x.created_at.slice(0, 10) === d); return { d: d.slice(5), n: a.length, p: pct(a.filter(x => x.is_correct).length, a.length) } })
    body = <><div className="grid sm:grid-cols-4 gap-3">{[['Rozwiązane', att.length], ['Poprawne', okN], ['Błędne', att.length - okN], ['Skuteczność', pct(okN, att.length) + '%']].map(([l, v]) => <div key={l as string} className={card}><div className="text-sm text-slate-500">{l}</div><div className="text-2xl font-bold">{v}</div></div>)}</div>
      <div className={card}><h3 className="font-semibold mb-2">Skuteczność – ostatnie 14 dni</h3><div className="flex items-end gap-1 h-32">{days.map(x => <div key={x.d} className="flex-1 flex flex-col justify-end items-center h-full"><div title={x.n + ' odp., ' + x.p + '%'} className="w-full bg-emerald-500 rounded-t" style={{ height: x.p + '%' }} /><span className="text-[10px]">{x.d}</span></div>)}</div></div>
      <div className="grid sm:grid-cols-2 gap-3"><div className={card}><h3 className="font-semibold mb-2">Najlepiej opanowane</h3>{cs.slice(0, 3).map(x => <div key={x.c.id} className="text-sm">{x.c.name} – {x.pct}%</div>)}{!cs.length && <p className="text-sm text-slate-500">Za mało danych (min. 5 odpowiedzi w kategorii).</p>}</div>
        <div className={card}><h3 className="font-semibold mb-2">Do poprawy</h3>{[...cs].reverse().slice(0, 3).map(x => <div key={x.c.id} className="text-sm">{x.c.name} – {x.pct}%</div>)}</div></div>
      <div className={card}><h3 className="font-semibold mb-2">Egzaminy próbne (zdane: {done.filter(e => e.passed).length} z {done.length})</h3>
        {[...done].reverse().map(e => <div key={e.id} className="text-sm py-1 border-b border-slate-100 dark:border-slate-700">{new Date(e.started_at).toLocaleString('pl-PL')} · {e.score}/74 · {e.passed ? '✅ ZDANY' : '❌ NIEZDANY'} · {mmss(Math.round((new Date(e.finished_at).getTime() - new Date(e.started_at).getTime()) / 1000))}</div>)}</div></>
  } else if (view === 'profile') {
    body = <div className={card + ' space-y-3 max-w-md'}><h2 className="text-xl font-bold">Profil</h2><p className="text-sm text-slate-500">{user.email}</p>
      <input className={inp + 'w-full'} placeholder="Nazwa wyświetlana" value={prof.display_name || ''} onChange={e => setProf({ ...prof, display_name: e.target.value })} />
      <label className="block text-sm">Codzienny cel (pytań) <input type="number" min={1} className={inp + 'w-24 ml-2'} value={prof.daily_goal} onChange={e => setProf({ ...prof, daily_goal: +e.target.value || 1 })} /></label>
      <label className="block text-sm"><input type="checkbox" checked={prof.remove_correct_from_wrong} onChange={e => setProf({ ...prof, remove_correct_from_wrong: e.target.checked })} /> Usuwaj z błędnych po poprawnej odpowiedzi</label>
      <button className={green} onClick={async () => { const { error } = await sb.from('profiles').upsert({ id: uid, display_name: prof.display_name, daily_goal: prof.daily_goal, remove_correct_from_wrong: prof.remove_correct_from_wrong }); setMsg(error ? error.message : 'Zapisano.') }}>Zapisz</button>
      <hr className="border-slate-200 dark:border-slate-700" />
      <input className={inp + 'w-full'} type="password" placeholder="Nowe hasło" value={newPw} onChange={e => setNewPw(e.target.value)} />
      <button className={navy} disabled={newPw.length < 6} onClick={async () => { const { error } = await sb.auth.updateUser({ password: newPw }); setMsg(error ? error.message : 'Hasło zmienione.'); setNewPw('') }}>Zmień hasło</button>
      {msg && <p className="text-sm text-emerald-600">{msg}</p>}
      <button className={ghost} onClick={() => sb.auth.signOut()}>Wyloguj</button></div>
  }

  return <div className="min-h-screen md:flex">
    <aside className="md:w-60 shrink-0 bg-white dark:bg-slate-800 border-r border-stone-200 dark:border-slate-700 md:min-h-screen p-3 md:p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
      <div className="font-bold text-xl text-emerald-600 md:mb-4 shrink-0 self-center md:self-start">Prawko<span className="text-[#14213d] dark:text-white">Start</span></div>
      {NAV.map(([k, l]) => <button key={k} onClick={() => { setView(k); setSub(null); if (k !== 'learn') setCatF(0) }} className={'text-left whitespace-nowrap rounded-2xl px-4 py-2.5 transition ' + (view === k ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-stone-100 dark:hover:bg-slate-700')}>{l}</button>)}
      <button className="md:mt-auto whitespace-nowrap rounded-2xl px-4 py-2.5 hover:bg-stone-100 dark:hover:bg-slate-700 text-left" onClick={() => setDark(!dark)}>{dark ? '☀ Tryb jasny' : '🌙 Tryb ciemny'}</button>
    </aside>
    <main className="flex-1 p-4 md:p-8 max-w-4xl w-full mx-auto space-y-4">{qs.length === 0 ? <div className={card}>Ładowanie pytań… (jeśli trwa długo, zaimportuj pytania: npm run import)</div> : body}</main>
  </div>
}
