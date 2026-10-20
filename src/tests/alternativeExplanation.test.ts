import {describe,it,expect} from 'vitest';
import {alternativeExplanation,wantsAnotherExplanation,parseAlternative} from '../services/alternativeExplanation';
import {TOPIC_LECTURES} from '../data/topicLectures';
describe('Alternative lesson explanations',()=>{
 it('rejects incomplete generated packages',()=>{expect(parseAlternative('{}')).toBeNull();expect(parseAlternative('not JSON')).toBeNull();expect(parseAlternative(JSON.stringify({title:'Example',scene:['a','b','c'],steps:['one','two','three','four']}))?.steps).toHaveLength(4);});
 it('recognizes Turkish requests',()=>{for(const text of ['Anlamadım','anlayamadım','Başka örnek ver','Daha basit anlat'])expect(wantsAnotherExplanation(text)).toBe(true);expect(wantsAnotherExplanation('Teşekkürler')).toBe(false);});
 it('keeps every topic grounded and changes the next representation',()=>{for(const lecture of Object.values(TOPIC_LECTURES)){const a=alternativeExplanation(lecture,1),b=alternativeExplanation(lecture,2);expect(a.narration).not.toBe(b.narration);expect(a.scene).not.toEqual(b.scene);expect(a.steps.length).toBeGreaterThanOrEqual(4);}});
 it('does not confuse braking with action reaction',()=>{const lecture=TOPIC_LECTURES.topic_fizik_motion;expect(lecture).toBeTruthy();expect(alternativeExplanation(lecture,1).narration).toContain('Aynı cisme etkimedikleri');expect(alternativeExplanation(lecture,2).title).toContain('Eylemsizlik');});
});

