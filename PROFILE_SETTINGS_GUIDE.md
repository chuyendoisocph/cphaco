# 👤 PROFILE & SETTINGS - Hướng dẫn hoàn chỉnh

## ✅ Đã tạo

### 2 trang mới:

1. **profile.html** - Trang hồ sơ
   - Upload & crop avatar
   - Edit thông tin cá nhân
   - Thống kê người dùng

2. **settings.html** - Trang cài đặt
   - Cài đặt chung
   - Thông báo
   - Bảo mật
   - Giao diện

### Files hỗ trợ:
- `profile.css` - Styling cho profile page
- `profile.js` - Logic upload avatar, update profile
- `settings.js` - Logic quản lý cài đặt

---

## 🎯 Features

### Profile Page (profile.html):

#### 1. Avatar Upload
```
✅ Click ảnh đại diện → Upload file
✅ Hỗ trợ: JPG, PNG, GIF
✅ Max size: 5MB
✅ Crop & rotate image
✅ Preview real-time
✅ Remove avatar
```

#### 2. Personal Information
```
✅ Họ và tên (editable)
✅ Email (readonly)
✅ Số điện thoại
✅ Ngày sinh
✅ Địa chỉ
```

#### 3. Work Information (Readonly)
```
✅ Chức vụ
✅ Chi nhánh
✅ Phòng ban
```

#### 4. Bio
```
✅ Giới thiệu bản thân
✅ Max 500 ký tự
✅ Character counter
```

#### 5. Stats
```
✅ Ngày tham gia
✅ Đăng nhập lần cuối
✅ Số ứng dụng truy cập
```

---

### Settings Page (settings.html):

#### 1. General Settings (Chung)
```
✅ Ngôn ngữ (Tiếng Việt/English)
✅ Múi giờ
✅ Tự động đăng nhập
```

#### 2. Notifications (Thông báo)
```
✅ Email notifications
✅ Desktop notifications
✅ Sound notifications
✅ Weekly digest
```

#### 3. Security (Bảo mật)
```
✅ 2FA setup (placeholder)
✅ Change password (link)
✅ Manage sessions (placeholder)
✅ Auto logout
⚠️ Delete account
```

#### 4. Appearance (Giao diện)
```
✅ Dark mode
✅ Theme color
✅ Animations
✅ Font size
```

---

## 📋 Setup Instructions

### Bước 1: Update dashboard.html

**Tìm dropdown menu trong `dashboard.html`:**

```html
<!-- Current code: -->
<a href="#" class="dropdown-item">
    <svg>...</svg>
    <span>Cài đặt</span>
</a>
<a href="#" class="dropdown-item">
    <svg>...</svg>
    <span>Hồ sơ</span>
</a>
```

**Thay bằng:**

```html
<a href="settings.html" class="dropdown-item">
    <svg>...</svg>
    <span>Cài đặt</span>
</a>
<a href="profile.html" class="dropdown-item">
    <svg>...</svg>
    <span>Hồ sơ</span>
</a>
```

### Bước 2: Add files to project

```
project/
├── profile.html       ✅
├── profile.css        ✅
├── profile.js         ✅
├── settings.html      ✅
├── settings.js        ✅
├── dashboard.html     (update links)
└── dashboard.css      (already have)
```

### Bước 3: Test

**Test Profile:**
```
1. Login to dashboard
2. Click avatar dropdown
3. Click "Hồ sơ"
4. → profile.html opens ✅
5. Try upload avatar
6. Edit name, phone
7. Click "Lưu thay đổi"
8. → Success toast ✅
```

**Test Settings:**
```
1. From dashboard dropdown
2. Click "Cài đặt"
3. → settings.html opens ✅
4. Toggle switches
5. Change language
6. → Auto-saves ✅
```

---

## 🎨 Profile Page Design

