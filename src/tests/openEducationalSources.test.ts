import {describe,it,expect} from 'vitest';
import {parseCommonsImages} from '../services/openEducationalSources';
const candidate=(overrides:any={})=>({query:{pages:{'1':{title:'File:Triangle.png',imageinfo:[{thumburl:'https://upload.wikimedia.org/wikipedia/commons/a/ab/test.png',thumbmime:'image/png',descriptionurl:'https://commons.wikimedia.org/wiki/File:Triangle.png',extmetadata:{Artist:{value:'<b>Geometry Author</b>'},LicenseShortName:{value:'CC BY-SA 4.0'},LicenseUrl:{value:'https://creativecommons.org/licenses/by-sa/4.0/'}},...overrides}]}}}});
describe('Open material license gate',()=>{
 it('retains attribution and source links as plain text',()=>{const r=parseCommonsImages(candidate());expect(r).toHaveLength(1);expect(r[0].author).toBe('Geometry Author');expect(r[0].license).toBe('CC BY-SA 4.0');});
 it('rejects unknown, missing and noncommercial-only license records',()=>{for(const license of ['All rights reserved','CC BY-NC 4.0',''])expect(parseCommonsImages(candidate({extmetadata:{Artist:{value:'Author'},LicenseShortName:{value:license},LicenseUrl:{value:'https://creativecommons.org/licenses/by-nc/4.0/'}}}))).toEqual([]);});
 it('rejects attacker-controlled image and page hosts and active file formats',()=>{expect(parseCommonsImages(candidate({thumburl:'https://upload.wikimedia.org.evil.test/image.png'}))).toEqual([]);expect(parseCommonsImages(candidate({descriptionurl:'https://evil.test'}))).toEqual([]);expect(parseCommonsImages(candidate({thumbmime:'text/html'}))).toEqual([]);});
});
