const test=require('node:test'),assert=require('node:assert/strict');
const {Document}=require('./dom.cjs');
const {manifest,loadLesson,memoryStorage}=require('./helpers.cjs');
const api=require('../5E4/unit2/lesson-a/practice.js');
const entry=manifest.find(e=>e.engine==='TimePractice');
const lesson=loadLesson(entry);
function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function open(storage=memoryStorage()){
 const document=new Document();api.mount(lesson,{document,storage,random:seeded(59)});return {document,storage};
}
function action(section,text){return section.querySelectorAll('button').find(b=>b.textContent===text);}
function fill(field,value){field.value=value;field.dispatchEvent({type:'input'});}
test('two complete independent pools; all reference answers and required variants are accepted',()=>{
 assert.equal(lesson.exercises.length,2);
 for(const ex of lesson.exercises){
  assert.equal(ex.items.length,30);assert.equal(new Set(ex.items.map(q=>q.prompt)).size,30);assert.equal(ex.count,10);
  for(const q of ex.items){
   assert.equal(api.grade(q.answers[0],q,ex.mode).correct,true,q.prompt);
   const variants=ex.mode==='timeWords'?[q.answers[0].replace("It's ",''),q.answers[0].replace("It's ",'It is ').replace('quarter','a quarter'),q.answers[0].toUpperCase().replaceAll(' ','   ').replaceAll('-',' '),q.answers[0].replaceAll("'",'’')]:[q.answers[0].padStart(5,'0'),q.answers[0].replace(':','h')];
   for(const variant of variants)assert.equal(api.grade(variant,q,ex.mode).correct,true,variant);
   assert.ok(q.explanation);
  }
 }
});
test('rejects numerical readings, past/to inversions and wrong next hour',()=>{
 const ex=lesson.exercises[0];
 const quarterPast=ex.items.find(q=>q.prompt==='8:15');
 for(const wrong of ['eight fifteen','8:15','quarter to eight','quarter past nine','a half past eight'])assert.equal(api.grade(wrong,quarterPast,ex.mode).correct,false,wrong);
 const quarterTo=ex.items.find(q=>q.prompt==='10:45');
 for(const wrong of ['quarter to ten','quarter past eleven','ten forty-five'])assert.equal(api.grade(wrong,quarterTo,ex.mode).correct,false,wrong);
 assert.match(api.grade('quarter to ten',quarterTo,ex.mode).message,/heure suivante \(11\)/);
 assert.match(api.grade('quarter to ten',quarterTo,ex.mode).message,/Réponse attendue/);
});
test('digital time uses strict coherent twelve-hour values and TO explanations',()=>{
 const q=lesson.exercises[1].items[0];
 for(const value of ['8:45','08:45','8h45',' 08 : 45 '])assert.equal(api.grade(value,q,'timeDigital').correct,true,value);
 for(const value of ['9:15','20:45','0:45','00:45','13:45','8:60','8:5','8:450','008:45','8.45','845','8:45 pm','-8:45','NaN'])assert.equal(api.grade(value,q,'timeDigital').correct,false,value);
 assert.match(api.grade('9:15',q,'timeDigital').message,/heure précédente \(8\)/);
 assert.match(api.grade('9:15',q,'timeDigital').message,/60 − 15 = 45/);
 assert.equal(api.grade('',q,'timeDigital').empty,true);
 const midnight=lesson.exercises[1].items.find(q=>q.answers[0]==='12:45');
 assert.equal(api.grade('12:45',midnight,'timeDigital').correct,true);assert.equal(api.grade('0:45',midnight,'timeDigital').correct,false);
});
for(const ex of lesson.exercises){
 test(ex.id+': clicks check wrong/right answers and scores; 100 retries cover all questions and reset only that exercise',()=>{
  const {document}=open(),seen=new Set(),orders=new Set();
  const other=document.getElementById(ex.id==='ex1'?'ex2':'ex1').querySelector('input');fill(other,'keep this answer');
  for(let attempt=0;attempt<100;attempt++){
   const section=document.getElementById(ex.id),fields=section.querySelectorAll('input');assert.equal(fields.length,10);assert.equal(new Set(fields.map(f=>f.id)).size,10);
   orders.add(fields.map(f=>f.id).join(','));
   for(const field of fields){assert.equal(field.value,'');seen.add(field.id.split('-')[1]);assert.equal(document.getElementById(field.getAttribute('aria-describedby')).textContent,'');fill(field,'25:99');}
   action(section,'Check answers').click();assert.match(section.querySelector('.score').textContent,/^0 \/ 10/);
   for(const field of fields){const q=ex.items.find(q=>field.id===ex.id+'-'+q.id+'-answer');const feedback=document.getElementById(field.getAttribute('aria-describedby'));assert.ok(feedback.textContent.includes(q.answers[0]));assert.ok(feedback.textContent.includes(q.explanation));fill(field,q.answers[0]);}
   action(section,'Check answers').click();assert.match(section.querySelector('.score').textContent,/^10 \/ 10/);
   assert.ok(section.querySelectorAll('.feedback').every(f=>f.textContent.startsWith('✓ Correct !')));
   action(section,'Try again').click();assert.match(document.getElementById(ex.id).querySelector('.score').textContent,/^0 \/ 10/);assert.equal(other.value,'keep this answer');
  }
  assert.equal(seen.size,30);assert.equal(orders.size,100);
 });
}
test('saved answers, order and feedback survive a reload; blank check remains unvalidated',()=>{
 const {document,storage}=open(),section=document.getElementById('ex1'),field=section.querySelector('input');
 action(section,'Check answers').click();assert.match(section.querySelector('.score').textContent,/^0 \/ 10/);assert.match(section.querySelector('.feedback').textContent,/Écris une réponse/);
 const q=lesson.exercises[0].items.find(q=>field.id==='ex1-'+q.id+'-answer');fill(field,q.answers[0]);action(section,'Check answers').click();
 const returned=open(storage).document;assert.equal(returned.getElementById(field.id).value,q.answers[0]);assert.match(returned.getElementById('ex1-score').textContent,/^1 \/ 10/);assert.match(returned.getElementById(field.id+'-feedback').textContent,/Correct/);
});
