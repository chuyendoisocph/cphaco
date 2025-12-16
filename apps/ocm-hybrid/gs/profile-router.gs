/*********************************************************
 * PROFILE – USERS Router (no-conflict, plug-in module)
 * - Không đụng chạm logic/hàm khác
 * - Dò JSON hoặc x-www-form-urlencoded
 * - Đọc/ghi sheet USERS theo header tiếng Việt có dấu
 **********************************************************/

/** CONFIG */
const PROFILE_SPREADSHEET_ID = '190KTfaRU56bYOU9E_EhM7GTyBXommqbJ0SFkF1pqXoY';
const PROFILE_USERS_SHEET    = 'USERS';
const PROFILE_TZ = 'Asia/Ho_Chi_Minh';
const PROFILE_AVATAR_FOLDER_ID = '1FHXbAZwyQDsflq0bW5rfjP08g2nvuTmP'; // ví dụ: '1AbC...xyz' hoặc để '' để auto-create
const PROFILE_AVATAR_FOLDER_NAME = 'USERS_AVATARS';

// format ISO datetime theo TZ
function PROFILE__isoDT_(d) {
  if (!d) return '';
  try {
    return Utilities.formatDate(new Date(d), PROFILE_TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
  } catch(_) { return String(d); }
}

// format ISO date (chỉ ngày) theo TZ
function PROFILE__isoD_(d) {
  if (!d) return '';
  try {
    return Utilities.formatDate(new Date(d), PROFILE_TZ, "yyyy-MM-dd");
  } catch(_) { return String(d); }
}

// ép thành chuỗi, giữ số 0 đầu
function PROFILE__asPhone_(v) {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  // nếu người dùng lỡ nhập dạng số, vẫn trả ra chuỗi
  return s;
}


/** Utils */
function PROFILE_json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function PROFILE__normalizeKey(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // bỏ dấu
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function PROFILE__headerMap_(sh) {
  const header = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const norm2idx = {};
  header.forEach((h, i) => { norm2idx[PROFILE__normalizeKey(h)] = i; });
  return { header, norm2idx };
}

function PROFILE__col(norm2idx, aliases) {
  for (const a of aliases) {
    const idx = norm2idx[PROFILE__normalizeKey(a)];
    if (idx != null) return idx;
  }
  return null;
}

function PROFILE__getUsersSheet_() {
  const ss = SpreadsheetApp.openById(PROFILE_SPREADSHEET_ID);
  const sh = ss.getSheetByName(PROFILE_USERS_SHEET);
  if (!sh) throw new Error(`Sheet "${PROFILE_USERS_SHEET}" not found`);
  const { header, norm2idx } = PROFILE__headerMap_(sh);

  const idx = {
    stt:       PROFILE__col(norm2idx, ['STT']),
    email:     PROFILE__col(norm2idx, ['Email']),
    name:      PROFILE__col(norm2idx, ['Họ tên','Ho ten','Full Name','Name']),
    sdt:       PROFILE__col(norm2idx, ['SĐT','So dien thoai','Dien thoai','Mobile']),
    branch:    PROFILE__col(norm2idx, ['Chi nhánh','Chi nhanh','Branch']),
    role:      PROFILE__col(norm2idx, ['Chức vụ','Chuc vu','Role','Position']),
    pwHash:    PROFILE__col(norm2idx, ['Password Hash']),
    salt:      PROFILE__col(norm2idx, ['Salt']),
    status:    PROFILE__col(norm2idx, ['Status','Trạng thái','Trang thai']),
    created:   PROFILE__col(norm2idx, ['Created','Ngày tạo','Ngay tao']),
    lastLogin: PROFILE__col(norm2idx, ['Last Login','Lần đăng nhập cuối','Lan dang nhap cuoi']),
    phone:     PROFILE__col(norm2idx, ['Phone','Điện thoại']),
    birthDate: PROFILE__col(norm2idx, ['Birth Date','Ngày sinh','Ngay sinh','DOB']),
    address:   PROFILE__col(norm2idx, ['Address','Địa chỉ','Dia chi']),
    bio:       PROFILE__col(norm2idx, ['Bio','Giới thiệu','Gioi thieu']),
    avatar:    PROFILE__col(norm2idx, ['Avatar','Ảnh đại diện','Anh dai dien','Photo','Image']),
    joinDate:  PROFILE__col(norm2idx, ['Join Date','Ngày vào','Ngay vao'])
  };
  if (idx.email == null) throw new Error('Header "Email" is required in USERS');

  return { sh, header, idx };
}

function PROFILE__parseRequest_(e) {
  const method = (e && e.method) || (e && e.postData ? 'POST' : 'GET');
  const contentType = (e && e.postData && e.postData.type) || '';
  let data = {};

  if (/x-www-form-urlencoded|multipart\/form-data/i.test(contentType)) {
    data = Object.assign({}, e.parameter);
  } else if (/application\/json/i.test(contentType)) {
    try {
      data = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    } catch (_) {
      data = Object.assign({}, e.parameter);
    }
  } else {
    data = Object.assign({}, e && e.parameter ? e.parameter : {});
  }
  const action = (data.action || (e && e.parameter && e.parameter.action) || '').toString();
  return { method, action, data };
}

/** ===== Core profile ops ===== */
function PROFILE_updateProfile(data) {
  if (!data || !data.email) return { ok:false, error:'Missing field: email' };
  const emailKey = String(data.email).trim().toLowerCase();

  const { sh, header, idx } = PROFILE__getUsersSheet_();
  const lastRow = sh.getLastRow();
  const lastCol = header.length;

  const values = lastRow > 1
    ? sh.getRange(2, 1, lastRow - 1, lastCol).getValues()
    : [];

  let rowIdx = -1; // index trong mảng values
  for (let r = 0; r < values.length; r++) {
    const vEmail = (values[r][idx.email] || '').toString().trim().toLowerCase();
    if (vEmail && vEmail === emailKey) { rowIdx = r; break; }
  }

  // canonical fields (chỉ set khi client gửi)
  const name      = data.name       ?? null;
  const phone     = data.phone      ?? null;
  const sdt       = data.sdt ?? data['SĐT'] ?? null;
  const birthDate = data.birthDate  ?? null;
  const address   = data.address    ?? null;
  const bio       = data.bio        ?? null;

  // NEW: nếu avatar là URL/base64 → upload lên Drive → lấy url public
  let avatarUrl   = null;
  if (data.avatar) {
    try {
      const up = PROFILE__saveAvatar_(data.email, data.avatar);
      avatarUrl = up.url;
    } catch (e) {
      // Nếu upload fail, bạn có thể:
      // - bỏ qua (không ghi avatar)
      // - hoặc ghi nguyên input (tùy bạn)
      // Ở đây mình chọn bỏ qua, và để client tự xử lý thông báo
      avatarUrl = null;
    }
  }

  const branch    = data.branch     ?? null;
  const role      = data.role       ?? null;
  const status    = data.status     ?? null;
  const joinDate  = data.joinDate   ?? null;

  if (rowIdx === -1) {
    // create new
    const row = new Array(lastCol).fill('');
    if (idx.email     != null) row[idx.email]    = data.email;
    if (idx.name      != null && name      != null) row[idx.name]      = name;
    if (idx.phone     != null && phone     != null) row[idx.phone]     = phone;
    if (idx.sdt       != null && sdt       != null) row[idx.sdt]       = sdt;
    if (idx.birthDate != null && birthDate != null) row[idx.birthDate] = birthDate;
    if (idx.address   != null && address   != null) row[idx.address]   = address;
    if (idx.bio       != null && bio       != null) row[idx.bio]       = bio;
      if (idx.avatar    != null) {
    if      (avatarUrl != null) row[idx.avatar] = avatarUrl;
    else if (data.avatar != null) row[idx.avatar] = data.avatar; // fallback nếu bạn muốn
  }
    if (idx.branch    != null && branch    != null) row[idx.branch]    = branch;
    if (idx.role      != null && role      != null) row[idx.role]      = role;
    if (idx.status    != null && status    != null) row[idx.status]    = status;

    const now = new Date();
    if (idx.created   != null) row[idx.created]  = now;
    if (idx.joinDate  != null) row[idx.joinDate] = joinDate ?? '';

    sh.appendRow(row);
    return { ok:true, created:true };
  }

  // update existing (sheet row = rowIdx + 2)
  const range = sh.getRange(rowIdx + 2, 1, 1, lastCol);
  const row = range.getValues()[0];

  if (idx.name      != null && name      != null) row[idx.name]      = name;
  if (idx.phone     != null && phone     != null) row[idx.phone]     = phone;
  if (idx.sdt       != null && sdt       != null) row[idx.sdt]       = sdt;
  if (idx.birthDate != null && birthDate != null) row[idx.birthDate] = birthDate;
  if (idx.address   != null && address   != null) row[idx.address]   = address;
  if (idx.bio       != null && bio       != null) row[idx.bio]       = bio;
    if (idx.avatar    != null) {
    if      (avatarUrl != null) row[idx.avatar] = avatarUrl;
    else if (data.avatar != null) row[idx.avatar] = data.avatar; // fallback nếu bạn muốn
  }
  if (idx.branch    != null && branch    != null) row[idx.branch]    = branch;
  if (idx.role      != null && role      != null) row[idx.role]      = role;
  if (idx.status    != null && status    != null) row[idx.status]    = status;
  if (idx.joinDate  != null && joinDate  != null) row[idx.joinDate]  = joinDate;

  range.setValues([row]);
  return { ok:true, updated:true };
}

function PROFILE_getProfile(email) {
  if (!email) throw new Error('Missing email');
  const key = String(email).trim().toLowerCase();
  const { sh, idx } = PROFILE__getUsersSheet_();

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return null;

  const values = sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getValues();
  for (let r = 0; r < values.length; r++) {
    const vEmail = (values[r][idx.email] || '').toString().trim().toLowerCase();
    if (vEmail === key) {
      return {
        email:     values[r][idx.email]      ?? '',
        name:      idx.name      != null ? values[r][idx.name]      : '',
        sdt:       idx.sdt       != null ? values[r][idx.sdt]       : '',
        phone:     idx.phone     != null ? values[r][idx.phone]     : '',
        branch:    idx.branch    != null ? values[r][idx.branch]    : '',
        role:      idx.role      != null ? values[r][idx.role]      : '',
        status:    idx.status    != null ? values[r][idx.status]    : '',
        created:   idx.created   != null ? values[r][idx.created]   : '',
        lastLogin: idx.lastLogin != null ? values[r][idx.lastLogin] : '',
        birthDate: idx.birthDate != null ? values[r][idx.birthDate] : '',
        address:   idx.address   != null ? values[r][idx.address]   : '',
        bio:       idx.bio       != null ? values[r][idx.bio]       : '',
        avatar:    idx.avatar    != null ? values[r][idx.avatar]    : '',
        joinDate:  idx.joinDate  != null ? values[r][idx.joinDate]  : ''
      };
    }
  }
  return null;
}

/** ===== Tiny router you can call from your existing doGet/doPost =====
 * Trả về TextOutput nếu action do module này xử lý, ngược lại trả về null
 */
function PROFILE_routeGet(e) {
  const { action, data } = PROFILE__parseRequest_(e);
  try {
    if (action === 'get-profile') {
      const res = PROFILE_getProfile(data.email);
      return PROFILE_json({ ok:true, data: res });
    }
    if (action === 'health' || action === '') {
      return PROFILE_json({ ok:true, message:'Profile Service running', ts:new Date().toISOString() });
    }
    return null; // không phải action của module này
  } catch (err) {
    return PROFILE_json({ ok:false, error:String(err) });
  }
}

function PROFILE_routePost(e) {
  const { action, data } = PROFILE__parseRequest_(e);
  try {
    if (action === 'update-profile') {
      const res = PROFILE_updateProfile(data); // (sẽ auto upload nếu data.avatar có giá trị)
      return PROFILE_json(res);
    }
    if (action === 'upload-avatar') {
      if (!data.email) return PROFILE_json({ ok:false, error:'Missing field: email' });
      if (!data.avatar) return PROFILE_json({ ok:false, error:'Missing field: avatar' });
      const up = PROFILE__saveAvatar_(data.email, data.avatar);
      return PROFILE_json({ ok:true, ...up });
    }
    if (action === 'get-profile') {
      const res = PROFILE_getProfile(data.email);
      return PROFILE_json({ ok:true, data: res });
    }
    return null;
  } catch (err) {
    return PROFILE_json({ ok:false, error:String(err) });
  }
}


/** (Tùy chọn) Nếu client có gửi OPTIONS */
function PROFILE_routeOptions(_e) {
  return PROFILE_json({ ok:true });
}

function PROFILE_setupUsersSheet() {
  const { sh, idx } = PROFILE__getUsersSheet_();
  // Các cột cần text để không rớt số 0 đầu
  const textCols = [idx.sdt, idx.phone].filter(v => v != null).map(i => i + 1);
  textCols.forEach(col => sh.getRange(2, col, Math.max(1, sh.getMaxRows()-1), 1).setNumberFormat('@STRING@'));

  // Các cột ngày/giờ: tùy bạn thích hiển thị trong sheet — xuất JSON vẫn chuẩn hóa theo helper
  // Ví dụ: Created/Last Login: hiển thị dd/mm/yyyy hh:mm trong sheet
  if (idx.created != null)   sh.getRange(2, idx.created+1, Math.max(1, sh.getMaxRows()-1), 1).setNumberFormat('dd/mm/yyyy hh:mm');
  if (idx.lastLogin != null) sh.getRange(2, idx.lastLogin+1, Math.max(1, sh.getMaxRows()-1), 1).setNumberFormat('dd/mm/yyyy hh:mm');
  if (idx.joinDate != null)  sh.getRange(2, idx.joinDate+1,  Math.max(1, sh.getMaxRows()-1), 1).setNumberFormat('yyyy-mm-dd');
  if (idx.birthDate != null) sh.getRange(2, idx.birthDate+1, Math.max(1, sh.getMaxRows()-1), 1).setNumberFormat('yyyy-mm-dd');
}

function PROFILE__getAvatarFolder_() {
  if (PROFILE_AVATAR_FOLDER_ID) {
    return DriveApp.getFolderById(PROFILE_AVATAR_FOLDER_ID);
  }
  // tìm theo tên, nếu chưa có thì tạo
  const it = DriveApp.getFoldersByName(PROFILE_AVATAR_FOLDER_NAME);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(PROFILE_AVATAR_FOLDER_NAME);
}

function PROFILE__fileViewUrl_(fileId) {
  // URL nhẹ để nhúng ảnh (không thanh Drive UI)
  return 'https://drive.google.com/uc?export=view&id=' + fileId;
}

function PROFILE__inferExtFromMime_(mime) {
  if (!mime) return 'png';
  if (mime.indexOf('jpeg') > -1) return 'jpg';
  if (mime.indexOf('png')  > -1) return 'png';
  if (mime.indexOf('webp') > -1) return 'webp';
  if (mime.indexOf('gif')  > -1) return 'gif';
  if (mime.indexOf('svg')  > -1) return 'svg';
  return 'png';
}

function PROFILE__toBlobFromInput_(avatarInput) {
  // avatarInput có thể là:
  // - URL http(s) đến ảnh
  // - data URL: data:image/png;base64,AAAA...
  // - raw base64 (không header) → mặc định image/png
  const s = String(avatarInput || '').trim();
  if (!s) return null;

  // data URL?
  if (s.startsWith('data:')) {
    const m = s.match(/^data:([^;]+);base64,(.+)$/i);
    if (!m) return null;
    const mime = m[1];
    const bytes = Utilities.base64Decode(m[2]);
    return Utilities.newBlob(bytes, mime, 'upload.' + PROFILE__inferExtFromMime_(mime));
  }

  // http(s) URL?
  if (/^https?:\/\//i.test(s)) {
    const resp = UrlFetchApp.fetch(s, { muteHttpExceptions: true, followRedirects: true });
    const code = resp.getResponseCode();
    if (code < 200 || code >= 300) throw new Error('Fetch avatar URL failed: HTTP ' + code);
    const ct = resp.getHeaders()['Content-Type'] || resp.getHeaders()['content-type'] || 'image/png';
    const blob = resp.getBlob();
    // đảm bảo đúng mime
    blob.setContentType(ct);
    blob.setName('upload.' + PROFILE__inferExtFromMime_(ct));
    return blob;
  }

  // raw base64 (không header)
  try {
    const bytes = Utilities.base64Decode(s);
    const blob = Utilities.newBlob(bytes, 'image/png', 'upload.png');
    return blob;
  } catch (e) {
    throw new Error('Unsupported avatar input format');
  }
}

function PROFILE__saveAvatar_(email, avatarInput) {
  if (!avatarInput) throw new Error('Missing avatar');
  const folder = PROFILE__getAvatarFolder_();
let blob = PROFILE__toBlobFromInput_(avatarInput);
if (!blob) throw new Error('Cannot build image blob');
// NEW: resize cho nhẹ
blob = PROFILE__resizeSquare_(blob, 512);
  blob = PROFILE__resizeSquare_(blob, 512);
  const ts = Utilities.formatDate(new Date(), PROFILE_TZ || 'Asia/Ho_Chi_Minh', 'yyyyMMdd-HHmmss');
  const safeEmail = String(email || 'unknown').replace(/[^\w@.+-]/g, '_');
  const ext = blob.getName().split('.').pop();
  const fileName = `avatar_${safeEmail}_${ts}.${ext}`;

  const file = folder.createFile(blob).setName(fileName);

  // Cho phép xem với link (nếu bạn muốn công khai trong web app)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    fileId: file.getId(),
    url: PROFILE__fileViewUrl_(file.getId()),
    name: file.getName(),
    mimeType: file.getMimeType(),
  };
}
function PROFILE__resizeSquare_(blob, target = 512) {
  try {
    const img = ImagesService.open(blob);
    const w = img.getWidth(), h = img.getHeight();
    const maxSide = Math.max(w, h);
    const scale = target / maxSide;
    const newW = Math.max(1, Math.round(w * scale));
    const newH = Math.max(1, Math.round(h * scale));
    const resized = img.resize(newW, newH);
    return resized.getBlob().setName(blob.getName()).setContentType(blob.getContentType());
  } catch (_) {
    // Không resize được (file WebP/SVG…), trả blob gốc
    return blob;
  }
}

function PROFILE__trashOldAvatarIfAny_(oldVal) {
  const oldId = PROFILE__extractFileId_(oldVal);
  if (!oldId) return;
  try { DriveApp.getFileById(oldId).setTrashed(true); } catch (_){}
}
