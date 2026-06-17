// 미리보기 스크린샷 생성 스크립트
// 사용법: node scripts/preview.js  → preview/ 폴더에 PNG 생성
// 필요: playwright(npm) + chromium 바이너리(시스템 또는 ~/.cache/ms-playwright)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'preview');
const URL = 'file://' + path.join(ROOT, 'index.html');
const wait = ms => new Promise(r => setTimeout(r, ms));

// chromium 실행 파일 자동 탐색 (환경별 경로 대응)
function findChrome() {
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  const roots = ['/opt/pw-browsers', path.join(process.env.HOME || '', '.cache/ms-playwright')];
  for (const r of roots) {
    if (!fs.existsSync(r)) continue;
    const stack = [r];
    while (stack.length) {
      const d = stack.pop();
      let ents = [];
      try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { continue; }
      for (const e of ents) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) stack.push(p);
        else if (e.name === 'chrome' || e.name === 'headless_shell') return p;
      }
    }
  }
  return undefined; // playwright 기본값 사용
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: findChrome() });
  const pg = await browser.newPage({ viewport: { width: 1040, height: 1500 }, deviceScaleFactor: 2 });
  await pg.goto(URL); await wait(400);

  const shot = n => pg.screenshot({ path: path.join(OUT, n), fullPage: true });
  const enter = async k => { await pg.click('.mode[data-mode="' + k + '"]'); await wait(300); };
  const openBackend = async () => { const rb = await pg.$('#revealBtn'); if (rb) { await rb.click(); await wait(250); } };

  await shot('01-hub.png');

  await enter('regulation');
  await openBackend(); await shot('02-reg-s1-issuer.png');
  await pg.click('#act'); await wait(300); await openBackend(); await shot('03-reg-s2-reserves.png');
  await pg.click('#act'); await wait(300); await openBackend(); await shot('04-reg-s3-protection.png');
  await pg.click('#act'); await wait(300); await shot('05-reg-s4-cbdc.png');
  await pg.click('#act'); await wait(400); await shot('06-reg-summary.png');
  const th = await pg.$('#toHub2'); if (th) { await th.click(); await wait(300); }

  await enter('personal');
  await pg.click('#act'); await wait(1400); await shot('07-personal-qr.png');

  await browser.close();
  console.log('preview/ 에 스크린샷 생성 완료');
})().catch(e => { console.error(e); process.exit(1); });
