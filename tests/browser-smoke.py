"""Real Chromium checks on the same static files GitHub Pages will serve.

Requests are fulfilled from the checkout to avoid external network dependencies.
The HTML, deferred scripts, CSS, origin and localStorage are exercised normally.
"""
import json
import mimetypes
import os
import re
import shutil
from pathlib import Path
from urllib.parse import urlsplit, unquote
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
ORIGIN='https://english-practice.test/20262027/'
manifest=json.loads((ROOT/'assets/lessons.json').read_text())
screenshots=Path(os.environ.get('SITE_SCREENSHOTS','/tmp/english-practice-review'))
screenshots.mkdir(parents=True,exist_ok=True)

def config(entry):
    source=(ROOT/entry['path']/entry['script']).read_text()
    return json.loads(source.split('window.EnglishPractice.mount(',1)[1].rsplit(');',1)[0])

def route_files(route):
    url=urlsplit(route.request.url)
    relative=unquote(url.path).removeprefix('/20262027/')
    if relative.endswith('/') or not relative:relative+='index.html'
    target=(ROOT/relative).resolve()
    if not target.is_relative_to(ROOT) or not target.is_file():
        route.fulfill(status=404,body='Not found');return
    # Reproduce a browser with the old, unversioned shared engine in its cache.
    if relative=='assets/js/app.js' and not url.query:
        route.fulfill(content_type='application/javascript',body='window.EnglishPractice={};');return
    route.fulfill(status=200,content_type=mimetypes.guess_type(str(target))[0] or 'application/octet-stream',body=target.read_bytes())

