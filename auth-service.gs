/**
 * ============================================
 * CPHACO AUTH SERVICE - PASSWORD AUTHENTICATION
 * Google Apps Script Web App
 * ============================================
 *
 * Deploy as Web App:
 * 1. Deploy > New deployment
 * 2. Type: Web app
 * 3. Execute as: Me
 * 4. Who has access: Anyone
 * 5. Copy Web App URL -> dùng làm AUTH_BASE phía client
 */

// ===== CONFIGURATION =====
const SPREADSHEET_ID = '190KTfaRU56bYOU9E_EhM7GTyBXommqbJ0SFkF1pqXoY'; // Sheet ID
const JWT_SECRET = '1xqBJtlbUAz6vbbHy00Myfhzw2L45iL_rTpP9mtuk5FxU79cJUkWntYAB'; // đổi secret
const TOKEN_EXPIRY_HOURS = 8; // Token hết hạn sau 8 giờ

// ====== ROBUST PARSERS / ROUTING HELPERS ======
function parseBodyUltra(e) {
  let out = {};
  const params = (e && e.parameter) ? e.parameter : {};

  if (e && e.postData && e.postData.contents) {
    const raw = e.postData.contents || '';
    const type = (e.postData.type || '').toLowerCase();

    if (type.indexOf('application/json') !== -1) {
      try {
        const j = JSON.parse(raw);
        if (j && typeof j === 'object') {
          out = (j.data && typeof j.data === 'object')
            ? Object.assign({}, j.data, j)
            : Object.assign({}, j);
        }
      } catch (_) { /* bỏ qua, sẽ merge params */ }
    }
    // urlencoded/multipart: Apps Script đã đưa text fields vào e.parameter
  }

  return Object.assign({}, params, out);
}

function getAction(body, e) {
  const q = (e && e.parameter) ? e.parameter : {};
  const cand = [
    body && body.action,
    body && body.cmd,
    body && body.type,
    body && body.method,
    body && body.data && body.data.action,
    body && body.payload && body.payload.action,
    q && q.action,
    q && q.cmd
  ].filter(v => typeof v === 'string' && v.trim() !== '');

  const first = (cand[0] || '').trim().toLowerCase();

  const alias = {
    'signin':'login',
    'log-in':'login',
    'sign-in':'login',
    'otp-send':'send-otp',
    'otp-verify':'verify-otp',
    'profile-update':'update-profile',
    'profile-get':'get-profile'
  };
  return alias[first] || first;
}

function looksLikeLogin(obj){
  if (!obj || typeof obj !== 'object') return false;
  const keys = Object.keys(obj).map(k => k.toLowerCase());
  const hasUser = keys.includes('email') || keys.includes('username') || keys.includes('user');
  const hasPass = keys.includes('password') || keys.includes('pass') || keys.includes('pwd');
  return hasUser && hasPass;
}

