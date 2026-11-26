const test=require('node:test'),assert=require('node:assert/strict');
const {Document}=require('./dom.cjs');
const {manifest,loadLesson}=require('./helpers.cjs');
const footy=require('../assets/js/footy-practice.js'),job=require('../assets/js/first-job-practice.js'),runtime=require('../assets/js/lesson-practice.js');
const entries=manifest.filter(e=>['FootyPractice','FirstJobPractice'].includes(e.engine));
const apiFor=entry=>entry.engine==='FootyPractice'?footy:job;
function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function open(entry){const document=new Document();apiFor(entry).mount(loadLesson(entry),{document,random:seeded(41)});return document;}
function fields(row){return row.querySelectorAll('input');}
function fill(field,value){field.value=value;field.dispatchEvent({type:'input'});}
function action(section,text){return section.querySelectorAll('button').find(button=>button.textContent===text);}
function check(section){const actions=section.children.find(el=>el.className==='actions');action(actions,'Check answers').click();}
function rows(section){return section.children.filter(el=>el.className==='question');}
function answer(row,ex,item){
 if(ex.mode==='ed')action(row,item.answers[0]).click();
 else fields(row).forEach((field,i)=>fill(field,item.answers[ex.fields===2?i:0]));
}
const lessonFooty=loadLesson(entries.find(e=>e.engine==='FootyPractice'));
const lessonJob=loadLesson(entries.find(e=>e.engine==='FirstJobPractice'));
test('four independent lessons each have three unique 30-question banks; all reference answers validate',()=>{
 assert.equal(entries.length,4);
 for(const entry of entries){const lesson=loadLesson(entry),api=apiFor(entry);assert.equal(lesson.exercises.length,3);
  for(const ex of lesson.exercises){assert.equal(ex.items.length,30);assert.equal(new Set(ex.items.map(i=>i.prompt)).size,30);
   for(const item of ex.items){const value=ex.fields===2?item.answers.slice(0,2):item.answers[0];assert.equal(api.grade(value,item,ex.mode).points,1,entry.path+' '+ex.mode+' '+item.prompt);}
  }
 }
 for(const entry of entries.filter(e=>e.engine==='FirstJobPractice')){const bank=loadLesson(entry).exercises[0].items;for(const category of ['/t/','/d/','/ɪd/'])assert.equal(bank.filter(q=>q.answers[0]===category).length,10);}
});
test('footy accepts real full-sentence variants without validating incorrect keyword combinations',()=>{
 const habits=lessonFooty.exercises[0];
 const emma=habits.items.find(q=>q.prompt==='Emma + footy + friends (often)');
 for(const value of ['Emma often plays footy with her friends.','Emma often watches footy with her friends.','Often, Emma watches footy with her friends.'])assert.equal(footy.grade(value,emma,'habits').points,1,value);
 const olivia=habits.items[1];
 for(const value of ['Every Friday, Olivia wears her team scarf at school.','Olivia wears her team scarf at school every Friday.'])assert.equal(footy.grade(value,olivia,'habits').points,1,value);
 for(const value of ['Olivia wear her team scarf at school every Friday.','Olivia scarf school wears Friday every team','Olivia wears her team scarf at school.'])assert.notEqual(footy.grade(value,olivia,'habits').points,1,value);
 const jack=habits.items[0];assert.equal(footy.grade('Jack watches usually footy on TV with his friends.',jack,'habits').status,'incorrect');
 const when=lessonFooty.exercises[1].items[0];
 for(const value of ['When his team wins, Jack sings and dances.','Jack sings and dances when the team wins a match.','When his team wins the game, Jack dances and sings.'])assert.equal(footy.grade(value,when,'when').points,1,value);
 for(const value of ['When his team win Jack sings and dances.','When his team wins Jack sing and dances.','When his team wins Jack sings and dance.','When his team wins Jack sings dances.','Jack sings and dances.','When wins Jack sings and dances.'])assert.notEqual(footy.grade(value,when,'when').points,1,value);
});
test('two different intensifications yield a point, one or duplicates yield half a point',()=>{
 const loves=lessonFooty.exercises[2].items[0],exciting=lessonFooty.exercises[2].items[1],amazing=lessonFooty.exercises[2].items[3];
 assert.equal(footy.grade(loves.answers.slice(0,2),loves,'feelings').points,1);
 assert.equal(footy.grade([loves.answers[0],''],loves,'feelings').points,.5);
 assert.equal(footy.grade([loves.answers[0],loves.answers[0].toUpperCase()],loves,'feelings').points,.5);
 for(const value of ['Emma very loves the Collingwood Magpies.','Emma loves really the Collingwood Magpies.'])assert.equal(footy.grade([value,value],loves,'feelings').status,'incorrect');
 assert.equal(footy.grade(['Footy is very excitingly.',''],exciting,'feelings').points,0);
 assert.equal(footy.grade(['The atmosphere at the stadium is very amazing.',''],amazing,'feelings').points,0);
 assert.equal(footy.grade(['Footy is very exciting.','Footy is so exciting.'],exciting,'feelings').points,1);
 assert.equal(footy.grade(['The atmosphere at the stadium is so amazing.','The atmosphere at the stadium is absolutely amazing.'],amazing,'feelings').points,1);
});
test('past notes accept coordination/spelling variants; errors report each verb separately',()=>{
 const notes=lessonJob.exercises[1].items;
 const sophia=notes[2];const wrong=job.grade('Sophia taked orders, served food and cleaned tables.',sophia,'pastNotes');assert.equal(wrong.correctVerbs,2);assert.equal(wrong.points,0);assert.match(wrong.message,/TOOK/);
 for(const [index,value,target]of [[1,'Jake stocked shelves, helped customers and carryed boxes.','CARRIED'],[5,'Lucas organised activities, lead games and helped children.','LED'],[7,'Namiye looked after children, learned new skills and becomed more responsible.','BECAME']])assert.ok(job.grade(value,notes[index],'pastNotes').message.includes(target));
 assert.equal(job.grade('Lucas organized activities and led games and helped children.',notes[5],'pastNotes').points,1);
 assert.equal(job.grade('Namiye became more responsible, looked after children and learnt new skills.',notes[7],'pastNotes').points,1);
 assert.equal(job.grade('Emma read stories, played games and prepared snacks.',notes[24],'pastNotes').points,1);
 assert.equal(job.grade('Ben took on new responsibilities, learned new skills and became more independent.',notes[29],'pastNotes').points,1);
 assert.notEqual(job.grade('Sophia took served cleaned orders food tables.',sophia,'pastNotes').points,1);
 assert.equal(job.grade('Sophia gained experience in this position.',sophia,'pastNotes').status,'compare');
});
test('translation accepts targeted variants and identifies past-tense errors without penalizing unknown formulations',()=>{
 const bank=lessonJob.exercises[2].items;
 const cases=[[0,'Previously, Emma often watched television.'],[1,'Before, Jake did not help his parents at home.'],[4,'Emma discovered she liked babysitting.'],[5,'Jake learnt working was tiring.'],[7,'Ben discovered he liked to help customers.'],[9,'Previously, Ava did not work during the vacations.'],[19,'Ava discovered she liked taking care of animals.'],[22,'Tom discovered he liked to help his neighbors.'],[25,'Namiye discovered she liked organizing activities.'],[27,'Jake discovered he liked working in a store.']];
 for(const [i,value]of cases)assert.equal(job.grade(value,bank[i],'jobTranslation').points,1,value);
 for(const [i,value,target]of [[1,"Before, Jake didn't helped his parents at home.",'base verbale'],[2,'Before, Sophia avoided to talk to strangers.','V-ING'],[4,'Emma discover that she liked looking after children.','DISCOVERED'],[5,'Jake learned that working were tiring.','WAS'],[6,'Sophia realised that she were more sociable.','WAS'],[0,'Before, Emma often watch TV.','WATCHED'],[8,'Before, Lucas spent hours play video games.','PLAYING']]){const result=job.grade(value,bank[i],'jobTranslation');assert.equal(result.status,'incorrect');assert.ok(result.message.includes(target));}
 assert.equal(job.grade('Emma used to watch television quite often.',bank[0],'jobTranslation').status,'compare');
 assert.notEqual(job.grade('Before, Jake helped his parents at home.',bank[1],'jobTranslation').points,1);
});
for(const entry of entries){
 test(entry.path+': actual check/retry controls work across 100 attempts per exercise; all late questions appear',()=>{
  const document=open(entry),lesson=loadLesson(entry);
  for(const ex of lesson.exercises){const seen=new Set(),orders=new Set();
   for(let attempt=0;attempt<100;attempt++){
    const section=document.getElementById(ex.id),questions=rows(section);assert.equal(questions.length,10);assert.equal(new Set(questions.map(r=>ex.mode==='ed'?r.querySelector('legend').textContent:fields(r)[0].id)).size,10);
    const ids=questions.map(r=>ex.mode==='ed'?ex.items.find(q=>r.querySelector('legend').textContent.endsWith(q.prompt)).id:fields(r)[0].id.split('-')[1]);orders.add(ids.join(','));ids.forEach(id=>seen.add(id));
    for(let i=0;i<questions.length;i++)answer(questions[i],ex,ex.items.find(q=>q.id===ids[i]));
    check(section);assert.match(section.querySelector('.score').textContent,/^10 \/ 10/);
    action(section,'Try again').click();const fresh=document.getElementById(ex.id);assert.match(fresh.querySelector('.score').textContent,/^0 \/ 10/);assert.ok(fresh.querySelectorAll('input').every(f=>f.value===''));assert.ok(fresh.querySelectorAll('.feedback').every(f=>f.textContent===''));assert.ok(fresh.querySelectorAll('.model').every(m=>m.textContent===''));
   }
   assert.equal(seen.size,30);assert.equal(orders.size,100);
  }
 });
}
test('footy progressive hints and Show answer require three nonempty checks; corrected answers validate',()=>{
 const entry=entries.find(e=>e.engine==='FootyPractice'),document=open(entry),ex=lessonFooty.exercises[0],section=document.getElementById('ex1'),row=rows(section)[0],field=fields(row)[0],item=ex.items.find(q=>field.id.includes('-'+q.id+'-'));
 check(section);check(section);check(section);assert.equal(action(row,'Show answer'),undefined);
 fill(field,item.answers[0].replace(/\b(goes|wears|watches|plays)\b/,m=>({goes:'go',wears:'wear',watches:'watch',plays:'play'}[m])));
 check(section);assert.match(row.querySelector('.feedback').textContent,/Indice/);assert.equal(action(row,'Show answer'),undefined);
 check(section);assert.match(row.querySelector('.feedback').textContent,/-S/);assert.equal(action(row,'Show answer'),undefined);
 check(section);assert.ok(action(row,'Show answer'));action(row,'Show answer').click();assert.ok(row.querySelector('.model').textContent.includes(item.answers[0]));
 fill(field,item.answers[0]);check(section);assert.match(section.querySelector('.score').textContent,/^1 \/ 10/);
});
test('new lesson sampling treats all positions equally over 30000 seeded draws',()=>{
 const items=lessonFooty.exercises[0].items,counts=Array(30).fill(0),random=seeded(124);
 for(let i=0;i<30000;i++)runtime.draw(items,random).forEach(q=>counts[Number(q.id.slice(1))-1]++);
 for(const count of counts)assert.ok(count>9500&&count<10500);
});
