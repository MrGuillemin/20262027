const test=require('node:test'),assert=require('node:assert/strict');
const {Document}=require('./dom.cjs');
const {manifest,loadLesson}=require('./helpers.cjs');
const api=require('../3E2/unit2/lessonA/practice.js');
const entry=manifest.find(e=>e.engine==='PocketMoney3E2'),lesson=loadLesson(entry);
function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function open(){const document=new Document();api.mount(lesson,document,seeded(124));return document;}
function action(section,text){return section.querySelectorAll('button').find(b=>b.textContent===text);}
function fill(field,value){field.value=value;field.dispatchEvent({type:'input'});}
test('two 30-question pools retain their original eight answers and all references validate',()=>{
 assert.equal(lesson.id,'3E2/unit2/lessonA');assert.equal(lesson.exercises.length,2);
 assert.deepEqual(lesson.exercises[0].items.slice(0,8).map(q=>q.answers[0]),['to save','by selling','to buy','by mowing','to earn','by looking after','to buy','by doing']);
 for(const [i,ex]of lesson.exercises.entries()){
  assert.equal(ex.items.length,30);assert.equal(new Set(ex.items.map(q=>q.id)).size,30);assert.equal(new Set(ex.items.map(q=>q.prompt)).size,30);
  for(const q of ex.items){assert.equal(api.grade(q.answers[0],q,i===1).status,'valid');assert.equal(api.grade(' '+q.answers[0].toUpperCase().replaceAll(' ','   ')+' ',q,i===1).status,'valid');if(i===0)assert.ok(q.contextFr);}
 }
});
test('correct structures validate and targeted mistakes explain BY, TO and WANTS',()=>{
 const completion=lesson.exercises[0].items;
 for(const [n,value,status]of [[1,'by selling','valid'],[1,'by sell','incorrect'],[0,'to save','valid'],[0,'to saving','incorrect'],[0,'in order to save','valid']])assert.equal(api.grade(value,completion[n]).status,status,value);
 const q=lesson.exercises[1].items[10];
 assert.equal(api.grade('She wants to work in a cafe.',q,true).status,'valid');
 assert.equal(api.grade('She wants to work',q,true).status,'compare','the grammatical fragment does not convey the full requested meaning');
 for(const [value,message]of [['She want to work','WANTS'],['She wants find a job','Il manque TO'],['by sell cookies','V-ING'],['to buying a car','base verbale']]){const result=api.grade(value,q,true);assert.equal(result.status,'incorrect');assert.ok(result.message.includes(message));}
 assert.equal(api.grade('She works in a cafe.',q,true).status,'compare','different meaning is never automatically validated');
});
test('translation variants combine without erasing subject, tense, negation or key vocabulary',()=>{
 const bank=lesson.exercises[1].items;
 const variants=[[1,'Young people can make money by delivering newspapers.'],[4,"Some young people save money in order to get their driver's license."],[6,'She works during the vacations in order to become more independent.'],[8,'She wants to find a job in California in order to become more independent.'],[12,'We can make money by selling biscuits.'],[17,'Students can make money by helping their neighbors.'],[22,'Young people can make money by looking after children.'],[29,'She wants to work in the US in order to improve her English.'],[29,'She wants to work in the United States to improve her English.']];
 for(const [n,value]of variants)assert.equal(api.grade(value,bank[n-1],true).status,'valid',value);
 for(const value of ['He wants to work in a cafe.','She wanted to work in a cafe.','She does not want to work in a cafe.','She wants to work in a school.'])assert.notEqual(api.grade(value,bank[10],true).status,'valid',value);
 assert.equal(api.grade('Working in a cafe is what she wants to do.',bank[10],true).status,'compare');
});
for(const [index,ex] of lesson.exercises.entries()){
 test(ex.id+': 100 actual retries preserve association, cover 21–30, vary order and reset only this exercise',()=>{
  const document=open(),seen=new Set(),orders=new Set();
  const other=document.getElementById(index===0?'ex2':'ex1').querySelector('input');fill(other,'keep this answer');
  for(let attempt=0;attempt<100;attempt++){
   const section=document.getElementById(ex.id),fields=section.querySelectorAll('input');assert.equal(fields.length,10);assert.equal(new Set(fields.map(f=>f.id)).size,10);orders.add(fields.map(f=>f.id).join(','));
   for(const field of fields){assert.equal(field.value,'');seen.add(field.id.split('-')[1]);assert.equal(document.getElementById(field.id+'-feedback').textContent,'');for(const id of field.getAttribute('aria-describedby').split(' '))assert.ok(document.getElementById(id));fill(field,index===0?'by sell':'She want to work');}
   action(section,'Check answers').click();assert.match(section.querySelector('.score').textContent,/^0 \/ 10 validées · 10 erreur/);
   for(const field of fields){const q=ex.items.find(q=>field.id===ex.id+'-'+q.id+'-answer');fill(field,q.answers[0]);}
   action(section,'Check answers').click();assert.match(section.querySelector('.score').textContent,/^10 \/ 10 validées/);assert.ok(section.querySelectorAll('.feedback').every(f=>f.textContent.startsWith('Correct !')));
   if(index===1){action(section,'Show a possible answer').click();assert.ok(section.querySelector('.model').textContent);}
   action(section,'Try again').click();const fresh=document.getElementById(ex.id);assert.match(fresh.querySelector('.score').textContent,/^0 \/ 10 validées · 0 erreur/);assert.equal(other.value,'keep this answer');assert.ok(fresh.querySelectorAll('.model').every(m=>m.textContent===''));
   assert.equal(document.activeElement,fresh.querySelector('h2'));
  }
  assert.equal(orders.size,100);assert.equal(seen.size,30);for(let n=21;n<=30;n++)assert.ok(seen.has('q'+n));
 });
}
test('uniform sample does not favor original or late questions (30000 seeded draws)',()=>{
 const counts=Array(30).fill(0),random=seeded(73),before=JSON.stringify(lesson.exercises[0].items);
 for(let i=0;i<30000;i++)api.draw(lesson.exercises[0].items,random).forEach(q=>counts[Number(q.id.slice(1))-1]++);
 assert.equal(JSON.stringify(lesson.exercises[0].items),before);for(const count of counts)assert.ok(count>9500&&count<10500);
});
test('translation models unlock only after checking a nonempty attempt; uncertain answers are counted separately',()=>{
 const document=open(),section=document.getElementById('ex2'),field=section.querySelector('input'),reveal=action(section,'Show a possible answer');
 assert.equal(reveal.disabled,true);fill(field,'A different formulation');assert.equal(reveal.disabled,true);reveal.click();assert.equal(section.querySelector('.model').textContent,'');
 action(section,'Check answers').click();assert.equal(reveal.disabled,false);assert.match(section.querySelector('.score').textContent,/0 erreur\(s\) identifiée\(s\) · 1 à comparer/);
 reveal.click();assert.ok(section.querySelector('.model').textContent);fill(field,'changed');assert.equal(reveal.disabled,true);assert.equal(section.querySelector('.model').textContent,'');assert.match(section.querySelector('.score').textContent,/0 à comparer/);
});
