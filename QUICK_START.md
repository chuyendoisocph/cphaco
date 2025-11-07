# ⚡ HƯỚNG DẪN NHANH - Deploy trong 5 phút

## 🚀 3 Bước Deploy Landing Page lên Mắt Bão

### **BƯỚC 1: Đăng nhập cPanel** (30 giây)
1. Vào https://matbao.net → Đăng nhập
2. Click **Quản lý Hosting** → **cPanel**

### **BƯỚC 2: Upload Files** (2 phút)
1. Trong cPanel, click **File Manager**
2. Mở thư mục `public_html`
3. **Xóa** tất cả files cũ trong đó
4. Click **Upload** → Chọn 3 files:
   - ✅ `index.html`
   - ✅ `styles.css`
   - ✅ `script.js`
5. Đợi upload xong

### **BƯỚC 3: Truy cập Website** (1 phút)
1. Mở trình duyệt
2. Vào: **https://cphaco.app**
3. Done! 🎉

---

## 🎨 Sửa nội dung nhanh

### Đổi thông tin liên hệ
Mở `index.html` → Tìm:
```html
<a href="mailto:contact@cphaco.app">
<a href="tel:+84123456789">
```
→ Đổi thành email và số điện thoại của bạn

### Thêm app mới
Khi có link app "Quản lý hoa màu":
1. Mở `index.html`
2. Tìm: `<!-- App Card 6 -->`
3. Xóa class `app-card-disabled`
4. Thêm `href="LINK_APP"` vào tag `<a>`
5. Xóa dòng `<span class="coming-soon-badge">Sắp ra mắt</span>`
6. Save → Upload lại file

---

## 🔧 Enable HTTPS (Bảo mật)

1. Trong cPanel → **SSL/TLS Status**
2. Click **Run AutoSSL** cho domain cphaco.app
3. Đợi 5-10 phút
4. Done! Website có ổ khóa xanh 🔒

---

## ✅ Checklist sau khi deploy

- [ ] Website hiển thị bình thường
- [ ] Logo hiển thị đúng
- [ ] Click vào app cards → Mở đúng Google Apps Script
- [ ] Test trên điện thoại → Responsive OK
- [ ] Có HTTPS (ổ khóa xanh)

---

## 🆘 Gặp vấn đề?

**Không hiển thị gì cả?**
→ Kiểm tra files trong thư mục `public_html`, phải có đủ 3 files

**CSS không đẹp?**
→ Ctrl + Shift + R để clear cache trình duyệt

**Cần hỗ trợ?**
→ Gọi Mắt Bão: **1900 6680**

---

## 🎯 Xong rồi!

Giờ bạn đã có website đẹp để showcase các app!

Share link với đồng nghiệp: **https://cphaco.app** 🚀
