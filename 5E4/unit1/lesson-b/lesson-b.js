const pools={
ex1:[
["Jack ___ a brother.","has"],["I ___ 12 years old.","am"],["My friends ___ blue eyes.","have"],["Charlie ___ 15 years old.","is"],["You ___ cold.","are"],["My sister ___ long brown hair.","has"],["We ___ hungry.","are"],["He ___ a dog.","has"],["They ___ very tall.","are"],["My best friend ___ two sisters.","has"],["Emma ___ 12 years old.","is"],["Emma ___ a brother.","has"],["I ___ a cat.","have"],["Lucy and Tom ___ hungry.","are"],["My brother ___ green eyes.","has"],["You ___ two pets.","have"],["She ___ British.","is"],["We ___ a new student in our class.","have"],["The boys ___ 13 years old.","are"],["My friend ___ a basketball.","has"],["I ___ British.","am"],["They ___ a dog and a cat.","have"],["Jack ___ cold.","is"],["My sisters ___ long hair.","have"],["You ___ very tall.","are"],["She ___ two brothers.","has"],["We ___ 12 years old.","are"],["Tom and Sam ___ blue eyes.","have"],["My best friend ___ hungry.","is"],["I ___ one sister.","have"]],
ex2:[
["I ___ in Nevers. (live)","live"],["Jack ___ in Manchester. (live)","lives"],["My friends ___ football. (play)","play"],["My best friend ___ football. (play)","plays"],["Jack and Charlie ___ in England. (live)","live"],["My brother ___ tennis. (not play)","doesn't play|does not play"],["The students ___ in London. (not live)","don't live|do not live"],["My sister ___ football. (like)","likes"],["Mélina and Jade ___ basketball. (not like)","don't like|do not like"],["The new student ___ in France. (not live)","doesn't live|does not live"],["Emma ___ in London. (live)","lives"],["I ___ basketball. (like)","like"],["She ___ music. (like)","likes"],["We ___ in England. (not live)","don't live|do not live"],["Tom ___ football every week. (play)","plays"],["You ___ in Nevers. (live)","live"],["My friends ___ tennis. (not play)","don't play|do not play"],["Charlie ___ basketball. (not like)","doesn't like|does not like"],["They ___ football. (like)","like"],["My brother ___ in London. (live)","lives"],["Lucy ___ tennis. (play)","plays"],["I ___ football. (not like)","don't like|do not like"],["The girls ___ in Manchester. (live)","live"],["My best friend ___ basketball. (not play)","doesn't play|does not play"],["He ___ music. (like)","likes"],["We ___ football after school. (play)","play"],["She ___ in France. (not live)","doesn't live|does not live"],["You ___ tennis. (not play)","don't play|do not play"],["Jack and Tom ___ basketball. (like)","like"],["The student ___ football. (play)","plays"]],
ex3:[
["I am 12 years old. → He","He is 12 years old."],["Jack lives in Manchester. → They","They live in Manchester."],["I play football. → She","She plays football."],["She is hungry. → We","We are hungry."],["They don't live in London. → He","He doesn't live in London.|He does not live in London."],["He doesn't play tennis. → I","I don't play tennis.|I do not play tennis."],["You are cold. → She","She is cold."],["I live in Nevers. → Jack","Jack lives in Nevers."],["We are 12 years old. → She","She is 12 years old."],["They play basketball. → He","He plays basketball."],["She likes music. → I","I like music."],["I don't live in London. → Emma","Emma doesn't live in London.|Emma does not live in London."],["He is British. → They","They are British."],["We live in France. → Jack","Jack lives in France."],["She doesn't like tennis. → We","We don't like tennis.|We do not like tennis."],["They are hungry. → I","I am hungry."],["You play football. → Charlie","Charlie plays football."],["Jack lives in England. → I","I live in England."],["I like basketball. → She","She likes basketball."],["He doesn't live in France. → They","They don't live in France.|They do not live in France."],["We play tennis. → My sister","My sister plays tennis."],["She is cold. → You","You are cold."],["They live in Manchester. → He","He lives in Manchester."],["I don't play basketball. → Jack","Jack doesn't play basketball.|Jack does not play basketball."],["He likes football. → We","We like football."],["You live in Nevers. → She","She lives in Nevers."],["She doesn't play football. → I","I don't play football.|I do not play football."],["I am hungry. → They","They are hungry."],["We don't like tennis. → He","He doesn't like tennis.|He does not like tennis."],["He plays basketball. → You","You play basketball."]]
};
function norm(s){return s.trim().toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ').replace(/[.!?]+$/,'')}
function pick(a,n=10){return [...a].sort(()=>Math.random()-.5).slice(0,n)}
function render(id){const box=document.getElementById(id);box.innerHTML='';pick(pools[id]).forEach((item,i)=>{const d=document.createElement('div');d.className='q';d.innerHTML=`<div class="prompt">${i+1}. ${item[0]}</div><input data-answers="${item[1].replace(/"/g,'&quot;')}" autocomplete="off"><div class="feedback"></div>`;box.appendChild(d)});document.getElementById('score-'+id).textContent=''}
function check(id){let good=0;const qs=[...document.querySelectorAll('#'+id+' .q')];qs.forEach(q=>{const inp=q.querySelector('input'),fb=q.querySelector('.feedback');const answers=inp.dataset.answers.split('|');const ok=answers.some(a=>norm(a)===norm(inp.value));if(ok){good++;fb.className='feedback ok';fb.textContent='✓ Correct !'}else{fb.className='feedback no';fb.textContent='✗ Vérifie ta réponse. Réponse possible : '+answers[0]}});document.getElementById('score-'+id).textContent=`Score : ${good} / ${qs.length}`}
['ex1','ex2','ex3'].forEach(render);

function splitSentences(t){return t.replace(/\n+/g,'. ').split(/[.!?]+/).map(s=>norm(s)).filter(Boolean)}
const factsShe=[
 {re:/\b(emma|she) (is|'s) (12|twelve)( years old)?\b/,label:'âge'},
 {re:/\b(emma|she) (is|'s) british\b/,label:'nationalité'},
 {re:/\b(emma|she) lives in london\b/,label:'ville'},
 {re:/\b(emma|she) (has|has got|'s got) (one|1|a) brother\b/,label:'famille'},
 {re:/\b(emma|she) (has|has got|'s got) (one|1|a) dog\b/,label:'chien'},
 {re:/\b(emma|she) (has|has got|'s got) (one|1|a) cat\b/,label:'chat'},
 {re:/\b(emma|she) (likes|plays) basketball\b/,label:'basketball'},
 {re:/\b(emma|she) likes (listening to )?music\b/,label:'musique'},
 {re:/\b(emma|she) likes reading\b/,label:'lecture'}
];
const factsI=[
 {re:/\bi (am|'m) (12|twelve)( years old)?\b/,label:'âge'},
 {re:/\bi (am|'m) british\b/,label:'nationalité'},
 {re:/\bi live in london\b/,label:'ville'},
 {re:/\bi (have|have got|'ve got) (one|1|a) brother\b/,label:'famille'},
 {re:/\bi (have|have got|'ve got) (one|1|a) dog\b/,label:'chien'},
 {re:/\bi (have|have got|'ve got) (one|1|a) cat\b/,label:'chat'},
 {re:/\bi (like|play) basketball\b/,label:'basketball'},
 {re:/\bi like (listening to )?music\b/,label:'musique'},
 {re:/\bi like reading\b/,label:'lecture'}
];
function checkEmma(mode){const ta=document.getElementById(mode==='she'?'emmaShe':'emmaI'), out=document.getElementById(mode==='she'?'fbShe':'fbI');const raw=ta.value.trim();const sents=splitSentences(raw);if(!raw){out.innerHTML='<p class="no">Écris d’abord ton texte.</p>';return}const facts=mode==='she'?factsShe:factsI;const found=facts.filter(f=>f.re.test(norm(raw)));let msgs=[];if(sents.length<5)msgs.push(`<p class="warn">⚠ Tu as écrit ${sents.length} phrase${sents.length>1?'s':''}. Il en faut au moins 5.</p>`);else msgs.push(`<p class="ok">✓ Tu as écrit au moins 5 phrases.</p>`);if(found.length>=5)msgs.push(`<p class="ok">✓ J'ai reconnu ${found.length} informations correctes de la carte.</p>`);else msgs.push(`<p class="warn">⚠ Je reconnais ${found.length} information${found.length>1?'s':''} correcte${found.length>1?'s':''}. Utilise davantage les informations de la carte.</p>`);
const t=norm(raw);
if(mode==='she'){
 if(/\bshe (live|like|play|have)\b/.test(t))msgs.push('<p class="no">✗ Avec <strong>she</strong>, pense au <strong>-s</strong> : lives, likes, plays ; et <strong>has</strong>, pas have.</p>');
 if(/\bshe (am|are)\b/.test(t))msgs.push('<p class="no">✗ Avec <strong>she</strong>, le verbe BE est <strong>is</strong>.</p>');
 if(/\bemma (live|like|play|have)\b/.test(t))msgs.push('<p class="no">✗ Avec <strong>Emma</strong>, pense à la 3e personne : lives, likes, plays, has.</p>');
}else{
 if(/\bi (is|are)\b/.test(t))msgs.push('<p class="no">✗ Avec <strong>I</strong>, le verbe BE est <strong>am</strong>.</p>');
 if(/\bi (lives|likes|plays|has)\b/.test(t))msgs.push('<p class="no">✗ Avec <strong>I</strong>, enlève le -s : live, like, play ; et utilise <strong>have</strong>.</p>');
 if(/\b(she|emma)\b/.test(t))msgs.push('<p class="warn">⚠ Dans le challenge, tu es Emma : utilise <strong>I</strong>, pas she/Emma.</p>');
}
if(sents.length>=5&&found.length>=5&&!msgs.some(m=>m.includes('class="no"')))msgs.push('<p class="ok"><strong>Bravo ! Ton texte est cohérent avec la carte.</strong></p>');
out.innerHTML=msgs.join('');}
