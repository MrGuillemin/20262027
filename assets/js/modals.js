/* Aussie Rules choice exercise. Banks and progress remain independent per lesson. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./app.js'));
  else root.AussieRules=factory(root.EnglishPractice);
})(typeof window==='undefined'?globalThis:window,function(common){
  'use strict';
  function mount(lesson,options={}){
    const document=options.document||window.document;
    const random=options.random||Math.random;
    const settings={random};
    if(Object.hasOwn(options,'storage'))settings.storage=options.storage;
    const progress=common.createProgress(lesson.id,settings);
    const host=document.getElementById('exercises');
    function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
    function button(text,action){const el=node('button',text);el.type='button';el.addEventListener('click',action);return el;}
    function render(exercise,fresh=false){
      const {state,items,save}=progress.prepare(exercise,fresh);
      const section=node('section',undefined,'exercise');section.id=exercise.id;
      const heading=node('h2',exercise.title);heading.tabIndex=-1;
      const french=node('p',exercise.instructionFr,'fr');french.lang='fr';
      section.append(heading,node('p',exercise.instruction),french,node('p','10 questions from 30. The questions and choices are shuffled on each new attempt.','muted'));
      const rows=items.map((item,index)=>{
        const row=node('div',undefined,'question'),label=node('label',(index+1)+'. '+item.prompt);
        const field=node('select');field.id=exercise.id+'-'+item.id+'-answer';label.htmlFor=field.id;
        const empty=node('option','— choose —');empty.value='';field.append(empty);
        common.shuffle(item.choices,random).forEach(choice=>{const option=node('option',choice);option.value=choice;field.append(option);});
        field.value=item.choices.includes(state.values[item.id])?state.values[item.id]:'';
        const feedback=node('div','','feedback');feedback.id=field.id+'-feedback';feedback.lang='fr';feedback.setAttribute('role','status');
        field.setAttribute('aria-describedby',feedback.id);
        const changed=()=>{state.values[item.id]=field.value;delete state.checked[item.id];feedback.textContent='';feedback.className='feedback';field.removeAttribute('aria-invalid');save();updateScore();};
        field.addEventListener('change',changed);
        row.append(label,field,feedback);section.append(row);return {item,field,feedback};
      });
      const score=node('p','','score');score.id=exercise.id+'-score';score.lang='fr';score.setAttribute('role','status');score.setAttribute('aria-live','polite');
      function updateScore(){const count=rows.filter(r=>state.checked[r.item.id]?.correct&&state.checked[r.item.id].value===r.field.value).length;score.textContent=count+' / '+items.length+' réponse(s) correcte(s).';}
      function check(row){
        const {item,field,feedback}=row;
        const correct=item.choices.includes(field.value)&&common.matchAnswer(field.value,item.answers);
        feedback.textContent=field.value?(correct?'✓ Correct ! '+item.explanation:'Réponse attendue : '+item.answers[0]+'. '+item.explanation):'Choisis une réponse avant de vérifier.';
        feedback.className='feedback '+(correct?'ok':'guidance');
        field.setAttribute('aria-invalid',String(Boolean(field.value)&&!correct));
        state.checked[item.id]={value:field.value,correct};
      }
      const actions=node('div',undefined,'actions');
      actions.append(button('Check answers',()=>{rows.forEach(check);save();updateScore();}));
      const retry=button('Try again',()=>{const replacement=render(exercise,true);section.replaceWith(replacement);replacement.querySelector('h2').focus();});retry.className='secondary';actions.append(retry);
      section.append(actions,score);
      rows.forEach(row=>{if(state.checked[row.item.id]?.value===row.field.value)check(row);});updateScore();return section;
    }
    host.replaceChildren(...lesson.exercises.map(exercise=>render(exercise)));
  }
  return {mount};
});
