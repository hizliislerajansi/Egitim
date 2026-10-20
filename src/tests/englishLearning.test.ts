import { beforeAll, describe, expect, it, vi } from 'vitest';
import { AppDatabase, getDb } from '../db/database';
import { COURSE_UNITS, ENGLISH_LEVELS, PLACEMENT_ITEMS } from '../data/englishCourse';
import { EnglishLearning, nextWordReview, placementResult } from '../services/englishLearning';
import { EnglishCorpusEngine } from '../services/englishCorpusEngine';
import initSqlJs from 'sql.js';
import fs from 'node:fs';

beforeAll(async()=>{await AppDatabase.getInstance().initialize();});
describe('English evidence and spaced review',()=>{
 it('rejects incomplete or invalid placement without inserting results',()=>{
   expect(()=>EnglishLearning.saveAssessment('invalid',{})).toThrow();
   expect(EnglishLearning.assessment('invalid')).toBeNull();
 });
 it('keeps prerequisite gaps at A1 despite high-band answers',()=>{
   const answers=Object.fromEntries(PLACEMENT_ITEMS.map(q=>[q.id,q.level==='A1'?q.options.find(o=>o!==q.answer)!:q.answer]));
   expect(placementResult(answers)).toBe('A1');
 });
 it('persists complete placement per student and exposes no unearned evidence',()=>{
   const answers=Object.fromEntries(PLACEMENT_ITEMS.map(q=>[q.id,q.answer]));
   expect(EnglishLearning.saveAssessment('student-a',answers)).toBe('B2');
   expect(EnglishLearning.assessment('student-a')?.level).toBe('B2');
   expect(EnglishLearning.assessment('student-b')).toBeNull();
   expect(EnglishLearning.evidence('student-a')).toEqual([]);
 });
 it('schedules actual wrong answers in ten minutes and correct answers after one day',()=>{
   const now=new Date('2026-10-17T09:00:00Z');
   const wrong=EnglishLearning.review('review-a','own-library','museum',now);
   expect(wrong.correct).toBe(false);
   expect(wrong.due_at).toBe('2026-10-17T09:10:00.000Z');
   expect(()=>EnglishLearning.review('review-a','own-library','library',now)).toThrow('henüz');
   const correct=EnglishLearning.review('review-a','own-library',' Library. ',new Date('2026-10-17T09:10:00Z'));
   expect(correct.correct).toBe(true);
   expect(correct.due_at).toBe('2026-10-18T09:10:00.000Z');
   expect(EnglishLearning.reviews('review-b')).toEqual([]);
 });
 it('caps intervals and resets a failed streak',()=>{
   const state={profile_id:'p',word_id:'w',streak:500,lapses:2,interval_days:60,due_at:'',reviewed_at:''};
   expect(nextWordReview(state,true).interval_days).toBe(60);
   expect(nextWordReview(state,false)).toMatchObject({streak:0,lapses:3,interval_days:0});
   expect(()=>nextWordReview(null,true,new Date('invalid'))).toThrow();
 });
 it('does not inflate evidence on repeated clicks or mix students',()=>{
   EnglishLearning.record('dedupe','A1:read-a1:correct','reading',1,1);
   EnglishLearning.record('dedupe','A1:read-a1:correct','reading',1,1);
   expect(EnglishLearning.evidence('dedupe')).toHaveLength(1);
   expect(EnglishLearning.evidence('other')).toHaveLength(0);
   expect(()=>EnglishLearning.record('dedupe','bad','reading',4,1)).toThrow();
 });
 it('round trips learner evidence through exported SQLite bytes',async()=>{
   const SQL=await initSqlJs({wasmBinary:fs.readFileSync('node_modules/sql.js/dist/sql-wasm.wasm')});
   const restored=new SQL.Database(getDb().getRawDatabase().export());
   expect(restored.exec("SELECT level FROM english_assessments WHERE profile_id='student-a'")[0].values[0][0]).toBe('B2');
   expect(restored.exec("SELECT streak FROM english_word_reviews WHERE profile_id='review-a'")[0].values[0][0]).toBe(1);
   restored.close();
 });
 it('has answerable original reading and listening tasks in every practice band',()=>{
   for(const level of ENGLISH_LEVELS){const u=COURSE_UNITS[level];expect(u.reading.length).toBeGreaterThan(70);expect(u.question.options).toContain(u.question.answer);expect(u.listeningQuestion.options).toContain(u.listeningQuestion.answer);}
 });
 it('does not mark untested registry sources online during a network health check',async()=>{
   EnglishCorpusEngine.initEngine();
   getDb().run("UPDATE english_source_registry SET status='cached', last_checked_at='not-tested' WHERE id='src_tatoeba'");
   const fetchMock=vi.spyOn(globalThis,'fetch').mockResolvedValue({ok:true} as Response);
   try {
     const result=await EnglishCorpusEngine.refreshSourceHealth();
     expect(fetchMock).toHaveBeenCalledTimes(1);
     expect(result.find(r=>r.id==='src_tatoeba')).toMatchObject({status:'cached',last_checked_at:'not-tested'});
     expect(result.find(r=>r.id==='src_free_dict_api')?.status).toBe('online');
   } finally {fetchMock.mockRestore();}
 });
});
