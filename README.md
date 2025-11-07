# 🚀 CPHACO.APP - Landing Page Deployment Guide

## 📋 Mô tả

Landing page hiện đại cho **Hoa Viên Nghĩa Trang Bình Dương** với thiết kế lấy cảm hứng từ Gamma, showcase 8 ứng dụng Google Apps Script.

### ✨ Tính năng

- ✅ Design hiện đại, clean như Gamma
- ✅ Màu xanh dương tươi - tone chủ đạo công ty
- ✅ Responsive - đẹp trên mọi thiết bị
- ✅ Animation mượt mà, tương tác thú vị
- ✅ SEO friendly
- ✅ Tốc độ tải nhanh
- ✅ 8 app cards với links Google Apps Script

---

## 📦 Các file trong package

```
├── index.html       # File HTML chính
├── styles.css       # File CSS với design đẹp
├── script.js        # File JavaScript cho tương tác
└── README.md        # File hướng dẫn này
```

---

## 🌐 Hướng dẫn Deploy lên Mắt Bão Hosting

### **Bước 1: Đăng nhập Mắt Bão**

1. Truy cập: https://matbao.net
2. Đăng nhập tài khoản của bạn
3. Vào **Quản lý Hosting** hoặc **cPanel**

### **Bước 2: Upload files**

#### **Cách 1: Upload qua File Manager (Khuyến nghị)**

1. Trong cPanel, tìm và click vào **File Manager**
2. Mở thư mục `public_html` (hoặc `www` hoặc `htdocs`)
3. Xóa tất cả files mặc định (index.html cũ nếu có)
4. Click nút **Upload** ở thanh công cụ
5. Upload 3 files:
   - `index.html`
   - `styles.css`
   - `script.js`
6. Đợi upload hoàn tất

#### **Cách 2: Upload qua FTP (FileZilla)**

1. Tải và cài đặt **FileZilla Client**: https://filezilla-project.org
2. Lấy thông tin FTP từ email Mắt Bão hoặc trong cPanel
3. Kết nối FTP với thông tin:
   - Host: ftp.yourdomain.com
   - Username: [username của bạn]
   - Password: [password FTP]
   - Port: 21
4. Sau khi kết nối, vào thư mục `public_html`
5. Kéo thả 3 files vào đây

### **Bước 3: Trỏ domain về hosting**

Nếu domain và hosting cùng ở Mắt Bão:
- Đã được trỏ tự động ✅

Nếu domain ở nơi khác:
1. Vào quản lý domain
2. Thay đổi Nameservers thành:
   - `ns1.matbao.net`
   - `ns2.matbao.net`
3. Đợi 4-24 giờ để DNS cập nhật

### **Bước 4: Kiểm tra website**

1. Truy cập: `https://cphaco.app`
2. Kiểm tra:
   - ✅ Trang hiển thị đúng
   - ✅ Logo hiển thị
   - ✅ Các app cards hoạt động
   - ✅ Responsive trên mobile
   - ✅ Animation mượt mà

---

## 🎨 Tùy chỉnh Landing Page

### **Thay đổi màu sắc**

Mở file `styles.css`, tìm phần `:root` và thay đổi:

```css
:root {
    --primary-blue: #0066FF;           /* Màu xanh chủ đạo */
    --primary-blue-light: #3385FF;     /* Màu xanh nhạt */
    --primary-blue-dark: #0052CC;      /* Màu xanh đậm */
    --gradient-start: #0066FF;         /* Màu đầu gradient */
    --gradient-end: #00C9FF;           /* Màu cuối gradient */
}
```

### **Thêm/Sửa App mới**

Mở file `index.html`, tìm phần `<!-- Apps Section -->` và thêm/sửa app card:

```html
<a href="LINK_APP_CỦA_BẠN" class="app-card" target="_blank">
    <div class="app-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <!-- SVG Icon -->
    </div>
    <div class="app-content">
        <h3 class="app-title">Tên App</h3>
        <p class="app-description">Mô tả ngắn gọn về app</p>
    </div>
    <div class="app-arrow">
        <!-- Arrow icon -->
    </div>
</a>
```

### **Thay đổi nội dung**

Mở `index.html` và tìm các phần:
- **Hero title**: Tìm class `hero-title`
- **Description**: Tìm class `hero-description`
- **About section**: Tìm id `about`
- **Footer**: Tìm class `footer`

### **Cập nhật Logo**

Nếu muốn đổi logo:
1. Upload logo mới lên hosting (thư mục `images/`)
2. Trong `index.html`, tìm tất cả tag:
   ```html
   <img src="https://i.postimg.cc/FzqRG7Kp/CPH-LOGO-1.png" ...>
   ```
3. Thay thành:
   ```html
   <img src="images/your-new-logo.png" ...>
   ```

---

## 🔧 Tối ưu Performance

### **1. Enable Gzip Compression**

Tạo file `.htaccess` trong `public_html`:

```apache
# Enable Gzip Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
```

### **2. Tối ưu hình ảnh**

- Sử dụng format WebP cho hình ảnh
- Compress logo trước khi upload
- Công cụ: https://tinypng.com

### **3. Enable HTTPS**

1. Trong cPanel, tìm **SSL/TLS**
2. Cài đặt **Let's Encrypt Free SSL**
3. Sau khi cài đặt, thêm vào `.htaccess`:

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## 📱 Kiểm tra Responsive

Test website trên:
- ✅ Desktop (1920x1080)
- ✅ Laptop (1366x768)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

Tool kiểm tra: https://responsivedesignchecker.com

---

## 🐛 Troubleshooting

### **Website không hiển thị**
- ✅ Kiểm tra files đã upload đúng thư mục `public_html`
- ✅ Kiểm tra tên file: `index.html` (chữ thường)
- ✅ Clear cache browser (Ctrl + Shift + R)

### **CSS không load**
- ✅ Kiểm tra file `styles.css` cùng cấp với `index.html`
- ✅ Kiểm tra link trong HTML: `<link rel="stylesheet" href="styles.css">`
- ✅ Clear cache

### **JavaScript không hoạt động**
- ✅ Kiểm tra file `script.js` đã upload
- ✅ Mở Console (F12) để xem lỗi
- ✅ Kiểm tra link: `<script src="script.js"></script>`

### **Logo không hiển thị**
- ✅ Kiểm tra link logo còn hoạt động
- ✅ Hoặc upload logo lên hosting và đổi link

---

## 📊 SEO Tips

### **1. Thêm Meta Tags**

Đã có sẵn trong `index.html`:
- Title tag
- Meta description
- Meta keywords
- Open Graph tags (Facebook)
- Twitter Card

### **2. Google Search Console**

1. Truy cập: https://search.google.com/search-console
2. Thêm property: cphaco.app
3. Verify ownership
4. Submit sitemap

### **3. Tạo sitemap.xml**

Tạo file `sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://cphaco.app/</loc>
    <lastmod>2025-01-01</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>
```

---

## 📧 Support

Nếu cần hỗ trợ:
- 📞 Hotline Mắt Bão: 1900 6680
- 📧 Email: support@matbao.net
- 💬 Live Chat trên website Mắt Bão

---

## 🎉 Xong!

Website của bạn đã sẵn sàng! 🚀

**Live URL**: https://cphaco.app

---

## 📝 Changelog

### Version 1.0.0 (2025-01-01)
- ✅ Initial release
- ✅ 8 app cards with Google Apps Script links
- ✅ Gamma-inspired design
- ✅ Blue theme
- ✅ Responsive layout
- ✅ Smooth animations

---

**Made with ❤️ by Claude**
