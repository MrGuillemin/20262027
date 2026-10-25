const test=require('node:test');
const assert=require('node:assert/strict');
const {createProgress,shuffle,uniqueItems}=require('../assets/js/app.js');
const {memoryStorage}=require('./helpers.cjs');
const exercise={id:'ex1',type:'text',items:Array.from({length:30},(_,i)=>({id:'q'+i,prompt:'Question '+i,answers:['Answer '+i]})),count:10};
test('returning to a lesson restores questions, answers and attempts',()=>{
  const storage=memoryStorage(),first=createProgress('class/lesson',{storage}).prepare(exercise);
  first.state.values[first.items[0].id]='my answer';first.state.attempts[first.items[0].id]=2;first.save();
  const returned=createProgress('class/lesson',{storage}).prepare(exercise);
  assert.deepEqual(returned.items,first.items);assert.deepEqual(returned.state.values,first.state.values);assert.deepEqual(returned.state.attempts,first.state.attempts);
});
test('retry clears only one exercise and keeps another exercise and lesson intact',()=>{
  const storage=memoryStorage(),progress=createProgress('class/a',{storage});
  const one=progress.prepare(exercise),two=progress.prepare({...exercise,id:'ex2'});
  one.state.values[one.items[0].id]='first';two.state.values[two.items[0].id]='second';two.save();
  assert.deepEqual(progress.prepare(exercise,true).state.values,{});
  assert.equal(progress.prepare({...exercise,id:'ex2'}).state.values[two.items[0].id],'second');
  assert.deepEqual(createProgress('class/b',{storage}).prepare(exercise).state.values,{});
});
test('a chronology scenario and radio answer survive a reload',()=>{
  const storage=memoryStorage(),ex={id:'ex1',type:'chronology',scenarios:[[...exercise.items.slice(0,5)],[...exercise.items.slice(5,10)]]};
  const first=createProgress('class/a',{storage}).prepare(ex);first.state.values[first.items[0].id]={order:'1',connector:'first'};first.save();
  const returned=createProgress('class/a',{storage}).prepare(ex);assert.deepEqual(returned.state,first.state);
});
test('blocked storage, corrupt JSON and stale questions recover without stopping practice',()=>{
  const storage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  const blocked=createProgress('class/a',{storage});assert.equal(blocked.prepare(exercise).items.length,10);assert.equal(blocked.available,false);
  const memory=memoryStorage();memory.setItem('EnglishPractice:v2:class/a','{bad');
  const recovered=createProgress('class/a',{storage:memory});assert.equal(recovered.prepare(exercise).items.length,10);
  const old=recovered.prepare(exercise);old.state.values[old.items[0].id]='old';old.save();
  const changed={...exercise,items:exercise.items.slice(0,15)};
  assert.deepEqual(createProgress('class/a',{storage:memory}).prepare(changed).state.values,{});
});
test('random sampling neither mutates the bank nor repeats duplicate questions',()=>{
  const duplicated=[...exercise.items,exercise.items[0]];assert.equal(uniqueItems(duplicated).length,30);
  const before=JSON.stringify(exercise.items),mixed=shuffle(exercise.items,()=>0);
  assert.equal(JSON.stringify(exercise.items),before);assert.equal(new Set(mixed.map(item=>item.id)).size,30);
  assert.notDeepEqual(mixed,exercise.items);
});
