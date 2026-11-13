/* Scoped to Making Pocket Money; shared design and Fisher–Yates come from EnglishPractice. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../../../assets/js/app.js'));
  else root.PocketMoney=factory(root.EnglishPractice);
})(typeof window==='undefined'?globalThis:window,function(common){
  'use strict';
  const clean=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/[.!?,;:]/g,' ').replace(/\s+/g,' ').trim();
  function canonical(value){return clean(value)
    .replace(/\bin order to\b/g,'to').replace(/\byoung people\b/g,'teenagers')
    .replace(/\b(make|makes|making) (some |extra |pocket )?money\b/g,(_,v,q)=>(v==='makes'?'earns':v==='making'?'earning':'earn')+' '+(q||'')+'money')
    .replace(/\bpart[ -]time job\b/g,'job').replace(/\bbaby-sitter\b/g,'babysitter')
    .replace(/\blooking after children\b/g,'babysitting').replace(/\bneighbors\b/g,'neighbours')
    .replace(/\b(?:the )?(?:united states(?: of america)?|usa|us)\b/g,'the usa')
    .replace(/\bdriver's license\b/g,'driving licence').replace(/\bdriving license\b/g,'driving licence')
    .replace(/\bvacations?\b/g,'holiday').replace(/\bholidays\b/g,'holiday')
    .replace(/\bon (?:the )?weekends?\b/g,'at weekends').replace(/\bat the weekend\b/g,'at weekends')
    .replace(/\bbiscuits\b/g,'cookies').replace(/\bold items\b/g,'old things')
    .replace(/\bby tutoring\b/g,'by giving private lessons').replace(/\bby cleaning the house\b/g,'by doing the housework');}
  function draw(pool,random=Math.random){
    // A uniform permutation of all 30: its first ten are a uniform ordered sample.
    // No forced exclusion of last time's questions: that would bias the next draw.
    return common.shuffle(pool,random).slice(0,10);
  }
  function grade(value,item,translation=false){
    const text=clean(value);
    if(!text)return {status:'blank',message:'Écris une réponse avant de vérifier.'};
    const expected=clean(item.answers[0]);
    if((translation?item.answers.some(a=>canonical(a)===canonical(value)):item.answers.some(a=>clean(a)===text)))return {status:'valid',message:translation?'Correct ! Les structures et le sens attendus sont reconnus.':'Correct ! '+item.explanation};
    if(!translation)return {status:'incorrect',message:expected.startsWith('by ')?'Attention : pour exprimer le moyen, utilise BY + V-ING. Après BY, le verbe prend -ING.':'Attention : pour exprimer un but, utilise TO + la base verbale.'};
    if(/\b(she|he|it) want\b/.test(text))return {status:'incorrect',message:'Avec SHE / HE / IT, il faut WANTS.'};
    if(/\b(wants?|want) (?!to\b)(?:work|find|buy|save|become|earn|make|go|travel|improve)\b/.test(text))return {status:'incorrect',message:'Il manque TO après WANT / WANTS.'};
    if(/\bby (?:to\b|sell\b|wash\b|deliver\b|clean\b|buy\b|help\b|walk\b|mow\b|give\b|do\b|look\b|babysit\b)/.test(text))return {status:'incorrect',message:'Après BY, utilise V-ING : BY SELLING, BY WASHING…'};
    if(/\bto (?:buying|working|selling|earning|making|saving|becoming|finding|paying|improving|going|gaining)\b/.test(text))return {status:'incorrect',message:'Après TO exprimant le but ou après WANT TO, utilise la base verbale : TO BUY, TO WORK…'};
    // Other formulations may be valid. Do not assign zero on the basis of a text mismatch.
    return {status:'compare',message:'Réponse à comparer : cette formulation demande une relecture du sens, du temps et de la grammaire avec la proposition ou ton professeur.'};
  }
  function mount(lesson,document=window.document,random=Math.random){
    const exercises=Array.isArray(lesson)?lesson:lesson.exercises;
    const host=document.getElementById('exercises');
    const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
    function button(text,action){const el=node('button',text,'secondary');el.type='button';el.addEventListener('click',action);return el;}
    function render(ex,index){
      const section=node('section',undefined,'exercise');section.id=ex.id;
      const heading=node('h2',ex.title);heading.tabIndex=-1;
      section.append(heading,node('p',ex.instruction),node('p',ex.instructionFr,'fr'));
      section.append(node('p','10 questions tirées au hasard parmi 30. Try again renouvelle le tirage et l’ordre.','muted'));
      if(index===0)section.append(node('p','Example: Teenagers can earn money ______ (wash) cars. → by washing','notice'));
      else section.append(node('p','Le correcteur reconnaît des variantes courantes. Une réponse différente peut rester à comparer ; elle ne reçoit pas automatiquement zéro.','notice'));
      const rows=draw(ex.items,random).map((item,i)=>{
        const row=node('div',undefined,'question'),label=node('label',(i+1)+'. '+item.prompt);
        const input=node('input');input.type='text';input.autocomplete='off';input.id=ex.id+'-'+item.id+'-answer';input.value='';label.htmlFor=input.id;
        const feedback=node('div','','feedback');feedback.id=input.id+'-feedback';feedback.lang='fr';input.setAttribute('aria-describedby',feedback.id);
        const model=node('p','','model');model.lang='fr';
        const state={item,input,feedback,model,status:'blank',revealed:false};
        row.append(label,input,feedback);
        if(index===1){const reveal=button('Voir une proposition de traduction',()=>{
          if(!input.value.trim()){feedback.textContent='Saisis ta réponse avant de consulter la proposition.';return;}
          state.revealed=true;model.textContent='Proposition : '+item.answers[0];
        });row.append(reveal,model);}
        input.addEventListener('input',()=>{state.status='blank';feedback.textContent='';feedback.className='feedback';input.removeAttribute('aria-invalid');updateScore();});
        section.append(row);return state;
      });
      const score=node('p','','score');score.id=ex.id+'-score';score.setAttribute('role','status');score.setAttribute('aria-live','polite');score.lang='fr';
      function updateScore(){
        const n=status=>rows.filter(r=>r.status===status).length;
        score.textContent=n('valid')+' / 10 validées · '+n('incorrect')+' erreur(s) identifiée(s) · '+n('compare')+' à comparer · '+n('blank')+' à compléter ou vérifier.';
      }
      const actions=node('div',undefined,'actions');
      actions.append(button('Check answers',()=>{rows.forEach(r=>{
        const result=grade(r.input.value,r.item,index===1);r.status=result.status;
        r.feedback.textContent=result.message+(r.revealed?' Proposition déjà consultée.':'');
        r.feedback.className='feedback '+(result.status==='valid'?'ok':'guidance');r.input.setAttribute('aria-invalid',String(result.status==='incorrect'));
      });updateScore();}),button('Try again',()=>{const replacement=render(ex,index);section.replaceWith(replacement);replacement.querySelector('h2').focus();}));
      section.append(actions,score);updateScore();return section;
    }
    const sections=exercises.map(render);host.replaceChildren(...sections);
  }
  return {clean,canonical,draw,grade,mount};
});
