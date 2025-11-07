# ⚡ HƯỚNG DẪN NHANH - Authentication System

## 🎯 3 Bước Deploy (5 phút)

### **Bước 1: Upload Files** (2 phút)

Upload 5 files này vào thư mục `public_html`:

```
✅ signin.html
✅ signup.html  
✅ signin.css
✅ signin.js
✅ signup.js
```

### **Bước 2: Test** (2 phút)

Truy cập:
- **Sign In**: `https://cphaco.app/signin.html`
- **Sign Up**: `https://cphaco.app/signup.html`

### **Bước 3: Link vào Landing Page** (1 phút)

Mở `index.html`, thêm button "Đăng nhập":

```html
<!-- Trong navigation -->
<a href="signin.html" class="nav-link-cta">Đăng nhập</a>

<!-- HOẶC trong hero section -->
<a href="signin.html" class="btn btn-secondary">Đăng nhập</a>
```

Done! ✅

---

## 📦 Files Overview

| File | Mô tả |
|------|-------|
| `signin.html` | Trang đăng nhập |
| `signup.html` | Trang đăng ký |
| `signin.css` | Styles (dùng chung) |
| `signin.js` | Logic đăng nhập |
| `signup.js` | Logic đăng ký |

---

## ✨ Tính năng chính

### 🔐 Sign In Page
- Email/Password login
- Google & Microsoft login
- Ghi nhớ đăng nhập
- Quên mật khẩu
- Form validation
- Loading states

### 📝 Sign Up Page  
- Đăng ký với email
- Password strength checker
- Social signup
- Auto-capitalize tên
- Điều khoản sử dụng

### 🎨 Design
- Gamma-inspired design
- Gradient backgrounds
- Smooth animations
- Fully responsive
- Clean & modern

---

## 🎨 Preview

### Sign In Page
```
┌─────────────────────────────────┐
│  Logo  Cphaco.app               │
│                                 │
│  Chào mừng trở lại! 👋         │
│  Đăng nhập để tiếp tục...      │
│                                 │
│  [Đăng nhập với Google]        │
│  [Đăng nhập với Microsoft]     │
│                                 │
│  ───────── hoặc ─────────      │
│                                 │
│  Email: ________________        │
│  Password: _____________        │
│  ☐ Ghi nhớ   Quên mật khẩu?    │
│                                 │
│  [      Đăng nhập      ]       │
│                                 │
│  Chưa có tài khoản? Đăng ký    │
└─────────────────────────────────┘
```

---

## ⚙️ Cấu hình nhanh

### Đổi logo
Trong `signin.html` và `signup.html`:
```html
<img src="YOUR_LOGO_URL" alt="Logo">
```

### Đổi redirect URL
Trong `signin.js`:
```javascript
window.location.href = 'dashboard.html'; // Thay vì index.html
```

### Đổi màu
Trong `signin.css`:
```css
:root {
    --primary-blue: #0066FF;    /* Màu của bạn */
    --gradient-start: #0066FF;
    --gradient-end: #00C9FF;
}
```

---

## 🔌 Tích hợp Backend (Production)

### Current: Demo Mode
- Dùng `localStorage` để test
- Không cần backend
- Mọi email/password đều login được

### Production: Real API

**Sign In:**
```javascript
// Trong signin.js, thay simulateLogin() bằng:
async function authenticateUser(email, password) {
    const response = await fetch('YOUR_API/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return await response.json();
}
```

**Sign Up:**
```javascript
// Trong signup.js, thay simulateSignup() bằng:
async function registerUser(fullname, email, password) {
    const response = await fetch('YOUR_API/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname, email, password })
    });
    return await response.json();
}
```

---

## ✅ Checklist

### Deploy:
- [ ] Upload 5 files
- [ ] Test signin.html
- [ ] Test signup.html
- [ ] Thêm link vào index.html

### Tùy chỉnh:
- [ ] Đổi logo
- [ ] Đổi màu (optional)
- [ ] Đổi redirect URL

### Production:
- [ ] Tích hợp backend API
- [ ] Enable HTTPS
- [ ] Test OAuth (nếu có)
- [ ] Add CAPTCHA (khuyến nghị)

---

## 🐛 Troubleshooting

**Không hiển thị gì?**
→ Check files đã upload đúng thư mục

**CSS không load?**
→ Kiểm tra `<link rel="stylesheet" href="signin.css">`

**JS không chạy?**
→ Mở Console (F12) xem lỗi

**Form không submit?**
→ Check file `.js` đã load chưa

---

## 📖 Tài liệu đầy đủ

Xem file **`AUTH_README.md`** để biết:
- Tích hợp backend chi tiết
- OAuth implementation
- Security best practices
- Advanced features
- API examples

---

## 🎉 Done!

Giờ bạn có hệ thống authentication đẹp như Gamma!

**Links:**
- Sign In: `https://cphaco.app/signin.html`
- Sign Up: `https://cphaco.app/signup.html`

**Demo credentials:**
- Email: Bất kỳ email nào
- Password: Bất kỳ password nào (min 6 chars)

---

**Made with ❤️ by Claude**  
**Version: 1.0.0**
