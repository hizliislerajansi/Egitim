import {describe,it,expect} from 'vitest';
import {lessonPath,subjectFromPath} from '../services/lessonRoutes';
import {MEB_SUBJECTS} from '../data/mebCurriculum';
import {validateMathAnswer} from '../services/mathValidator';
describe('Independent lesson routes and strict grading',()=>{
 it('round trips every existing subject without collisions',()=>{const paths=MEB_SUBJECTS.map(s=>lessonPath(s.id));expect(new Set(paths).size).toBe(MEB_SUBJECTS.length);for(const s of MEB_SUBJECTS){expect(subjectFromPath(lessonPath(s.id))).toBe(s.id);expect(subjectFromPath(lessonPath(s.id)+'/')).toBe(s.id);}});
 it('does not treat unknown paths as a different lesson',()=>{expect(subjectFromPath('/dersler/bilinmeyen')).toBeUndefined();expect(subjectFromPath('/')).toBeUndefined();});
 it('accepts equivalent fractions and equations',()=>{expect(validateMathAnswer('12/4','3').isValid).toBe(true);expect(validateMathAnswer('x = 3','3').isValid).toBe(true);expect(validateMathAnswer('0,5','1/2').isValid).toBe(true);});
 it('rejects partial numbers, nonfinite input, and zero denominators',()=>{for(const value of ['3abc','3+5','3/1xyz','Infinity','3/0'])expect(validateMathAnswer(value,'3').isValid).toBe(false);});
});