with sync_playwright() as p:
    executable=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium')
    options={'headless':True,'args':['--no-sandbox','--disable-crashpad-for-testing']}
    if executable:options['executable_path']=executable
    browser=p.chromium.launch(**options)
    context=browser.new_context(viewport={'width':1440,'height':1000})
    context.route('**/*',route_files)
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    if os.environ.get('SITE_RENDER_ONLY')=='1':
        # Restricted hosts may allow Chromium rendering but block all navigations.
        # This mode checks the real DOM and layout; CI uses full navigation below.
        css=(ROOT/'assets/css/style.css').read_text()
        app=(ROOT/'assets/js/app.js').read_text()
        def display(relative,entry=None):
            html=(ROOT/relative).read_text()
            html=re.sub(r'<script\b[^>]*>[\s\S]*?</script>','',html)
            html=re.sub(r'<link\b[^>]*>','',html)
            page.set_content(html,wait_until='domcontentloaded')
            page.add_style_tag(content=css)
            if entry:
                page.evaluate(app)
                page.evaluate((ROOT/entry['path']/entry['script']).read_text())
        for width in [1440,390]:
            page.set_viewport_size({'width':width,'height':1000 if width==1440 else 844})
            total=0
            for entry in manifest:
                display(entry['path']+'/index.html',entry)
                count=page.locator('.exercise').count()
                assert count==len(config(entry)['exercises']),(entry['path'],count,errors)
                assert page.locator('.exercise-error').count()==0
                assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),entry['path']+' overflows'
                total+=count
            assert total==50
            display('index.html')
            assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
            suffix='desktop' if width==1440 else 'mobile'
            page.screenshot(path=str(screenshots/('home-'+suffix+'.png')),full_page=True)
            entry=next(entry for entry in manifest if entry['path']=='4E2/unit1/lesson-a')
            display(entry['path']+'/index.html',entry)
            page.screenshot(path=str(screenshots/('lesson-'+suffix+'.png')),full_page=True)
        for entry in manifest:
            display(entry['path']+'/index.html')
            assert page.locator('.fallback-exercise').count()==len(config(entry)['exercises'])
        assert not errors,errors
        browser.close()
        print('PASS render-only: 50 exercises at desktop and mobile widths; 13 readable fallbacks. Navigation not tested in this mode.')
        raise SystemExit(0)
    total=0
    for entry in manifest:
        lesson=config(entry)
        page.goto(ORIGIN+entry['path']+'/',wait_until='networkidle')
        expected=len(lesson['exercises'])
        assert page.locator('.exercise').count()==expected,(entry['path'],errors)
        assert page.locator('.fallback-exercise').count()==0,entry['path']+' did not initialize'
        assert page.locator('.exercise-error').count()==0,entry['path']+' failed to render'
        assert not errors,(entry['path'],errors)
        assert page.locator('.question input, .question select, .question textarea').count()>0
        total+=expected
        print(entry['path']+': '+str(expected)+' exercises visible',flush=True)
    assert total==50,total

    # Go through each class and unit instead of only opening deep links.
    for code in ['5E4','4E2','4E3','3E2','3E4']:
        page.goto(ORIGIN,wait_until='networkidle')
        page.locator('.class-card[href="'+code+'/"]').click()
        page.locator('.unit-card').click()
        page.locator('.lesson-card').first.click()
        page.wait_for_selector('.exercise:not(.fallback-exercise)')
        assert page.locator('.exercise-error').count()==0,code

    # Save, revisit and restart one exercise in each class.
    for code in ['5E4','4E2','4E3','3E2','3E4']:
        entry=next(entry for entry in manifest if entry['className']==code)
        url=ORIGIN+entry['path']+'/'
        page.goto(url,wait_until='networkidle')
        field=page.locator('#ex1 .question input, #ex1 .question select').first
        field_id=field.get_attribute('id')
        if field.evaluate('(node)=>node.tagName')=='SELECT':
            value=field.locator('option').nth(1).get_attribute('value');field.select_option(value)
        else:value='My saved answer';field.fill(value)
        page.goto(ORIGIN,wait_until='networkidle');page.goto(url,wait_until='networkidle')
        assert page.locator('#'+field_id).input_value()==value,code+' lost a saved answer'
        other=page.locator('#ex2 .question input, #ex2 .question select').first
        if other.evaluate('(node)=>node.tagName')=='SELECT':
            other_value=other.locator('option').nth(1).get_attribute('value');other.select_option(other_value)
        else:other_value='Keep this answer';other.fill(other_value)
        other_id=other.get_attribute('id')
        page.locator('#ex1 > .actions').get_by_role('button',name='Try again',exact=True).click()
        assert page.locator('#'+other_id).input_value()==other_value,code+' reset another exercise'

    # Small viewports: no horizontal page overflow, and controls stay available.
    page.set_viewport_size({'width':390,'height':844})
    for entry in manifest:
        page.goto(ORIGIN+entry['path']+'/',wait_until='networkidle')
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+1'),entry['path']+' overflows on mobile'
        assert page.locator('.exercise').count()==len(config(entry)['exercises'])
    page.goto(ORIGIN,wait_until='networkidle')
    page.screenshot(path=str(screenshots/'home-mobile.png'),full_page=True)
    page.goto(ORIGIN+'4E2/unit1/lesson-a/',wait_until='networkidle')
    page.screenshot(path=str(screenshots/'lesson-mobile.png'),full_page=True)
    page.set_viewport_size({'width':1440,'height':1000})
    page.goto(ORIGIN,wait_until='networkidle')
    page.screenshot(path=str(screenshots/'home-desktop.png'),full_page=True)
    page.goto(ORIGIN+'4E2/unit1/lesson-a/',wait_until='networkidle')
    page.screenshot(path=str(screenshots/'lesson-desktop.png'),full_page=True)

    # With scripts disabled the fifty exercise sections and prompts remain readable.
    reading=browser.new_context(java_script_enabled=False)
    reading.route('**/*',route_files)
    reader=reading.new_page()
    for entry in manifest:
        reader.goto(ORIGIN+entry['path']+'/',wait_until='networkidle')
        assert reader.locator('.fallback-exercise').count()==len(config(entry)['exercises'])
        assert reader.locator('.reading-questions li').count()>0
    assert not errors,errors
    browser.close()
print('PASS: 13 lessons, 50 exercises, five navigation journeys, saved responses, scoped retries, mobile and script-free reading.',flush=True)
