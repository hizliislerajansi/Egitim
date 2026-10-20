import initSqlJs from 'sql.js';
import {readFileSync} from 'node:fs';
import {beforeAll,describe,it,expect,vi} from 'vitest';
import {AppDatabase,getDb} from '../db/database';
import {seedInitialData} from '../db/seed';
import {writeSetting,readSetting} from '../services/apiClient';
const store=new Map<string,string>();const setItem=vi.fn((k:string,v:string)=>{store.set(k,v);});
Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>store.get(k)||null,setItem},configurable:true});
beforeAll(async()=>{await AppDatabase.getInstance().initialize();await seedInitialData();});
describe('Lesson durable drafts',()=>{
 it('synchronizes the curriculum with one durable export',async()=>{const before=setItem.mock.calls.length;await seedInitialData();expect(setItem.mock.calls.length-before).toBe(1);});
 it('isolates subject and topic drafts',()=>{writeSetting('lesson_draft_topic_math_equations',{questionId:'math',answer:'x=4'});writeSetting('lesson_draft_topic_eng_theme1',{questionId:'eng',answer:'tea'});expect(readSetting('lesson_draft_topic_math_equations',{})).toMatchObject({answer:'x=4'});expect(readSetting('lesson_draft_topic_eng_theme1',{})).toMatchObject({answer:'tea'});});
 it('reports capacity errors and clears the error after successful retry',()=>{setItem.mockImplementationOnce(()=>{throw new Error('QuotaExceededError');});writeSetting('lesson_draft_capacity',{answer:'saved in memory'});expect(getDb().getPersistenceError()).toBe(true);writeSetting('lesson_draft_capacity',{answer:'retry'});expect(getDb().getPersistenceError()).toBe(false);expect(store.get('ders_companion_sqlite_v1')).toBeTruthy();});
 it('reloads the exported database with the actual answer',async()=>{const SQL=await initSqlJs({wasmBinary:readFileSync('node_modules/sql.js/dist/sql-wasm.wasm')});const reopened=new SQL.Database(Uint8Array.from(atob(store.get('ders_companion_sqlite_v1')!),c=>c.charCodeAt(0)));const rows=reopened.exec("SELECT value FROM app_settings WHERE key='lesson_draft_capacity'");expect(JSON.parse(String(rows[0].values[0][0]))).toMatchObject({answer:'retry'});reopened.close();});
});
