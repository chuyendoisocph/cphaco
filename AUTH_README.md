# 🔐 CPHACO.APP - Hệ thống Authentication

## ✨ Tổng quan

Hệ thống đăng nhập/đăng ký với thiết kế **Gamma-inspired** hiện đại, clean và đẹp mắt cho Cphaco.app.

---

## 📦 Các file trong package

```
📁 Authentication System
├── 📄 signin.html       # Trang đăng nhập
├── 📄 signup.html       # Trang đăng ký
├── 📄 signin.css        # Styles chung cho cả 2 trang
├── 📄 signin.js         # JavaScript cho trang đăng nhập
├── 📄 signup.js         # JavaScript cho trang đăng ký
└── 📄 AUTH_README.md    # File hướng dẫn này
```

---

## 🎨 Tính năng

### ✅ Trang Sign In (`signin.html`)

- **Social Login**:
  - Đăng nhập với Google
  - Đăng nhập với Microsoft
  
- **Email/Password Login**:
  - Validate email format
  - Toggle hiện/ẩn password
  - Checkbox "Ghi nhớ đăng nhập"
  - Link "Quên mật khẩu"
  
- **UI/UX**:
  - Gradient background với animated orbs
  - Smooth animations
  - Form validation real-time
  - Loading states
  - Success/Error messages
  - Responsive design

### ✅ Trang Sign Up (`signup.html`)

- **Social Signup**:
  - Đăng ký với Google
  - Đăng ký với Microsoft
  
- **Email/Password Signup**:
  - Họ và tên (auto-capitalize)
  - Email validation
  - Password strength checker với 4 yêu cầu:
    - Ít nhất 8 ký tự
    - Có chữ hoa
    - Có chữ thường
    - Có số
  - Checkbox đồng ý điều khoản
  
- **UI/UX**:
  - Giống y hệt trang Sign In
  - Password requirements indicator
  - Real-time validation
  - Smooth transitions

---

## 🚀 Hướng dẫn sử dụng

### **Bước 1: Upload files**

Upload tất cả 5 files vào cùng thư mục trên hosting:
```
public_html/
├── signin.html
├── signup.html
├── signin.css
├── signin.js
└── signup.js
```

### **Bước 2: Thêm link vào landing page**

Mở file `index.html` và thêm button "Đăng nhập":

```html
<!-- Trong navigation -->
<nav class="nav">
  <div class="nav-container">
    <a href="#" class="nav-logo">...</a>
    <div class="nav-links">
      <a href="#about" class="nav-link">Về chúng tôi</a>
      <a href="#apps" class="nav-link">Ứng dụng</a>
      <a href="signin.html" class="nav-link-cta">Đăng nhập</a>
    </div>
  </div>
</nav>

<!-- Hoặc trong hero section -->
<div class="hero-cta">
  <a href="#apps" class="btn btn-primary">Khám phá ứng dụng</a>
  <a href="signin.html" class="btn btn-secondary">Đăng nhập</a>
</div>
```

### **Bước 3: Test**

1. Vào: `https://cphaco.app/signin.html`
2. Test form validation
3. Test social login buttons
4. Test chuyển trang sign in ↔ sign up

---

## ⚙️ Cấu hình

### **Thay đổi logo**

Trong cả 2 files `signin.html` và `signup.html`, tìm và thay:

```html
<img src="https://i.postimg.cc/FzqRG7Kp/CPH-LOGO-1.png" alt="Cphaco Logo">
```

Thành:

```html
<img src="YOUR_LOGO_URL" alt="Cphaco Logo">
```

### **Thay đổi redirect URL sau khi đăng nhập**

Trong file `signin.js`, tìm dòng:

```javascript
window.location.href = 'index.html';
```

Đổi thành URL bạn muốn redirect:

```javascript
window.location.href = 'dashboard.html'; // hoặc URL khác
```

### **Thay đổi màu sắc**

Trong file `signin.css`, tìm phần `:root` và đổi:

