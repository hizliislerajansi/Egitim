import {describe,it,expect} from 'vitest';
import {pronunciationText,parsePronunciationDictionary} from '../services/pronunciation';
import {SpeechPhonetics} from '../services/speechPhonetics';
describe('Speech-only pronunciation',()=>{
 it('reads foreign names and brands phonetically in Turkish',()=>{expect(pronunciationText('Google ve ChatGPT ile Einstein.','tr-TR')).toBe('gugıl ve çet ci pi ti ile aynştayn.');});
 it('does not change English lessons',()=>{expect(pronunciationText('Google Shakespeare online','en-US')).toBe('Google Shakespeare online');});
 it('preserves suffixes and does not replace inside another word',()=>{expect(pronunciationText("Google’dan ve Googler ile konuştum",'tr-TR')).toBe("gugıl’dan ve Googler ile konuştum");});
 it('supports literal metacharacters and one pass custom overrides',()=>{const custom=parsePronunciationDictionary('C++=si plas plas\nGoogle=Gugıl özel\nGugıl özel=yanlış');expect(pronunciationText('C++ ve Google','tr-TR',custom)).toBe('si plas plas ve Gugıl özel');});
 it('rejects malformed and oversized dictionary rules',()=>{expect(()=>parsePronunciationDictionary('boş')).toThrow();expect(()=>parsePronunciationDictionary('a='+ 'b'.repeat(121))).toThrow();});
 it('keeps superscript bases and mathematical symbols',()=>{const spoken=SpeechPhonetics.toSpokenText('x² + 2³ = 12');expect(spoken).toContain('x kare');expect(spoken).toContain('2 küp');expect(spoken).toContain('eşittir');});
});
