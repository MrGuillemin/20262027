/* Topic-specific extensions of the existing free-answer normalizer and matcher. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./app.js'),require('./lesson-practice.js'));else root.FirstJobPractice=factory(root.EnglishPractice,root.LessonPractice);})(typeof window==='undefined'?globalThis:window,function(common,runtime){
  'use strict';
  function norm(value){return common.normalize(value)
    .replace(/\blearnt\b/g,'learned').replace(/\brealized\b/g,'realised').replace(/\borganized\b/g,'organised').replace(/\borganizing\b/g,'organising')
    .replace(/\bneighbors\b/g,'neighbours').replace(/\btelevision\b/g,'tv').replace(/\bstore\b/g,'shop')
    .replace(/\bpreviously\b/g,'before').replace(/\bvacations?\b/g,'holidays')
    .replace(/\btaking care of\b/g,'looking after').replace(/\btake care of\b/g,'look after').replace(/\bbabysitting\b/g,'looking after children')
    .replace(/\bspeak to\b/g,'talk to').replace(/\bspeaking to\b/g,'talking to').replace(/\bspoke to\b/g,'talked to')
    .replace(/\bother people\b/g,'others').replace(/\bmake (?:any )?money\b/g,'earn money').replace(/\bearn any money\b/g,'earn money')
    .replace(/\b(discovered|learned|realised) that\b/g,'$1')
    .replace(/\bliked to (help|work|look after|organise|organize|take care of)\b/g,(_,verb)=>'liked '+({help:'helping',work:'working','look after':'looking after',organise:'organising',organize:'organising','take care of':'looking after'}[verb]));}
  const match=(value,answers)=>common.matchAnswer(norm(value),answers.map(norm));
  const result=(status,message,points=status==='valid'?1:0)=>({status,message,points});
  function permutations(values){return values.length===1?[values]:values.flatMap((value,i)=>permutations(values.filter((_,j)=>j!==i)).map(rest=>[value,...rest]));}
  function noteAnswers(item){
    const out=[...item.answers];
    for(const actions of permutations(item.actions.map(a=>a.pastPhrase))){
      out.push(item.person+' '+actions[0]+', '+actions[1]+' and '+actions[2],item.person+' '+actions.join(' and '),item.person+' '+actions.join(' and '+item.pronoun+' '));
    }
    return out;
  }
  function notes(value,item){
    const text=norm(value),count=item.actions.filter(action=>new RegExp('\\b'+norm(action.past)+'\\b').test(text)).length;
    if(match(value,noteAnswers(item)))return {...result('valid','Excellent ! Les trois actions sont correctement construites au prétérit.'),correctVerbs:3};
    let message=null;
    for(const action of item.actions){
      if(action.base==='carry'&&/\bcarryed\b/.test(text))message='Attention : CARRY se termine par une consonne suivie de Y : Y devient I, CARRIED.';
      const irregular=['take','give','feed','lead','become','ride','sell','wake','meet','teach','make','read','do','find','feel','bring'].includes(action.base);
      const wrong=action.base+'ed',wrongForms=action.base.endsWith('e')?[wrong,action.base+'d']:[wrong];
      if(!irregular&&action.base.endsWith('e')&&new RegExp('\\b'+wrong+'\\b').test(text))message='Ce verbe se termine déjà par E : ajoute seulement D, '+action.past.toUpperCase()+'.';
      if(irregular&&wrongForms.some(form=>new RegExp('\\b'+form+'\\b').test(text)))message='Attention : '+action.base.toUpperCase()+' est irrégulier. Son prétérit est '+action.past.toUpperCase()+'.';
      // Match a bare verb only at an action boundary, not inside a valid infinitive elsewhere.
      const boundary=new RegExp('(?:^'+item.person.toLowerCase()+' |\\band (?:'+item.pronoun+' )?|, )'+action.base+'\\b');
      if(action.base!==action.past&&boundary.test(String(value).toLowerCase()))message='Conjugue '+action.base.toUpperCase()+' au prétérit : '+action.past.toUpperCase()+'.';
    }
    if(!text.includes(item.person.toLowerCase()))message='Reprends le sujet indiqué dans les notes.';
    if(!/\band\b/.test(text)&&count>=2)message='Utilise AND pour relier les actions et construire une phrase complète.';
    return {...result(message?'incorrect':'compare',message||'Réponse à comparer : les trois actions et leurs compléments doivent former une phrase complète.'),correctVerbs:count};
  }
  function translation(value,item){
    if(match(value,item.answers))return result('valid','✓ Traduction reconnue : sens et constructions attendus sont conservés.');
    const text=norm(value);
    if(/\bdid not (?:helped|talked|worked|did|earned|prepared|got|went|learnt|learned|spoke|played|avoided)\b/.test(text))return result('incorrect','Après DIDN’T / DID NOT, utilise la base verbale : DIDN’T HELP, pas DIDN’T HELPED.');
    if(/\bavoided to\b/.test(text))return result('incorrect','Après AVOID, utilise V-ING : AVOIDED TALKING.');
    if(/\bworking(?: in a restaurant| with children)? were\b/.test(text))return result('incorrect','WORKING est ici un sujet singulier : utilise WAS.');
    if(/\b(?:she|he) were\b/.test(text))return result('incorrect','Avec SHE ou HE au prétérit, utilise WAS et non WERE.');
    if(/\bspent (?:hours|time) (?:play|watch|work)\b/.test(text))return result('incorrect','Après SPEND TIME ou SPEND HOURS, utilise V-ING : PLAYING.');
    if(/\b(?:emma|jake|sophia|ben|lucas|ava|noah|lucy|tom|sarah|jack|namiye) (?:discover|learn|realise|realize)\b/.test(text))return result('incorrect','Conjugue le verbe au prétérit : DISCOVERED, LEARNED / LEARNT, REALISED / REALIZED.');
    if(/^before (?:emma|jake|sophia|ben|lucas|ava|noah|lucy|tom|sarah|jack|namiye) (?:often )?(?:watch|watches|play|plays|avoid|avoids|spend|spends)\b/.test(text))return result('incorrect','Il s’agit d’une habitude passée : utilise WATCHED, PLAYED, AVOIDED ou SPENT.');
    return result('compare','Réponse à comparer : formulation non reconnue avec certitude. Compare le sens, le sujet et les temps avec la proposition ; l’objectif est de travailler le prétérit.');
  }
  function grade(value,item,mode){
    if(!String(value).trim())return result('blank','Complète la réponse avant de vérifier.');
    if(mode==='ed'){const correct=value===item.answers[0];return result(correct?'valid':'incorrect',(correct?'✓ Correct ! ':'Réponse attendue : '+item.answers[0]+'. ')+item.explanation);}
    return mode==='pastNotes'?notes(value,item):translation(value,item);
  }
  return {grade,norm,noteAnswers,mount:(lesson,options={})=>runtime.mount(lesson,{...options,grade,policy:'immediate'})};
});
