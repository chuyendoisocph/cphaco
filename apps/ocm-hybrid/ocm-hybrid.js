/* =========================================================
   CONFIG – gắn với cphaco.app + backend OCM
   ========================================================= */
const TOKEN_KEY     = 'CP_AUTH_TOKEN';                // SSO cphaco.app
const OCM_API_BASE  = 'https://cphaco.onrender.com'; // TODO: sửa
const MAPTILER_KEY  = 'x8p20fOYXXCBA2iHHKMw';       // TODO: sửa
const DEFAULT_CENTER= [106.6521,11.1836];
const DEFAULT_ZOOM  = 17;
// Đặt ở đầu file ocm-hybrid.js
if (typeof pmtiles !== 'undefined') {
  let protocol = new pmtiles.Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);
}
/* =========================================================
   JWT HELPER – giống signin.js
   ========================================================= */
function toBase64(b64url) {
  let s = String(b64url || '').replace(/-/g, '+').replace(/_/g, '/').trim();
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  return s;
}
function b64urlDecodeUtf8(b64url) {
  const b64 = toBase64(b64url);
  const bin = atob(b64);
  if (typeof TextDecoder !== 'undefined') {
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }
  try {
    return decodeURIComponent(
      bin.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
  } catch {
    return bin;
  }
}
function normalizeToken(raw) {
  if (!raw) return '';
  let t = String(raw).trim().replace(/^"|"$/g, '');
  if (t.startsWith('Bearer ')) t = t.slice(7).trim();
  try {
    const dec = decodeURIComponent(t);
    if (dec.split('.').length === 3) t = dec;
  } catch {}
  return t.replace(/\s+/g, '');
}
function parseJWT(token) {
  const t = normalizeToken(token);
  const parts = t.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const header  = JSON.parse(b64urlDecodeUtf8(parts[0]));
  const payload = JSON.parse(b64urlDecodeUtf8(parts[1]));
  if (header.alg && header.alg !== 'HS256') {
    console.warn('Unexpected JWT alg:', header.alg);
  }
  return payload;
}

/* =========================================================
   USER FROM CP_AUTH_TOKEN
   ========================================================= */
let currentUser = null;
function ensureUserOrRedirect(){
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) {
    window.location.href = '/signin.html?next=' + encodeURIComponent(window.location.pathname.replace(/^\//,''));
    return null;
  }
  try{
    const payload = parseJWT(raw);
    currentUser = payload;
    populateProfileFromPayload(payload);
    return payload;
  }catch(e){
    console.warn('[OCM] Invalid token', e);
    window.location.href = '/signin.html?next=' + encodeURIComponent(window.location.pathname.replace(/^\//,''));
    return null;
  }
}
function getLoginDisplayName(){
  if (!currentUser) return '';
  return currentUser.fullName || currentUser.name || currentUser.email || '';
}
function populateProfileFromPayload(p){
  const name  = p.fullName || p.name || 'Người dùng';
  const email = p.email || '';
  const phone = p.phone || '';
  const branch= p.branch || p.department || '';
  const role  = p.role || p.position || '';

  document.getElementById('profName').textContent   = name;
  document.getElementById('profEmail').textContent  = email || '—';
  document.getElementById('profPhone').textContent  = phone || '—';
  document.getElementById('profBranch').textContent = branch || '';
  document.getElementById('profRole').textContent   = role || '—';

  const av = document.getElementById('profAvatar');
  if (p.avatar){
    av.style.backgroundImage = `url('${p.avatar}')`;
    av.textContent = '';
  } else {
    av.style.backgroundImage = 'none';
    av.textContent = initials(name);
  }
  const menuUser = document.getElementById('menuUserName');
  if (menuUser) menuUser.textContent = name + (branch ? ` · ${branch}` : '');
}
function initials(s){
  s = String(s||'').trim();
  if(!s) return '?';
  const parts = s.split(/\s+/);
  const a = (parts[0]||'')[0] || '';
  const b = (parts[parts.length-1]||'')[0] || '';
  return (a + b).toUpperCase();
}
function logout(){
  try{ localStorage.removeItem(TOKEN_KEY); }catch{}
  window.location.href = '/signin.html';
}

/* =========================================================
   API HELPER – gọi backend Node
   ========================================================= */
async function apiGet(path){
  const res = await fetch(OCM_API_BASE + path, { credentials:'omit' });
  if (!res.ok) throw new Error(path + ' ' + res.status);
  return res.json();
}
async function apiPost(path, body){
  const res = await fetch(OCM_API_BASE + path, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    credentials:'omit',
    body: JSON.stringify(body || {})
  });
  if (!res.ok) throw new Error(path + ' ' + res.status);
  return res.json();
}

/* =========================================================
   MAP INIT
   ========================================================= */
let currentStyle = 'streets';
const styles = {
  streets:  `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
  satellite:`https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`
};
const map = new maplibregl.Map({
  container:'map', style:styles.streets,
  center:DEFAULT_CENTER, zoom:DEFAULT_ZOOM,
  maxZoom:25, minZoom:4
});
window.map = map;

map.addControl(new maplibregl.NavigationControl(),'bottom-right');
map.addControl(new maplibregl.ScaleControl(),'bottom-left');
map.addControl(new maplibregl.GeolocateControl({
  positionOptions:{enableHighAccuracy:true},
  trackUserLocation:true, showUserHeading:true
}),'bottom-right');

/* =========================================================
   TOAST / HELPERS
   ========================================================= */
function showToast(msg){
  const t=document.createElement('div');
  t.className='toast';
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),1800);
}
const $ = id => document.getElementById(id);
const VND=v=>!v?'':Number(v.toString().replace(/[^\d.-]/g,''))
  .toLocaleString('vi-VN',{style:'currency',currency:'VND'});

const totalCount     = $('totalCount');
const availableCount = $('availableCount');
const soldCount      = $('soldCount');
const reservedCount  = $('reservedCount');

const STATUS_COLORS = {
  'Trống': '#0EA5E9',
  'Đặt cọc': '#D1D5DB',
  'Đặt cọc ngắn hạn': '#F97316',
  'Đặt cọc dài hạn':  '#EA580C',
  'Đã nhượng quyền sử dụng': '#6366F1',
  'Đã bán': '#22C55E',
  'Đã an táng': '#EF4444',
  'Khác': '#6B7280'
};
const STATUS_ORDER = [
  'Trống','Đã bán','Đặt cọc','Đã an táng',
  'Đặt cọc ngắn hạn','Đặt cọc dài hạn','Đã nhượng quyền sử dụng','Khác'
];
let dynamicStatuses = new Set();

/* =========================================================
   DATA STATE
   ========================================================= */
let allPlots = [];
let plotsFiltered = [];
let fuse = null;
let overlayImages = [];
let overlayLayerIds = [];
let activeHolds = {};
let spiritualVisible = true;
let spiritualRasterLayers = [];
let spiritualRasterSources = [];
let spiritualHitLayers = [];
let spiritualHitSources = [];

const searchInput = document.getElementById('searchInput');
const suggestEl   = document.getElementById('suggestList');
let suggestIndex  = -1;

/* =========================================================
   HOLDS
   ========================================================= */
function holdKey(p){ return p.key || (p.sheet+'|'+p.name); }

async function fetchHolds(){
  try{
    const mapH = await apiGet('/ocm/holds');
    activeHolds = mapH || {};
    if (map.getSource('plots')) {
      showPlots( (plotsFiltered && plotsFiltered.length) ? plotsFiltered : allPlots );
    }
  }catch(e){
    console.warn('fetchHolds error', e);
  }
}
async function ocmHoldToggle(key, sheet, name){
  const who = getLoginDisplayName() || 'Ẩn danh';
  if (!who){
    showToast('⚠️ Không lấy được thông tin tài khoản. Vui lòng đăng nhập lại.');
    return;
  }
  const held = activeHolds[key];
  if (held && held.heldBy && held.heldBy !== who){
    showToast('🔒 Đang tư vấn bởi '+held.heldBy);
    return;
  }
  try{
    if (held){
      const res = await apiPost('/ocm/holds/release', { key, heldBy: who });
      if (res && res.ok){
        showToast('✅ Đã bỏ dặn');
        fetchHolds();
      } else {
        showToast('⚠️ Không bỏ được dặn');
      }
    } else {
      const res = await apiPost('/ocm/holds/reserve', {
        key, sheet, name, heldBy: who, minutes: 60, note: ''
      });
      if (res && res.ok){
        showToast('🟡 Đang tư vấn (60p)');
        fetchHolds();
      } else {
        showToast('🔒 '+(res.heldBy?('Đang tư vấn bởi '+res.heldBy):'Không thể dặn'));
      }
    }
  }catch(e){
    console.error('ocmHoldToggle', e);
    showToast('⚠️ Lỗi giữ chỗ');
  }
}
function safeIdFromKey(k){ return String(k||'').replace(/[^a-zA-Z0-9_-]/g,'_'); }
function holdRemainText(until){
  try{
    const t = (new Date(until)).getTime() - Date.now();
    if (t <= 0) return 'hết hạn';
    const m = Math.floor(t/60000), s = Math.floor((t%60000)/1000);
    return 'còn '+m+'p '+s+'s';
  }catch{ return ''; }
}
const holdCountdownTimers = {};
function startHoldCountdown(key, until){
  const elId = 'holdRemain-'+safeIdFromKey(key);
  const el = document.getElementById(elId);
  if(!el) return;
  if(holdCountdownTimers[elId]) clearInterval(holdCountdownTimers[elId]);
  function tick(){
    const txt = holdRemainText(until);
    el.textContent = txt;
    if (txt === 'hết hạn') { clearInterval(holdCountdownTimers[elId]); }
  }
  tick();
  holdCountdownTimers[elId] = setInterval(tick, 1000);
}
function holdLineHTML(p){
  const key = holdKey(p);
  const h = activeHolds[key];
  if(!h) return '';
  const who = String(h.heldBy || '')
    .replace(/[<>"'&]/g,s=>({'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','&':'&amp;'}[s]));
  const remainId = 'holdRemain-'+safeIdFromKey(key);
  const initRemain = holdRemainText(h.until);
  return `
    <div class="hold-row" style="margin:6px 0; padding:8px; border-radius:8px; background:#fff7e6; border:1px dashed #ffc069;">
      👤 <b>${who}</b> • ⏳ <span id="${remainId}">${initRemain}</span>
    </div>`;
}

/* =========================================================
   LOAD DATA
   ========================================================= */
function vnNormalize(str){
  if (!str) return '';
  let s = String(str).toLowerCase();
  try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g,''); } catch {}
  s = s.replace(/đ/g,'d').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  return s;
}
function buildNormText(p){
  return vnNormalize([p.name, p.khu || p.sheet, p.status, p.note].join(' '));
}
function getSearchCollection(){
  return (plotsFiltered && plotsFiltered.length) ? plotsFiltered : allPlots;
}
function smartSearch(q, max=12){
  const nq = vnNormalize(q);
  if(!nq) return [];
  const toks = nq.split(' ').filter(Boolean);
  const pool = getSearchCollection();
  const exactish = pool.filter(p => {
    const hay = p._n || '';
    return toks.every(t => hay.indexOf(t) !== -1);
  });
  let backfill = [];
  if (fuse){
    backfill = fuse.search(nq, {limit:50}).map(r=>r.item)
      .filter(p => pool.indexOf(p)!==-1 && exactish.indexOf(p)===-1);
  }
  return exactish.concat(backfill).slice(0, max);
}

async function loadPlots(){
  const plots = await apiGet('/ocm/plots');
  allPlots = (plots || []).map(p => (p._n = buildNormText(p), p));
  if(!fuse){
    fuse = new Fuse(allPlots, {
      keys: ['_n'],
      includeScore: true,
      threshold: 0.38,
      distance: 120,
      ignoreLocation: true,
      minMatchCharLength: 1,
      shouldSort: true,
      findAllMatches: true
    });
  } else {
    fuse.setCollection(allPlots);
  }

  // build "Khu vực"
  const area = document.getElementById('areaList');
  area.querySelectorAll('.area-chip:not([data-area="__ALL__"])').forEach(e=>e.remove());
  const areasSet = new Set(allPlots.map(p => p.sheet || p.khu).filter(Boolean));
  areasSet.forEach(n=>{
    const chip=document.createElement('div');
    chip.className='filter-chip area-chip';
    chip.dataset.area=n;
    chip.textContent=n;
    area.appendChild(chip);
  });
  setupFilters();
  ensurePlotLayers();
  bindPlotPopup();
  applyFilters();
}

async function loadOverlays(){
  try{
    // Gọi API lấy danh sách (bạn cần đảm bảo backend trả về dữ liệu giống Google Sheet)
    const list = await apiGet('/ocm/overlays'); 
    
    // Xóa layer/source cũ để tránh trùng lặp khi reload
    overlayLayerIds.forEach(id=>{
      if (map.getLayer(id)) map.removeLayer(id);
      const sid = id.replace('layer','img');
      if (map.getSource(sid)) map.removeSource(sid);
    });
    overlayLayerIds = [];

    const overlayList = list || [];
    const beforeId = map.getLayer('plots-circle') ? 'plots-circle' : undefined;
    const allBounds = new maplibregl.LngLatBounds();

    overlayList.forEach((item, i) => {
      // 1. Map dữ liệu từ các tên cột trong Google Sheet (Link, NW_Lng...) hoặc API cũ (url, nw...)
      let url = String(item.Link || item.url || '').trim();
      
      // Lấy tọa độ để fitBounds (hỗ trợ cả kiểu Google Sheet rời rạc và kiểu API mảng cũ)
      const nwLng = Number(item.NW_Lng ?? item.nw?.[0]);
      const nwLat = Number(item.NW_Lat ?? item.nw?.[1]);
      const seLng = Number(item.SE_Lng ?? item.se?.[0]);
      const seLat = Number(item.SE_Lat ?? item.se?.[1]);

      // 2. Fix domain tự động (nếu lỡ trong sheet vẫn để r2.dev)
      if (url.includes('.r2.dev')) {
        url = url.replace(/https:\/\/.*\.r2\.dev/, 'https://tiles.cphaco.id.vn');
      }

      if (!url) return;

      const sid = `img-${i}`;
      const lid = `layer-${i}`;
      
      // 3. Xử lý PMTiles (Ưu tiên)
      if (url.endsWith('.pmtiles')) {
         if (!map.getSource(sid)) {
           map.addSource(sid, {
             type: 'raster',
             url: `pmtiles://${url}`, // Cú pháp bắt buộc cho pmtiles
             tileSize: 256
           });
         }
         if (!map.getLayer(lid)) {
           map.addLayer({
             id: lid,
             type: 'raster',
             source: sid,
             paint: { 'raster-opacity': 1 }
           }, beforeId);
         }
      } 
      // 4. Xử lý Link ảnh thường (Dự phòng cho các map cũ chưa convert)
      else if (/\{z\}/.test(url)) { // Dạng XYZ
         if (!map.getSource(sid)) map.addSource(sid, { type:'raster', tiles:[url], tileSize:256 });
         if (!map.getLayer(lid))  map.addLayer({ id:lid, type:'raster', source:sid }, beforeId);
      }
      else if (nwLng && nwLat && seLng && seLat) { // Dạng ảnh đơn (Image Overlay)
         if (!map.getSource(sid)) {
            map.addSource(sid, {
              type: 'image',
              url: url,
              coordinates: [[nwLng, nwLat], [seLng, nwLat], [seLng, seLat], [nwLng, seLat]]
            });
         }
         if (!map.getLayer(lid)) map.addLayer({ id:lid, type:'raster', source:sid }, beforeId);
      }

      // Lưu layer ID để quản lý bật/tắt
      overlayLayerIds.push(lid);

      // Gom bounds để zoom map vừa khít tất cả overlay
      if (nwLng && nwLat && seLng && seLat) {
        allBounds.extend([nwLng, nwLat]);
        allBounds.extend([seLng, seLat]);
      }
    });

    // Zoom bản đồ bao quát hết các overlay vừa load
    if (!allBounds.isEmpty()) {
      map.fitBounds(allBounds, { padding: 20 });
    }

    showToast(`🗺️ Đã tải ${overlayLayerIds.length} bản đồ PMTiles`);

  } catch(e){ 
    console.error('loadOverlays error', e); 
  }
}


