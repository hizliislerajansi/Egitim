import { beforeAll, describe, expect, it, vi } from 'vitest';
import { AppDatabase, getDb } from '../db/database';
import { MIGRATIONS } from '../db/schema';
import { ENGLISH_WORD_BANK, EnglishLearning, localWritingFeedback, sanitizeEnglishState } from '../services/englishLearning';
import { ORDERED_ENGLISH_UNITS } from '../data/englishCurriculum';
import { englishLocation, englishPath, ENGLISH_PANELS } from '../services/englishRoutes';
import initSqlJs from 'sql.js';
import fs from 'node:fs';
beforeAll(async()=>{await getDb().initialize();});
describe('English distribution acceptance',()=>{
 it('contains twelve original coherent units and valid answer keys',()=>{
  expect(ORDERED_ENGLISH_UNITS).toHaveLength(12);expect(ENGLISH_WORD_BANK.length).toBeGreaterThan(30);
  const ids=new Set<string>();
  for(const unit of ORDERED_ENGLISH_UNITS){expect(unit.grammar).toHaveLength(3);expect(unit.conversation).toHaveLength(3);expect(unit.reading.length).toBeGreaterThan(80);expect(unit.writing.length).toBeGreaterThan(35);for(const q of [...unit.grammar,...unit.questions,...unit.listeningQuestions]){expect(ids.has(q.id)).toBe(false);ids.add(q.id);expect(q.options).toContain(q.answer);expect(q.explanation.length).toBeGreaterThan(15);}}
 });
 it('persists partial placement, separate writing drafts, time and voice without cross-student leakage',()=>{
  const state=sanitizeEnglishState({unitId:'a2-plans',panel:'writing',minutes:30,voice:'device',placement:{'a1-be':'am'},writing:{'a1-directions':'Go straight.','a2-plans':'Would you like to join me?'}});
  EnglishLearning.saveState('resume-a',state);
  expect(EnglishLearning.state('resume-a')).toEqual(state);expect(EnglishLearning.state('resume-b').writing).toEqual({});
  expect(EnglishLearning.state('resume-a').placementComplete).toBe(false);
 });
 it('rejects polluted state and invalid options without touching user text',()=>{
  const state=sanitizeEnglishState(JSON.parse('{"unitId":"bad","panel":"__proto__","minutes":999,"placementComplete":true,"placement":{"a1-be":"evil"},"writing":{"__proto__":"evil","a1-foundation":"<script>hello</script>"}}'));
  expect(state.unitId).toBe('a1-foundation');expect(state.panel).toBe('plan');expect(state.minutes).toBe(20);expect(state.placementComplete).toBe(false);expect(state.writing['a1-foundation']).toBe('<script>hello</script>');expect(Object.keys(state.writing)).toEqual(['a1-foundation']);
 });
 it('round trips all deep links and ignores invalid route inputs',()=>{
  for(const panel of Object.keys(ENGLISH_PANELS) as (keyof typeof ENGLISH_PANELS)[]){const path=englishPath(panel,'a1-directions');expect(englishLocation(path.slice(path.indexOf('?')))).toEqual({panel,unit:'a1-directions'});}
  expect(englishLocation('?lab=__proto__&unit=../../keys')).toEqual({panel:undefined,unit:undefined});
 });
 it('keeps incorrect attempts, explanations and successful retries without premature unit advancement',()=>{
  const unit=ORDERED_ENGLISH_UNITS[1];const item=unit.grammar[0];const wrong=item.options.find(o=>o!==item.answer)!;
  expect(EnglishLearning.submitExercise('progress',unit.id,item.id,wrong,'grammar')).toBe(false);expect(EnglishLearning.unitProgress('progress',unit.id).ready).toBe(false);
  expect(EnglishLearning.submitExercise('progress',unit.id,item.id,item.answer,'grammar')).toBe(true);
  expect(EnglishLearning.attempts('progress')[0]).toMatchObject({attempts:2,correct:1});
  for(const q of unit.grammar.slice(1))EnglishLearning.submitExercise('progress',unit.id,q.id,q.answer,'grammar');
  expect(EnglishLearning.unitProgress('progress',unit.id)).toEqual({grammar:true,reading:false,ready:false});
  for(const q of unit.questions)EnglishLearning.submitExercise('progress',unit.id,q.id,q.answer,'reading');
  expect(EnglishLearning.unitProgress('progress',unit.id).ready).toBe(true);expect(EnglishLearning.unitProgress('other',unit.id).ready).toBe(false);
  expect(()=>EnglishLearning.submitExercise('progress',unit.id,'not-real','answer','grammar')).toThrow();
 });
 it('distinguishes transcript-supported work from listening results',()=>{
  const unit=ORDERED_ENGLISH_UNITS[1];const q=unit.listeningQuestions[0];EnglishLearning.submitExercise('text-mode',unit.id,q.id,q.answer,'reading-supported');
  expect(EnglishLearning.evidence('text-mode')[0].skill).toBe('reading-supported');expect(EnglishLearning.evidence('text-mode').some(e=>e.skill==='listening')).toBe(false);
 });
 it('saves a private writing portfolio, deduplicates repeated saving and never assigns a proficiency score',()=>{
  const id=EnglishLearning.saveWriting('author','a1-foundation','I am a student.','Check punctuation.','local');
  expect(EnglishLearning.saveWriting('author','a1-foundation','I am a student.','Check punctuation.','local')).toBe(id);
  expect(EnglishLearning.portfolio('author')).toHaveLength(1);expect(EnglishLearning.portfolio('stranger')).toEqual([]);expect(EnglishLearning.evidence('author')).toEqual([]);
  expect(localWritingFeedback('i like books')).toContain('büyük');expect(localWritingFeedback('She go to school.')).toContain('she goes');
 });
 it('preserves earlier release progress without inventing a missing wrong answer',()=>{
  EnglishLearning.record('legacy-progress','A1:a1-be:correct','grammar',1,1);
  EnglishLearning.record('legacy-progress','A1:read-a1:retry','reading',0,1);
  EnglishLearning.state('legacy-progress');
  expect(EnglishLearning.attempts('legacy-progress').find(a=>a.activity_id==='a1-foundation:grammar:a1-be')?.correct).toBe(1);
  expect(EnglishLearning.attempts('legacy-progress').find(a=>a.activity_id==='a1-foundation:reading:read-a1')?.answer).toBe('');
 });
 it('upgrades a version seven SQLite without deleting earlier student settings',async()=>{
  const SQL=await initSqlJs({wasmBinary:fs.readFileSync('node_modules/sql.js/dist/sql-wasm.wasm')});const legacy=new SQL.Database();
  legacy.run('CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,name TEXT,applied_at TEXT)');
  for(const m of MIGRATIONS.filter(m=>m.version<=7)){legacy.run(m.sql);legacy.run('INSERT INTO schema_migrations VALUES(?,?,?)',[m.version,m.name,'before']);}
  legacy.run("INSERT INTO app_settings VALUES('preserved_note','student note','before')");
  let bytes=Buffer.from(legacy.export()).toString('base64');legacy.close();
  vi.stubGlobal('localStorage',{getItem:()=>bytes,setItem:(_key:string,value:string)=>{bytes=value;}});
  try{const restored=Reflect.construct(AppDatabase,[]) as AppDatabase;await restored.initialize();expect(restored.queryOne<{value:string}>("SELECT value FROM app_settings WHERE key='preserved_note'")?.value).toBe('student note');expect(restored.queryOne('SELECT version FROM schema_migrations WHERE version=8')).toBeTruthy();}
  finally{vi.unstubAllGlobals();}
 });
 it('rolls back an interrupted migration rather than keeping a partial schema',async()=>{
  MIGRATIONS.push({version:999,name:'test-only-failure',sql:'CREATE TABLE migration_probe(id TEXT); THIS IS INVALID SQL;'});
  const isolated=Reflect.construct(AppDatabase,[]) as AppDatabase;
  try{await expect(isolated.initialize()).rejects.toThrow();expect(isolated.queryOne("SELECT name FROM sqlite_master WHERE name='migration_probe'")).toBeNull();}
  finally{MIGRATIONS.pop();}
 });
});
