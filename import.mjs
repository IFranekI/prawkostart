// node import.mjs  (env: SUPABASE_URL, SUPABASE_SERVICE_KEY) – po wykonaniu schema.sql
import { createClient } from '@supabase/supabase-js'; import fs from 'fs';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const d = JSON.parse(fs.readFileSync('questions_b.json','utf8'));
await sb.from('categories').upsert(d.categories, {onConflict:'slug'});
const { data: cats } = await sb.from('categories').select('id,slug'); const id = Object.fromEntries(cats.map(c=>[c.slug,c.id]));
const rows = d.questions.map(q=>({number:q.number,category_id:id[q.category],text:q.text,kind:q.kind,
  answer_a:q.answers?.A??null,answer_b:q.answers?.B??null,answer_c:q.answers?.C??null,correct:q.correct,media:q.media,points:q.points,source:q.source}));
for (let i=0;i<rows.length;i+=500){ const {error}=await sb.from('questions').upsert(rows.slice(i,i+500),{onConflict:'number'}); if(error) throw error; }
console.log('Zaimportowano', rows.length);