/* =========================================================
   MAP LAYERS: plots
   ========================================================= */
function normalizeStatus(raw){
  if (!raw) return 'Khác';
  let s = String(raw).trim().replace(/\s+/g, ' ');
  if (/an\s*tang|an\stáng|an\s*táng|an\tang/i.test(s)) return 'Đã an táng';
  if (/ngan\s*han|ngắn\s*hạn/i.test(s)) return 'Đặt cọc ngắn hạn';
  if (/dai\s*han|dài\s*hạn|kh(ô|o)ng\s*k(ỳ|y)\s*h(ạ|a)n|đ(ặ|a)c\s*bi(ệ|e)t/i.test(s)) return 'Đặt cọc dài hạn';
  if (/nh(ư|u)ợng\s*quyền/i.test(s)) return 'Đã nhượng quyền sử dụng';
  if (['Trống','Đã bán','Đặt cọc'].includes(s)) return s;
  return 'Khác';
}
function ensurePlotLayers(){
  if(!map.getSource('plots')){
    map.addSource('plots',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
  }
  if(!map.getLayer('plots-circle')){
    map.addLayer({
      id:'plots-circle', type:'circle', source:'plots',
      paint:{
        'circle-radius':['interpolate',['linear'],['zoom'],15,3,19,8],
        'circle-color':['get','_statusColor'],
        'circle-stroke-color':'#fff',
        'circle-stroke-width':1
      }
    });
  }
  if(!map.getLayer('plots-hold-glow')){
    map.addLayer({
      id:'plots-hold-glow',
      type:'circle',
      source:'plots',
      filter:['==',['get','_held'], true],
      paint:{
        'circle-radius': 18,
        'circle-color':'rgba(75,85,99,0.22)',
        'circle-blur': 0.6,
        'circle-pitch-scale':'viewport'
      }
    });
  }
  if(!map.getLayer('plots-hold')){
    map.addLayer({
      id:'plots-hold',
      type:'circle',
      source:'plots',
      filter:['==',['get','_held'], true],
      paint:{
        'circle-radius': 14,
        'circle-color':'rgba(0,0,0,0)',
        'circle-stroke-color':'#4B5563',
        'circle-stroke-width':2.2,
        'circle-opacity': 1,
        'circle-pitch-scale':'viewport'
      }
    });
  }
  if(!map.getLayer('plots-hit')){
    map.addLayer({
      id:'plots-hit',
      type:'circle',
      source:'plots',
      paint:{
        'circle-radius': ['interpolate',['linear'],['zoom'], 14, 18, 16, 26, 19, 36],
        'circle-color':'rgba(0,0,0,0)'
      }
    });
    map.on('click','plots-hit', onPlotClick);
  }
}

function isMobile(){ return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent); }
function applyPlotRadius(){
  if (!map.getLayer('plots-circle')) return;
  const radiusExpr = isMobile()
    ? ['interpolate', ['linear'], ['zoom'], 14, 6, 16, 11, 19, 16, 22, 24]
    : ['interpolate', ['linear'], ['zoom'], 15, 4, 19, 10, 22, 14];
  map.setPaintProperty('plots-circle', 'circle-radius', radiusExpr);
  map.setPaintProperty('plots-circle', 'circle-stroke-width', isMobile() ? 2 : 1.5);
  map.setPaintProperty('plots-circle', 'circle-stroke-color', '#fff');
  map.setPaintProperty('plots-circle', 'circle-pitch-scale', 'viewport');
}
function applyHoldRadius(){
  if (map.getLayer('plots-hold')) {
    const ring = isMobile()
      ? ['interpolate',['linear'],['zoom'], 14,10, 16,18, 19,28, 22,36]
      : ['interpolate',['linear'],['zoom'], 15,6,  19,14, 22,18];
    map.setPaintProperty('plots-hold','circle-radius', ring);
    map.setPaintProperty('plots-hold','circle-stroke-width', isMobile()? 3 : 2);
    map.setPaintProperty('plots-hold','circle-pitch-scale','viewport');
  }
  if (map.getLayer('plots-hold-glow')) {
    const halo = isMobile()
      ? ['interpolate',['linear'],['zoom'], 14,14, 16,24, 19,36, 22,48]
      : ['interpolate',['linear'],['zoom'], 15,8,  19,18, 22,24];
    map.setPaintProperty('plots-hold-glow','circle-radius', halo);
    map.setPaintProperty('plots-hold-glow','circle-blur', 0.6);
    map.setPaintProperty('plots-hold-glow','circle-pitch-scale','viewport');
  }
}
map.on('load', () => { applyPlotRadius(); applyHoldRadius(); });
map.on('styledata', () => {
  if (map.getLayer('plots-circle')) applyPlotRadius();
  applyHoldRadius();
});

