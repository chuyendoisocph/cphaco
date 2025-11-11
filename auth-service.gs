/**
 * ============================================
 * CPHACO AUTH SERVICE - PASSWORD AUTHENTICATION
 * Google Apps Script Web App
 * ============================================
 * 
 * Deploy as Web App:
 * 1. Click "Deploy" > "New deployment"
 * 2. Type: Web app
 * 3. Execute as: Me
 * 4. Who has access: Anyone
 * 5. Copy Web App URL -> use as AUTH_BASE in client
 */

// ===== CONFIGURATION =====
const SPREADSHEET_ID = '190KTfaRU56bYOU9E_EhM7GTyBXommqbJ0SFkF1pqXoY'; // Your Google Sheet ID
const JWT_SECRET = '1xqBJtlbUAz6vbbHy00Myfhzw2L45iL_rTpP9mtuk5FxU79cJUkWntYAB'; // Đổi thành secret key của bạn
const TOKEN_EXPIRY_HOURS = 8; // Token hết hạn sau 8 giờ

// ===== MAIN HANDLER =====

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    // Parse request body
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    Logger.log('Received action: %s', action);
    Logger.log('Request data: %s', JSON.stringify(data));
    
    // Route to appropriate handler
    switch(action) {
      case 'login':
        return handleLogin(data);
      
      case 'send-otp':
        return handleSendOTP(data);
      
      case 'verify-otp':
        return handleVerifyOTP(data);
      
      case 'reset-password':
        return handleResetPassword(data);
      
      case 'change-password':
        return handleChangePassword(data);
      
      case 'enable-2fa':
        return handleEnable2FA(data);
      
      case 'disable-2fa':
        return handleDisable2FA(data);
      
      case 'verify-2fa':
        return handleVerify2FA(data);
      
      default:
        return jsonResponse({
          ok: false,
          error: 'Invalid action'
        });
    }
    
  } catch (error) {
    Logger.log('Error in doPost: %s', error.toString());
    return jsonResponse({
      ok: false,
      error: 'Server error: ' + error.toString()
    });
  }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Cphaco Auth Service is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// ===== LOGIN WITH PASSWORD =====

/**
 * Handle login request
 */
