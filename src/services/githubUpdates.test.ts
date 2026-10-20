import {describe, it, expect, vi} from 'vitest';
import {githubRepository, newerVersion, checkGithubUpdate} from './githubUpdates';
describe('GitHub updates',()=>{
  it('accepts only a public GitHub repository identifier',()=>{
    expect(githubRepository('https://github.com/owner/repo.git')).toBe('owner/repo');
    for(const input of ['https://evil.test/o/r','o/r?token=secret','o/..','o/r/extra','https://user:secret@github.com/o/r']) expect(()=>githubRepository(input)).toThrow();
  });
  it('compares numeric stable versions without downgrades',()=>{
    expect(newerVersion('v0.11.0','0.10.0')).toBe(true);
    for(const version of ['0.9.9','0.10.0','0.11.0-beta','invalid']) expect(newerVersion(version,'0.10.0')).toBe(false);
  });
  it('constructs safe links and never sends credentials',async()=>{
    const request=vi.fn().mockResolvedValue(new Response(JSON.stringify({tag_name:'v99.0.0',draft:false,prerelease:false,html_url:'javascript:bad',assets:[{name:'setup.exe',state:'uploaded'}]})));
    const update=await checkGithubUpdate('owner/repo',request);
    expect(update).toEqual({version:'v99.0.0',available:true,url:'https://github.com/owner/repo/releases/tag/v99.0.0',installers:1});
    expect(request.mock.calls[0][1].credentials).toBe('omit');
  });
  it('explains missing releases, limits and offline errors',async()=>{
    for(const status of [404,403,429,500]) await expect(checkGithubUpdate('o/r',vi.fn().mockResolvedValue(new Response('',{status})))).rejects.toThrow();
    await expect(checkGithubUpdate('o/r',vi.fn().mockRejectedValue(new TypeError('offline')))).rejects.toThrow('çevrimdışı');
  });
  it('rejects draft and prerelease responses',async()=>{
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({tag_name:'v99.0.0',draft:false,prerelease:true})));
    await expect(checkGithubUpdate('o/r',request)).rejects.toThrow('Kararlı');
  });
});