/* =========================================================
   POPUP / SEARCH
   ========================================================= */
function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, function(ch){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]);
  });
}
function makeNavUrl(lat, lng) {
  return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng;
}
function buildPlotPopupHTML(p){
  const lat = Number(p.lat), lng = Number(p.lng);
  const color = STATUS_COLORS[p.status] || '#333';
  const gmapUrl = makeNavUrl(lat,lng);
  return (
    '<div class="popup-card">'
    + '<div class="popup-title">'+escapeHtml(p.name||'')+'</div>'
    + '<div class="popup-sub">'+escapeHtml(p.khu||p.sheet||'')+'</div>'
    + (p.imageUrl?('<div class="popup-photo"><img src="'+p.imageUrl+'"></div>'):'')
    + '<div>🏷️ Trạng thái: <b style="color:'+color+'">'+escapeHtml(p.status||'')+'</b></div>'
    + '<div>💵 Giá: '+(VND(p.price||''))+'</div>'
    + '<div>📝 Ghi chú: '+escapeHtml(p.note||'')+'</div>'
    + holdLineHTML(p)
    + '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">'
      + '<a target="_blank" href="'+gmapUrl+'" style="background:var(--primary);color:#fff;padding:6px 12px;border-radius:8px;text-decoration:none">🚗 Dẫn đường</a>'
      + '<button onclick="showQRFor('+lat+','+lng+')" style="background:#fff;color:#333;border:1px solid #ddd;padding:6px 12px;border-radius:8px;cursor:pointer">📱 QR</button>'
      + '<button onclick="ocmHoldToggle(\''+holdKey(p).replace(/'/g,'&#39;')+'\', \''+(String(p.sheet||'').replace(/'/g,'&#39;'))+'\', \''+(String(p.name||'').replace(/'/g,'&#39;'))+'\')" style="background:#fff;color:#333;border:1px solid #ddd;padding:6px 12px;border-radius:8px;cursor:pointer">🟡 Đang tư vấn (60p)</button>'
    + '</div>'
    + '</div>'
  );
}
function hideSuggest(){
  suggestEl.classList.remove('show');
  suggestEl.innerHTML = '';
  suggestEl._data = null;
  suggestIndex = -1;
}
function renderSuggestions(q){
  const items = smartSearch(q, 12);
  if(!items.length){ hideSuggest(); return; }

  suggestEl.innerHTML = items.map((p,i)=>{
    const held = activeHolds[holdKey(p)];
    const who  = held ? (' • 👤 '+escapeHtml(held.heldBy||'')) : '';
    return (
      '<div class="suggest-item" data-idx="'+i+'">'
        + '<div class="dot" style="background:'+(STATUS_COLORS[p.status]||'#bbb')+'"></div>'
        + '<div>'
          + '<div class="suggest-title">'+escapeHtml(p.name||'')+'</div>'
          + '<div class="suggest-sub">'+escapeHtml(p.khu||p.sheet||'')+' • '+escapeHtml(p.status||'')+(p.price?(' • '+VND(p.price)):'')+ who +'</div>'
        + '</div>'
      + '</div>'
    );
  }).join('');

  suggestEl._data = items;
  suggestEl.classList.add('show');
  suggestIndex = -1;
}
function selectSuggestion(i){
  const list = suggestEl._data || [];
  const p = list[i];
  if(!p) return;
  hideSuggest();
  map.flyTo({ center:[p.lng, p.lat], zoom:19 });
  const html = buildPlotPopupHTML(p);
  new maplibregl.Popup().setLngLat([p.lng, p.lat]).setHTML(html).addTo(map);
  const key = holdKey(p); const held = activeHolds[key];
  if (held) startHoldCountdown(key, held.until);
}
function moveActive(delta){
  const nodes = suggestEl.querySelectorAll('.suggest-item');
  if(!nodes.length) return;
  suggestIndex = (suggestIndex + delta + nodes.length) % nodes.length;
  Array.prototype.forEach.call(nodes, el => el.classList.remove('active'));
  const el = nodes[suggestIndex];
  if(el){ el.classList.add('active'); el.scrollIntoView({block:'nearest'}); }
}

/* Popup click */
function onPlotClick(e){
  try{
    const f = e.features[0];
    const pr = f.properties || {};
    const p = {
      ...pr,
      name: String(pr.name||''),
      sheet: String(pr.sheet||pr.khu||''),
      khu: String(pr.khu||pr.sheet||''),
      status: String(pr.status||''),
      note: String(pr.note||''),
      imageUrl: pr.imageUrl ? String(pr.imageUrl) : ''
    };
    const html = buildPlotPopupHTML(p);
    const coords = [Number(p.lng), Number(p.lat)];
    new maplibregl.Popup().setLngLat(coords).setHTML(html).addTo(map);
    const key = holdKey(p); const held = activeHolds[key];
    if (held) startHoldCountdown(key, held.until);
  }catch(err){
    console.error('Popup error:', err);
    showToast('⚠️ Lỗi hiển thị popup');
  }
}
function bindPlotPopup(){
  if (!map.getLayer('plots-circle')) return;
  try{ map.off('click','plots-circle', onPlotClick); }catch{}
  map.on('click','plots-circle', onPlotClick);
}

/* Loose tap */
function enableLooseTap(){
  map.on('click', function(e){
    const hitStrict = map.queryRenderedFeatures(e.point, {
      layers: ['plots-circle','plots-hold','plots-hold-glow','plots-hit']
    });
    if (hitStrict && hitStrict.length) return;
    const R = isMobile() ? 26 : 16;
    const bbox = [[e.point.x - R, e.point.y - R],[e.point.x + R, e.point.y + R]];
    const near = map.queryRenderedFeatures(bbox, { layers:['plots-circle'] });
    if (!near || !near.length) return;
    const f = near[0];
    const coords = f.geometry && f.geometry.coordinates
      ? f.geometry.coordinates
      : [e.lngLat.lng, e.lngLat.lat];
    onPlotClick({
      features: [{ properties: f.properties }],
      lngLat: new maplibregl.LngLat(coords[0], coords[1])
    });
  });
}

/* =========================================================
   LIST + STATS
   ========================================================= */
function updateList(list){
  const box=document.getElementById('propertyList');
  box.innerHTML=list.map(p=>{
    const key = holdKey(p);
    const held = activeHolds[key];
    const heldBadge = held ? `<div style="font-size:12px;color:#b26b00;margin-top:2px">👤 Tư vấn: <b>${escapeHtml(held.heldBy||'')}</b></div>` : '';
    return `
    <div class="property-card" onclick="map.flyTo({center:[${p.lng},${p.lat}],zoom:19})">
      <img class="thumb" src="${p.imageUrl||'https://dummyimage.com/160x120/eee/aaa&text=No+Image'}" alt="">
      <div class="prop-body">
        <div class="property-name">${escapeHtml(p.name)}</div>
        <div class="property-details">${escapeHtml(p.khu||p.sheet)} – <b style="color:${STATUS_COLORS[p.status]||'#333'}">${escapeHtml(p.status||'')}</b></div>
        ${heldBadge}
        <div class="property-price">${VND(p.price)}</div>
      </div>
    </div>`;
  }).join('');
}
function updateStats(list){
  totalCount.textContent=list.length;
  availableCount.textContent=list.filter(p=>normalizeStatus(p.status)==='Trống').length;
  soldCount.textContent=list.filter(p=>normalizeStatus(p.status)==='Đã bán').length;
  reservedCount.textContent=list.filter(p=>normalizeStatus(p.status)==='Đặt cọc').length;
}

/* =========================================================
   FILTERS
   ========================================================= */
function renderStatusChips(){
  const wrap = document.getElementById('statusChips'); if (!wrap) return;
  const allStatusNames = new Set();
  Object.keys(STATUS_COLORS).forEach(s => allStatusNames.add(s));
  dynamicStatuses.forEach(s => allStatusNames.add(s));
  const ordered = Array.from(allStatusNames).sort((a,b)=>{
    const ia = STATUS_ORDER.indexOf(a), ib = STATUS_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b,'vi');
    if (ia === -1) return 1; if (ib === -1) return -1; return ia - ib;
  });
  wrap.innerHTML = ordered.map(s=>{
    const color = STATUS_COLORS[s] || '#E5E7EB';
    return `
      <div class="filter-chip active" data-status="${s}"
           style="border:1px solid rgba(0,0,0,.03);box-shadow:0 1px 2px rgba(0,0,0,.02)">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;vertical-align:middle"></span>
        ${s}
      </div>
    `;
  }).join('');
  wrap.querySelectorAll('.filter-chip[data-status]').forEach(chip=>{
    chip.onclick = ()=>{ chip.classList.toggle('active'); applyFilters(); };
  });
}
function setupFilters(){
  document.querySelectorAll('.filter-chip[data-status]').forEach(chip=>{
    chip.onclick=()=>{chip.classList.toggle('active');applyFilters();};
  });
  document.querySelectorAll('.area-chip').forEach(chip=>{
    chip.onclick=()=>{
      document.querySelectorAll('.area-chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      applyFilters();
    };
  });
  document.getElementById('layer-plots').onclick=()=>{toggleLayer('plots-circle','layer-plots');};
  document.getElementById('layer-overlays').onclick=()=>{toggleOverlaysChip();};
  document.getElementById('layer-satellite').onclick=()=>{toggleLayerSatellite();};
}
function applyFilters(){
  const activeStatuses = Array.from(document.querySelectorAll('.filter-chip[data-status].active'))
    .map(c => c.dataset.status);
  const currentArea = document.querySelector('.area-chip.active')?.dataset.area || '__ALL__';
  plotsFiltered = allPlots.filter(p=>{
    const s = normalizeStatus(p.status);
    const byStatus = activeStatuses.length
      ? (activeStatuses.includes(s) || (!STATUS_COLORS[s] && activeStatuses.includes('Khác')))
      : true;
    const byArea = (currentArea === '__ALL__' || p.sheet === currentArea || p.khu === currentArea);
    return byStatus && byArea;
  });
  showPlots(plotsFiltered);
}
function showPlots(list){
  const fc = {
    type:'FeatureCollection',
    features: list.map(p=>{
      const normStatus = normalizeStatus(p.status);
      const key = holdKey(p);
      if (!STATUS_COLORS[normStatus] && normStatus !== 'Khác') dynamicStatuses.add(normStatus);
      return {
        type:'Feature',
        geometry:{ type:'Point', coordinates:[p.lng, p.lat] },
        properties:{
          ...p,
          status: normStatus,
          _held: !!activeHolds[key],
          _statusColor: STATUS_COLORS[normStatus] || STATUS_COLORS['Khác'] || '#6B7280'
        }
      };
    })
  };
  map.getSource('plots').setData(fc);
  renderStatusChips();
  updateStats(list);
  updateList(list);
}
function toggleFilters(){
  const panel = document.getElementById('filterPanel');
  const overlay = document.getElementById('filterOverlay');
  const isActive = panel.classList.contains('active');
  if (isActive) {
    panel.classList.remove('active'); overlay.classList.remove('active');
    setTimeout(() => { overlay.style.display = 'none'; }, 250);
  } else {
    overlay.style.display = 'block';
    setTimeout(() => { overlay.classList.add('active'); panel.classList.add('active'); }, 10);
  }
}
function hideFilterPanel(){
  const panel = document.getElementById('filterPanel');
  const overlay = document.getElementById('filterOverlay');
  panel.classList.remove('active'); overlay.classList.remove('active');
  setTimeout(() => { overlay.style.display = 'none'; }, 250);
}
function toggleLayer(id,chipId){
  const on = document.getElementById(chipId).classList.toggle('active');
  if(map.getLayer(id)) map.setLayoutProperty(id,'visibility', on?'visible':'none');
}
function toggleOverlaysChip(){
  const chip=document.getElementById('layer-overlays');
  const toOn = !chip.classList.contains('active');
  chip.classList.toggle('active');
  overlayLayerIds.forEach(id=>{
    if(map.getLayer(id)) map.setLayoutProperty(id,'visibility', toOn?'visible':'none');
  });
}
function toggleLayerSatellite() {
  const chipFilter = document.getElementById('layer-satellite');
  const itemMenu = document.querySelector('.menu-item[data-action="satellite"]');
  const toSatellite = currentStyle !== 'satellite';
  currentStyle = toSatellite ? 'satellite' : 'streets';
  if (chipFilter) chipFilter.classList.toggle('active', toSatellite);
  if (itemMenu)  itemMenu.classList.toggle('active', toSatellite);
  const center = map.getCenter(), zoom = map.getZoom(), bearing = map.getBearing(), pitch = map.getPitch();
  map.setStyle(styles[currentStyle]);
  map.once('styledata', () => {
    ensurePlotLayers();
    bindPlotPopup();
    showPlots(plotsFiltered.length ? plotsFiltered : allPlots);
    loadOverlays();
    map.jumpTo({ center, zoom, bearing, pitch });
  });
  showToast(toSatellite ? "🛰️ Đã bật chế độ vệ tinh" : "🗺️ Đã tắt vệ tinh");
}

/* =========================================================
   SEARCH EVENTS
   ========================================================= */
searchInput.addEventListener('input', () => {
  const q = (searchInput.value||'').trim();
  if(q) renderSuggestions(q); else hideSuggest();
});
suggestEl.addEventListener('click', function(e){
  const item = e.target.closest('.suggest-item'); if(!item) return;
  const idx = Number(item.getAttribute('data-idx')); selectSuggestion(idx);
});
document.addEventListener('click', function(e){
  const wrap = document.querySelector('.gm-search-wrap'); if(!wrap) return;
  if(!wrap.contains(e.target)) hideSuggest();
});
searchInput.addEventListener('keydown', function(e){
  if(!suggestEl.classList.contains('show')){
    if(e.key === 'Enter'){
      const q = (searchInput.value||'').trim();
      const first = smartSearch(q, 1)[0];
      if(first){
        e.preventDefault();
        hideSuggest();
        map.flyTo({ center:[first.lng, first.lat], zoom:19 });
        const html = buildPlotPopupHTML(first);
        new maplibregl.Popup().setLngLat([first.lng, first.lat]).setHTML(html).addTo(map);
        const key = holdKey(first); const held = activeHolds[key];
        if (held) startHoldCountdown(key, held.until);
      }
    }
    return;
  }
  if(e.key === 'ArrowDown'){ e.preventDefault(); moveActive(+1); }
  else if(e.key === 'ArrowUp'){ e.preventDefault(); moveActive(-1); }
  else if(e.key === 'Enter'){
    e.preventDefault();
    if(suggestIndex < 0) selectSuggestion(0);
    else selectSuggestion(suggestIndex);
  } else if(e.key === 'Escape'){ hideSuggest(); }
});
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') hideSuggest(); });

/* =========================================================
   BOTTOM SHEET DRAG
   ========================================================= */
(function(){
  const sheet=document.getElementById('bottomSheet');
  let startY=0,currentY=0,isDragging=false;
  sheet.addEventListener('touchstart',e=>{
    startY=e.touches[0].clientY;
    isDragging=true;
    sheet.style.transition='none';
  });
  sheet.addEventListener('touchmove',e=>{
    if(!isDragging)return;
    currentY=e.touches[0].clientY;
    const diff=currentY-startY;
    if(diff>0) sheet.style.transform=`translateY(${diff}px)`;
  });
  sheet.addEventListener('touchend',()=>{
    sheet.style.transition='transform .3s ease-out';
    if(currentY-startY>120){
      sheet.classList.remove('active');
    } else {
      sheet.style.transform='translateY(0)';
    }
    isDragging=false;
  });
})();
function toggleList(){document.getElementById('bottomSheet').classList.toggle('active');}

/* =========================================================
   SIDE MENU + CONTEXT MENU
   ========================================================= */
function centerMap(){map.flyTo({center:DEFAULT_CENTER,zoom:DEFAULT_ZOOM});}
const sideMenu=document.getElementById('sideMenu');
document.getElementById('btnMenu').onclick=()=>{
  sideMenu.classList.toggle('active');
  sideMenu.setAttribute('aria-hidden',!sideMenu.classList.contains('active'));
};
map.getCanvas().addEventListener('click',()=>{
  if(sideMenu.classList.contains('active')) sideMenu.classList.remove('active');
});
map.on('contextmenu', e => {
  const lng = e.lngLat.lng;
  const lat = e.lngLat.lat;
  const coordText = `${lat}, ${lng}`;
  navigator.clipboard.writeText(coordText).then(() => {
    showToast(`✅ Đã copy tọa độ:\n${coordText}`);
  }).catch(err => {
    console.error('Clipboard error:', err);
    showToast(`📍 ${coordText}`);
  });
});

/* =========================================================
   SPIRITUAL SITES
   ========================================================= */
function gatherImagesFromRow(p){
  const out = [];
  const add = u => { if (u && /^https?:/i.test(String(u).trim())) out.push(String(u).trim()); };
  const candidates = [p.imageUrl, p['Ảnh URL'], p['Ảnh 2'], p['Ảnh 3'], p['Images'], p['Ảnh']];
  candidates.forEach(v=>{
    if (!v) return;
    const s = String(v);
    if (s.match(/https?:\/\//i) && s.match(/[,;\s]/)) s.split(/[\s,;]+/).forEach(add);
    else add(s);
  });
  return Array.from(new Set(out));
}
function makeCircleDataUrl(srcUrl, done){
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = function(){
    const size = 512;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');

    ctx.clearRect(0,0,size,size);
    const r = size/2;
    ctx.save(); ctx.beginPath(); ctx.arc(r, r, r-6, 0, Math.PI*2, false); ctx.closePath(); ctx.clip();
    const iw = img.width, ih = img.height;
    const scale = Math.max(size / iw, size / ih);
    const drawW = iw * scale, drawH = ih * scale;
    const dx = (size - drawW) / 2, dy = (size - drawH) / 2;
    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();

    ctx.lineWidth = 10; ctx.strokeStyle = "#fff";
    ctx.beginPath(); ctx.arc(r, r, r-6, 0, Math.PI*2, false); ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = "#1A73E8";
    ctx.beginPath(); ctx.arc(r, r, r-20, 0, Math.PI*2, false); ctx.stroke();
    done(c.toDataURL("image/png"));
  };
  img.onerror = function(){ done("https://i.postimg.cc/8cB0bKf3/spiritual-dot-256.png"); };
  img.src = srcUrl;
}
async function loadSpiritualSites(){
  try{
    spiritualRasterLayers.forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
    spiritualRasterSources.forEach(id => { if (map.getSource(id)) map.removeSource(id); });
    spiritualHitLayers.forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
    spiritualHitSources.forEach(id => { if (map.getSource(id)) map.removeSource(id); });
    spiritualRasterLayers = []; spiritualRasterSources = []; spiritualHitLayers = []; spiritualHitSources = [];

    const list = await apiGet('/ocm/spiritual-sites');
    if (!list || !list.length) return;

    list.forEach((p, i) => {
      const nwLng = Number(p["NW Lng"]);
      const nwLat = Number(p["NW Lat"]);
      const seLng = Number(p["SE Lng"]);
      const seLat = Number(p["SE Lat"]);
      if (!isFinite(nwLng) || !isFinite(nwLat) || !isFinite(seLng) || !isFinite(seLat)) return;
      const centerLng = (nwLng + seLng) / 2;
      const centerLat = (nwLat + seLat) / 2;

      let imagesList = gatherImagesFromRow(p);
      const thumbUrl = (imagesList && imagesList[0]) || p.imageUrl || "https://i.postimg.cc/8cB0bKf3/spiritual-dot-256.png";

      makeCircleDataUrl(thumbUrl, function(circleUrl){
        const srcId  = `spiritual-img-src-${i}`;
        const layerId= `spiritual-img-layer-${i}`;
        const hitSrc = `spiritual-hit-src-${i}`;
        const hitLay = `spiritual-hit-layer-${i}`;

        if (!map.getSource(srcId)) {
          map.addSource(srcId, {
            type: "image",
            url: circleUrl,
            coordinates: [
              [nwLng, nwLat],
              [seLng, nwLat],
              [seLng, seLat],
              [nwLng, seLat]
            ]
          });
        }
        if (!map.getLayer(layerId)) {
          map.addLayer({ id: layerId, type: "raster", source: srcId,
            paint: { "raster-opacity": spiritualVisible ? 1 : 0 }});
        }
        spiritualRasterSources.push(srcId); spiritualRasterLayers.push(layerId);

        if (!map.getSource(hitSrc)) {
          map.addSource(hitSrc, {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [{
                type: "Feature",
                geometry: { type: "Point", coordinates: [centerLng, centerLat] },
                properties: {
                  name: p.name || '',
                  type: p.type || '',
                  status: p.status || '',
                  desc: p.desc || '',
                  note: p.note || '',
                  imageUrl: thumbUrl,
                  images: JSON.stringify(imagesList),
                  lat: centerLat,
                  lng: centerLng
                }
              }]
            }
          });
        }
        if (!map.getLayer(hitLay)) {
          map.addLayer({
            id: hitLay,
            type: "circle",
            source: hitSrc,
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 14, 18, 28, 22, 40],
              "circle-color": "rgba(0,0,0,0)"
            }
          });
        }
        map.on("click", hitLay, e => {
          const f = e.features && e.features[0]; if (!f) return;
          const pr = f.properties || {};
          const lat = Number(pr.lat), lng = Number(pr.lng);
          const navUrl = makeNavUrl(lat, lng);

          let imgs = [];
          try { imgs = JSON.parse(pr.images || '[]'); } catch {}
          if (!imgs || !imgs.length) imgs = pr.imageUrl ? [pr.imageUrl] : [];
          const cid = `spc_${Date.now()}_${Math.floor(Math.random()*1e6)}`;

          const html = `
            <div class="popup-card">
              <div class="popup-title">${pr.name || ''}</div>
              <div class="popup-sub">${(pr.type||'')}${pr.status ? ' – ' + pr.status : ''}</div>
              ${imgs.length ? `
                <div class="popup-photo">
                  <div class="carousel" id="${cid}">
                    <div class="carousel-track">
                      ${imgs.map(u => `<div class="carousel-item"><img src="${u}"></div>`).join('')}
                    </div>
                  </div>
                  ${imgs.length > 1 ? `
                    <button class="nav prev" onclick="spcMove('${cid}',-1)">‹</button>
                    <button class="nav next" onclick="spcMove('${cid}',+1)">›</button>
                    <div class="dots">
                      ${imgs.map((_,i)=>`<span class="dot ${i===0?'active':''}"></span>`).join('')}
                    </div>` : ``}
                </div>` : ``}
              ${pr.desc ? `<div>${pr.desc}</div>` : ``}
              ${pr.note ? `<div style="margin-top:6px;font-size:12px;color:#666">${pr.note}</div>` : ``}
              <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
                <a target="_blank" href="${navUrl}" style="background:var(--primary);color:#fff;padding:6px 12px;border-radius:8px;text-decoration:none">🚗 Dẫn đường</a>
                <button onclick="showQRFor(${lat},${lng})" style="background:#fff;color:#333;border:1px solid #ddd;padding:6px 12px;border-radius:8px;cursor:pointer">📱 QR</button>
              </div>
            </div>`;
          new maplibregl.Popup().setLngLat([lng, lat]).setHTML(html).addTo(map);
          setTimeout(()=> spcInit(cid), 0);
        });

        spiritualHitSources.push(hitSrc);
        spiritualHitLayers.push(hitLay);
      });
    });
  }catch(e){
    console.error('loadSpiritualSites', e);
  }
}
function toggleSpiritualSites(){
  spiritualVisible = !spiritualVisible;
  spiritualRasterLayers.forEach(id => {
    if (map.getLayer(id)){
      map.setPaintProperty(id, "raster-opacity", spiritualVisible ? 1 : 0);
    }
  });
  spiritualHitLayers.forEach(id => {
    if (map.getLayer(id)){
      map.setLayoutProperty(id, "visibility", spiritualVisible ? "visible" : "none");
    }
  });
  showToast(spiritualVisible ? "🕍 Đã bật Công trình tâm linh" : "🕍 Đã tắt Công trình tâm linh");
}
function spcInit(id){
  const root = document.getElementById(id);
  if(!root) return;
  root.dataset.idx = 0;
  const track = root.querySelector('.carousel-track');
  if(track) track.style.transform = 'translateX(0%)';
}
function spcMove(id, delta){
  const root = document.getElementById(id); if(!root) return;
  const track = root.querySelector('.carousel-track'); if(!track) return;
  const total = track.children.length;
  let idx = +(root.dataset.idx || 0);
  idx = (idx + delta + total) % total;
  root.dataset.idx = String(idx);
  track.style.transform = `translateX(${-idx*100}%)`;
  const dotsWrap = root.parentElement.querySelector('.dots');
  if (dotsWrap){
    dotsWrap.querySelectorAll('.dot').forEach((d,i)=> d.classList.toggle('active', i===idx));
  }
}
window.spcMove = spcMove;

