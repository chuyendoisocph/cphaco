// backend/ocm-server.js
// Node.js + Express + Google Sheets API
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
console.log('[OCM] ENV GOOGLE_APPLICATION_CREDENTIALS =', process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log('[OCM] ENV OCM_SHEET_ID =', process.env.OCM_SHEET_ID);

// ===== CONFIG =====
// ID này lấy từ GS gốc (trong file GAS: SHEET_ID = '19f0I1AA...')
const SHEET_ID    = '19f0I1AAdSlhvymE84SV3-VANL_xI1Fw2P28g4ywq270';
const HOLDS_SHEET = 'OCM_Holds';

// Service Account – dùng GOOGLE_APPLICATION_CREDENTIALS trỏ tới file JSON,
// hoặc tự load JSON từ biến môi trường.
// Service Account – dùng GOOGLE_APPLICATION_CREDENTIALS trỏ tới file JSON
let sheetsClientPromise = null;

async function getSheetsClient() {
  if (sheetsClientPromise) return sheetsClientPromise;

  const keyFile = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  if (!keyFile) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS is not set. Check your .env file.');
  }

  console.log('[OCM] Using keyFile:', keyFile);

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  // Dùng GoogleAuth làm auth cho google.sheets
  const sheets = google.sheets({ version: 'v4', auth });
  sheetsClientPromise = sheets;
  return sheets;
}


const app = express();
app.use(cors());
app.use(express.json());

/* =========================================================
   HELPER: đọc toàn bộ sheet
   ========================================================= */
async function getSpreadsheetMeta(){
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID
  });
  return res.data;
}

async function readSheetValues(title, rangeA1 = 'A1:Z1000'){
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${title}'!${rangeA1}`,
    valueRenderOption: 'UNFORMATTED_VALUE'
  });
  const rows = res.data.values || [];
  if (!rows.length) return { headers: [], rows: [] };
  const headers = rows[0];
  const data = rows.slice(1);
  return { headers, rows: data };
}

/* =========================================================
   GET /ocm/overlays
   Sheet: OverlayImages
   Cột: Link, NW_Lng, NW_Lat, SE_Lng, SE_Lat
   ========================================================= */
app.get('/ocm/overlays', async (req,res)=>{
  try{
    const { headers, rows } = await readSheetValues('OverlayImages', 'A1:Z1000');
    if (!headers.length) return res.json([]);
    const idx = name => headers.indexOf(name);

    const out = rows
      .filter(r => r[idx('Link')])
      .map(r => ({
        url: r[idx('Link')],
        nw: [ Number(r[idx('NW_Lng')]), Number(r[idx('NW_Lat')]) ],
        se: [ Number(r[idx('SE_Lng')]), Number(r[idx('SE_Lat')]) ]
      }))
      .filter(o => isFinite(o.nw[0]) && isFinite(o.nw[1]) && isFinite(o.se[0]) && isFinite(o.se[1]));
    res.json(out);
  }catch(e){
    console.error('GET /ocm/overlays', e);
    res.status(500).json({ error: 'overlays_failed' });
  }
});

/* =========================================================
   GET /ocm/spiritual-sites
   Sheet: "Công trình tâm linh"
   Dựa trên getSpiritualSites() trong GAS
   ========================================================= */
app.get('/ocm/spiritual-sites', async (req,res)=>{
  try{
    const { headers, rows } = await readSheetValues('Công trình tâm linh', 'A1:Z1000');
    if (!headers.length) return res.json([]);
    const col = name => headers.indexOf(name);

    const idxName  = col('Tên công trình');
    const idxNwLng = col('NW Lng');
    const idxNwLat = col('NW Lat');
    const idxSeLng = col('SE Lng');
    const idxSeLat = col('SE Lat');
    const idxType  = col('Loại công trình');
    const idxDesc  = col('Mô tả / Giới thiệu ngắn');
    const idxImg   = col('Ảnh URL');
    const idxStt   = col('Trạng thái');
    const idxNote  = col('Ghi chú');

    const out = [];
    rows.forEach(r =>{
      if (!r[idxName]) return;
      const nwLng = idxNwLng > -1 ? Number(r[idxNwLng]) : NaN;
      const nwLat = idxNwLat > -1 ? Number(r[idxNwLat]) : NaN;
      const seLng = idxSeLng > -1 ? Number(r[idxSeLng]) : NaN;
      const seLat = idxSeLat > -1 ? Number(r[idxSeLat]) : NaN;
      if (!isFinite(nwLng) || !isFinite(nwLat) || !isFinite(seLng) || !isFinite(seLat)) return;

      out.push({
        name: r[idxName] || '',
        'NW Lng': nwLng,
        'NW Lat': nwLat,
        'SE Lng': seLng,
        'SE Lat': seLat,
        type:   idxType > -1 ? (r[idxType]  || '') : '',
        desc:   idxDesc > -1 ? (r[idxDesc]  || '') : '',
        imageUrl: idxImg > -1 ? (r[idxImg]  || '') : '',
        status: idxStt > -1 ? (r[idxStt]   || '') : '',
        note:   idxNote> -1 ? (r[idxNote]  || '') : ''
      });
    });
    res.json(out);
  }catch(e){
    console.error('GET /ocm/spiritual-sites', e);
    res.status(500).json({ error: 'spiritual_failed' });
  }
});

