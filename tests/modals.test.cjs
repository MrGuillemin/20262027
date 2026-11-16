const test=require('node:test'),assert=require('node:assert/strict');
const {Document}=require('./dom.cjs');
const {manifest,loadLesson,memoryStorage}=require('./helpers.cjs');
const {mount}=require('../assets/js/modals.js');
const entries=manifest.filter(e=>e.engine==='AussieRules');
const choices=['CAN',"CAN'T",'MUST',"MUSTN'T",'HAVE TO'];
const originalAnswers=['CAN',"MUSTN'T",'CAN',"CAN'T",'HAVE TO','MUST','CAN',"MUSTN'T",'HAVE TO','HAVE TO'];
function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function open(entry,storage=memoryStorage()){
 const document=new Document();mount(loadLesson(entry),{document,storage,random:seeded(42)});return {document,storage};
}
function action(section,text){return section.querySelectorAll('button').find(b=>b.textContent===text);}
function fill(field,value){field.value=value;field.dispatchEvent({type:'change'});}
test('both classes have independent complete 30-question banks with the original ten answers',()=>{
 assert.equal(entries.length,2);assert.notEqual(entries[0].path,entries[1].path);
 const banks=entries.map(e=>loadLesson(e).exercises[0].items);
 for(const bank of banks){
  assert.equal(bank.length,30);assert.equal(new Set(bank.map(q=>q.prompt)).size,30);
  assert.deepEqual(bank.slice(0,10).map(q=>q.answers[0]),originalAnswers);
  for(const q of bank){assert.deepEqual(q.choices,choices);assert.ok(q.explanation);assert.ok(q.prompt.includes('_____'));}
 }
 banks[0][0].answers[0]='changed';assert.equal(banks[1][0].answers[0],'CAN');
});
for(const entry of entries){
 test(entry.path+': real check clicks produce corrections and score; retry samples all 30 and resets',()=>{
  const {document}=open(entry),exercise=loadLesson(entry).exercises[0];
  const orders=new Set(),seen=new Set(),optionOrders=new Set();
  for(let attempt=0;attempt<100;attempt++){
   const section=document.getElementById('ex1'),fields=section.querySelectorAll('select');
   assert.equal(fields.length,10);assert.equal(new Set(fields.map(f=>f.id)).size,10);
   orders.add(fields.map(f=>f.id).join(','));
   for(const field of fields){
    assert.equal(field.value,'');const qid=field.id.split('-')[1];seen.add(qid);
    const item=exercise.items.find(q=>q.id===qid),options=field.querySelectorAll('option').slice(1).map(o=>o.value);
    assert.deepEqual([...options].sort(),[...choices].sort());optionOrders.add(options.join(','));
    assert.equal(document.getElementById(field.getAttribute('aria-describedby')).textContent,'');
    fill(field,choices.find(c=>c!==item.answers[0]));
   }
   action(section,'Check answers').click();assert.match(section.querySelector('.score').textContent,/^0 \/ 10/);
   for(const field of fields){
    const item=exercise.items.find(q=>field.id==='ex1-'+q.id+'-answer');
    const feedback=document.getElementById(field.getAttribute('aria-describedby'));
    assert.ok(feedback.textContent.includes('Réponse attendue : '+item.answers[0]));assert.ok(feedback.textContent.includes(item.explanation));assert.equal(field.getAttribute('aria-invalid'),'true');
    fill(field,item.answers[0]);
   }
   action(section,'Check answers').click();assert.match(section.querySelector('.score').textContent,/^10 \/ 10/);
   assert.ok(section.querySelectorAll('.feedback').every(f=>f.textContent.startsWith('✓ Correct !')));
   action(section,'Try again').click();assert.match(document.getElementById('ex1').querySelector('.score').textContent,/^0 \/ 10/);
   assert.equal(document.activeElement,document.getElementById('ex1').querySelector('h2'));
  }
  assert.equal(orders.size,100);assert.equal(seen.size,30);assert.ok(optionOrders.size>20);
 });
 test(entry.path+': answers survive a reload and remain isolated from the other class',()=>{
  const {document,storage}=open(entry),section=document.getElementById('ex1'),field=section.querySelector('select');
  const correct=loadLesson(entry).exercises[0].items.find(q=>field.id==='ex1-'+q.id+'-answer').answers[0];fill(field,correct);action(section,'Check answers').click();
  const returned=open(entry,storage).document;assert.equal(returned.getElementById(field.id).value,correct);assert.match(returned.getElementById('ex1-score').textContent,/^1 \/ 10/);
  const other=entries.find(e=>e!==entry);assert.ok(open(other,storage).document.querySelectorAll('select').every(f=>f.value===''));
 });
}