/* =========================================================
   QR & Google Maps paste
   ========================================================= */
(function(){
  const H = 'ht' + 'tps://';
  const GMAPS_BASE = H + 'www.google.com/maps/dir/?api=1&destination=';
  const QR_BASE    = H + 'quickchart.io/qr?text=';
  window.showQRFor = function(lat, lng){
    try {
      const url     = GMAPS_BASE + lat + ',' + lng;
      const img     = document.getElementById('qrImg');
      const linkEl  = document.getElementById('qrUrlText');
      const openBtn = document.getElementById('qrOpenBtn');
      const src     = QR_BASE + encodeURIComponent(url) + '&size=240&margin=1';
      if (img)    img.setAttribute('src', src);
      if (linkEl) linkEl.textContent = url;
      if (openBtn)openBtn.setAttribute('href', url);
      const overlay = document.getElementById('qrOverlay');
      overlay.classList.add('active');
    } catch(e){
      showToast('⚠️ Lỗi QR: ' + e);
    }
  };
  window.hideQR = function(){
    document.getElementById('qrOverlay')?.classList.remove('active');
  };
  window.copyQRLink = function(){
    const el = document.getElementById('qrUrlText');
    const url = el ? el.textContent : '';
    if (!url) { showToast('⚠️ Không có link'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(()=>showToast('📋 Đã copy link dẫn đường'))
        .catch(()=>showToast('⚠️ Không copy được'));
      return;
    }
    showToast(url);
  };
})();

/* Google Maps paste widget */
function openGmPaste(){
  const m = document.getElementById('gmpaste-root');
  if(!m) return; m.classList.add('active');
  setTimeout(()=> document.getElementById('gmaps-input')?.focus(), 30);
}
function closeGmPaste(){ document.getElementById('gmpaste-root')?.classList.remove('active'); }
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeGmPaste(); });

