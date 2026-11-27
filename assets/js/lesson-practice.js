/* Additional lesson controls using the existing EnglishPractice engine and CSS. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./app.js'));else root.LessonPractice=factory(root.EnglishPractice);})(typeof window==='undefined'?globalThis:window,function(common){
  'use strict';
  function draw(items,random=Math.random){return common.shuffle(common.shuffle(items,random).slice(0,10),random);}
  function mount(lesson,options){
    const document=options.document||window.document,random=options.random||Math.random,host=document.getElementById('exercises');
    const progressive=options.policy==='progressive';
    function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
    function button(text,handler,cls='secondary'){const el=node('button',text,cls);el.type='button';el.addEventListener('click',handler);return el;}
    function render(exercise){
      const section=node('section',undefined,'exercise');section.id=exercise.id;
      const heading=node('h2',exercise.title);heading.tabIndex=-1;
      const french=node('p',exercise.instructionFr,'fr');french.lang='fr';
      const example=node('p','Example: '+exercise.example,'notice');
      section.append(heading,node('p',exercise.instruction),french,example,node('p','10 questions from 30. Try again selects and shuffles a new series.','muted'));
      const score=node('p','','score');score.lang='fr';score.id=exercise.id+'-score';score.setAttribute('role','status');score.setAttribute('aria-live','polite');
      let rows=[];
      function updateScore(){
        const total=rows.reduce((sum,row)=>sum+(row.result?.points||0),0);
        const compared=rows.filter(row=>row.result?.status==='compare'||row.result?.needsCompare).length;
        const errors=rows.filter(row=>row.result?.status==='incorrect').length;
        score.textContent=String(total).replace('.',',')+' / '+rows.length+' point(s) reconnu(s) · '+errors+' erreur(s) identifiée(s) · '+compared+' réponse(s) à comparer.';
      }
      function hasValue(row){const value=row.read();return Array.isArray(value)?value.some(v=>v.trim()):Boolean(value.trim());}
      function showModel(row){
        if(!row.checked||!hasValue(row))return;
        if(progressive&&(row.attempts<3||row.result?.points===1))return;
        row.model.replaceChildren(...row.item.answers.slice(0,exercise.fields===2?2:1).map(answer=>node('p','Proposition : '+answer)));
        row.revealed=true;
      }
      function updateRowActions(row){
        const children=[];
        if(!progressive&&exercise.mode!=='ed')children.push(row.checkButton);
        if(row.checked&&hasValue(row)&&exercise.mode!=='ed'&&(!progressive||(row.attempts>=3&&row.result?.points!==1)))children.push(row.revealButton);
        row.actions.replaceChildren(...children);
      }
      function check(row){
        row.result=options.grade(row.read(),row.item,exercise.mode);row.checked=true;
        if(hasValue(row)&&row.result.points!==1)row.attempts++;
        let text=row.result.message;
        if(progressive&&hasValue(row)&&row.result.points!==1){
          const prefix=row.result.status==='compare'?'Formulation non reconnue avec certitude. ':'';
          text=prefix+(row.attempts===1?'Indice : '+options.hint(exercise.mode):row.result.message);
        }
        if(Number.isInteger(row.result.correctVerbs))text+=' '+row.result.correctVerbs+' / 3 verbes reconnus au prétérit.';
        row.feedback.textContent=text+(row.revealed?' Proposition déjà consultée.':'');
        row.feedback.className='feedback '+(row.result.points===1?'ok':'guidance');
        row.fields.forEach(field=>field.setAttribute('aria-invalid',String(row.result.status==='incorrect')));
        if(exercise.mode==='ed'&&hasValue(row)){
          row.feedback.textContent=row.result.message;
        }else if(!progressive&&row.result.status==='compare')showModel(row);
        updateRowActions(row);updateScore();
      }
      rows=draw(exercise.items,random).map((item,index)=>{
        const element=node('div',undefined,'question'),feedback=node('div','','feedback'),model=node('div','','model'),actions=node('div',undefined,'actions');
        const id=exercise.id+'-'+item.id;feedback.id=id+'-feedback';feedback.lang='fr';feedback.setAttribute('role','status');model.lang='fr';
        const row={item,element,feedback,model,actions,fields:[],read:null,result:null,attempts:0,checked:false,revealed:false};
        if(exercise.mode==='ed'){
          const group=node('fieldset');group.append(node('legend',(index+1)+'. '+item.prompt));
          let selected='';const buttons=[];
          for(const choice of item.choices){const option=button(choice,()=>{
            selected=choice;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===choice)));check(row);
          });option.setAttribute('aria-pressed','false');option.setAttribute('aria-describedby',feedback.id);buttons.push(option);group.append(option);}
          row.read=()=>selected;element.append(group);
        }else{
          if(exercise.fields===2)element.append(node('p',(index+1)+'. '+item.prompt));
          for(let fieldIndex=0;fieldIndex<(exercise.fields||1);fieldIndex++){
            const label=node('label',exercise.fields===2?'Reformulation '+(fieldIndex+1):(index+1)+'. '+item.prompt);
            const input=node('input');input.type='text';input.autocomplete='off';input.id=id+'-answer'+(exercise.fields===2?'-'+(fieldIndex+1):'');input.value='';label.htmlFor=input.id;input.setAttribute('aria-describedby',feedback.id);
            input.addEventListener('input',()=>{row.result=null;row.checked=false;feedback.textContent='';feedback.className='feedback';model.replaceChildren();row.fields.forEach(field=>field.removeAttribute('aria-invalid'));updateRowActions(row);updateScore();});
            row.fields.push(input);element.append(label,input);
          }
          row.read=()=>exercise.fields===2?row.fields.map(field=>field.value):row.fields[0].value;
        }
        row.checkButton=button('Check answer',()=>check(row));row.revealButton=button(progressive?'Show answer':'Show a possible answer',()=>showModel(row));
        element.append(feedback,actions,model);updateRowActions(row);section.append(element);return row;
      });
      const actions=node('div',undefined,'actions');
      actions.append(button('Check answers',()=>rows.forEach(check),''),button('Try again',()=>{const replacement=render(exercise);section.replaceWith(replacement);replacement.querySelector('h2').focus();}));
      section.append(actions,score);updateScore();return section;
    }
    host.replaceChildren(...lesson.exercises.map(render));
  }
  return {draw,mount};
});
