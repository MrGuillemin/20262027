/* Telling the time: lesson-specific correction, shared random sampling and saved progress. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../../../assets/js/app.js'));
  else root.TimePractice=factory(root.EnglishPractice);
})(typeof window==='undefined'?globalThis:window,function(common){
  'use strict';
  function words(value){
    return String(value??'').toLowerCase().replace(/[’‘]/g,"'").replace(/[-‐‑–]/g,' ')
      .replace(/[.,!?;:]/g,' ').replace(/\s+/g,' ').trim()
      .replace(/^(?:it's|its|it is)\s+/,'').replace(/\ba quarter\b/g,'quarter')
      .replace(/\bo\s*'?\s*clock\b/g,"o'clock");
  }
  function digital(value){
    const match=String(value??'').trim().toLowerCase().match(/^(0?[1-9]|1[0-2])\s*[:h]\s*([0-5][0-9])$/);
    return match?Number(match[1])+':'+match[2]:null;
  }
  function grade(value,item,mode){
    if(!String(value??'').trim())return {correct:false,empty:true,message:'Écris une réponse avant de vérifier.'};
    const actual=mode==='timeDigital'?digital(value):words(value);
    const correct=actual!==null&&item.answers.some(answer=>(mode==='timeDigital'?digital(answer):words(answer))===actual);
    let explanation=item.explanation;
    if(!correct&&mode==='timeDigital'&&actual===null)explanation='Utilise une heure de 1 à 12 et deux chiffres pour les minutes, de 00 à 59 : H:MM (8:45, 08:45 ou 8h45). '+explanation;
    if(!correct&&mode==='timeWords'&&!/\b(past|to|o'clock)\b/.test(actual))explanation='Utilise les expressions étudiées : past, to ou o’clock. La lecture numérique, comme seven fifteen, ne convient pas ici. '+explanation;
    return {correct,empty:false,message:(correct?'✓ Correct ! ':'Réponse attendue : '+item.answers[0]+' ')+explanation};
  }
  function mount(lesson,options={}){
    const document=options.document||window.document,random=options.random||Math.random,settings={random};
    if(Object.hasOwn(options,'storage'))settings.storage=options.storage;
    const progress=common.createProgress(lesson.id,settings),host=document.getElementById('exercises');
    function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
    function button(text,action){const el=node('button',text);el.type='button';el.addEventListener('click',action);return el;}
    function render(exercise,fresh=false){
      const {state,items,save}=progress.prepare(exercise,fresh);
      const section=node('section',undefined,'exercise');section.id=exercise.id;
      const heading=node('h2',exercise.title);heading.tabIndex=-1;
      const french=node('p',exercise.instructionFr,'fr');french.lang='fr';
      section.append(heading,node('p',exercise.instruction),french,node('p','10 questions from 30. Try again selects and shuffles a new series.','muted'));
      const rows=items.map((item,index)=>{
        const row=node('div',undefined,'question'),label=node('label',(index+1)+'. '+item.prompt);
        const field=node('input');field.type='text';field.autocomplete='off';field.id=exercise.id+'-'+item.id+'-answer';label.htmlFor=field.id;
        field.value=typeof state.values[item.id]==='string'?state.values[item.id]:'';
        if(exercise.mode==='timeDigital')field.placeholder='H:MM';
        const feedback=node('div','','feedback');feedback.id=field.id+'-feedback';feedback.lang='fr';feedback.setAttribute('role','status');
        field.setAttribute('aria-describedby',feedback.id);
        const changed=()=>{state.values[item.id]=field.value;delete state.checked[item.id];feedback.textContent='';feedback.className='feedback';field.removeAttribute('aria-invalid');save();updateScore();};
        field.addEventListener('input',changed);field.addEventListener('change',changed);
        row.append(label,field,feedback);section.append(row);return {item,field,feedback};
      });
      const score=node('p','','score');score.id=exercise.id+'-score';score.lang='fr';score.setAttribute('role','status');score.setAttribute('aria-live','polite');
      function updateScore(){score.textContent=rows.filter(r=>state.checked[r.item.id]?.correct&&state.checked[r.item.id].value===r.field.value).length+' / '+items.length+' réponse(s) correcte(s).';}
      function check(row){
        const result=grade(row.field.value,row.item,exercise.mode);
        row.feedback.textContent=result.message;row.feedback.className='feedback '+(result.correct?'ok':'guidance');row.field.setAttribute('aria-invalid',String(!result.correct&&!result.empty));
        state.checked[row.item.id]={value:row.field.value,correct:result.correct};
      }
      const actions=node('div',undefined,'actions');actions.append(button('Check answers',()=>{rows.forEach(check);save();updateScore();}));
      const retry=button('Try again',()=>{const replacement=render(exercise,true);section.replaceWith(replacement);replacement.querySelector('h2').focus();});retry.className='secondary';actions.append(retry);
      section.append(actions,score);rows.forEach(row=>{if(state.checked[row.item.id]?.value===row.field.value)check(row);});updateScore();return section;
    }
    host.replaceChildren(...lesson.exercises.map(exercise=>render(exercise)));
  }
  return {words,digital,grade,mount};
});
