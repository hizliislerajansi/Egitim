import {beforeEach,describe,it,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({settings:new Map<string,unknown>(),keys:new Set<string>(),test:vi.fn()}));
vi.mock('../services/apiClient',()=>({readSetting:(k:string,f:unknown)=>state.settings.get(k)??f,writeSetting:(k:string,v:unknown)=>state.settings.set(k,v),hasProviderKey:async(k:string)=>state.keys.has(k)}));
vi.mock('../services/aiAdapter',()=>({AiAdapter:{testConnection:state.test}}));
import {startupConnections} from '../services/startupConnections';
import {applyAdminBootstrap} from '../services/adminBootstrap';
beforeEach(()=>{state.settings.clear();state.keys.clear();state.test.mockReset();});
describe('Installation startup',()=>{
 it('applies a verifier once and preserves the previous password record',()=>{const previous={salt:[1],hash:[2],iterations:1};state.settings.set('admin_password_record',previous);applyAdminBootstrap();const installed=state.settings.get('admin_password_record') as {hash:number[]};expect(installed.hash).toHaveLength(32);expect(state.settings.get('admin_password_before_bootstrap')).toEqual(previous);state.settings.set('admin_password_record',previous);applyAdminBootstrap();expect(state.settings.get('admin_password_record')).toEqual(previous);});
 it('explains missing keys without sending any request',async()=>{const rows=await startupConnections();expect(rows.every(r=>r.state==='missing')).toBe(true);expect(state.test).not.toHaveBeenCalled();});
 it('checks an existing Gemini connection once and reports its failure',async()=>{state.keys.add('gemini');state.test.mockImplementation(async()=>{state.settings.set('api_test_gemini',{success:false,message:'Kota doldu (429).'});});const rows=await startupConnections();expect(rows[0].state).toBe('failed');expect(rows[0].message).toContain('429');await startupConnections();expect(state.test).toHaveBeenCalledTimes(1);});
 it('distinguishes a saved voice key from a live tested API',async()=>{state.keys.add('elevenlabs');const row=(await startupConnections()).find(r=>r.provider==='ElevenLabs');expect(row?.state).toBe('unverified');expect(state.test).not.toHaveBeenCalled();});
});
