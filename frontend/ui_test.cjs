const puppeteer = require('puppeteer-core')

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const APP = 'http://localhost:5173'

function log(tag, msg) { console.log(`[${tag}] ${msg}`) }

async function widgetState(page) {
  return page.evaluate(() => {
    const w = document.querySelector('#ai-diagnosis')
    if (!w) return 'NO WIDGET'
    const txt = w.innerText.slice(0, 600)
    const modal = document.querySelector('.fixed.inset-0.z-modal')
    return JSON.stringify({ widget: txt, modalPresent: !!modal, modalText: modal ? modal.innerText.slice(0, 300) : '' })
  })
}

;(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  page.on('requestfailed', (r) => errors.push('REQFAIL: ' + r.url() + ' :: ' + (r.failure()?.errorText || '')))
  page.on('response', (r) => { if (r.url().includes('/diagnose')) log('NET', r.status() + ' ' + r.url().slice(-60)) })

  await page.goto(APP, { waitUntil: 'networkidle0', timeout: 30000 })
  await page.waitForSelector('#ai-diagnosis', { timeout: 15000 })
  log('PAGE', 'loaded, diagnosis section found')

  await page.setViewport({ width: 1280, height: 900 })
  const input = await page.$('#ai-diagnosis input[type=file]')
  if (!input) throw new Error('file input not found')
  await input.uploadFile('C:/python/mptechsolution/backend/ui_test_pipe.jpg')
  log('UPLOAD', 'file attached')
  await page.waitForFunction(() => document.body.innerText.includes('Analyzing visual features'), { timeout: 5000 })
  log('STATE', 'analyzing…')

  try {
    await page.waitForSelector('.fixed.inset-0.z-modal', { timeout: 45000 })
    log('MODAL', 'questions modal appeared')
    const qs = await page.evaluate(() => {
      const m = document.querySelector('.fixed.inset-0.z-modal')
      return Array.from(m.querySelectorAll('p.font-semibold')).map((p) => p.innerText)
    })
    log('QUESTIONS', JSON.stringify(qs, null, 1))

    const btns = await page.$$('.fixed.inset-0.z-modal button[type=button]')
    for (let i = 1; i <= qs.length && i < btns.length; i++) { await btns[i].click() }
    log('ANSWERS', 'selected first option per question')

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('.fixed.inset-0.z-modal button'))
        .find((b) => b.innerText.includes('Submit Answers'))
      btn.click()
    })
    log('STATE', 'submitted…')

    await page.waitForFunction(() => {
      return document.body.innerText.includes('DIY-Safe Repair') ||
             document.body.innerText.includes('Call a Pro') ||
             document.body.innerText.includes('Itemized Cost Estimate')
    }, { timeout: 45000 })
    log('RESULTS', 'results rendered')
    log('STATE', await widgetState(page))
    await page.screenshot({ path: 'ui_diagnosis_result.png', fullPage: false })
    log('SHOT', 'saved ui_diagnosis_result.png')
  } catch (e) {
    log('FAIL_TIMEOUT', 'waited too long')
    log('STATE', await widgetState(page))
    log('JS_ERRORS', errors.length ? errors.join('\n---\n') : 'none')
    await page.screenshot({ path: 'ui_diagnosis_fail.png', fullPage: false })
    throw e
  }

  log('JS_ERRORS', errors.length ? errors.join('\n---\n') : 'none')
  await browser.close()
})().catch((e) => { console.error('FAIL:', e.message); process.exit(1) })