```css
:root {
    --primary-blue: #0066FF;           /* Màu chính */
    --gradient-start: #0066FF;         /* Màu đầu gradient */
    --gradient-end: #00C9FF;           /* Màu cuối gradient */
}
```

---

## 🔌 Tích hợp Backend

### **Current State (Demo Mode)**

Hiện tại đang dùng `localStorage` để demo:
- Sign Up: Lưu user vào `localStorage`
- Sign In: Check email/password từ `localStorage`

### **Production: Tích hợp API**

#### **1. Sign In**

Trong file `signin.js`, tìm function `simulateLogin` và thay bằng:

```javascript
async function authenticateUser(email, password, remember) {
    const response = await fetch('YOUR_API_URL/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
    }
    
    const data = await response.json();
    
    // Save token
    localStorage.setItem('authToken', data.token);
    if (remember) {
        localStorage.setItem('rememberedEmail', email);
    }
    
    return data;
}
```

Và trong form submit handler:

```javascript
try {
    const data = await authenticateUser(emailInput.value, passwordInput.value, rememberCheckbox.checked);
    showSuccessMessage();
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
} catch (error) {
    showError(passwordInput, error.message);
}
```

#### **2. Sign Up**

Trong file `signup.js`, tìm function `simulateSignup` và thay bằng:

```javascript
async function registerUser(fullname, email, password) {
    const response = await fetch('YOUR_API_URL/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullname, email, password })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
    }
    
    return await response.json();
}
```

#### **3. Social Login (OAuth)**

**Google OAuth:**

```javascript
// Trong signin.js và signup.js
function handleSocialLogin(provider) {
    if (provider === 'Google') {
        // Redirect to Google OAuth
        window.location.href = 'YOUR_API_URL/auth/google';
    } else if (provider === 'Microsoft') {
        // Redirect to Microsoft OAuth
        window.location.href = 'YOUR_API_URL/auth/microsoft';
    }
}
```

Hoặc sử dụng Google Sign-In SDK:

```html
<!-- Thêm vào <head> của signin.html và signup.html -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

```javascript
// Initialize Google Sign-In
google.accounts.id.initialize({
    client_id: 'YOUR_GOOGLE_CLIENT_ID',
    callback: handleGoogleCallback
});

function handleGoogleCallback(response) {
    // Send token to your backend
    fetch('YOUR_API_URL/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
    })
    .then(res => res.json())
    .then(data => {
        localStorage.setItem('authToken', data.token);
        window.location.href = 'index.html';
    });
}
```

---

## 🔒 Bảo mật

### ⚠️ Quan trọng khi deploy production:

1. **HTTPS bắt buộc**
   - Chỉ chạy trên HTTPS
   - Enable SSL certificate

2. **Password hashing**
   ```javascript
   // KHÔNG BAO GIỜ gửi plain password!
   // Backend phải hash password với bcrypt hoặc argon2
   ```

3. **CSRF Protection**
   ```javascript
   // Thêm CSRF token vào mọi request
   headers: {
       'X-CSRF-Token': getCsrfToken()
   }
   ```

4. **Rate Limiting**
   - Giới hạn số lần đăng nhập/đăng ký
   - Implement CAPTCHA sau X lần thất bại

5. **Input Sanitization**
   - Backend phải validate và sanitize tất cả input
   - Tránh XSS và SQL Injection

6. **Session Management**
   ```javascript
   // Sử dụng JWT với expiry time
   // Refresh token khi cần
   // Logout clear token
   ```

---

## 🎨 Tùy chỉnh thiết kế

### **Thay đổi layout**

Có thể đổi từ 2 cột sang 1 cột:

```css
/* Trong signin.css */
@media (max-width: 1024px) {
    .signin-container {
        flex-direction: column; /* Stack vertically */
    }
}
```

### **Thêm/bớt social login buttons**

Trong `signin.html` và `signup.html`, thêm button:

```html
<button class="social-button github-button">
    <!-- GitHub SVG icon -->
    Tiếp tục với GitHub
