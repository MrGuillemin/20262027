const test=require('node:test');
const assert=require('node:assert/strict');
const {manifest,loadLesson}=require('./helpers.cjs');
const {matchAnswer,uniqueItems}=require('../assets/js/app.js');
test('the five classes retain thirteen lessons and fifty main exercises',()=>{
  assert.deepEqual([...new Set(manifest.map(entry=>entry.className))].sort(),['3E2','3E4','4E2','4E3','5E4']);
  assert.equal(manifest.length,13);assert.equal(new Set(manifest.map(entry=>entry.path)).size,13);
  assert.equal(manifest.flatMap(entry=>loadLesson(entry).exercises).length,50);
});
test('banks contain unique questions, usable answers and valid choice options',()=>{
  for(const entry of manifest){const lesson=loadLesson(entry);assert.equal(lesson.id,entry.path);
    function inspect(exercise){
      assert.ok(['text','choice','matching','writing','free','chronology'].includes(exercise.type));
      for(const items of exercise.scenarios||[exercise.items]){
        assert.ok(items.length>0);assert.equal(new Set(items.map(item=>item.id)).size,items.length);
        assert.equal(uniqueItems(items).length,items.length,entry.path+' '+exercise.id+' duplicate bank entries');
        if(exercise.type==='chronology')assert.deepEqual(items.map(item=>item.order).sort((a,b)=>a-b),Array.from({length:items.length},(_,i)=>i+1));
        for(const item of items){assert.ok(item.prompt);
          if(['text','choice','matching'].includes(exercise.type)){
            assert.ok(item.answers.length>0);for(const answer of item.answers){assert.ok(answer.trim());assert.ok(matchAnswer(answer,item.answers,exercise.mode));}
          }
          if(exercise.type==='choice'){assert.ok(item.choices.includes(item.answers[0]));assert.equal(new Set(item.choices).size,item.choices.length);}
        }
      }
      if(exercise.challenge)inspect(exercise.challenge);
    }
    lesson.exercises.forEach(inspect);
  }
});
