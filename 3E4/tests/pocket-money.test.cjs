const test=require('node:test'),assert=require('node:assert/strict');
const bank=require('../unit2/lessonA/questions.json'),api=require('../unit2/lessonA/practice.js');
const {Document}=require('../../tests/dom.cjs');
function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function action(section,text){return section.querySelectorAll('button').find(b=>b.textContent===text);}
for(const [index,ex] of bank.entries()){
 test(ex.id+': 30 unique questions, 100 successive uniform draws retain answers and vary order',()=>{
  assert.equal(ex.items.length,30);assert.equal(new Set(ex.items.map(q=>q.id)).size,30);
  const random=seeded(12345+index),seen=new Set(),sets=new Set(),orders=new Set();
  for(let attempt=0;attempt<100;attempt++){
   const selected=api.draw(ex.items,random);assert.equal(selected.length,10);assert.equal(new Set(selected.map(q=>q.id)).size,10);
   selected.forEach(q=>{assert.equal(q,ex.items.find(original=>original.id===q.id));seen.add(q.id);assert.equal(api.grade(q.answers[0],q,index===1).status,'valid');});
   sets.add(selected.map(q=>q.id).sort().join(','));orders.add(selected.map(q=>q.id).join(','));
  }
  assert.equal(sets.size,100);assert.equal(orders.size,100);
  assert.equal(seen.size,30,'all questions, including 9–30, occur over these seeded attempts');
 });
 test(ex.id+': actual Try again buttons reset answers, feedback and models across 10 attempts',()=>{
  const document=new Document();api.mount(bank,document,seeded(987+index));const orders=new Set();
  const other=document.getElementById(index===0?'ex2':'ex1').querySelector('input');other.value='keep';
  for(let attempt=0;attempt<10;attempt++){
   const section=document.getElementById(ex.id),inputs=section.querySelectorAll('input');assert.equal(inputs.length,10);
   orders.add(inputs.map(i=>i.id).join(','));assert.ok(inputs.every(i=>i.value===''));assert.ok(section.querySelectorAll('.feedback').every(f=>f.textContent===''));
   inputs.forEach(input=>{const id=input.id.split('-')[1];input.value=ex.items.find(q=>q.id===id).answers[0];input.dispatchEvent({type:'input'});});
   action(section,'Check answers').click();assert.match(section.querySelector('.score').textContent,/^10 \/ 10/);
   if(index===1){action(section,'Voir une proposition de traduction').click();assert.ok(section.querySelector('.model').textContent);}
   action(section,'Try again').click();assert.equal(other.value,'keep');
   assert.ok(document.getElementById(ex.id).querySelectorAll('.model').every(m=>m.textContent===''));
  }
  assert.equal(orders.size,10);
 });
}
test('equal treatment of pool positions over 30000 reproducible draws',()=>{
 const counts=Array(30).fill(0),random=seeded(73);
 for(let i=0;i<30000;i++)api.draw(bank[0].items,random).forEach(q=>counts[Number(q.id.slice(1))-1]++);
 for(const count of counts)assert.ok(count>9500&&count<10500,String(count));
});
test('completion checks complete structure while ignoring case, spaces and punctuation',()=>{
 for(const q of bank[0].items){assert.equal(api.grade('  '+q.answers[0].toUpperCase().replaceAll(' ','   ')+'. ',q).status,'valid');assert.equal(api.grade(q.answers[0].replace(/^(by|to) /,''),q).status,'incorrect');}
 for(const wrong of ['by sell','to selling','by to wash'])assert.equal(api.grade(wrong,bank[0].items[1]).status,'incorrect');
});
test('translation variants accepted; grammar errors targeted; unknown translations remain to compare',()=>{
 const cases=[[1,'Young people can make money by delivering newspapers.'],[4,"Some young people save money to get their driver's license."],[8,'She wants to find a job in California in order to become more independent.'],[12,'We can make money by selling biscuits.'],[17,'Students can make money by helping their neighbors.'],[22,'Young people can make money by looking after children.'],[29,'She wants to work in the United States to improve her English.']];
 for(const [n,value]of cases)assert.equal(api.grade(value,bank[1].items[n-1],true).status,'valid',value);
 for(const [value,message]of [['She want to work','WANTS'],['by sell cookies','V-ING'],['to buying a car','base verbale'],['She wants find a job','Il manque TO']]){const g=api.grade(value,bank[1].items[10],true);assert.equal(g.status,'incorrect');assert.ok(g.message.includes(message));}
 assert.equal(api.grade('Working in a cafe is what she wants to do.',bank[1].items[10],true).status,'compare');
 assert.equal(api.grade('',bank[1].items[0],true).status,'blank');
});
test('translation model requires a nonempty response; changing an answer clears its status',()=>{
 const document=new Document();api.mount(bank,document,seeded(7));const section=document.getElementById('ex2'),input=section.querySelector('input');
 action(section,'Voir une proposition de traduction').click();assert.equal(section.querySelector('.model').textContent,'');
 input.value='my answer';input.dispatchEvent({type:'input'});action(section,'Voir une proposition de traduction').click();assert.ok(section.querySelector('.model').textContent);
 action(section,'Check answers').click();assert.match(section.querySelector('.score').textContent,/1 à comparer/);
 input.value='changed';input.dispatchEvent({type:'input'});assert.match(section.querySelector('.score').textContent,/0 à comparer/);
});