function handleLogin(data) {
  const email = data.email;
  const password = data.password;
  const app = data.app || 'PORTAL';
  const returnTo = data.returnTo || 'dashboard.html';
  
  // Validate input
  if (!email || !password) {
    return jsonResponse({
      ok: false,
      error: 'Email và mật khẩu không được để trống'
    });
  }
  
  // Get spreadsheet
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName('USERS');
  
  if (!usersSheet) {
    return jsonResponse({
      ok: false,
      error: 'USERS sheet not found'
    });
  }
  
  // Find user by email
  const userData = usersSheet.getDataRange().getValues();
  const headers = userData[0];
  
  // Get column indices
  const emailCol = headers.indexOf('Email');
  const passwordHashCol = headers.indexOf('Password Hash');
  const saltCol = headers.indexOf('Salt');
  const statusCol = headers.indexOf('Status');
  const nameCol = headers.indexOf('Họ tên');
  const roleCol = headers.indexOf('Chức vụ');
  const branchCol = headers.indexOf('Chi nhánh');
  const lastLoginCol = headers.indexOf('Last Login');
  
  // Find user row
  let userRow = null;
  let rowIndex = -1;
  
  for (let i = 1; i < userData.length; i++) {
    if (userData[i][emailCol] && userData[i][emailCol].toString().toLowerCase() === email.toLowerCase()) {
      userRow = userData[i];
      rowIndex = i + 1; // 1-based index
      break;
    }
  }
  
  // User not found
  if (!userRow) {
    return jsonResponse({
      ok: false,
      error: 'Email hoặc mật khẩu không đúng'
    });
  }
  
  // Check if user is active
  const status = userRow[statusCol];
  if (status !== 'Active') {
    return jsonResponse({
      ok: false,
      error: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.'
    });
  }
  
  // Verify password
  const storedHash = userRow[passwordHashCol];
  const salt = userRow[saltCol];
  
  if (!storedHash || !salt) {
    return jsonResponse({
      ok: false,
      error: 'Tài khoản chưa được cấu hình mật khẩu. Vui lòng liên hệ quản trị viên.'
    });
  }
  
  const inputHash = hashPassword(password, salt);
  
  if (inputHash !== storedHash) {
    return jsonResponse({
      ok: false,
      error: 'Email hoặc mật khẩu không đúng'
    });
  }
  
  // Check if user has 2FA enabled
  const props = PropertiesService.getScriptProperties();
  const twoFASecret = props.getProperty('2FA_SECRET_' + email);
  
  if (twoFASecret) {
    // User has 2FA enabled - require 2FA verification
    // Generate temporary token
    const tempToken = Utilities.getUuid();
    props.setProperty('TEMP_TOKEN_' + email, tempToken);
    
    // Set expiry for temp token (5 minutes)
    setTimeout(() => {
      try {
        props.deleteProperty('TEMP_TOKEN_' + email);
      } catch(e) {}
    }, 5 * 60 * 1000);
    
    return jsonResponse({
      ok: true,
      requires2FA: true,
      tempToken: tempToken,
      message: 'Vui lòng nhập mã 2FA từ ứng dụng Authenticator'
    });
  }
  
  // No 2FA - proceed with normal login
  // Get user permissions
  const permissions = getUserPermissions(ss, email, app);
  
  // Check if user has access to this app
  if (!permissions || permissions.length === 0) {
    return jsonResponse({
      ok: false,
      error: 'Bạn không có quyền truy cập ứng dụng này'
    });
  }
  
  // Update last login
  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  usersSheet.getRange(rowIndex, lastLoginCol + 1).setValue(dateStr);
  
  // Create JWT token
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
  
  // Log to AUDIT_LOG
  logAudit(ss, email, app, 'LOGIN', 'Successful login');
  
  // Return success
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

// ===== OTP FUNCTIONS (for signup & forgot password) =====

/**
 * Handle send OTP request
 */
function handleSendOTP(data) {
  const email = data.email;
  
  if (!email) {
    return jsonResponse({
      ok: false,
      error: 'Email không được để trống'
    });
  }
  
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP in Properties Service (expires in 10 minutes)
  const props = PropertiesService.getScriptProperties();
  const otpKey = 'OTP_' + email;
  const otpData = {
    code: otp,
    timestamp: Date.now(),
    email: email
  };
  
  props.setProperty(otpKey, JSON.stringify(otpData));
  
  // Send email with OTP
  try {
MailApp.sendEmail({
  to: email,
  subject: 'Mã OTP đăng nhập Cphaco.app',
  name: 'Cphaco.app',
  replyTo: 'noreply@cphaco.app',
  htmlBody: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
        <tr>
          <td align="center">
            <!-- Main Container -->
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header with Logo -->
              <tr>
                <td style="background: linear-gradient(135deg, #0066FF, #00C9FF); padding: 40px 30px; text-align: center;">
                  <img src="https://i.postimg.cc/FzqRG7Kp/CPH-LOGO-1.png" alt="Cphaco Logo" style="height: 60px; margin-bottom: 10px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Xác thực tài khoản</h1>
                </td>
              </tr>
              
              <!-- Body Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Xin chào,
                  </p>
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                    Mã OTP để xác thực tài khoản Cphaco.app của bạn là:
                  </p>
                  
                  <!-- OTP Code Box -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 30px 0;">
                        <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
                        ${otp}
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Info Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: #fff9e6; border-left: 4px solid #ffc107; border-radius: 8px; margin: 30px 0;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                          ⏰ <strong>Lưu ý:</strong> Mã này chỉ có hiệu lực trong <strong>10 phút</strong>.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                    Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi nếu bạn có bất kỳ thắc mắc nào.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #999999; font-size: 12px; margin: 0 0 10px;">
                    Đây là email tự động, vui lòng không trả lời email này.
                  </p>
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    © 2025 <strong>Cphaco.app</strong> - All rights reserved.
                  </p>
                  <div style="margin-top: 20px;">
                    <a href="https://cphaco.app" style="color: #0066FF; text-decoration: none; margin: 0 10px; font-size: 12px;">Website</a>
                    <span style="color: #cccccc;">|</span>
                    <a href="mailto:support@cphaco.app" style="color: #0066FF; text-decoration: none; margin: 0 10px; font-size: 12px;">Hỗ trợ</a>
                    <span style="color: #cccccc;">|</span>
                    <a href="https://cphaco.app/privacy" style="color: #0066FF; text-decoration: none; margin: 0 10px; font-size: 12px;">Chính sách</a>
                  </div>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
});
    
    return jsonResponse({
      ok: true,
      message: 'OTP đã được gửi đến ' + email
    });
    
  } catch (error) {
    Logger.log('Error sending email: %s', error.toString());
    return jsonResponse({
      ok: false,
      error: 'Không thể gửi email. Vui lòng thử lại sau.'
    });
  }
}

/**
 * Handle verify OTP request
 */
function handleVerifyOTP(data) {
  const email = data.email;
  const code = data.code;
  const purpose = data.purpose || 'signup'; // 'signup' or 'reset-password'
  
  if (!email || !code) {
    return jsonResponse({
      ok: false,
      error: 'Email và mã OTP không được để trống'
    });
  }
  
  // Get stored OTP
  const props = PropertiesService.getScriptProperties();
  const otpKey = 'OTP_' + email;
  const otpDataStr = props.getProperty(otpKey);
  
  if (!otpDataStr) {
    return jsonResponse({
      ok: false,
      error: 'Mã OTP không tồn tại hoặc đã hết hạn'
    });
  }
  
  const otpData = JSON.parse(otpDataStr);
  
  // Check if OTP expired (10 minutes)
  const now = Date.now();
  const elapsed = now - otpData.timestamp;
  const TEN_MINUTES = 10 * 60 * 1000;
  
  if (elapsed > TEN_MINUTES) {
    props.deleteProperty(otpKey);
    return jsonResponse({
      ok: false,
      error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.'
    });
  }
  
  // Verify OTP code
  if (code !== otpData.code) {
    return jsonResponse({
      ok: false,
      error: 'Mã OTP không chính xác'
    });
  }
  
  // OTP verified successfully
  // Delete used OTP
  props.deleteProperty(otpKey);
  
  Logger.log('OTP verified successfully for: %s', email);
  Logger.log('Purpose: %s', purpose);
  
  // Return success with token for password reset
  if (purpose === 'reset-password') {
    // Create temporary token for password reset
    const resetToken = Utilities.getUuid();
    const tokenKey = 'RESET_TOKEN_' + email;
    
    Logger.log('Creating reset token: %s', resetToken);
    Logger.log('Token key: %s', tokenKey);
    
    props.setProperty(tokenKey, JSON.stringify({
      token: resetToken,
      timestamp: Date.now()
    }));
    
    // Verify token was saved
    const saved = props.getProperty(tokenKey);
    Logger.log('Token saved successfully: %s', saved ? 'YES' : 'NO');
    
    return jsonResponse({
      ok: true,
      message: 'OTP xác thực thành công',
      resetToken: resetToken
    });
  }
  
  // For signup
  return jsonResponse({
    ok: true,
    message: 'OTP xác thực thành công'
  });
}

/**
 * Handle reset password request
 */
function handleResetPassword(data) {
  Logger.log('=== RESET PASSWORD REQUEST ===');
  Logger.log('Full data: %s', JSON.stringify(data));
  
  const email = data.email;
  const resetToken = data.resetToken;
  const newPassword = data.newPassword;
  
  Logger.log('Email: %s', email);
  Logger.log('Reset Token: %s', resetToken);
  Logger.log('New Password length: %s', newPassword ? newPassword.length : 'undefined');
  
  if (!email || !resetToken || !newPassword) {
    Logger.log('Missing required fields!');
    return jsonResponse({
      ok: false,
      error: 'Thiếu thông tin bắt buộc'
    });
  }
  
  // Verify reset token
  const props = PropertiesService.getScriptProperties();
  const tokenKey = 'RESET_TOKEN_' + email;
  Logger.log('Looking for token with key: %s', tokenKey);
  
  const tokenDataStr = props.getProperty(tokenKey);
  Logger.log('Token data from storage: %s', tokenDataStr);
  
  if (!tokenDataStr) {
    Logger.log('Token not found in storage!');
    return jsonResponse({
      ok: false,
      error: 'Token không hợp lệ hoặc đã hết hạn'
    });
  }
  
  const tokenData = JSON.parse(tokenDataStr);
  Logger.log('Parsed token data: %s', JSON.stringify(tokenData));
  
  // Check token expiry (30 minutes)
  const now = Date.now();
  const elapsed = now - tokenData.timestamp;
  const THIRTY_MINUTES = 30 * 60 * 1000;
  
  Logger.log('Token age: %s ms (limit: %s ms)', elapsed, THIRTY_MINUTES);
  
  if (elapsed > THIRTY_MINUTES) {
    Logger.log('Token expired!');
    props.deleteProperty(tokenKey);
    return jsonResponse({
      ok: false,
      error: 'Token đã hết hạn. Vui lòng thực hiện lại quy trình.'
    });
  }
  
  Logger.log('Comparing tokens:');
  Logger.log('  Received: %s', resetToken);
  Logger.log('  Stored:   %s', tokenData.token);
  
  if (resetToken !== tokenData.token) {
    Logger.log('Token mismatch!');
    return jsonResponse({
      ok: false,
      error: 'Token không hợp lệ'
    });
  }
  
  Logger.log('Token verified successfully!');
  
  // Update password in sheet
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName('USERS');
  
  const userData = usersSheet.getDataRange().getValues();
  const headers = userData[0];
  
  const emailCol = headers.indexOf('Email');
  const passwordHashCol = headers.indexOf('Password Hash');
  const saltCol = headers.indexOf('Salt');
  
  // Find user
  let rowIndex = -1;
  for (let i = 1; i < userData.length; i++) {
    if (userData[i][emailCol] && userData[i][emailCol].toString().toLowerCase() === email.toLowerCase()) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) {
    return jsonResponse({
      ok: false,
      error: 'Không tìm thấy người dùng'
    });
  }
  
  // Generate new salt and hash
  const salt = generateSalt(16);
  const hash = hashPassword(newPassword, salt);
  
  // Update in sheet
  usersSheet.getRange(rowIndex, passwordHashCol + 1).setValue(hash);
  usersSheet.getRange(rowIndex, saltCol + 1).setValue(salt);
  
  // Delete reset token
  props.deleteProperty(tokenKey);
  
  // Log to audit
  logAudit(ss, email, 'PORTAL', 'PASSWORD_RESET', 'Password reset successful');
  
  return jsonResponse({
    ok: true,
    message: 'Mật khẩu đã được cập nhật thành công'
  });
}

// ===== HELPER FUNCTIONS =====

/**
 * Get user permissions for an app
 */
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
      // If app is specified, only return permissions for that app
      // If app is not specified or is 'PORTAL', return all permissions
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

/**
 * Hash password with salt using SHA-256
 */
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

/**
 * Generate random salt
 */
function generateSalt(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  for (let i = 0; i < length; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

/**
 * Create JWT token (simple implementation)
 */
function createJWT(payload) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  const signature = Utilities.computeHmacSha256Signature(
    encodedHeader + '.' + encodedPayload,
    JWT_SECRET
  );
  
  const encodedSignature = base64UrlEncode(signature);
  
  return encodedHeader + '.' + encodedPayload + '.' + encodedSignature;
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(input) {
  if (typeof input === 'string') {
    input = Utilities.newBlob(input).getBytes();
  }
  
  const base64 = Utilities.base64Encode(input);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Log to audit log
 */
function logAudit(ss, email, app, action, details) {
  try {
    const auditSheet = ss.getSheetByName('AUDIT_LOG');
    if (!auditSheet) return;
    
    const now = new Date();
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    
    auditSheet.appendRow([
      timestamp,
      email,
      app,
      action,
      details,
      '' // IP address (would need additional setup to capture)
    ]);
  } catch (error) {
    Logger.log('Error logging to audit: %s', error.toString());
  }
}

/**
 * Return JSON response
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - Create first admin
 */
function testCreateAdmin() {
  const email = 'admin@cphaco.vn';
  const password = 'Admin@123';
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName('USERS');
  
  const salt = generateSalt(16);
  const hash = hashPassword(password, salt);
  
  Logger.log('Email: %s', email);
  Logger.log('Password: %s', password);
  Logger.log('Salt: %s', salt);
  Logger.log('Hash: %s', hash);
  
  // Update in sheet manually or via code
  // Row 2 should be admin@cphaco.vn
  usersSheet.getRange(2, 7).setValue(hash); // Password Hash column
  usersSheet.getRange(2, 8).setValue(salt); // Salt column
  
  Logger.log('✅ Admin password updated successfully!');
}

// ===== CHANGE PASSWORD (for logged-in users) =====

/**
 * Handle change password request (user must be logged in)
 */
function handleChangePassword(data) {
  const email = data.email;
  const currentPassword = data.currentPassword;
  const newPassword = data.newPassword;
  
  if (!email || !currentPassword || !newPassword) {
    return jsonResponse({
      ok: false,
      error: 'Thiếu thông tin bắt buộc'
    });
  }
  
  // Validate new password
  if (newPassword.length < 8) {
    return jsonResponse({
      ok: false,
      error: 'Mật khẩu mới phải có ít nhất 8 ký tự'
    });
  }
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName('USERS');
  
  const userData = usersSheet.getDataRange().getValues();
  const headers = userData[0];
  
  const emailCol = headers.indexOf('Email');
  const passwordHashCol = headers.indexOf('Password Hash');
  const saltCol = headers.indexOf('Salt');
  const statusCol = headers.indexOf('Status');
  
  // Find user
  let userRow = null;
  let rowIndex = -1;
  
  for (let i = 1; i < userData.length; i++) {
    if (userData[i][emailCol] && userData[i][emailCol].toString().toLowerCase() === email.toLowerCase()) {
      userRow = userData[i];
      rowIndex = i + 1;
      break;
    }
  }
  
  if (!userRow) {
    return jsonResponse({
      ok: false,
      error: 'Không tìm thấy người dùng'
    });
  }
  
  // Check status
  if (userRow[statusCol] !== 'Active') {
    return jsonResponse({
      ok: false,
      error: 'Tài khoản đã bị vô hiệu hóa'
    });
  }
  
  // Verify current password
  const storedHash = userRow[passwordHashCol];
  const salt = userRow[saltCol];
  
  if (!storedHash || !salt) {
    return jsonResponse({
      ok: false,
      error: 'Tài khoản chưa có mật khẩu'
    });
  }
  
  const inputHash = hashPassword(currentPassword, salt);
  
  if (inputHash !== storedHash) {
    return jsonResponse({
      ok: false,
      error: 'Mật khẩu hiện tại không đúng'
    });
  }
  
  // Generate new salt and hash
  const newSalt = generateSalt(16);
  const newHash = hashPassword(newPassword, newSalt);
  
  // Update in sheet
  usersSheet.getRange(rowIndex, passwordHashCol + 1).setValue(newHash);
  usersSheet.getRange(rowIndex, saltCol + 1).setValue(newSalt);
  
  // Log to audit
  logAudit(ss, email, 'PORTAL', 'PASSWORD_CHANGE', 'Password changed successfully');
  
  return jsonResponse({
    ok: true,
    message: 'Mật khẩu đã được thay đổi thành công'
  });
}

// ===== 2FA FUNCTIONS =====

/**
 * Enable 2FA for user
 */
function handleEnable2FA(data) {
  const email = data.email;
  
  if (!email) {
    return jsonResponse({
      ok: false,
      error: 'Email không được để trống'
    });
  }
  
  // Generate 2FA secret (base32 encoded)
  const secret = generate2FASecret();
  
  // Store secret in Properties Service (or in a new column in USERS sheet)
  const props = PropertiesService.getScriptProperties();
  props.setProperty('2FA_SECRET_' + email, secret);
  
  // Generate QR code URL for authenticator apps
  const qrCodeUrl = get2FAQRCode(email, secret);
  
  // Update user's 2FA status in sheet
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName('USERS');
  
  // (Optional) Add "2FA Enabled" column to USERS sheet
  // For now, we'll just store in Properties
  
  logAudit(ss, email, 'PORTAL', '2FA_ENABLED', '2FA enabled for user');
  
  return jsonResponse({
    ok: true,
    secret: secret,
    qrCode: qrCodeUrl,
    message: '2FA đã được bật. Vui lòng quét mã QR bằng ứng dụng Authenticator.'
  });
}

/**
 * Disable 2FA for user
 */
function handleDisable2FA(data) {
  const email = data.email;
  const code = data.code; // Require 2FA code to disable
  
  if (!email || !code) {
    return jsonResponse({
      ok: false,
      error: 'Thiếu thông tin bắt buộc'
    });
  }
  
  // Verify 2FA code first
  const props = PropertiesService.getScriptProperties();
  const secret = props.getProperty('2FA_SECRET_' + email);
  
  if (!secret) {
    return jsonResponse({
      ok: false,
      error: '2FA chưa được bật cho tài khoản này'
    });
  }
  
  const isValid = verify2FACode(secret, code);
  
  if (!isValid) {
    return jsonResponse({
      ok: false,
      error: 'Mã 2FA không chính xác'
    });
  }
  
  // Delete secret
  props.deleteProperty('2FA_SECRET_' + email);
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  logAudit(ss, email, 'PORTAL', '2FA_DISABLED', '2FA disabled for user');
  
  return jsonResponse({
    ok: true,
    message: '2FA đã được tắt thành công'
  });
}

/**
 * Verify 2FA code during login
 */
function handleVerify2FA(data) {
  const email = data.email;
  const code = data.code;
  const tempToken = data.tempToken; // Temporary token from initial login
  
  if (!email || !code || !tempToken) {
    return jsonResponse({
      ok: false,
      error: 'Thiếu thông tin bắt buộc'
    });
  }
  
  // Verify temp token
  const props = PropertiesService.getScriptProperties();
  const tempTokenData = props.getProperty('TEMP_TOKEN_' + email);
  
  if (!tempTokenData || tempTokenData !== tempToken) {
    return jsonResponse({
      ok: false,
      error: 'Token không hợp lệ hoặc đã hết hạn'
    });
  }
  
  // Get 2FA secret
  const secret = props.getProperty('2FA_SECRET_' + email);
  
  if (!secret) {
    return jsonResponse({
      ok: false,
      error: '2FA chưa được bật'
    });
  }
  
  // Verify 2FA code
  const isValid = verify2FACode(secret, code);
  
  if (!isValid) {
    return jsonResponse({
      ok: false,
      error: 'Mã 2FA không chính xác'
    });
  }
  
  // Delete temp token
  props.deleteProperty('TEMP_TOKEN_' + email);
  
  // Get user info and create full token
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
      userRow = userData[i];
      break;
    }
  }
  
  if (!userRow) {
    return jsonResponse({
      ok: false,
      error: 'Không tìm thấy người dùng'
    });
  }
  
  // Get permissions
  const permissions = getUserPermissions(ss, email, data.app || 'PORTAL');
  
  // Create JWT token
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

// ===== 2FA HELPER FUNCTIONS =====

/**
 * Generate 2FA secret (base32)
 */
function generate2FASecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 16; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

/**
 * Generate QR code URL for Google Authenticator
 */
function get2FAQRCode(email, secret) {
  const issuer = 'Cphaco.app';
  const label = encodeURIComponent(issuer + ':' + email);
  const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  
  // Use Google Charts API to generate QR code
  return `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(otpauthUrl)}`;
}

/**
 * Verify 2FA code (TOTP)
 * Simple implementation - in production use a proper TOTP library
 */
function verify2FACode(secret, code) {
  // This is a simplified version
  // In production, use a proper TOTP library
  
  // Get current timestamp (30-second window)
  const now = Math.floor(Date.now() / 1000 / 30);
  
  // Check current and adjacent windows (±1)
  for (let i = -1; i <= 1; i++) {
    const timestamp = now + i;
    const generatedCode = generateTOTP(secret, timestamp);
    
    if (generatedCode === code) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate TOTP code (simplified)
 * Note: This is a basic implementation for demonstration
 * In production, use a proper TOTP library
 */
function generateTOTP(secret, timestamp) {
  // This is a placeholder - implement proper TOTP algorithm
  // For now, return a simple hash
  const data = secret + timestamp.toString();
  const hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_1,
    data,
    Utilities.Charset.UTF_8
  );
  
  // Take last 4 bytes and convert to 6-digit code
  const offset = hash[hash.length - 1] & 0x0f;
  const truncatedHash = (hash[offset] & 0x7f) << 24 |
                        (hash[offset + 1] & 0xff) << 16 |
                        (hash[offset + 2] & 0xff) << 8 |
                        (hash[offset + 3] & 0xff);
  
  const code = (truncatedHash % 1000000).toString().padStart(6, '0');
  return code;
}
