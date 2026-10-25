/* Shared static exercise engine. Class-specific questions remain in class folders. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EnglishPractice=api;})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  function normalize(value) {
    return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
      .replace(/[’‘]/g,"'").replace(/\bd\s*\.\s*c\s*\.?/g,'dc')
      .replace(/\b(he|she|it|emma)'s got\b/g,'$1 has got').replace(/\b(he|she|it|emma|there)'s\b/g,'$1 is')
      .replace(/\bi'm\b/g,'i am').replace(/\b(we|they|you|there)'re\b/g,'$1 are')
      .replace(/\b(i|we|they|you)'ve\b/g,'$1 have').replace(/\b(i|we|they|you|he|she)'d\b/g,'$1 would')
      .replace(/\bdidn't\b/g,'did not').replace(/\bdoesn't\b/g,'does not').replace(/\bdon't\b/g,'do not')
      .replace(/\bisn't\b/g,'is not').replace(/\baren't\b/g,'are not').replace(/\bwasn't\b/g,'was not')
      .replace(/\bweren't\b/g,'were not').replace(/\bhasn't\b/g,'has not').replace(/\bhaven't\b/g,'have not')
      .replace(/\bcan't\b/g,'cannot').replace(/[.,!?;:]/g,' ').replace(/\s+/g,' ').trim();
  }
  function canonical(value,mode='text',model='') {
    let text=normalize(value);
    if(mode==='haveGot')return text;
    const verbs={talk:'talking',tell:'telling',discover:'discovering',help:'helping',lose:'losing',meet:'meeting'};
    text=text.replace(/\b(like|likes) to (talk|tell|discover|help|lose|meet)\b/g,(_,like,verb)=>like+' '+verbs[verb])
      .replace(/\bother people\b/g,'others').replace(/\bcentre\b/g,'center').replace(/\bcentres\b/g,'centers')
      .replace(/\borganises\b/g,'organizes').replace(/\btravelled\b/g,'traveled').replace(/\btravelling\b/g,'traveling')
      .replace(/\bphotos\b/g,'pictures').replace(/\blots of\b/g,'a lot of');
    // Do not equate MANY with A LOT OF before uncountable nouns such as street art.
    text=text.replace(/\b(?:many|a lot of) ((?:(?:green|historic|historical|modern|music|art|sporting|sports|cultural|interesting) )*(?:parks|gardens|spaces|things|pictures|events|festivals|museums|cafes|buildings|trams|buses|galleries|restaurants|activities|shops|people|inhabitants|laneways|lanes|attractions))\b/g,'many $1');
    if(mode==='translation'||mode==='notes') {
      text=text.replace(/\bnew york city\b/g,'new york').replace(/\b(?:the )?united kingdom\b/g,'the uk')
        .replace(/\bthe united states(?: of america)?\b/g,'the usa').replace(/\bthe most populous\b/g,'the most populated')
        .replace(/\b(fewer|more) inhabitants\b/g,'$1 people').replace(/\bin my opinion\b/g,'i think')
        .replace(/\bi think that\b/g,'i think').replace(/^next /,'then ');
      if(/\b(tower|shard)\b/.test(normalize(model)))text=text.replace(/\bhigher than\b/g,'taller than');
    }
    if(mode==='reform')text=text.replace(/^in (.+?) (there (?:is|are) .+)$/,'$2 in $1');
    return text;
  }
  function matchAnswer(value,answers,mode='text') {return answers.some(model=>canonical(value,mode,model)===canonical(model,mode,model));}
  function shuffle(items,random=Math.random) {
    const result=[...items];
    for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  }
  function uniqueItems(items) {
    const seen=new Set();
    return items.filter(item=>{const key=JSON.stringify([item.prompt,item.answers,item.choices,item.order]);if(seen.has(key))return false;seen.add(key);return true;});
  }
  function createProgress(lessonId,options={}) {
    const key='EnglishPractice:v2:'+lessonId;
    let storage,available=true,data={};
    try {
      storage=Object.hasOwn(options,'storage')?options.storage:window.localStorage;
      const raw=storage.getItem(key);
      try{const parsed=JSON.parse(raw);if(parsed&&!Array.isArray(parsed)&&typeof parsed==='object')data=parsed;}catch{/* Recover a malformed save. */}
    }catch{available=false;}
    const random=options.random||Math.random;
    function save(){try{storage.setItem(key,JSON.stringify(data));}catch{available=false;}if(options.onStatus)options.onStatus(available);}
    return {
      get available(){return available;},
      prepare(exercise,fresh=false) {
        const signature=JSON.stringify(exercise);
        let state=data[exercise.id],scenario=state&&Number.isInteger(state.scenario)?state.scenario:0;
        if(exercise.scenarios&&(scenario<0||scenario>=exercise.scenarios.length))state=null;
        const existing=uniqueItems(exercise.scenarios?exercise.scenarios[scenario]||[]:exercise.items);
        const count=Math.min(exercise.count||existing.length,existing.length);
        const object=value=>value&&!Array.isArray(value)&&typeof value==='object';
        const valid=state&&state.signature===signature&&Array.isArray(state.selection)&&state.selection.length===count&&new Set(state.selection).size===count&&state.selection.every(id=>existing.some(item=>item.id===id))&&object(state.values)&&object(state.attempts)&&object(state.checked);
        if(fresh||!valid) {
          scenario=exercise.scenarios?Math.floor(random()*exercise.scenarios.length):0;
          const pool=uniqueItems(exercise.scenarios?exercise.scenarios[scenario]:exercise.items),size=Math.min(exercise.count||pool.length,pool.length);
          const selected=['writing','free'].includes(exercise.type)?pool.slice(0,size):shuffle(pool,random).slice(0,size);
          state={signature,scenario,selection:selected.map(item=>item.id),values:{},attempts:{},checked:{}};data[exercise.id]=state;
        }
        save();
        const pool=exercise.scenarios?exercise.scenarios[state.scenario]:exercise.items;
        return {state,items:state.selection.map(id=>pool.find(item=>item.id===id)),save};
      }
    };
  }
  function diagnose(value,model,mode) {
    const text=normalize(value),expected=normalize(model);
    if(!text)return 'Écris une réponse avant de vérifier.';
    if(/\bdoes not likes\b|\bdo not likes\b/.test(text))return 'Après do not / does not, utilise like sans -s.';
    if(/\bdid not (went|saw|took|drove|found|spent|visited|walked|played|wanted)\b/.test(text))return 'Après did not, utilise la base verbale : go, see, take, visit…';
    if(/\b(he|she|emma|tom) (like|do not|are|have)\b/.test(text))return 'Avec un sujet singulier : likes, does not, is ou has.';
    if(/\b(i|we|they) (is|likes|does not)\b/.test(text))return 'Vérifie l’accord : I am, we are, they like…';
    if(expected.includes('because')&&!/\bbecause\b/.test(text))return 'Pense à because + sujet + verbe pour expliquer la raison.';
    if(mode==='reform'&&/\byou have\b/.test(text))return 'Remplace you have par there is ou there are.';
    if(/\bthere is (many|a lot of parks|some museums)\b/.test(text))return 'Avec ces noms au pluriel, utilise there are.';
    if(/\bthere are (a lot of street art|a lot of greenery|public transport)\b/.test(text))return 'Avec ce nom indénombrable, utilise there is.';
    if(mode==='comparative'&&!/\bthan\b/.test(text))return 'Pense à than après le comparatif.';
    if(mode==='superlative'&&!/\bthe\b/.test(text))return 'Pense à the devant le superlatif.';
    return 'Cette formulation n’est pas encore reconnue. Vérifie la consigne, puis compare avec une réponse possible.';
  }
  const adjectives=['talkative','helpful','shy','sociable','curious','funny','quiet','competitive','creative'];
  function writingAdvice(value,mode,item) {
    const text=normalize(value),messages=[];
    if(!text)return ['Écris ton texte pour commencer.'];
    if(mode==='personality') {
      if(!/\bbecause\b/.test(text))messages.push('Ajoute because pour expliquer la personnalité.');
      else {
        const reason=text.split(/\bbecause\b/).slice(1).join(' because ').trim(),words=reason.split(/\s+/);
        if(words.length<3||new Set(words).size<3||!/\b(am|is|are|have|has|do|does|can|like|likes|love|loves|enjoy|enjoys|help|helps|talk|talks|tell|tells|make|makes|want|wants|prefer|prefers|feel|feels|ask|asks|meet|meets|draw|draws|write|writes|hate|hates|play|plays)\b/.test(reason))messages.push('Après because, développe une raison avec un sujet et un verbe.');
      }
      if(!adjectives.some(word=>new RegExp('\\b'+word+'\\b').test(text)))messages.push('Utilise un adjectif de personnalité étudié en classe.');
      if(item.subject==='me'&&!/\bi am\b/.test(text))messages.push('Pour parler de toi, utilise I am…');
      if(item.subject==='friend'&&!/\b(is|are)\b/.test(text))messages.push('Pour parler d’un camarade, utilise He is / She is / My classmate is…');
    } else if(mode==='emma') {
      const sentences=String(value).replace(/\n+/g,'. ').split(/[.!?]+/).map(normalize).filter(Boolean);
      if(sentences.length<5)messages.push('Écris au moins cinq phrases.');
      const subject=item.subject==='i'?'i':'(?:emma|she)',be=item.subject==='i'?'am':'is',have=item.subject==='i'?'have':'has',likes=item.subject==='i'?'like':'likes';
      const facts=[new RegExp('\\b'+subject+' '+be+' (?:12|twelve)(?: years old)?\\b'),new RegExp('\\b'+subject+' '+be+' british\\b'),new RegExp('\\b'+subject+' live'+(item.subject==='i'?'':'s')+' in london\\b'),...['brother','dog','cat'].map(noun=>new RegExp('\\b'+subject+' '+have+'(?: got)? (?:(?:a|one|1) (?:brother|dog|cat) and )?(?:a|one|1) '+noun+'\\b')),new RegExp('\\b'+subject+' (?:'+likes+'|play'+(item.subject==='i'?'':'s')+') basketball\\b'),new RegExp('\\b'+subject+' '+likes+' (?:listening to )?music\\b'),new RegExp('\\b'+subject+' '+likes+' reading\\b')];
      const found=facts.filter(regex=>sentences.some(sentence=>regex.test(sentence))).length;
      messages.push(found+' information(s) de la carte reconnue(s).');
      if(found<5)messages.push('Utilise davantage d’informations de la carte.');
      if(item.subject==='i'&&/\b(she|emma)\b/.test(text))messages.push('Dans ce texte, tu es Emma : utilise I.');
      if(item.subject==='i'&&/\bi (is|are|lives|likes|plays|has)\b/.test(text))messages.push('Avec I : am, live, like, play, have.');
    } else if(mode==='past') {
      const expected=normalize(item.model).match(/\b(started|walked|took|drove|saw|did not visit|spent|rode|were|was|did not want)\b/g)||[];
      if(!expected.some(verb=>text.includes(verb)))messages.push('Vérifie les formes du prétérit et les négations attendues.');
      if(!/\b(i|we|they|he|she|tom|sarah|my|the)\b/.test(text))messages.push('Écris une phrase complète avec un sujet.');
      messages.push('Ce contrôle repère seulement certaines formes du passé. Compare aussi les idées avec les notes.');
    }
    if(/\b(he|she|emma) (like|do not|are|have|live|play)\b/.test(text))messages.push('Avec he / she / Emma, vérifie la troisième personne : is, has, likes, lives, plays.');
    if(/\bdoes not likes\b|\bdo not likes\b/.test(text))messages.push('Après do not / does not, utilise like sans -s.');
    if(!messages.length)messages.push('Les constructions recherchées sont présentes. Relis aussi le sens et la grammaire avec ton professeur.');
    return messages;
  }

  function mount(lesson) {
    const host=document.getElementById('exercises');
    if(!host)throw new Error('Missing exercise container');
    const notice=document.getElementById('progressNotice');
    const progress=createProgress(lesson.id,{onStatus(available){
      const text=available?'Les questions et tes réponses sont conservées dans ce navigateur. Try again recommence uniquement l’exercice concerné.':'La sauvegarde locale est indisponible. Garde la page ouverte pour conserver tes réponses.';
      if(notice&&notice.textContent!==text)notice.textContent=text;
    }});
    function node(tag,text,className){const element=document.createElement(tag);if(text!==undefined)element.textContent=text;if(className)element.className=className;return element;}
    function button(text,action,className){const element=node('button',text,className);element.type='button';element.addEventListener('click',action);return element;}
    function addOptions(select,options){const blank=node('option','— choose —');blank.value='';select.append(blank);options.forEach(([value,label])=>{const option=node('option',label);option.value=value;select.append(option);});}
    function render(exercise,fresh=false,challenge=false) {
      const {state,items,save}=progress.prepare(exercise,fresh);
      const section=node('section',undefined,challenge?'challenge':'exercise');section.id=exercise.id;
      const heading=node(challenge?'h3':'h2',exercise.title);heading.tabIndex=-1;
      section.append(heading,node('p',exercise.instruction));
      if(exercise.instructionFr){const p=node('p',exercise.instructionFr,'fr');p.lang='fr';section.append(p);}
      if(['writing','free'].includes(exercise.type)) {
        const note=node('p',exercise.type==='free'?'Écriture libre : à relire avec ton professeur, sans autocorrection.':'Aide à la relecture : les règles ne vérifient pas tout le sens ni toute la grammaire.','notice');note.lang='fr';section.append(note);
      } else {
        const pool=uniqueItems(exercise.scenarios?exercise.scenarios[state.scenario]:exercise.items);
        section.append(node('p',items.length+' questions from '+pool.length+' different questions. After three unsuccessful checks, you can show a possible answer.','muted'));
      }
      if(exercise.image){const image=node('img');image.src=exercise.image;image.alt=exercise.imageAlt;image.loading='lazy';image.decoding='async';image.className='idcard';section.append(image,node('p',exercise.imageAlt,'muted'));}
      const score=node('p','','score');score.id=exercise.id+'-score';score.setAttribute('role','status');score.setAttribute('aria-live','polite');score.lang='fr';
      const rows=[];
      function updateScore(){
        if(exercise.type==='free')return;
        if(exercise.type==='writing'){
          const checked=rows.filter(row=>state.checked[row.item.id]?.value===JSON.stringify(row.read())).length;
          score.textContent=checked?'Conseils affichés pour '+checked+' texte(s). Consulte les indications sous chaque champ.':'';
          return;
        }
        const good=rows.filter(row=>state.checked[row.item.id]?.value===JSON.stringify(row.read())&&state.checked[row.item.id].correct).length;
        score.textContent=good+' / '+items.length+' réponse(s) reconnue(s).';
      }
      items.forEach((item,index)=>{
        const id=exercise.id+'-'+item.id,fieldId=id+'-answer',prompt=(index+1)+'. '+item.prompt;
        const row=node('div',undefined,'question'),feedback=node('div','','feedback');feedback.id=id+'-feedback';feedback.lang='fr';
        let read,fields=[];const stored=state.values[item.id];
        if(exercise.type==='chronology') {
          const group=node('fieldset');group.append(node('legend',prompt));
          const orderLabel=node('label','Order');orderLabel.htmlFor=fieldId+'-order';const order=node('select');order.id=orderLabel.htmlFor;
          const connectorLabel=node('label','Connector');connectorLabel.htmlFor=fieldId+'-connector';const connector=node('select');connector.id=connectorLabel.htmlFor;
          addOptions(order,items.map((_,i)=>[String(i+1),String(i+1)]));addOptions(connector,[['first','First / To begin with'],['middle','Then / Next / After that'],['final','Finally / To finish']]);
          if(stored&&typeof stored==='object'){order.value=String(stored.order||'');connector.value=String(stored.connector||'');}
          group.append(orderLabel,order,connectorLabel,connector);row.append(group);fields=[order,connector];read=()=>({order:order.value,connector:connector.value});
        } else if(exercise.type==='choice'&&exercise.presentation==='radio') {
          const group=node('fieldset');group.append(node('legend',prompt));
          item.choices.forEach((choice,i)=>{const input=node('input');input.type='radio';input.name=fieldId;input.id=fieldId+'-'+i;input.value=choice;input.checked=stored===choice;const label=node('label',undefined,'radio-choice');label.htmlFor=input.id;label.append(input,document.createTextNode(choice));group.append(label);fields.push(input);});
          row.append(group);read=()=>fields.find(input=>input.checked)?.value||'';
        } else {
          const label=node('label',prompt);label.htmlFor=fieldId;
          const field=node(['writing','free'].includes(exercise.type)?'textarea':['choice','matching'].includes(exercise.type)?'select':'input');field.id=fieldId;
          if(field.tagName==='INPUT'){field.type='text';field.autocomplete='off';}
          if(field.tagName==='SELECT'){const choices=exercise.type==='matching'?items.map(value=>value.answers[0]):item.choices;addOptions(field,shuffle([...new Set(choices)]).map(choice=>[choice,choice]));}
          field.value=typeof stored==='string'?stored:'';row.append(label,field);fields=[field];read=()=>field.value;
        }
        fields.forEach(field=>{
          field.setAttribute('aria-describedby',feedback.id);
          const changed=()=>{state.values[item.id]=read();delete state.checked[item.id];feedback.replaceChildren();feedback.className='feedback';fields.forEach(input=>input.removeAttribute('aria-invalid'));save();updateScore();};
          field.addEventListener('input',changed);field.addEventListener('change',changed);
        });
        row.append(feedback);section.append(row);rows.push({item,read,feedback,fields});
      });
      function checkRow(row,increment) {
        const {item,read,feedback,fields}=row,value=read();
        if(exercise.type==='free')return;
        feedback.replaceChildren();
        if(exercise.type==='writing') {
          feedback.textContent=writingAdvice(value,exercise.mode,item).join(' ');feedback.className='feedback guidance';
          if(item.model)feedback.append(node('p','Exemple à comparer : '+item.model,'model'));
          state.checked[item.id]={value:JSON.stringify(value)};return;
        }
        const empty=exercise.type==='chronology'?(!value.order||!value.connector):!String(value).trim();
        const correct=exercise.type==='chronology'?Number(value.order)===item.order&&value.connector===(item.order===1?'first':item.order===items.length?'final':'middle'):matchAnswer(value,item.answers,exercise.mode);
        fields.forEach(field=>field.setAttribute('aria-invalid',String(!correct&&!empty)));
        if(correct){feedback.textContent='✓ Réponse reconnue.';feedback.className='feedback ok';}
        else if(empty){feedback.textContent='Complète la réponse avant de vérifier.';feedback.className='feedback guidance';}
        else {
          if(increment)state.attempts[item.id]=(Number(state.attempts[item.id])||0)+1;
          feedback.textContent=exercise.type==='chronology'?'Vérifie l’ordre et le connecteur choisi.':['choice','matching'].includes(exercise.type)?'Relis la phrase et vérifie ton choix.':diagnose(value,item.answers[0],exercise.mode);feedback.className='feedback guidance';
          if(state.attempts[item.id]>=3)feedback.append(button('Show a possible answer',()=>{
            const answer=exercise.type==='chronology'?'Order: '+item.order+' — '+(item.order===1?'First':item.order===items.length?'Finally':'Then / Next / After that'):item.answers[0];
            const model=node('p','Réponse possible : '+answer,'model');model.tabIndex=-1;
            feedback.replaceChildren(model);model.focus();
          },'secondary reveal'));
        }
        state.checked[item.id]={value:JSON.stringify(value),correct};
      }
      const actions=node('div',undefined,'actions');
      if(exercise.type!=='free')actions.append(button(exercise.type==='writing'?'Check my text':'Check answers',()=>{rows.forEach(row=>checkRow(row,true));save();updateScore();}));
      actions.append(button('Try again',()=>{const replacement=render(exercise,true,challenge);section.replaceWith(replacement);replacement.querySelector('h2, h3').focus();},'secondary'));
      section.append(actions,score);
      rows.forEach(row=>{if(state.checked[row.item.id]?.value===JSON.stringify(row.read()))checkRow(row,false);});updateScore();
      if(exercise.challenge)section.append(render(exercise.challenge,false,true));
      return section;
    }
    // Keep other exercises visible if one bank or saved answer cannot be rendered.
    host.replaceChildren();
    lesson.exercises.forEach(exercise=>{
      try{host.append(render(exercise));}
      catch(error){
        console.error('Exercise rendering failed:',lesson.id,exercise.id,error);
        const panel=node('section',undefined,'exercise exercise-error');panel.id=exercise.id;
        panel.append(node('h2',exercise.title),node('p','Cet exercice n’a pas pu se charger. Les autres exercices de la leçon restent disponibles.','notice'));
        panel.append(button('Réessayer cet exercice',()=>{try{panel.replaceWith(render(exercise,true));}catch(retryError){console.error(retryError);}},'secondary'));
        host.append(panel);
      }
    });
  }
  return {normalize,canonical,matchAnswer,shuffle,uniqueItems,createProgress,diagnose,writingAdvice,mount};
});