```
┌──────────────────────────────────────────┐
│  ← Quay lại Dashboard      [👤 User]     │
└──────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  Hồ sơ cá nhân                                  │
│  Quản lý thông tin và ảnh đại diện              │
└────────────────────────────────────────────────┘

┌─────────────────┬────────────────────────────┐
│  [Avatar]       │  THÔNG TIN CÁ NHÂN          │
│                 │  ┌──────┐  ┌──────┐         │
│  📷 Đổi ảnh     │  │ Tên  │  │Email │         │
│  🗑️ Xóa ảnh     │  └──────┘  └──────┘         │
│                 │                             │
│  ℹ️ JPG, PNG     │  ┌──────┐  ┌──────┐         │
│     Max 5MB     │  │ SĐT  │  │N.Sinh│         │
│                 │  └──────┘  └──────┘         │
│  ━━━━━━━━━━━    │                             │
│                 │  ┌──────────────────┐       │
│  THỐNG KÊ       │  │ Địa chỉ          │       │
│  Tham gia: ...  │  └──────────────────┘       │
│  Login: ...     │                             │
│  Apps: 8        │  THÔNG TIN CÔNG VIỆC        │
│                 │  (readonly)                 │
└─────────────────┴────────────────────────────┘
                         [Hủy] [Lưu]
```

---

## ⚙️ Settings Page Design

```
┌──────────────────────────────────────────┐
│  ← Quay lại Dashboard      [👤 User]     │
└──────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  Cài đặt                                        │
│  Tùy chỉnh trải nghiệm của bạn                  │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  [Chung] [Thông báo] [Bảo mật] [Giao diện]     │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  CHUNG                                          │
│                                                 │
│  Ngôn ngữ                      [Tiếng Việt ▼]  │
│  Thời gian hiển thị...                         │
│                                                 │
│  Múi giờ                       [GMT+7 ▼]       │
│  Thời gian hiển thị...                         │
│                                                 │
│  Tự động đăng nhập             [○━━━]          │
│  Giữ đăng nhập...                              │
└────────────────────────────────────────────────┘
```

---

## 🔧 Avatar Upload Flow

```
1. User clicks "Đổi ảnh"
   ↓
2. File picker opens
   ↓
3. User selects image
   ↓
4. Validate:
   • File type (image)
   • File size (<5MB)
   ↓
5. Show crop modal
   ┌──────────────────┐
   │ Cắt ảnh đại diện │
   │                  │
   │  [Image Preview] │
   │                  │
   │ [⟲] [⟳] [↔]    │
   │                  │
   │ [Hủy] [Áp dụng]  │
   └──────────────────┘
   ↓
6. User adjusts:
   • Rotate left/right
   • Flip horizontal
   ↓
7. Click "Áp dụng"
   ↓
8. Canvas crop to 400x400
   ↓
9. Convert to base64
   ↓
10. Update avatar preview
    ↓
11. Show toast: "Nhớ lưu!"
    ↓
12. User clicks "Lưu thay đổi"
    ↓
13. Save to localStorage
    (In production: upload to server)
    ↓
14. Success! ✅
```

---

## 💾 Data Storage

### Current (Demo):
```javascript
// localStorage keys:
{
  "authToken": "eyJ...",
  "userProfile": {
    "fullName": "Nguyễn Văn A",
    "phone": "0912 345 678",
    "birthDate": "1990-01-01",
    "address": "123 ABC",
    "bio": "Hello...",
    "avatar": "data:image/jpeg;base64,..."
  },
  "appSettings": {
    "general": { ... },
    "notifications": { ... },
    "security": { ... },
    "appearance": { ... }
  },
  "userStats": {
    "joinDate": "15/01/2024",
    "lastLogin": "12/11/2024",
    "appsCount": 8
  }
}
```

### Production (Backend):
```javascript
// USERS sheet - add columns:
{
  "Phone": "0912345678",
  "Birth Date": "1990-01-01",
  "Address": "123 ABC, District 1, HCMC",
  "Bio": "Hello world",
  "Avatar URL": "https://drive.google.com/...",
  "Settings": JSON.stringify(settings)
}
```

---

## 🚀 Integration với Backend

### Update auth-service.gs:

```javascript
// Add endpoint: update-profile
case 'update-profile':
  return handleUpdateProfile(data);

// Handler
function handleUpdateProfile(data) {
  const email = data.email;
  const updates = data.updates;
  
  // Find user row
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('USERS');
  
  // Update columns:
  // - Phone
  // - Birth Date
  // - Address
  // - Bio
  
  // For avatar, either:
  // 1. Save base64 to cell (not recommended)
  // 2. Upload to Google Drive, save URL
  
  return jsonResponse({
    ok: true,
    message: 'Profile updated'
  });
}
```

---

## 📸 Avatar Storage Options

