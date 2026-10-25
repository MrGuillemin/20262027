const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {Document}=require('./dom.cjs');
const {root,manifest,loadLesson,memoryStorage}=require('./helpers.cjs');
const source=fs.readFileSync(path.join(root,'assets/js/app.js'),'utf8');
function open(lesson,storage=memoryStorage()){
  const document=new Document(),window={localStorage:storage};
  vm.runInNewContext(source,{window,document});window.EnglishPractice.mount(lesson);
  return {document,storage};
}
function fill(field,value){field.value=value;field.dispatchEvent({type:'input'});}
function action(section,text){return section.children.find(child=>child.className==='actions').querySelectorAll('button').find(button=>button.textContent===text);}

test('all thirteen lessons render their exercises with labelled fields and feedback descriptions',()=>{
  let exercises=0;
  for(const entry of manifest){const lesson=loadLesson(entry),{document}=open(lesson);
    assert.equal(document.querySelectorAll('.exercise').length,lesson.exercises.length,entry.path);exercises+=lesson.exercises.length;
    const ids=document.querySelectorAll('[id]').map(node=>node.id);assert.equal(new Set(ids).size,ids.length,entry.path+' duplicate IDs');
    for(const field of document.querySelectorAll('input, select, textarea')){
      assert.ok(document.querySelectorAll('label').some(label=>label.htmlFor===field.id),entry.path+' missing label '+field.id);
      assert.ok(document.getElementById(field.getAttribute('aria-describedby')),entry.path+' missing feedback '+field.id);
    }
  }
  assert.equal(exercises,50);
});
test('a model answer can be checked in every closed exercise, including choices and chronology',()=>{
  for(const entry of manifest){const lesson=loadLesson(entry),{document}=open(lesson);
    for(const exercise of lesson.exercises){if(['writing','free'].includes(exercise.type))continue;
      const section=document.getElementById(exercise.id);
      for(const row of section.children.filter(node=>node.className==='question')){
        const field=row.querySelector('input, select, textarea'),qid=field.id.match(/-(q\d+)-answer/)[1];
        let item=exercise.items?.find(item=>item.id===qid);
        if(exercise.type==='chronology'){
          const legend=row.querySelector('legend').textContent;item=exercise.scenarios?exercise.scenarios.flat().find(item=>legend.endsWith(item.prompt)):item;
          const fields=row.querySelectorAll('select');fill(fields[0],String(item.order));fill(fields[1],item.order===1?'first':item.order===section.children.filter(node=>node.className==='question').length?'final':'middle');
        }else if(exercise.presentation==='radio'){
          const radio=row.querySelectorAll('input').find(input=>input.value===item.answers[0]);radio.checked=true;radio.dispatchEvent({type:'change'});
        }else fill(field,item.answers[0]);
      }
      action(section,'Check answers').click();
      const count=section.children.filter(node=>node.className==='question').length;
      assert.match(document.getElementById(exercise.id+'-score').textContent,new RegExp('^'+count+' / '+count),entry.path+' '+exercise.id);
    }
  }
});
test('typing, switching lesson and returning restores the selected questions and checked answers',()=>{
  const lesson=loadLesson(manifest.find(entry=>entry.path==='4E3/Unit1/LessonB'));
  const {document,storage}=open(lesson),section=document.getElementById('ex2'),field=section.querySelector('input');
  const id=field.id,item=lesson.exercises[1].items.find(item=>id.includes('-'+item.id+'-answer'));
  fill(field,item.answers[0]);action(section,'Check answers').click();
  open(loadLesson(manifest[0]),storage);
  const returned=open(lesson,storage).document;
  assert.equal(returned.getElementById(id).value,item.answers[0]);assert.match(returned.getElementById(id.replace('-answer','-feedback')).textContent,/reconnue/);
});
test('Try again replaces one exercise, retains another answer, and moves focus to the exercise heading',()=>{
  const lesson=loadLesson(manifest.find(entry=>entry.path==='3E2/unit1/lessonB'));
  const {document}=open(lesson),first=document.getElementById('ex1'),other=document.getElementById('ex3').querySelector('input');
  fill(first.querySelector('input'),'first answer');fill(other,'keep this answer');action(first,'Try again').click();
  assert.ok(document.getElementById('ex1').querySelectorAll('input').every(input=>input.value===''));
  assert.equal(other.value,'keep this answer');assert.equal(document.activeElement,document.getElementById('ex1').querySelector('h2'));
});
test('a blank check does not reveal an answer, three nonempty attempts do',()=>{
  const {document}=open(loadLesson(manifest[0])),section=document.getElementById('ex1');
  const check=action(section,'Check answers');check.click();check.click();check.click();assert.equal(section.querySelectorAll('.reveal').length,0);
  const field=section.querySelector('input');fill(field,'unrecognized answer');check.click();check.click();check.click();
  const reveal=section.querySelector('.reveal');assert.ok(reveal);reveal.click();assert.match(section.querySelector('.model').textContent,/Réponse possible/);
});
test('blocked storage leaves the controls usable with an explicit notice',()=>{
  const storage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  const {document}=open(loadLesson(manifest[0]),storage);assert.match(document.getElementById('progressNotice').textContent,/indisponible/);
  const section=document.getElementById('ex1');fill(section.querySelector('input'),'anything');assert.doesNotThrow(()=>action(section,'Check answers').click());
});
test('matching selections and radio buttons keep their meaning when options are rebuilt',()=>{
  const storage=memoryStorage();
  for(const entry of [manifest.find(entry=>entry.path==='5E4/unit1/lesson-c'),manifest.find(entry=>entry.path==='3E4/unit1/lessonB')]){
    const lesson=loadLesson(entry),{document}=open(lesson,storage),section=document.getElementById('ex2');
    const field=section.querySelector('input, select'),id=field.id;
    let expected;
    if(field.type==='radio'){field.checked=true;field.dispatchEvent({type:'change'});expected=field.value;}
    else{expected=field.querySelectorAll('option').find(option=>option.value!=='').value;fill(field,expected);}
    const returned=open(lesson,storage).document;
    if(field.type==='radio'){assert.equal(returned.getElementById(id).checked,true);assert.equal(returned.getElementById(id).value,expected);}
    else assert.equal(returned.getElementById(id).value,expected);
  }
});
test('chronology retains both its scenario and its two selected answers',()=>{
  const lesson=loadLesson(manifest.find(entry=>entry.path==='3E4/unit1/lessonA'));
  const {document,storage}=open(lesson),section=document.getElementById('ex4'),fields=section.querySelectorAll('select');
  const prompt=section.querySelector('legend').textContent;fill(fields[0],'2');fill(fields[1],'middle');
  const returned=open(lesson,storage).document;
  assert.equal(returned.getElementById('ex4').querySelector('legend').textContent,prompt);
  assert.equal(returned.getElementById(fields[0].id).value,'2');assert.equal(returned.getElementById(fields[1].id).value,'middle');
});
test('one damaged exercise never hides the remaining exercises in the lesson',()=>{
  const lesson=loadLesson(manifest[0]);delete lesson.exercises[0].items;
  const {document}=open(lesson);
  assert.equal(document.querySelectorAll('.exercise').length,lesson.exercises.length);
  assert.equal(document.querySelectorAll('.exercise-error').length,1);
  assert.ok(document.getElementById('ex2').querySelectorAll('input').length>0);
  assert.ok(document.getElementById('ex3').querySelectorAll('input').length>0);
});