</button>
```

Style trong `signin.css`:

```css
.github-button:hover {
    border-color: #333;
}
```

### **Thay đổi background orbs**

Trong `signin.css`:

```css
.orb-1 {
    background: linear-gradient(135deg, #your-color-1, #your-color-2);
}
```

---

## 📱 Responsive Design

Đã optimize cho:
- ✅ Desktop (1920px+)
- ✅ Laptop (1024px - 1919px)
- ✅ Tablet (768px - 1023px)
- ✅ Mobile (320px - 767px)

Test trên nhiều thiết bị!

---

## 🐛 Troubleshooting

### **Form không submit**

1. Check Console (F12)
2. Đảm bảo tất cả files cùng thư mục
3. Kiểm tra đường dẫn file JS/CSS

### **CSS không load**

```html
<!-- Đảm bảo link đúng trong HTML -->
<link rel="stylesheet" href="signin.css">
```

### **Social login không hoạt động**

- Chỉ là demo UI
- Cần implement OAuth trong production
- Xem phần "Tích hợp Backend"

### **Password validation không work**

- Check file `signin.js` hoặc `signup.js` đã load
- Xem Console có lỗi không

---

## ✅ Checklist trước khi deploy

- [ ] Upload đủ 5 files
- [ ] Test sign in page
- [ ] Test sign up page
- [ ] Test form validation
- [ ] Test trên mobile
- [ ] Đổi logo thành logo của bạn
- [ ] Thay redirect URL
- [ ] Enable HTTPS
- [ ] Tích hợp backend API (production)
- [ ] Test OAuth flow (nếu có)
- [ ] Add CAPTCHA (khuyến nghị)

---

## 🚀 Tính năng nâng cao (optional)

### **1. Email Verification**

Sau khi đăng ký:
```javascript
// Gửi email verification
await sendVerificationEmail(user.email);

// Hiển thị thông báo
alert('Vui lòng kiểm tra email để xác thực tài khoản');
```

### **2. Forgot Password**

Tạo trang `forgot-password.html`:
- Form nhập email
- Send reset link
- Trang reset password

### **3. Two-Factor Authentication (2FA)**

- QR code setup
- OTP verification
- Backup codes

### **4. Social Login mở rộng**

Thêm:
- Apple Sign In
- GitHub
- LinkedIn
- Facebook

---

## 💡 Tips & Best Practices

### **UX Tips:**

1. **Loading states**
   - Hiển thị spinner khi submit
   - Disable button khi đang process

2. **Error handling**
   - Messages rõ ràng, dễ hiểu
   - Highlight field bị lỗi
   - Không blame user

3. **Success feedback**
   - Hiện message success
   - Auto redirect sau 1-2s
   - Smooth transition

### **Performance:**

1. **Lazy load images**
2. **Minify CSS/JS** cho production
3. **Use CDN** nếu có
4. **Cache static assets**

### **Accessibility:**

1. Labels cho tất cả inputs
2. Keyboard navigation
3. ARIA labels
4. Focus indicators
5. Screen reader friendly

---

## 📊 Analytics (optional)

Track user actions:

```javascript
// Sign In
gtag('event', 'login', {
    method: 'email'
});

// Sign Up
gtag('event', 'sign_up', {
    method: 'email'
});

// Social Login
gtag('event', 'login', {
    method: 'google'
});
```

---

## 🆘 Cần hỗ trợ?

### **Resources:**

- [OAuth 2.0 Guide](https://oauth.net/2/)
- [JWT.io](https://jwt.io/)
- [OWASP Authentication](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/README)

### **Contact:**

- Email: support@cphaco.app
- Website: https://cphaco.app

---

## 📄 License

© 2025 Cphaco.app. All rights reserved.

---

## 🎉 Kết luận

Bạn đã có hệ thống authentication **đẹp, hiện đại và đầy đủ tính năng**!

**Điều quan trọng nhất:** 
- ⚠️ Tích hợp backend API trong production
- 🔒 Implement security best practices
- ✅ Test kỹ trước khi deploy

**Chúc bạn thành công! 🚀**

---

**Made with ❤️ by Claude**  
**Version: 1.0.0**  
**Last update: 2025-01-07**
