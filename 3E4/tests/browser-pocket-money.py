"""Browser regression: navigation, retry/reset, models, correction and mobile."""
import http.server,threading,json,shutil,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
bank=json.loads((ROOT/'3E4/unit2/lessonA/questions.json').read_text())
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base='http://127.0.0.1:'+str(server.server_port)
with sync_playwright() as p:
    options={'headless':True,'args':['--no-sandbox','--disable-crashpad-for-testing']}
    executable=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or (None if os.environ.get('CI') else shutil.which('chromium'))
    if executable:options['executable_path']=executable
    browser=p.chromium.launch(**options)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(base+'/3E4/')
    page.locator('a.unit-card[href="unit2/"]').click()
    page.locator('a.lesson-card').click()
    page.wait_for_selector('#ex1 input')
    assert page.locator('.exercise').count()==2
    for index,ex in enumerate(bank):
        orders=set();seen=set()
        for attempt in range(10):
            section=page.locator('#'+ex['id']);fields=section.locator('input')
            assert fields.count()==10
            ids=fields.evaluate_all('(nodes)=>nodes.map(n=>n.id)')
            assert len(set(ids))==10
            orders.add(tuple(ids));seen.update(ids)
            assert all(v=='' for v in fields.evaluate_all('(nodes)=>nodes.map(n=>n.value)'))
            assert all(t=='' for t in section.locator('.feedback').all_text_contents())
            for field_id in ids:
                qid=field_id.split('-')[1];item=next(q for q in ex['items'] if q['id']==qid)
                page.locator('#'+field_id).fill(item['answers'][0])
            section.get_by_role('button',name='Check answers',exact=True).click()
            assert section.locator('.score').inner_text().startswith('10 / 10')
            if index==1:
                section.get_by_role('button',name='Voir une proposition de traduction').first.click()
                assert section.locator('.model').first.inner_text()
            section.get_by_role('button',name='Try again',exact=True).click()
            assert all(t=='' for t in page.locator('#'+ex['id']+' .model').all_text_contents())
        assert len(orders)==10
        assert any(int(id.split('-')[1][1:])>=9 for id in seen)
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    shots=Path(os.environ.get('SITE_SCREENSHOTS','/tmp/english-practice-review'));shots.mkdir(parents=True,exist_ok=True)
    page.screenshot(path=str(shots/'pocket-money-mobile.png'),full_page=True)
    page.set_viewport_size({'width':1440,'height':1000})
    page.screenshot(path=str(shots/'pocket-money-desktop.png'),full_page=True)
    assert not errors,errors
    browser.close()
server.shutdown()
print('PASS: class → unit → lesson, 10 successive retries per exercise, answer associations, reset, models, 390px mobile; no JS errors.')
