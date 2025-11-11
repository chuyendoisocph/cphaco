/**
 * ================================================
 * HƯỚNG DẪN CUSTOMIZE EMAIL OTP - CPHACO.APP
 * ================================================
 */

// ===== OPTION 1: Thay đổi tên hiển thị (Recommended) =====

/**
 * Thêm tên người gửi vào email
 */
MailApp.sendEmail({
  to: email,
  subject: 'Mã OTP đăng nhập Cphaco.app',
  name: 'Cphaco Support Team',  // 👈 TÊN HIỂN THỊ
  htmlBody: `...`
});

// Email sẽ hiển thị: "Cphaco Support Team <your-email@gmail.com>"

// ===== OPTION 2: Thay đổi email reply-to =====

MailApp.sendEmail({
  to: email,
  subject: 'Mã OTP đăng nhập Cphaco.app',
  name: 'Cphaco Support',
  replyTo: 'support@cphaco.vn',  // 👈 EMAIL REPLY
  htmlBody: `...`
});

// Khi user reply, email sẽ gửi đến support@cphaco.vn

// ===== OPTION 3: Custom template với logo và brand =====

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
                        <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 2px dashed #0066FF; border-radius: 12px; padding: 30px; display: inline-block;">
                          <div style="font-size: 42px; font-weight: bold; color: #0066FF; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                            ${otp}
                          </div>
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
                    © 2024 <strong>Cphaco.app</strong> - All rights reserved.
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

// ===== OPTION 4: Template cho từng loại email =====

/**
 * Function gửi OTP với template custom
 */
function sendOTPEmail(email, otp, purpose) {
  let subject, greeting, message;
  
  switch(purpose) {
    case 'signup':
      subject = 'Chào mừng đến với Cphaco.app - Xác thực tài khoản';
      greeting = 'Chào mừng bạn đến với Cphaco.app! 🎉';
      message = 'Để hoàn tất đăng ký, vui lòng nhập mã OTP bên dưới:';
      break;
      
    case 'reset-password':
      subject = 'Đặt lại mật khẩu Cphaco.app';
      greeting = 'Yêu cầu đặt lại mật khẩu 🔐';
      message = 'Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu. Mã OTP của bạn là:';
      break;
      
    case 'login':
      subject = 'Mã xác thực đăng nhập Cphaco.app';
      greeting = 'Xác thực đăng nhập 🔑';
      message = 'Mã OTP để đăng nhập vào tài khoản của bạn:';
      break;
      
    default:
      subject = 'Mã OTP từ Cphaco.app';
      greeting = 'Xác thực tài khoản';
      message = 'Mã OTP của bạn là:';
  }
  
  MailApp.sendEmail({
    to: email,
    subject: subject,
    name: 'Cphaco.app',
    replyTo: 'noreply@cphaco.app',
    htmlBody: `
      <!-- Template với ${greeting} và ${message} -->
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0066FF;">${greeting}</h2>
        <p>${message}</p>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>Mã này sẽ hết hạn sau <strong>10 phút</strong>.</p>
      </div>
    `
  });
}

// ===== OPTION 5: Dùng alias email (Google Workspace only) =====

/**
 * Nếu bạn có Google Workspace, có thể dùng alias
 */
MailApp.sendEmail({
  to: email,
  subject: 'Mã OTP đăng nhập Cphaco.app',
  from: 'noreply@cphaco.vn',  // 👈 Phải là alias hợp lệ
  name: 'Cphaco Support',
  htmlBody: `...`
});

// Lưu ý: Chỉ work nếu noreply@cphaco.vn là alias của tài khoản

// ===== OPTION 6: Dùng external email service =====

/**
 * SendGrid example
 */
function sendOTPViaSendGrid(email, otp) {
  const SENDGRID_API_KEY = 'your-sendgrid-api-key';
  
  const url = 'https://api.sendgrid.com/v3/mail/send';
  
  const payload = {
    personalizations: [{
      to: [{ email: email }],
      subject: 'Mã OTP đăng nhập Cphaco.app'
    }],
    from: {
      email: 'noreply@cphaco.app',
      name: 'Cphaco.app'
    },
    content: [{
      type: 'text/html',
      value: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Mã OTP của bạn</h2>
          <p>OTP: <strong>${otp}</strong></p>
        </div>
      `
    }]
  };
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + SENDGRID_API_KEY,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    return { ok: true };
  } catch (error) {
    Logger.log('SendGrid error: %s', error);
    return { ok: false };
  }
}

/**
 * Mailgun example
 */
function sendOTPViaMailgun(email, otp) {
  const MAILGUN_API_KEY = 'your-mailgun-api-key';
  const MAILGUN_DOMAIN = 'mg.cphaco.app';
  
  const url = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
  
  const payload = {
    from: 'Cphaco.app <noreply@cphaco.app>',
    to: email,
    subject: 'Mã OTP đăng nhập Cphaco.app',
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Mã OTP của bạn</h2>
        <p>OTP: <strong>${otp}</strong></p>
      </div>
    `
  };
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Basic ' + Utilities.base64Encode('api:' + MAILGUN_API_KEY)
    },
    payload: payload
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    return { ok: true };
  } catch (error) {
    Logger.log('Mailgun error: %s', error);
    return { ok: false };
  }
}

// ===== CẤU HÌNH TRONG auth-service.gs =====

/**
 * Trong handleSendOTP, thay đổi phần gửi email:
 */

// TRƯỚC:
MailApp.sendEmail({
  to: email,
  subject: 'Mã OTP đăng nhập Cphaco.app',
  htmlBody: `...`
});

// SAU (Option 1 - Simple):
MailApp.sendEmail({
  to: email,
  subject: 'Mã OTP đăng nhập Cphaco.app',
  name: 'Cphaco Support Team',  // 👈 THÊM TÊN
  replyTo: 'support@cphaco.app',  // 👈 THÊM REPLY-TO
  htmlBody: `...`
});

// SAU (Option 2 - Function):
sendOTPEmail(email, otp, 'reset-password');

// SAU (Option 3 - External):
sendOTPViaSendGrid(email, otp);

/**
 * ================================================
 * RECOMMENDATION
 * ================================================
 * 
 * Nếu chỉ muốn đổi tên hiển thị:
 * → Dùng Option 1 (thêm name và replyTo)
 * 
 * Nếu muốn email đẹp hơn:
 * → Dùng Option 3 (custom template)
 * 
 * Nếu cần chuyên nghiệp + tracking:
 * → Dùng Option 6 (SendGrid/Mailgun)
 * 
 * Nếu có Google Workspace:
 * → Dùng Option 5 (alias)
 */
