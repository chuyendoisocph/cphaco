# 🐛 BUG FIX - FORGOT PASSWORD TOKEN ERROR

## Lỗi gặp phải:
```
Lỗi: Token không hợp lệ. Vui lòng thực hiện lại từ đầu.
```

## Nguyên nhân:

### Trong `auth-service.gs`, function `handleVerifyOTP()`:

**Code LỖI (dòng 372):**
```javascript
if (action === 'reset-password') {  // ❌ SAI: biến 'action' không tồn tại!
    const resetToken = Utilities.getUuid();
    props.setProperty('RESET_TOKEN_' + email, JSON.stringify({
        token: resetToken,
        timestamp: Date.now()
    }));
    return jsonResponse({
        ok: true,
        resetToken: resetToken
    });
}
```

**Client gửi lên (forgot-password.js):**
```javascript
{
    action: 'verify-otp',
    email: email,
    code: code,
    purpose: 'reset-password'  // ✅ ĐÚNG: dùng 'purpose'
}
```

**Function nhận (handleVerifyOTP):**
```javascript
function handleVerifyOTP(data) {
    const email = data.email;
    const code = data.code;
    const purpose = data.purpose || 'signup';  // ✅ Đã định nghĩa 'purpose'
    
    // Nhưng sau đó lại check 'action' thay vì 'purpose'! ❌
    if (action === 'reset-password') {  // WRONG!
        // ...
    }
}
```

### Kết quả:
- `action` là `undefined`
- Điều kiện `if (action === 'reset-password')` = `false`
- Token KHÔNG được tạo và lưu vào Properties Service
- Khi reset password, backend không tìm thấy token → Lỗi!

---

## Giải pháp:

### ✅ Fix 1: Đổi `action` thành `purpose` trong `auth-service.gs`

```javascript
// BEFORE (❌ LỖI):
if (action === 'reset-password') {

// AFTER (✅ ĐÚNG):
if (purpose === 'reset-password') {
```

### ✅ Fix 2: Thêm logging để debug

**Trong `forgot-password.js`:**
```javascript
async function resetPassword(email, token, newPassword) {
    console.log('=== RESET PASSWORD DEBUG ===');
    console.log('Email:', email);
    console.log('Token:', token);
    console.log('Token length:', token ? token.length : 'undefined');
    
    if (!email || !token) {
        throw new Error('Missing email or token!');
    }
    
    // ... rest of code
}
```

**Trong `auth-service.gs`:**
```javascript
function handleVerifyOTP(data) {
    // ...
    Logger.log('OTP verified successfully for: %s', email);
    Logger.log('Purpose: %s', purpose);  // Debug
    
    if (purpose === 'reset-password') {
        const resetToken = Utilities.getUuid();
        const tokenKey = 'RESET_TOKEN_' + email;
        
        Logger.log('Creating reset token: %s', resetToken);
        Logger.log('Token key: %s', tokenKey);
        
        props.setProperty(tokenKey, JSON.stringify({
            token: resetToken,
            timestamp: Date.now()
        }));
        
        // Verify saved
        const saved = props.getProperty(tokenKey);
        Logger.log('Token saved: %s', saved ? 'YES' : 'NO');
        
        return jsonResponse({
            ok: true,
            resetToken: resetToken
        });
    }
}

function handleResetPassword(data) {
    Logger.log('=== RESET PASSWORD REQUEST ===');
    Logger.log('Email: %s', data.email);
    Logger.log('Token: %s', data.resetToken);
    
    const tokenKey = 'RESET_TOKEN_' + data.email;
    const tokenDataStr = props.getProperty(tokenKey);
    
    Logger.log('Token from storage: %s', tokenDataStr);
    
    if (!tokenDataStr) {
        Logger.log('Token not found!');
        return jsonResponse({
            ok: false,
            error: 'Token không hợp lệ hoặc đã hết hạn'
        });
    }
    
    // ... rest of code
}
```

---

## Files đã fix:

1. ✅ **forgot-password.js** - Thêm logging chi tiết
2. ✅ **auth-service.gs** - Fix bug `action` → `purpose` + thêm logging

---

## Cách test:

### 1. Deploy auth-service.gs mới:
```
1. Mở Google Apps Script Editor
2. Copy toàn bộ nội dung auth-service.gs đã fix
3. Paste vào (thay thế code cũ)
4. Deploy → Manage deployments → Edit (⚙️ icon)
5. Version: New version
6. Deploy
```

### 2. Update forgot-password.js:
```
1. Replace file cũ bằng file mới
2. Clear cache (Ctrl + Shift + R)
```

### 3. Test flow:
```
1. Vào forgot-password.html
2. Nhập email → Gửi OTP
3. Nhập OTP → Xác nhận
4. Nhập mật khẩu mới → Đặt lại mật khẩu
5. Success! ✅
```

### 4. Check logs:

**Browser Console (F12):**
```
=== RESET PASSWORD DEBUG ===
Email: test@example.com
Token: abc-123-def-456
Token length: 36
...
```

**Apps Script Logs:**
```
OTP verified successfully for: test@example.com
Purpose: reset-password
Creating reset token: abc-123-def-456
Token key: RESET_TOKEN_test@example.com
Token saved: YES

=== RESET PASSWORD REQUEST ===
Email: test@example.com
Token: abc-123-def-456
Token from storage: {"token":"abc-123-def-456","timestamp":1234567890}
Token verified successfully!
```

---

## Tóm tắt:

| Issue | Before | After |
|-------|--------|-------|
| Biến check | `if (action === ...)` | `if (purpose === ...)` |
| Token được tạo | ❌ NO | ✅ YES |
| Logging | ❌ Minimal | ✅ Detailed |
| Error message | Generic | Specific |

**Root cause:** Typo trong tên biến (`action` vs `purpose`)

**Impact:** Token không được tạo → Reset password fail 100%

**Fix:** 1 line code change + logging

---

Completed: ✅ Bug fixed!
