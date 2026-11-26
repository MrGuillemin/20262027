"""Real Chromium interactions for the four new Footy / First Job lessons."""
import http.server,json,os,shutil,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'assets/lessons.json').read_text())
entries=[e for e in manifest if e.get('engine') in ['FootyPractice','FirstJobPractice']]
def config(entry):
    text=(ROOT/entry['path']/entry['script']).read_text()
    return json.loads(text.split('window.'+entry['engine']+'.mount(',1)[1].rsplit(');',1)[0])
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
origin='http://127.0.0.1:'+str(server.server_port)+'/'
shots=Path(os.environ.get('SITE_SCREENSHOTS','/tmp/english-practice-review'));shots.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    options={'headless':True,'args':['--no-sandbox','--disable-crashpad-for-testing']}
    executable=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or (None if os.environ.get('CI') else shutil.which('chromium'))
    if executable:options['executable_path']=executable
    browser=p.chromium.launch(**options)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    def item_for(row,exercise):
        if exercise['mode']=='ed':return next(q for q in exercise['items'] if row.locator('legend').inner_text().endswith('. '+q['prompt']))
        qid=row.locator('input').first.get_attribute('id').split('-')[1]
        return next(q for q in exercise['items'] if q['id']==qid)
    def answer(row,exercise,item):
        if exercise['mode']=='ed':row.get_by_role('button',name=item['answers'][0],exact=True).click()
        else:
            for i in range(exercise.get('fields',1)):
                value=item['answers'][i if exercise.get('fields')==2 else 0]
                value=value.replace('dad','father').replace('mum','mother').replace('learned','learnt').replace('organised','organized').replace('neighbours','neighbors')
                row.locator('input').nth(i).fill(value)
    def check(section):section.locator(':scope > .actions').get_by_role('button',name='Check answers',exact=True).click()
    for entry in entries:
        page.goto(origin,wait_until='networkidle')
        page.locator('.class-card[href="'+entry['className']+'/"]').click()
        page.locator('.unit-card[href="'+entry['unit']+'/"]').click()
        page.locator('.lesson-card[href="'+entry['path'].split('/')[-1]+'/"]').click()
        page.wait_for_selector('.exercise:not(.fallback-exercise)')
        assert page.locator('.exercise').count()==3
        for exercise in config(entry)['exercises']:
            orders=set();seen=set()
            for attempt in range(10):
                section=page.locator('#'+exercise['id']);rows=section.locator('.question');assert rows.count()==10
                items=[item_for(rows.nth(i),exercise) for i in range(10)]
                ids=[q['id'] for q in items];assert len(set(ids))==10;orders.add(tuple(ids));seen.update(ids)
                assert all(v=='' for v in section.locator('input').evaluate_all('(nodes)=>nodes.map(n=>n.value)'))
                assert all(t=='' for t in section.locator('.feedback').all_text_contents())
                assert section.locator('.score').inner_text().startswith('0 / 10')
                assert section.get_by_role('button',name='Show answer',exact=True).count()==0
                for i in range(10 if attempt==0 else 1):answer(rows.nth(i),exercise,items[i])
                check(section);assert section.locator('.score').inner_text().startswith(('10' if attempt==0 else '1')+' / 10')
                if attempt==0:
                    row=rows.first;item=items[0];mode=exercise['mode']
                    if entry['engine']=='FootyPractice':
                        if mode=='feelings':
                            row.locator('input').nth(1).fill(item['answers'][0])
                        elif mode=='habits':
                            value=item['answers'][0]
                            for right,wrong in [('goes','go'),('wears','wear'),('watches','watch'),('plays','play')]:value=value.replace(' '+right+' ',' '+wrong+' ')
                            row.locator('input').fill(value)
                        else:
                            value=item['answers'][0].replace(' wins',' win').replace(' loses',' lose').replace(' scores',' score')
                            row.locator('input').fill(value)
                        check(section);assert 'Indice' in row.locator('.feedback').inner_text()
                        assert row.get_by_role('button',name='Show answer',exact=True).count()==0
                        check(section);assert row.get_by_role('button',name='Show answer',exact=True).count()==0
                        check(section);row.get_by_role('button',name='Show answer',exact=True).click();assert item['answers'][0] in row.locator('.model').inner_text()
                        if mode=='feelings':assert section.locator('.score').inner_text().startswith('9,5 / 10')
                        answer(row,exercise,item);check(section);assert section.locator('.score').inner_text().startswith('10 / 10')
                    elif mode=='ed':
                        wrong=next(c for c in item['choices'] if c!=item['answers'][0]);row.get_by_role('button',name=wrong,exact=True).click()
                        assert item['answers'][0] in row.locator('.feedback').inner_text();assert item['explanation'] in row.locator('.feedback').inner_text();assert section.locator('.score').inner_text().startswith('9 / 10')
                        answer(row,exercise,item);assert section.locator('.score').inner_text().startswith('10 / 10')
                    else:
                        if mode=='pastNotes':
                            action_to_change=next(a for a in item['actions'] if a['past']!=a['base'])
                            wrong=item['answers'][0].replace(action_to_change['past'],action_to_change['base'],1)
                        else:wrong="Before, Jake didn't helped his parents at home."
                        row.locator('input').fill(wrong);row.get_by_role('button',name='Check answer',exact=True).click()
                        if mode=='pastNotes':assert '2 / 3' in row.locator('.feedback').inner_text()
                        else:assert 'base verbale' in row.locator('.feedback').inner_text()
                        row.get_by_role('button',name='Show a possible answer',exact=True).click();assert item['answers'][0] in row.locator('.model').inner_text()
                        answer(row,exercise,item);row.get_by_role('button',name='Check answer',exact=True).click();assert section.locator('.score').inner_text().startswith('10 / 10')
                        row.locator('input').fill('A different formulation for comparison.');row.get_by_role('button',name='Check answer',exact=True).click()
                        assert '1 réponse(s) à comparer' in section.locator('.score').inner_text();assert item['answers'][0] in row.locator('.model').inner_text()
                section.get_by_role('button',name='Try again',exact=True).click()
                assert all(t=='' for t in page.locator('#'+exercise['id']+' .model').all_text_contents())
            assert len(orders)==10 and any(int(q[1:])>=21 for q in seen)
            print(entry['path']+' '+exercise['mode']+': PASS 10 attempts, check, hints/models, score and reset',flush=True)
        assert not errors,errors
        page.screenshot(path=str(shots/(entry['className']+'-'+entry['title'].replace(' ','-')+'-desktop.png')),full_page=True)
    for width in [768,390]:
        page.set_viewport_size({'width':width,'height':844})
        for entry in entries:
            page.goto(origin+entry['path']+'/',wait_until='networkidle')
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),entry['path']+' overflows'
            assert 'undefined' not in page.locator('body').inner_text()
            for exercise in config(entry)['exercises']:
                section=page.locator('#'+exercise['id']);row=section.locator('.question').first;answer(row,exercise,item_for(row,exercise));check(section);assert section.locator('.score').inner_text().startswith('1 / 10')
            page.screenshot(path=str(shots/(entry['className']+'-'+entry['title'].replace(' ','-')+'-'+str(width)+'.png')),full_page=True)
    assert not errors,errors
    browser.close()
server.shutdown()
print('PASS new lessons: four lessons, 12 exercises, 10 retries each, native checks, progressive hints, models, half points, ED feedback, per-verb count, desktop/tablet/mobile.',flush=True)
