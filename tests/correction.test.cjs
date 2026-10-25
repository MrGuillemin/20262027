const test=require('node:test');
const assert=require('node:assert/strict');
const api=require('../assets/js/app.js');

test('contractions, apostrophes and regional spellings are accepted consistently',()=>{
  for(const [answer,model] of [["She's twelve years old.",'She is twelve years old.'],["I'm British.",'I am British.'],["We didn’t visit the city centre.",'We did not visit the city center.'],['They traveled to London.','They travelled to London.']])assert.ok(api.matchAnswer(answer,[model]));
  assert.equal(api.normalize("Tom's brother took pictures."),"tom's brother took pictures");
});
test('reported translation variants and combinations are accepted',()=>{
  const cases=[['She is helpful because she likes to help other people.','She is helpful because she likes helping others.'],['There are lots of parks in Melbourne.','There are many parks in Melbourne.'],['The CN Tower is higher than the Shard.','The CN Tower is taller than the Shard.'],['I think Auckland is better than Toronto.','In my opinion, Auckland is better than Toronto.'],['We took a lot of photos in Yosemite.','We took lots of pictures in Yosemite.']];
  for(const [answer,model] of cases)assert.ok(api.matchAnswer(answer,[model],'translation'),answer);
  assert.ok(api.matchAnswer('There are many museums in Melbourne.',['In Melbourne, there are many museums.'],'reform'));
});
test('variants do not hide incorrect agreement, negation, or uncountable quantities',()=>{
  for(const [answer,model] of [['She is helpful because she like helping others.','She is helpful because she likes helping others.'],['She does not like music.','She likes music.'],['There are many street art.','There is a lot of street art.'],['There is many street art.','There is a lot of street art.'],['We did not went to London.','We did not go to London.']])assert.equal(api.matchAnswer(answer,[model],'translation'),false);
  assert.equal(api.matchAnswer('higher than',['taller than'],'comparative'),false);
  assert.doesNotMatch(api.diagnose('Tom is competitive because he does not like winning.','','translation'),/pas likes|sans -s/);
  assert.match(api.diagnose('Tom does not likes music.','','text'),/sans -s/);
  assert.match(api.diagnose('A different formulation.','','translation'),/pas encore reconnue/);
});
test('Emma recognizes contracted ages and grouped pets without validating a whole text',()=>{
  const advice=api.writingAdvice("She's twelve years old. She's British. She lives in London. She has a dog and a cat. She likes music.",'emma',{subject:'she'}).join(' ');
  assert.match(advice,/6 information/);
  const first=api.writingAdvice("I'm twelve years old. I'm British. I live in London. I have a dog and a cat. I like music.",'emma',{subject:'i'}).join(' ');
  assert.match(first,/6 information/);
  assert.doesNotMatch(advice,/Bravo|texte est cohérent/);
});
test('personality advice detects a missing or repetitive reason',()=>{
  assert.match(api.writingAdvice('I am shy because banana banana banana.','personality',{subject:'me'}).join(' '),/sujet et un verbe/);
  assert.doesNotMatch(api.writingAdvice('I am helpful because I like helping others.','personality',{subject:'me'}).join(' '),/Ajoute because|développe une raison/);
  assert.match(api.writingAdvice('','personality',{subject:'me'}).join(' '),/Écris/);
});
