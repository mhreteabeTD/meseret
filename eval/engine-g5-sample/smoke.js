// Smoke test for the Amharic lesson engine (Engine A). See README.md in this folder.
const S = process.env.OUT || '.', URL = process.env.SITE_URL || 'http://localhost:8765/'; const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true, args: ['--headless=new'] });
  const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 }); const pg = await ctx.newPage(); const errs=[];
  pg.on('pageerror', e => errs.push('PAGEERR '+e.message)); pg.on('console', m => { if (m.type()==='error' && !/ERR_TUNNEL|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(() => { localStorage.setItem('meseret:lang', JSON.stringify('en')); localStorage.setItem('meseret:grades', JSON.stringify([5])); });
  await pg.goto(URL + '#book/g5-maths-u99'); await pg.waitForSelector('.book .sec'); await pg.waitForTimeout(600);
  // the inline L-shaped cubes block
  const lc = pg.locator('.quiz[data-kind="cubes"]').first(); await lc.scrollIntoViewIfNeeded(); while (await lc.locator('#gnx').isEnabled()) await lc.locator('#gnx').click(); await lc.screenshot({ path: S+'/c_layers.png' }); console.log('L-shape count:', await lc.locator('.cnt').textContent());
  await pg.locator('.pcard[data-a="prac"]').click(); await pg.waitForTimeout(600);
  await pg.screenshot({ path: S+'/c_prac1.png' });
  // shape: mark cells like a student would (whole = 1 tap, half = 2 taps)
  const cells = await pg.evaluate(() => { const poly=[[2,0],[0,2],[2,4],[4,2]], C=4; const ins=(x,y)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){if(((poly[i][1]>y)!==(poly[j][1]>y))&&(x<(poly[j][0]-poly[i][0])*(y-poly[i][1])/(poly[j][1]-poly[i][1])+poly[i][0]))c=!c;}return c;}; const out=[]; for(let r=0;r<4;r++)for(let c=0;c<C;c++){let n=0;for(let a=0;a<10;a++)for(let q=0;q<10;q++)if(ins(c+(a+.5)/10,r+(q+.5)/10))n++;out.push(n/100);} return out; });
  console.log('cell fractions:', cells.map(x=>x.toFixed(2)).join(' '));
  const rects = pg.locator('rect[data-i]');
  for (let i=0;i<16;i++){ const f=cells[i]; const taps = f>.95?1: Math.abs(f-.5)<.06?2:0; for(let k=0;k<taps;k++) await rects.nth(i).click(); }
  console.log('shape counter:', await pg.locator('.shp .cnt').textContent()); await pg.screenshot({ path: S+'/c_shape.png' });
  await pg.locator('#go').click(); await pg.waitForTimeout(700); await pg.screenshot({ path: S+'/c_shape_ok.png' });
  console.log('tray after shape:', (await pg.locator('#msg').textContent()).trim().slice(0,80));
  await pg.locator('#go').click(); await pg.waitForTimeout(500);
  // cubes graded
  for (let i=0;i<3;i++) await pg.locator('#gnx').click(); await pg.screenshot({ path: S+'/c_cubes_mid.png' });
  while (await pg.locator('#gnx').isEnabled()) await pg.locator('#gnx').click(); await pg.waitForTimeout(100);
  await pg.locator('.cin').fill('6O'); console.log('ready with junk?', await pg.locator('#go').isDisabled());
  await pg.locator('.cin').fill('60'); await pg.locator('#go').click(); await pg.waitForTimeout(700); await pg.screenshot({ path: S+'/c_cubes_ok.png' });
  console.log('tray after cubes:', (await pg.locator('#msg').textContent()).trim().slice(0,80));
  console.log('overflow:', await pg.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'errors:', errs); await b.close(); })();