/* =========================================================
   GET /ocm/plots
   Gộp tất cả sheet (trừ sheet hệ thống)
   Dựa trên getPlots() trong GAS
   ========================================================= */
const SYSTEM_SHEETS = new Set(['OverlayImages','OCM_Holds','Công trình tâm linh']);

app.get('/ocm/plots', async (req,res)=>{
  try{
    const meta = await getSpreadsheetMeta();
    const sheets = meta.sheets || [];
    const all = [];

    for (const sh of sheets){
      const title = sh.properties?.title || '';
      if (!title || SYSTEM_SHEETS.has(title)) continue;

      const { headers, rows } = await readSheetValues(title, 'A1:Z2000');
      if (!headers.length) continue;
      const idx = name => headers.indexOf(name);

      const idxName   = idx('Tên');
      const idxLat    = idx('Vĩ độ');
      const idxLng    = idx('Kinh độ');
      const idxStatus = idx('Tình trạng');
      const idxArea   = idx('Diện tích');
      const idxPrice  = idx('Giá');
      const idxNote   = idx('Ghi chú');
      const idxKhu    = idx('Khu') > -1 ? idx('Khu') : null;
      const idxImg    = idx('Ảnh') > -1 ? idx('Ảnh') : null;

      rows.forEach(r=>{
        if (idxName < 0 || idxLat < 0 || idxLng < 0) return;
        const lat = Number(r[idxLat]);
        const lng = Number(r[idxLng]);
        if (!isFinite(lat) || !isFinite(lng)) return;
        all.push({
          sheet: title,
          khu:   idxKhu !== null ? (r[idxKhu] || title) : title,
          name:  r[idxName] || '',
          lat, lng,
          status: idxStatus > -1 ? (r[idxStatus] || '') : '',
          area:   idxArea   > -1 ? (r[idxArea]   || '') : '',
          price:  idxPrice  > -1 ? (r[idxPrice]  || '') : '',
          note:   idxNote   > -1 ? (r[idxNote]   || '') : '',
          imageUrl: idxImg  > -1 ? (r[idxImg]    || '') : ''
        });
      });
    }
    res.json(all);
  }catch(e){
    console.error('GET /ocm/plots', e);
    res.status(500).json({ error: 'plots_failed' });
  }
});

/* =========================================================
   HOLDS: GET + RESERVE + RELEASE
   Sheet: OCM_Holds
   Cột: Key,PlotName,Sheet,HeldBy,Note,UntilEpoch,UpdatedAt,CreatedAt,Active
   ========================================================= */
async function ensureHoldsSheet(){
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const exists = (meta.data.sheets || []).some(s => s.properties?.title === HOLDS_SHEET);
  if (exists) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody:{
      requests:[{
        addSheet:{ properties:{ title: HOLDS_SHEET } }
      }]
    }
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `'${HOLDS_SHEET}'!A1:I1`,
    valueRenderOption:'RAW',
    valueInputOption:'RAW',
    requestBody:{
      values:[['Key','PlotName','Sheet','HeldBy','Note','UntilEpoch','UpdatedAt','CreatedAt','Active']]
    }
  });
}

