import {TOPIC_LECTURES} from '../data/topicLectures';
import {OfflineQuestionEngine} from './offlineQuestionEngine';
import type {CheckpointQuestion} from './unitExam';
export function unitQuestions(topics:Array<{id:string;subject_id:string}>):CheckpointQuestion[]{
 return topics.flatMap<CheckpointQuestion>(topic=>{
  const saved=OfflineQuestionEngine.getQuestionsByTopic(topic.id);
  if(saved.length)return saved.map(q=>({id:q.id,prompt:q.question_text,math:q.question_type==='open_math',options:q.options_json?JSON.parse(q.options_json):[],answer:q.correct_answer,explanation:q.solution_explanation||'Dersin çözüm adımlarını incele.'}));
  const lecture=TOPIC_LECTURES[topic.id];if(!lecture?.workedExample.finalAnswer)return [];
  const answer=lecture.workedExample.finalAnswer;
  const alternatives=[...new Set(Object.values(TOPIC_LECTURES).filter(l=>l.subjectId===topic.subject_id&&l.topicId!==topic.id).map(l=>l.workedExample.finalAnswer))].filter(a=>a&&a!==answer).slice(0,3);
  const options=[...alternatives];options.splice([...topic.id].reduce((n,c)=>n+c.charCodeAt(0),0)%(options.length+1),0,answer);
  return [{id:'checkpoint-'+topic.id,prompt:lecture.workedExample.question,options,answer,explanation:lecture.workedExample.solutionSteps.join('\n')}];
 });
}
