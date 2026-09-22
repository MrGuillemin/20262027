/* Common utilities for English Practice. Class folders remain independent. */
window.EnglishPractice = {
  normalize(value){return String(value ?? '').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');},
  checkText(input, answers, feedback){
    const accepted = (Array.isArray(answers)?answers:[answers]).map(this.normalize);
    const ok = accepted.includes(this.normalize(input.value));
    this.showFeedback(feedback, ok, ok ? 'Correct! ✓' : 'Try again.');
    return ok;
  },
  checkChoice(select, answer, feedback){
    const ok = this.normalize(select.value) === this.normalize(answer);
    this.showFeedback(feedback, ok, ok ? 'Correct! ✓' : 'Try again.');
    return ok;
  },
  showFeedback(el, ok, text){if(!el)return;el.textContent=text;el.className='feedback '+(ok?'ok':'bad');},
  reset(container=document){container.querySelectorAll('input').forEach(i=>i.value='');container.querySelectorAll('select').forEach(s=>s.selectedIndex=0);container.querySelectorAll('.feedback').forEach(f=>{f.textContent='';f.className='feedback';});}
};