// ===== MAIN HANDLERS =====
function doPost(e) {
  try {
    Logger.log('[POST] type=%s len=%s',
      e && e.postData ? (e.postData.type || '') : 'N/A',
      e && e.postData ? String((e.postData.contents || '').length) : '0'
    );

    // 1) Parse chịu đòn
    const data = parseBodyUltra(e);

    // 2) Lấy action (body/query/alias)
    const action = getAction(data, e);
    Logger.log('Received action: %s', action);
    Logger.log('Request data: %s', JSON.stringify(data));

    // 3) Chuyển sang PROFILE module nếu đúng action
    if (isProfileAction(action)) {
      // Yêu cầu bạn đã có PROFILE_routePost
      const maybeProfile = PROFILE_routePost({
        method: 'POST',
        postData: e && e.postData ? e.postData : null,
        parameter: e ? e.parameter : {},
        body: data
      });
      if (maybeProfile) return maybeProfile;
    }

    // 4) Router cũ
    switch (action) {
      case 'login':            return handleLogin(data);
      case 'send-otp':         return handleSendOTP(data);
      case 'verify-otp':       return handleVerifyOTP(data);
      case 'reset-password':   return handleResetPassword(data);
      case 'change-password':  return handleChangePassword(data);
      case 'enable-2fa':       return handleEnable2FA(data);
      case 'disable-2fa':      return handleDisable2FA(data);
      case 'verify-2fa':       return handleVerify2FA(data);

      default:
        if (looksLikeLogin(data)) {
          Logger.log('[POST] Fallback → treat as login');
          return handleLogin(data);
        }
        return ContentService.createTextOutput(JSON.stringify({
          ok: false, error: 'Unknown action: ' + (action || '')
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false, error: String(err)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Chỉ liệt kê đúng action của PROFILE để tránh chắn login
function isProfileAction(action) {
  return action === 'update-profile'
      || action === 'get-profile'
      || action === 'upload-avatar'
      || action === 'delete-avatar'
      || action === 'profile';
}

function doGet(e) {
  const action = e && e.parameter ? String(e.parameter.action || '').toLowerCase() : '';

  if (isProfileAction(action)) {
    // Yêu cầu bạn đã có PROFILE_routeGet
    const maybeProfile = PROFILE_routeGet(e);
    if (maybeProfile) return maybeProfile;
  }

  if (action === 'health') {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Cphaco Auth Service is running',
      version: '1.1.0',
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    ok: false, error: 'Unknown GET action: ' + action
  })).setMimeType(ContentService.MimeType.JSON);
}

// ===== LOGIN WITH PASSWORD =====
function handleLogin(data) {
  const email = data.email;
  const password = data.password;
  const app = data.app || 'PORTAL';
  const returnTo = data.returnTo || 'dashboard.html';

  if (!email || !password) {
    return jsonResponse({ ok: false, error: 'Email và mật khẩu không được để trống' });
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName('USERS');
  if (!usersSheet) {
    return jsonResponse({ ok: false, error: 'USERS sheet not found' });
  }

  const userData = usersSheet.getDataRange().getValues();
  const headers = userData[0];

  const emailCol = headers.indexOf('Email');
  const passwordHashCol = headers.indexOf('Password Hash');
  const saltCol = headers.indexOf('Salt');
  const statusCol = headers.indexOf('Status');
  const nameCol = headers.indexOf('Họ tên');
  const roleCol = headers.indexOf('Chức vụ');
  const branchCol = headers.indexOf('Chi nhánh');
  const lastLoginCol = headers.indexOf('Last Login');

  let userRow = null, rowIndex = -1;
  for (let i = 1; i < userData.length; i++) {
    if (userData[i][emailCol] && userData[i][emailCol].toString().toLowerCase() === email.toLowerCase()) {
      userRow = userData[i];
      rowIndex = i + 1;
      break;
    }
  }

  if (!userRow) {
    return jsonResponse({ ok: false, error: 'Email hoặc mật khẩu không đúng' });
  }

  if (userRow[statusCol] !== 'Active') {
    return jsonResponse({ ok: false, error: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.' });
  }

  const storedHash = userRow[passwordHashCol];
  const salt = userRow[saltCol];
  if (!storedHash || !salt) {
    return jsonResponse({ ok: false, error: 'Tài khoản chưa được cấu hình mật khẩu. Vui lòng liên hệ quản trị viên.' });
  }

  const inputHash = hashPassword(password, salt);
  if (inputHash !== storedHash) {
    return jsonResponse({ ok: false, error: 'Email hoặc mật khẩu không đúng' });
  }

  // 2FA?
  const props = PropertiesService.getScriptProperties();
  const twoFASecret = props.getProperty('2FA_SECRET_' + email);
  if (twoFASecret) {
    // LƯU temp token KÈM TIMESTAMP (không dùng setTimeout)
    const tempToken = Utilities.getUuid();
    props.setProperty('TEMP_TOKEN_' + email, JSON.stringify({
      token: tempToken,
      timestamp: Date.now()
    }));
    return jsonResponse({
      ok: true,
      requires2FA: true,
      tempToken: tempToken,
      message: 'Vui lòng nhập mã 2FA từ ứng dụng Authenticator'
    });
  }

  // Quyền
  const permissions = getUserPermissions(ss, email, app);
  if (!permissions || permissions.length === 0) {
    return jsonResponse({ ok: false, error: 'Bạn không có quyền truy cập ứng dụng này' });
  }

  // Cập nhật last login
  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  usersSheet.getRange(rowIndex, lastLoginCol + 1).setValue(dateStr);

  // JWT
  const payload = {
    email: email,
    name: userRow[nameCol],
    role: userRow[roleCol],
    branch: userRow[branchCol],
    permissions: permissions,
    app: app,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (TOKEN_EXPIRY_HOURS * 3600)
  };
  const token = createJWT(payload);

  logAudit(ss, email, app, 'LOGIN', 'Successful login');

  return jsonResponse({
    ok: true,
    token: token,
    redirect: returnTo,
    user: {
      email: email,
      name: userRow[nameCol],
      role: userRow[roleCol],
      branch: userRow[branchCol]
    }
  });
}

// ===== OTP FUNCTIONS =====
function handleSendOTP(data) {
  const email = data.email;
  if (!email) return jsonResponse({ ok: false, error: 'Email không được để trống' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const props = PropertiesService.getScriptProperties();
  const otpKey = 'OTP_' + email;
  props.setProperty(otpKey, JSON.stringify({ code: otp, timestamp: Date.now(), email }));

  try {
    MailApp.sendEmail({
      to: email,
      subject: 'Mã OTP đăng nhập Cphaco.app',
      name: 'Cphaco.app',
      replyTo: 'noreply@cphaco.app',
      htmlBody: `<!DOCTYPE html><html><body>
        <div style="font-family:Arial,sans-serif;">
          <h2>Mã OTP của bạn</h2>
          <div style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</div>
          <p>Mã có hiệu lực 10 phút.</p>
        </div>
      </body></html>`
    });

    return jsonResponse({ ok: true, message: 'OTP đã được gửi đến ' + email });
  } catch (error) {
    Logger.log('Error sending email: %s', error.toString());
    return jsonResponse({ ok: false, error: 'Không thể gửi email. Vui lòng thử lại sau.' });
  }
}

function handleVerifyOTP(data) {
  const email = data.email;
  const code = data.code;
  const purpose = data.purpose || 'signup';

  if (!email || !code) return jsonResponse({ ok: false, error: 'Email và mã OTP không được để trống' });

  const props = PropertiesService.getScriptProperties();
  const otpKey = 'OTP_' + email;
  const otpDataStr = props.getProperty(otpKey);
  if (!otpDataStr) return jsonResponse({ ok: false, error: 'Mã OTP không tồn tại hoặc đã hết hạn' });

  const otpData = JSON.parse(otpDataStr);
  const now = Date.now();
  if (now - otpData.timestamp > 10 * 60 * 1000) {
    props.deleteProperty(otpKey);
    return jsonResponse({ ok: false, error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' });
  }

  if (code !== otpData.code) return jsonResponse({ ok: false, error: 'Mã OTP không chính xác' });

  props.deleteProperty(otpKey);

  if (purpose === 'reset-password') {
    const resetToken = Utilities.getUuid();
    const tokenKey = 'RESET_TOKEN_' + email;
    props.setProperty(tokenKey, JSON.stringify({ token: resetToken, timestamp: Date.now() }));
    return jsonResponse({ ok: true, message: 'OTP xác thực thành công', resetToken });
  }

  return jsonResponse({ ok: true, message: 'OTP xác thực thành công' });
}

// ===== SIGNUP =====
function handleSignup(data) {
  Logger.log('=== SIGNUP REQUEST === %s', JSON.stringify(data));

  const fullname = data.fullname;
  const email = data.email;
  const password = data.password;
  const otpCode = data.otpCode;

  if (!fullname || !email || !password || !otpCode) {
    return jsonResponse({ ok: false, error: 'Thiếu thông tin bắt buộc' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return jsonResponse({ ok: false, error: 'Email không hợp lệ' });
  if (password.length < 8) return jsonResponse({ ok: false, error: 'Mật khẩu phải có ít nhất 8 ký tự' });

  const props = PropertiesService.getScriptProperties();
  const otpKey = 'OTP_' + email;
  const otpDataStr = props.getProperty(otpKey);
  if (!otpDataStr) return jsonResponse({ ok: false, error: 'Mã OTP không tồn tại hoặc đã hết hạn' });

  const otpData = JSON.parse(otpDataStr);
  if (Date.now() - otpData.timestamp > 10 * 60 * 1000) {
    props.deleteProperty(otpKey);
    return jsonResponse({ ok: false, error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' });
  }
  if (otpCode !== otpData.code) return jsonResponse({ ok: false, error: 'Mã OTP không chính xác' });
  props.deleteProperty(otpKey);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName('USERS');
  if (!usersSheet) return jsonResponse({ ok: false, error: 'USERS sheet not found' });

  const userData = usersSheet.getDataRange().getValues();
  const headers = userData[0];
  const emailCol = headers.indexOf('Email');

  for (let i = 1; i < userData.length; i++) {
    if (userData[i][emailCol] && userData[i][emailCol].toString().toLowerCase() === email.toLowerCase()) {
      return jsonResponse({ ok: false, error: 'Email này đã được sử dụng' });
    }
  }

  const salt = generateSalt(16);
  const hash = hashPassword(password, salt);

  const nameCol = headers.indexOf('Họ tên');
  const roleCol = headers.indexOf('Chức vụ');
  const branchCol = headers.indexOf('Chi nhánh');
  const phoneCol = headers.indexOf('Số điện thoại');
  const departmentCol = headers.indexOf('Phòng ban');
  const passwordHashCol = headers.indexOf('Password Hash');
  const saltCol = headers.indexOf('Salt');
  const statusCol = headers.indexOf('Status');
  const createdAtCol = headers.indexOf('Created At');
  const lastLoginCol = headers.indexOf('Last Login');

  const newRow = new Array(headers.length).fill('');
  newRow[emailCol] = email;
  newRow[nameCol] = fullname;
  newRow[roleCol] = 'User';
  newRow[branchCol] = '';
  newRow[phoneCol] = '';
  newRow[departmentCol] = '';
  newRow[passwordHashCol] = hash;
  newRow[saltCol] = salt;
  newRow[statusCol] = 'Active';
  newRow[createdAtCol] = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  newRow[lastLoginCol] = '';

  usersSheet.appendRow(newRow);

  const permSheet = ss.getSheetByName('PERMISSIONS');
  if (permSheet) {
    const permHeaders = permSheet.getRange(1, 1, 1, permSheet.getLastColumn()).getValues()[0];
    const permEmailCol = permHeaders.indexOf('Email');
    const permAppIdCol = permHeaders.indexOf('App ID');
    const permRoleCol = permHeaders.indexOf('Role');
    const permCanViewCol = permHeaders.indexOf('Can View');
    const permCanEditCol = permHeaders.indexOf('Can Edit');
    const permCanDeleteCol = permHeaders.indexOf('Can Delete');
    const permCanManageCol = permHeaders.indexOf('Can Manage');

    const permRow = new Array(permHeaders.length).fill('');
    permRow[permEmailCol] = email;
    permRow[permAppIdCol] = 'PORTAL';
    permRow[permRoleCol] = 'User';
    permRow[permCanViewCol] = true;
    permRow[permCanEditCol] = false;
    permRow[permCanDeleteCol] = false;
    permRow[permCanManageCol] = false;

    permSheet.appendRow(permRow);
  }

  logAudit(ss, email, 'PORTAL', 'SIGNUP', 'User registered successfully');

  return jsonResponse({
    ok: true,
    message: 'Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.',
    user: { email, name: fullname, role: 'User' }
  });
}

// ===== RESET PASSWORD =====
function handleResetPassword(data) {
  Logger.log('=== RESET PASSWORD REQUEST === %s', JSON.stringify(data));

  const email = data.email;
  const resetToken = data.resetToken;
  const newPassword = data.newPassword;

  if (!email || !resetToken || !newPassword) {
    return jsonResponse({ ok: false, error: 'Thiếu thông tin bắt buộc' });
  }
  if (newPassword.length < 8) {
    return jsonResponse({ ok: false, error: 'Mật khẩu phải có ít nhất 8 ký tự' });
  }

  const props = PropertiesService.getScriptProperties();
  const tokenKey = 'RESET_TOKEN_' + email;
  const tokenDataStr = props.getProperty(tokenKey);
  if (!tokenDataStr) return jsonResponse({ ok: false, error: 'Token không hợp lệ hoặc đã hết hạn' });

  const tokenData = JSON.parse(tokenDataStr);
  if (Date.now() - tokenData.timestamp > 30 * 60 * 1000) {
    props.deleteProperty(tokenKey);
    return jsonResponse({ ok: false, error: 'Token đã hết hạn. Vui lòng thực hiện lại quy trình.' });
  }
  if (resetToken !== tokenData.token) return jsonResponse({ ok: false, error: 'Token không hợp lệ' });

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName('USERS');

  const userData = usersSheet.getDataRange().getValues();
  const headers = userData[0];

  const emailCol = headers.indexOf('Email');
  const passwordHashCol = headers.indexOf('Password Hash');
  const saltCol = headers.indexOf('Salt');

  let rowIndex = -1;
  for (let i = 1; i < userData.length; i++) {
    if (userData[i][emailCol] && userData[i][emailCol].toString().toLowerCase() === email.toLowerCase()) {
      rowIndex = i + 1; break;
    }
  }
  if (rowIndex === -1) return jsonResponse({ ok: false, error: 'Không tìm thấy người dùng' });

  const salt = generateSalt(16);
  const hash = hashPassword(newPassword, salt);
  usersSheet.getRange(rowIndex, passwordHashCol + 1).setValue(hash);
  usersSheet.getRange(rowIndex, saltCol + 1).setValue(salt);

  props.deleteProperty(tokenKey);
  logAudit(ss, email, 'PORTAL', 'PASSWORD_RESET', 'Password reset successful');

  return jsonResponse({ ok: true, message: 'Mật khẩu đã được cập nhật thành công' });
}

// ===== CHANGE PASSWORD =====
function handleChangePassword(data) {
  const email = data.email;
  const currentPassword = data.currentPassword;
  const newPassword = data.newPassword;

  if (!email || !currentPassword || !newPassword) {
    return jsonResponse({ ok: false, error: 'Thiếu thông tin bắt buộc' });
  }
  if (newPassword.length < 8) {
    return jsonResponse({ ok: false, error: 'Mật khẩu mới phải có ít nhất 8 ký tự' });
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName('USERS');

  const userData = usersSheet.getDataRange().getValues();
  const headers = userData[0];

  const emailCol = headers.indexOf('Email');
  const passwordHashCol = headers.indexOf('Password Hash');
  const saltCol = headers.indexOf('Salt');
  const statusCol = headers.indexOf('Status');

  let userRow = null, rowIndex = -1;
  for (let i = 1; i < userData.length; i++) {
    if (userData[i][emailCol] && userData[i][emailCol].toString().toLowerCase() === email.toLowerCase()) {
      userRow = userData[i]; rowIndex = i + 1; break;
    }
  }
  if (!userRow) return jsonResponse({ ok: false, error: 'Không tìm thấy người dùng' });
  if (userRow[statusCol] !== 'Active') return jsonResponse({ ok: false, error: 'Tài khoản đã bị vô hiệu hóa' });

  const storedHash = userRow[passwordHashCol];
  const salt = userRow[saltCol];
  if (!storedHash || !salt) return jsonResponse({ ok: false, error: 'Tài khoản chưa có mật khẩu' });

  if (hashPassword(currentPassword, salt) !== storedHash) {
    return jsonResponse({ ok: false, error: 'Mật khẩu hiện tại không đúng' });
  }

  const newSalt = generateSalt(16);
  const newHash = hashPassword(newPassword, newSalt);
  usersSheet.getRange(rowIndex, passwordHashCol + 1).setValue(newHash);
  usersSheet.getRange(rowIndex, saltCol + 1).setValue(newSalt);

  logAudit(ss, email, 'PORTAL', 'PASSWORD_CHANGE', 'Password changed successfully');
  return jsonResponse({ ok: true, message: 'Mật khẩu đã được thay đổi thành công' });
}

// ===== 2FA =====
function handleEnable2FA(data) {
  const email = data.email;
  if (!email) return jsonResponse({ ok: false, error: 'Email không được để trống' });

  const secret = generate2FASecret();
  const props = PropertiesService.getScriptProperties();
  props.setProperty('2FA_SECRET_' + email, secret);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  logAudit(ss, email, 'PORTAL', '2FA_ENABLED', '2FA enabled for user');

  return jsonResponse({
    ok: true,
    secret: secret,
    qrCode: get2FAQRCode(email, secret),
    message: '2FA đã được bật. Vui lòng quét mã QR bằng ứng dụng Authenticator.'
  });
}

function handleDisable2FA(data) {
  const email = data.email;
  const code = data.code;
  if (!email || !code) return jsonResponse({ ok: false, error: 'Thiếu thông tin bắt buộc' });

  const props = PropertiesService.getScriptProperties();
  const secret = props.getProperty('2FA_SECRET_' + email);
  if (!secret) return jsonResponse({ ok: false, error: '2FA chưa được bật cho tài khoản này' });

  if (!verify2FACode(secret, code)) return jsonResponse({ ok: false, error: 'Mã 2FA không chính xác' });

  props.deleteProperty('2FA_SECRET_' + email);
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  logAudit(ss, email, 'PORTAL', '2FA_DISABLED', '2FA disabled for user');

  return jsonResponse({ ok: true, message: '2FA đã được tắt thành công' });
}

function handleVerify2FA(data) {
  const email = data.email;
  const code = data.code;
  const tempToken = data.tempToken;
  if (!email || !code || !tempToken) {
    return jsonResponse({ ok: false, error: 'Thiếu thông tin bắt buộc' });
  }

  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('TEMP_TOKEN_' + email);
  if (!raw) return jsonResponse({ ok: false, error: 'Token không hợp lệ hoặc đã hết hạn' });

  let stored;
  try { stored = JSON.parse(raw); } catch (_) { stored = null; }
  if (!stored || stored.token !== tempToken) return jsonResponse({ ok: false, error: 'Token không hợp lệ' });

  if (Date.now() - Number(stored.timestamp || 0) > 5 * 60 * 1000) {
    props.deleteProperty('TEMP_TOKEN_' + email);
    return jsonResponse({ ok: false, error: 'Token đã hết hạn' });
  }
  props.deleteProperty('TEMP_TOKEN_' + email);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName('USERS');

  const userData = usersSheet.getDataRange().getValues();
  const headers = userData[0];

  const emailCol = headers.indexOf('Email');
  const nameCol = headers.indexOf('Họ tên');
  const roleCol = headers.indexOf('Chức vụ');
  const branchCol = headers.indexOf('Chi nhánh');

  let userRow = null;
  for (let i = 1; i < userData.length; i++) {
    if (userData[i][emailCol] && userData[i][emailCol].toString().toLowerCase() === email.toLowerCase()) {
      userRow = userData[i]; break;
    }
  }
  if (!userRow) return jsonResponse({ ok: false, error: 'Không tìm thấy người dùng' });

  const permissions = getUserPermissions(ss, email, data.app || 'PORTAL');

  const payload = {
    email: email,
    name: userRow[nameCol],
    role: userRow[roleCol],
    branch: userRow[branchCol],
    permissions: permissions,
    app: data.app || 'PORTAL',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (TOKEN_EXPIRY_HOURS * 3600)
  };
  const token = createJWT(payload);

  logAudit(ss, email, data.app || 'PORTAL', 'LOGIN_2FA', '2FA verification successful');

  return jsonResponse({
    ok: true,
    token: token,
    redirect: data.returnTo || 'dashboard.html',
    user: {
      email: email,
      name: userRow[nameCol],
      role: userRow[roleCol],
      branch: userRow[branchCol]
    }
  });
}

// ===== 2FA HELPERS (minh hoạ TOTP đơn giản) =====
function generate2FASecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 16; i++) secret += chars.charAt(Math.floor(Math.random() * chars.length));
  return secret;
}

function get2FAQRCode(email, secret) {
  const issuer = 'Cphaco.app';
  const label = encodeURIComponent(issuer + ':' + email);
  const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  return `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(otpauthUrl)}`;
}

function verify2FACode(secret, code) {
  const now = Math.floor(Date.now() / 1000 / 30);
  for (let i = -1; i <= 1; i++) {
    const ts = now + i;
    if (generateTOTP(secret, ts) === code) return true;
  }
  return false;
}

function generateTOTP(secret, timestamp) {
  const data = secret + timestamp.toString();
  const hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_1,
    data,
    Utilities.Charset.UTF_8
  );
  const offset = hash[hash.length - 1] & 0x0f;
  const truncatedHash = (hash[offset] & 0x7f) << 24 |
                        (hash[offset + 1] & 0xff) << 16 |
                        (hash[offset + 2] & 0xff) << 8 |
                        (hash[offset + 3] & 0xff);
  return (truncatedHash % 1000000).toString().padStart(6, '0');
}

// ===== COMMON HELPERS =====
function getUserPermissions(ss, email, app) {
  const permSheet = ss.getSheetByName('PERMISSIONS');
  if (!permSheet) return [];

  const permData = permSheet.getDataRange().getValues();
  const headers = permData[0];

  const emailCol = headers.indexOf('Email');
  const appIdCol = headers.indexOf('App ID');
  const roleCol = headers.indexOf('Role');
  const canViewCol = headers.indexOf('Can View');
  const canEditCol = headers.indexOf('Can Edit');
  const canDeleteCol = headers.indexOf('Can Delete');
  const canManageCol = headers.indexOf('Can Manage');

  const permissions = [];
  for (let i = 1; i < permData.length; i++) {
    const row = permData[i];
    if (row[emailCol] && row[emailCol].toString().toLowerCase() === email.toLowerCase()) {
      if (!app || app === 'PORTAL' || row[appIdCol] === app) {
        permissions.push({
          appId: row[appIdCol],
          role: row[roleCol],
          canView: row[canViewCol] === true,
          canEdit: row[canEditCol] === true,
          canDelete: row[canDeleteCol] === true,
          canManage: row[canManageCol] === true
        });
      }
    }
  }
  return permissions;
}

function hashPassword(password, salt) {
  const input = salt + password;
  const hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    input,
    Utilities.Charset.UTF_8
  );
  return hash.map(byte => {
    const v = (byte & 0xFF).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function generateSalt(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  for (let i = 0; i < length; i++) salt += chars.charAt(Math.floor(Math.random() * chars.length));
  return salt;
}

function createJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = Utilities.computeHmacSha256Signature(
    encodedHeader + '.' + encodedPayload,
    JWT_SECRET
  );
  const encodedSignature = base64UrlEncode(signature);
  return encodedHeader + '.' + encodedPayload + '.' + encodedSignature;
}

function base64UrlEncode(input) {
  if (typeof input === 'string') input = Utilities.newBlob(input).getBytes();
  const base64 = Utilities.base64Encode(input);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function logAudit(ss, email, app, action, details) {
  try {
    const auditSheet = ss.getSheetByName('AUDIT_LOG');
    if (!auditSheet) return;
    const now = new Date();
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    auditSheet.appendRow([ timestamp, email, app, action, details, '' ]);
  } catch (error) {
    Logger.log('Error logging to audit: %s', error.toString());
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test helper – set admin password row 2
 */
function testCreateAdmin() {
  const email = 'admin@cphaco.vn';
  const password = 'Admin@123';

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName('USERS');

  const salt = generateSalt(16);
  const hash = hashPassword(password, salt);

  usersSheet.getRange(2, 7).setValue(hash); // Password Hash
  usersSheet.getRange(2, 8).setValue(salt); // Salt
  Logger.log('✅ Admin password updated successfully!');
}
