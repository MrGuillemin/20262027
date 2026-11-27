/* Free answers reuse EnglishPractice.matchAnswer; accepted sentence variants are grammatical templates. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./app.js'),require('./lesson-practice.js'));else root.FootyPractice=factory(root.EnglishPractice,root.LessonPractice);})(typeof window==='undefined'?globalThis:window,function(common,runtime){
  'use strict';
  const norm=value=>common.normalize(value).replace(/\bfavorite\b/g,'favourite').replace(/\bfather\b/g,'dad').replace(/\bmother\b|\bmom\b/g,'mum').replace(/\btelevision\b/g,'tv').replace(/\baustralian rules football\b/g,'footy').replace(/\bthe (collingwood|sydney swans) matches\b/g,'$1 matches');
  const match=(value,answers)=>common.matchAnswer(norm(value),answers.map(norm));
  const outcome=(status,message,points=status==='valid'?1:0)=>({status,message,points});
  function permutations(values){return values.length===1?[values]:values.flatMap((value,i)=>permutations(values.filter((_,j)=>i!==j)).map(rest=>[value,...rest]));}
  function habitAnswers(item){
    const out=[...item.answers],f=item.frequency;
    for(const predicate of item.predicates){
      if(['always','usually','often','sometimes','never'].includes(f)){
        out.push(item.person+' '+f+' '+predicate);
        if(['usually','often','sometimes'].includes(f))out.push(f+' '+item.person+' '+predicate);
        if(['often','sometimes'].includes(f))out.push(item.person+' '+predicate+' '+f);
      }else out.push(item.person+' '+predicate+' '+f,f+' '+item.person+' '+predicate);
      // Full valid alternative predicates are stored in the bank; a bag of keywords never validates.
    }
    return out;
  }
  function whenAnswers(item){
    const subjects=[item.eventSubject,item.eventSubject.replace(/^(his|her) /,'the ')];
    const verbs=item.eventKind==='goal'?['scores a goal','scores the goal']:item.eventKind==='victory'?['wins','wins a match','wins the match','wins a game','wins the game']:['loses','loses a match','loses the match','loses a game','loses the game'];
    const out=[...item.answers];
    for(const actions of permutations(item.actions)){
      const reactions=[item.person+' '+actions.join(' and ')];
      if(actions.length===2)reactions.push(item.person+' '+actions[0]+' and '+item.pronoun+' '+actions[1]);
      for(const subject of subjects)for(const verb of verbs)for(const reaction of reactions){const event=subject+' '+verb;out.push('when '+event+' '+reaction,reaction+' when '+event);}
    }
    return out;
  }
  function grammar(value,item,mode){
    const text=norm(value);
    if(mode==='habits'){
      if(!text.includes(norm(item.frequency)))return 'N’oublie pas l’expression de fréquence demandée : '+item.frequency+'.';
      if(new RegExp('\\b'+item.person.toLowerCase()+' (?:'+item.frequency+' )?(?:go|watch|wear|play)\\b').test(text))return 'Attention au -S de la troisième personne : goes, watches, wears, plays.';
      if(/\bin tv\b|\bat tv\b/.test(text))return 'On dit ON TV.';
      if(/\bgoes (?:at|in) (?:the )?stadium\b/.test(text))return 'On dit GO TO THE STADIUM : goes to the stadium.';
      if(/\b(?:goes|watches|wears|plays) (?:always|usually|never)\b/.test(text))return 'L’adverbe de fréquence se place généralement avant le verbe principal.';
    }else{
      if(!/\bwhen\b/.test(text))return 'N’oublie pas WHEN pour relier les deux propositions.';
      if(/\b(?:score|win|lose|sing|dance|jump|clap|shout|smile|cheer|celebrate|hug|wave|feel)\b/.test(text))return 'Vérifie chaque verbe : SCORE → SCORES, WIN → WINS, LOSE → LOSES. Conjugue aussi le deuxième verbe.';
      if(item.actions.length>1&&!/\band\b/.test(text))return 'Utilise AND pour relier les deux actions.';
      if(/\bwhen (?:wins|loses|scores)\b/.test(text))return 'Il manque un sujet dans la proposition avec WHEN.';
      if(item.possessive==='her'&&/\bhis\b/.test(text)||item.possessive==='his'&&/\bher\b/.test(text))return 'Vérifie les adjectifs possessifs : his ou her doit être cohérent avec le personnage.';
    }
    return null;
  }
  function feeling(value,item){
    if(!String(value).trim())return outcome('blank','Écris une reformulation.');
    const text=norm(value);
    const alternatives=item.kind==='adjective'?[...item.answers,item.subject+' really '+item.verb+' '+item.tail]:item.answers;
    if(match(value,alternatives))return outcome('valid','Reformulation correcte.');
    if(/\bvery (?:loves|enjoys)\b/.test(text))return outcome('incorrect','VERY ne s’utilise pas directement devant un verbe.');
    if(/\b(?:loves|enjoys) (?:really|absolutely)\b/.test(text))return outcome('incorrect','REALLY ou ABSOLUTELY se place avant le verbe principal.');
    if(/\bvery (?:amazing|fantastic)\b/.test(text))return outcome('incorrect','AMAZING et FANTASTIC sont déjà forts : utilise par exemple ABSOLUTELY.');
    if(/\bexcitingly\b/.test(text))return outcome('incorrect','Après IS, utilise l’adjectif EXCITING, pas EXCITINGLY.');
    if(text===norm(item.prompt))return outcome('incorrect','Utilise un intensificateur pour renforcer le sentiment.');
    return outcome('compare','Cette formulation n’a pas été reconnue avec certitude. Conserve le sujet, le sens et les éléments de la phrase originale.');
  }
  function grade(value,item,mode){
    if(mode==='feelings'){
      const [first='',second='']=Array.isArray(value)?value:[value,''];
      const a=feeling(first,item),b=feeling(second,item),same=Boolean(norm(first))&&norm(first)===norm(second);
      const points=(a.points+b.points-(same&&a.points&&b.points?1:0))/2;
      const message='1. '+a.message+' 2. '+b.message+(same?' Propose une deuxième reformulation différente.':'');
      return {status:points===1?'valid':points>0?'partial':a.status==='blank'&&b.status==='blank'?'blank':a.status==='compare'||b.status==='compare'?'compare':'incorrect',points,message,needsCompare:a.status==='compare'||b.status==='compare'};
    }
    if(!String(value).trim())return outcome('blank','Écris une phrase avant de vérifier.');
    if(match(value,mode==='habits'?habitAnswers(item):whenAnswers(item)))return outcome('valid','✓ Phrase reconnue : construction et conjugaison correctes.');
    const error=grammar(value,item,mode);
    return error?outcome('incorrect',error):outcome('compare','Cette formulation n’a pas été reconnue avec certitude. Vérifie la construction, les prépositions et tous les éléments demandés.');
  }
  const hint=mode=>mode==='habits'?'Reprends le sujet, l’expression de fréquence et les éléments des notes.':mode==='when'?'Construis deux propositions complètes au présent simple, reliées par WHEN.':'Conserve le sens et ajoute un intensificateur compatible. Écris deux reformulations différentes.';
  return {grade,habitAnswers,whenAnswers,norm,mount:(lesson,options={})=>runtime.mount(lesson,{...options,grade,hint,policy:'progressive'})};
});