(function setupGoogleMapsPaste(map){
  if(!map || typeof map.flyTo !== 'function'){
    console.warn('[OCM] setupGoogleMapsPaste: map chưa sẵn sàng'); return;
  }
  const $input = document.getElementById('gmaps-input');
  const $go    = document.getElementById('gmaps-go');
  const $copy  = document.getElementById('gmaps-copy');
  let currentMarker = null;
  function ensureMarker(lng, lat){
    if(currentMarker){ currentMarker.remove(); }
    const el = document.createElement('div'); el.className = 'ocm-pin';
    currentMarker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([lng, lat])
      .setPopup(new maplibregl.Popup({ offset: 16 }).setHTML(
        `<div style="font:500 14px/20px system-ui">Vị trí đã chọn</div>
         <div style="font:12px/18px ui-monospace,Menlo,Consolas">
           lat: ${lat.toFixed(6)}<br>lng: ${lng.toFixed(6)}
         </div>`
      ))
      .addTo(map);
    return currentMarker;
  }
  function focus(lng, lat){
    map.flyTo({ center: [lng, lat], zoom: 18, essential: true });
    const mk = ensureMarker(lng, lat);
    setTimeout(()=> mk.togglePopup(), 350);
  }

  function parseGmaps(input){
    if(!input) return null;
    let s = String(input).trim();
    try { s = decodeURIComponent(s); } catch {}
    s = s.replace(/\+/g,' ')
         .replace(/[\u00A0\u2000-\u200D]/g,' ')
         .replace(/，/g, ',')
         .replace(/\s+/g,' ')
         .trim();
    let m = s.match(/(-?\d+(?:\.\d+)?)[\s\u200B]*[,，][\s\u200B]*(-?\d+(?:\.\d+)?)/);
    if (m) {
      const a = parseFloat(m[1]), b = parseFloat(m[2]);
      if (Number.isFinite(a) && Number.isFinite(b)){
        let lat, lng;
        if (Math.abs(a) <= 90 && Math.abs(b) <= 180) { lat=a; lng=b; }
        else { lat=b; lng=a; }
        return { lat, lng };
      }
    }
    m = s.match(/@(-?\d+(?:\.\d+)?)[\s\u200B]*,[\s\u200B]*(-?\d+(?:\.\d+)?)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    m = s.match(/[?&](?:q|query)=(-?\d+(?:\.\d+)?)[\s\u200B]*,[\s\u200B]*(-?\d+(?:\.\d+)?)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    m = s.match(/!3d(-?\d+(?:\.\d+)?)[\s\u200B]*!4d(-?\d+(?:\.\d+)?)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    m = s.match(/!4d(-?\d+(?:\.\d+)?)[\s\u200B]*!3d(-?\d+(?:\.\d+)?)/);
    if (m) return { lat: parseFloat(m[2]), lng: parseFloat(m[1]) };
    const nums = (s.match(/-?\d+(?:\.\d+)?/g) || []).map(Number).filter(Number.isFinite);
    if (nums.length >= 2) {
      let a = nums[0], b = nums[1]; let lat, lng;
      if (Math.abs(a) <= 90 && Math.abs(b) <= 180) { lat=a; lng=b; }
      else { lat=b; lng=a; }
      return { lat, lng };
    }
    return null;
  }
  function handleGo(){
    const raw = $input.value;
    const pt = parseGmaps(raw);
    if(!pt){
      $input.setCustomValidity('Không đọc được toạ độ. Hãy dán link Google Maps hoặc cặp số lat,lng.');
      $input.reportValidity();
      setTimeout(()=> $input.setCustomValidity(''), 1500);
      return;
    }
    focus(pt.lng, pt.lat);
  }
  function handleCopy(){
    const c = map.getCenter();
    const text = `${c.lat.toFixed(8)}, ${c.lng.toFixed(8)}`;
    navigator.clipboard.writeText(text).then(()=>{
      $copy.textContent = 'Đã copy';
      setTimeout(()=> $copy.textContent = 'Copy toạ độ', 1000);
    }).catch(()=>{ alert(text); });
  }
  $input.addEventListener('keydown', e=>{ if(e.key==='Enter') handleGo(); });
  $go.addEventListener('click', handleGo);
  $copy.addEventListener('click', handleCopy);
})(map);

/* =========================================================
   PROFILE PANEL
   ========================================================= */
const btnAccount = document.getElementById('btnAccount');
const profilePanel = document.getElementById('profilePanel');
const profileOverlay = document.getElementById('profileOverlay');
btnAccount.addEventListener('click', ()=> toggleProfile());
function toggleProfile(force){
  const open = (typeof force === 'boolean') ? force : !profilePanel.classList.contains('active');
  if(open){
    profilePanel.style.display = 'block';
    requestAnimationFrame(()=>{
      profilePanel.classList.add('active');
      profileOverlay.classList.add('active');
    });
  } else {
    profilePanel.classList.remove('active');
    profileOverlay.classList.remove('active');
    setTimeout(()=>{
      if(!profilePanel.classList.contains('active')) profilePanel.style.display='none';
    }, 180);
  }
}
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') toggleProfile(false); });
function copy(text){
  navigator.clipboard?.writeText(String(text)).then(()=>showToast('📋 Đã copy'));
}
function copyUserEmail(){ if(currentUser?.email) copy(currentUser.email); }
function copySid(){ showToast('SID hiện lấy từ CP_AUTH_TOKEN, không dùng ocm_sid nữa'); }

/* =========================================================
   ENTRY
   ========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
  const user = ensureUserOrRedirect();
  if (!user) return;

  enableLooseTap();

  try{
    await Promise.all([
      loadPlots(),
      loadOverlays(),
      loadSpiritualSites(),
      fetchHolds()
    ]);
  }catch(e){
    console.error('OCM init error', e);
    showToast('⚠️ Lỗi tải dữ liệu OCM');
  }

  setInterval(fetchHolds, 8000);
});