app.get('/ocm/holds', async (req,res)=>{
  try{
    await ensureHoldsSheet();
    const { headers, rows } = await readSheetValues(HOLDS_SHEET, 'A1:I1000');
    if (!headers.length) return res.json({});
    const idx = name => headers.indexOf(name);
    const now = Date.now();
    const mapH = {};
    rows.forEach(r=>{
      const key   = r[idx('Key')];
      const heldBy= r[idx('HeldBy')];
      const until = Number(r[idx('UntilEpoch')]) || 0;
      const active= (r[idx('Active')] === true || r[idx('Active')] === 'TRUE' || r[idx('Active')] === 1);
      if (!key || !heldBy || !active) return;
      if (until && until < now) return;
      mapH[key] = { heldBy, until };
    });
    res.json(mapH);
  }catch(e){
    console.error('GET /ocm/holds', e);
    res.status(500).json({ error: 'holds_failed' });
  }
});

app.post('/ocm/holds/reserve', async (req,res)=>{
  const { key, sheet, name, heldBy, minutes = 60, note = '' } = req.body || {};
  if (!key || !heldBy){
    return res.status(400).json({ ok:false, error:'missing_key_or_user' });
  }
  try{
    await ensureHoldsSheet();
    const sheets = await getSheetsClient();
    const { headers, rows } = await readSheetValues(HOLDS_SHEET, 'A1:I1000');
    const idx = name => headers.indexOf(name);

    const now = Date.now();
    const until = now + (minutes * 60 * 1000);

    // kiểm tra conflict
    let rowIndexForKey = -1;
    rows.forEach((r,i)=>{
      if (r[idx('Key')] === key){
        rowIndexForKey = i+2; // +2 vì header + index 1-based
        const active = (r[idx('Active')] === true || r[idx('Active')] === 'TRUE' || r[idx('Active')] === 1);
        const oldUntil = Number(r[idx('UntilEpoch')]) || 0;
        const oldHeldBy= r[idx('HeldBy')] || '';
        if (active && oldUntil > now && oldHeldBy && oldHeldBy !== heldBy){
          // đang bị người khác giữ
          throw { type:'conflict', heldBy: oldHeldBy };
        }
      }
    });

    const values = [[
      key,
      name || '',
      sheet || '',
      heldBy,
      note,
      until,
      new Date().toISOString(),
      new Date().toISOString(),
      true
    ]];

    if (rowIndexForKey > 0){
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `'${HOLDS_SHEET}'!A${rowIndexForKey}:I${rowIndexForKey}`,
        valueInputOption:'RAW',
        requestBody:{ values }
      });
    }else{
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `'${HOLDS_SHEET}'!A1:I1`,
        valueInputOption:'RAW',
        insertDataOption:'INSERT_ROWS',
        requestBody:{ values }
      });
    }
    res.json({ ok:true, until });
  }catch(e){
    if (e && e.type === 'conflict'){
      return res.json({ ok:false, heldBy:e.heldBy });
    }
    console.error('POST /ocm/holds/reserve', e);
    res.status(500).json({ ok:false, error:'reserve_failed' });
  }
});

app.post('/ocm/holds/release', async (req,res)=>{
  const { key, heldBy } = req.body || {};
  if (!key || !heldBy){
    return res.status(400).json({ ok:false, error:'missing_key_or_user' });
  }
  try{
    await ensureHoldsSheet();
    const sheets = await getSheetsClient();
    const { headers, rows } = await readSheetValues(HOLDS_SHEET, 'A1:I1000');
    const idx = name => headers.indexOf(name);
    let changed = false;

    rows.forEach((r,i)=>{
      if (r[idx('Key')] === key && r[idx('HeldBy')] === heldBy){
        const rowIndex = i + 2;
        const now = Date.now();
        r[idx('Active')] = false;
        r[idx('UpdatedAt')] = new Date().toISOString();
        r[idx('UntilEpoch')] = now;
        changed = true;
        sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `'${HOLDS_SHEET}'!A${rowIndex}:I${rowIndex}`,
          valueInputOption:'RAW',
          requestBody:{ values:[r] }
        }).catch(err => console.error('update release row error', err));
      }
    });
    res.json({ ok: changed });
  }catch(e){
    console.error('POST /ocm/holds/release', e);
    res.status(500).json({ ok:false, error:'release_failed' });
  }
});

/* =========================================================
   HEALTHCHECK
   ========================================================= */
app.get('/health', (req,res)=> res.json({ ok:true }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, ()=> console.log('OCM backend listening on', PORT));