### Option 1: Base64 in Sheet (Simple)
```javascript
// Pros:
✅ No external storage needed
✅ Simple implementation

// Cons:
❌ Large data size
❌ Slow to load
❌ Sheet size limit
```

### Option 2: Google Drive (Recommended)
```javascript
// Pros:
✅ Proper file storage
✅ Sharable links
✅ Image optimization

// Cons:
❌ Need Drive API
❌ Permission management

// Implementation:
function uploadAvatar(base64Data, email) {
  // 1. Decode base64
  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    'image/jpeg',
    email + '_avatar.jpg'
  );
  
  // 2. Create/get folder
  const folder = DriveApp.getFoldersByName('Avatars').next();
  
  // 3. Upload file
  const file = folder.createFile(blob);
  
  // 4. Set sharing
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  // 5. Return URL
  return file.getUrl();
}
```

### Option 3: External CDN
```javascript
// Upload to:
• Cloudinary
• Imgur
• AWS S3
• ImageKit

// Pros:
✅ CDN benefits
✅ Image optimization
✅ Resize on-the-fly

// Cons:
❌ External service
❌ May cost money
```

---

## 🎨 CSS Customization

### Theme Colors:
```css
:root {
  --primary-color: #0066FF;
  --secondary-color: #00C9FF;
}

/* Blue theme */
.theme-blue {
  --primary-color: #0066FF;
  --secondary-color: #00C9FF;
}

/* Purple theme */
.theme-purple {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
}

/* Green theme */
.theme-green {
  --primary-color: #10b981;
  --secondary-color: #059669;
}
```

### Dark Mode:
```css
body.dark-mode {
  --bg-color: #1a1a1a;
  --text-color: #ffffff;
  --card-bg: #2a2a2a;
  --border-color: #404040;
}
```

---

## 📱 Mobile Responsive

### Profile Page:
```css
@media (max-width: 968px) {
  .profile-content {
    grid-template-columns: 1fr; /* Stack vertically */
  }
  
  .avatar-wrapper {
    width: 150px; /* Smaller avatar */
    height: 150px;
  }
}
```

### Settings Page:
```css
@media (max-width: 768px) {
  .settings-nav {
    overflow-x: scroll; /* Horizontal scroll */
  }
  
  .settings-nav-btn {
    min-width: 120px;
  }
}
```

---

## ✅ Testing Checklist

### Profile Page:
- [ ] Page loads correctly
- [ ] Avatar upload works
- [ ] Crop modal opens
- [ ] Rotate buttons work
- [ ] Flip button works
- [ ] Apply crop works
- [ ] Remove avatar works
- [ ] Form validation works
- [ ] Name auto-capitalize works
- [ ] Phone auto-format works
- [ ] Bio counter works
- [ ] Save button works
- [ ] Toast shows
- [ ] Cancel redirects
- [ ] Mobile responsive

### Settings Page:
- [ ] All tabs switch
- [ ] Toggle switches work
- [ ] Dropdowns change
- [ ] Settings save to localStorage
- [ ] Toast notifications show
- [ ] Dark mode toggles
- [ ] Theme color changes
- [ ] Font size changes
- [ ] Desktop notification permission
- [ ] Links work (change password, etc)
- [ ] Mobile responsive

---

## 🐛 Troubleshooting

### Avatar not uploading?
```
Check:
1. File type (must be image)
2. File size (<5MB)
3. Browser console for errors
4. Canvas support in browser
```

### Settings not saving?
```
Check:
1. localStorage enabled
2. Console for errors
3. Browser dev tools → Application → Local Storage
```

### Page not loading?
```
Check:
1. All CSS files linked
2. All JS files linked
3. File paths correct
4. Console errors
```

---

## 🎉 Done!

**Bạn đã có:**
✅ Profile page với avatar upload & crop
✅ Settings page với toggle switches
✅ Responsive design
✅ Toast notifications
✅ LocalStorage persistence
✅ Professional UI/UX

**Ready to use!** 🚀

---

## 📞 Next Steps

1. **Update dashboard.html** - Link to profile & settings
2. **Test all features** - Upload avatar, change settings
3. **Integrate backend** - API calls for save/load
4. **Add avatar upload to Drive** - Proper storage
5. **Deploy** - Production ready!

**Cần help thêm?** Hỏi tôi! 💪
