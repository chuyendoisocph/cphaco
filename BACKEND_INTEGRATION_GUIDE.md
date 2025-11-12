# 🔌 BACKEND INTEGRATION GUIDE
## Profile Management with Google Sheets

---

## 📋 Overview

**What we're adding:**
1. ✅ **Get Profile** - Fetch user data from sheet
2. ✅ **Update Profile** - Save changes to sheet
3. ✅ **Avatar Storage** - Base64 or Drive URL

---

## 🎯 Step-by-Step Integration

### STEP 1: Update Google Sheet Structure

**Open your USERS sheet and add these columns:**

```
Current columns:
A - Name
B - Email  
C - Password
D - Verified
E - Role

👇 ADD THESE NEW COLUMNS:

F - Phone
G - Birth Date
H - Address
I - Bio
J - Branch
K - Department
L - Avatar
M - Join Date
N - Last Login
```

**Your header row should look like:**
```
| Name | Email | Password | Verified | Role | Phone | Birth Date | Address | Bio | Branch | Department | Avatar | Join Date | Last Login |
|  A   |   B   |    C     |    D     |  E   |   F   |     G      |    H    |  I  |   J    |     K      |   L    |     M     |      N     |
```

**How to add columns:**
1. Right-click column F (or last column)
2. Click "Insert 1 right"
3. Repeat until you have columns F-N
4. Add headers: Phone, Birth Date, Address, etc.

---

### STEP 2: Update Backend Code

**Open your Google Apps Script project:**

#### 2.1 Update doGet() Function

Find your `doGet()` function and add the **get-profile** case:

```javascript
function doGet(e) {
  const action = e.parameter.action;
  
  switch(action) {
    case 'verify-email':
      return handleVerifyEmail(e.parameter);
    
    case 'get-profile':  // 👈 ADD THIS
      return handleGetProfile(e.parameter);
    
    default:
      return jsonResponse({ ok: false, message: 'Invalid action' });
  }
}
```

#### 2.2 Update doPost() Function

Find your `doPost()` function and add the **update-profile** case:

```javascript
function doPost(e) {
  const data = parsePostData(e);
  const action = data.action;
  
  switch(action) {
    case 'signup':
      return handleSignup(data);
    case 'signin':
      return handleSignin(data);
    case 'reset-password':
      return handleResetPassword(data);
    case 'change-password':
      return handleChangePassword(data);
    
    case 'update-profile':  // 👈 ADD THIS
      return handleUpdateProfile(data);
    
    default:
      return jsonResponse({ ok: false, message: 'Invalid action' });
  }
}
```

#### 2.3 Add Handler Functions

**Copy the entire content from `backend-profile-handler.gs` and paste it at the end of your `auth-service.gs` file.**

This includes:
- `handleGetProfile()` - Fetch profile
- `handleUpdateProfile()` - Save profile
- `uploadAvatarToDrive()` - Optional Drive upload
- `formatDate()` - Helper function

---

### STEP 3: Deploy New Version

**In Google Apps Script:**

1. Click **Deploy** → **Manage deployments**
2. Click **Edit** (pencil icon)
3. Under "Version", select **New version**
4. Add description: "Added profile management"
5. Click **Deploy**
6. ✅ Note the new Web App URL (should be same)

---

### STEP 4: Update Frontend Code

**Replace your `profile.js` with the upgraded version:**

```
project/
├── profile.js  ← Delete old
└── profile-upgraded.js  ← Rename to profile.js
```

**Or manually update:**

1. Open `profile.js`
2. Replace `loadUserProfile()` function
3. Replace `handleFormSubmit()` function
4. Save

---

### STEP 5: Test Everything

#### Test 1: Load Profile

```
1. Open dashboard
2. Click avatar → "Hồ sơ"
3. Check browser console (F12)
4. Should see:
   📥 Fetching profile from backend...
   ✅ Profile loaded from backend
5. Form fields should populate with data
```

#### Test 2: Update Profile

```
1. Change name to "Test User"
2. Add phone: 0912 345 678
3. Click "Lưu thay đổi"
4. Should see:
   💾 Saving profile to backend...
   ✅ Profile saved to backend
   ✓ Cập nhật hồ sơ thành công!
5. Check USERS sheet - data updated ✅
```

#### Test 3: Avatar Upload

```
1. Click "Đổi ảnh"
2. Upload image
3. Crop/rotate
4. Click "Áp dụng"
5. Click "Lưu thay đổi"
6. Check USERS sheet column L
7. Should have base64 data or Drive URL ✅
```

---

## 🔍 Troubleshooting

### Problem: "Backend not available"

**Check:**
1. Web App URL correct in profile.js?
2. Script deployed as "Anyone"?
3. Console shows network error?

**Fix:**
```javascript
// In profile.js, verify:
const AUTH_BASE = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// Test in browser:
https://script.google.com/macros/s/YOUR_ID/exec?action=get-profile&email=test@test.com
```

---

### Problem: "User not found"

**Check:**
1. Email exists in USERS sheet?
2. Email format correct (column B)?
3. Case sensitivity?

**Fix:**
- Check sheet for exact email
- Verify user is logged in
- Check console for currentUser.email

---

### Problem: Avatar too large

**Options:**

#### Option 1: Reduce quality
```javascript
// In profile.js, line ~300:
croppedImageData = canvas.toDataURL('image/jpeg', 0.7);  // Reduce from 0.9 to 0.7
```

#### Option 2: Use Drive upload
```javascript
// In backend, uncomment:
const avatarUrl = uploadAvatarToDrive(data.avatar, email);
sheet.getRange(userRow, 12).setValue(avatarUrl);
```

---

### Problem: Sheet columns wrong

**Verify column mapping:**
```
A  - Name       ✅
B  - Email      ✅
C  - Password   ✅
D  - Verified   ✅
E  - Role       ✅
F  - Phone      👈 Check this
G  - Birth Date 👈 Check this
H  - Address    👈 Check this
I  - Bio        👈 Check this
J  - Branch     👈 Check this
K  - Department 👈 Check this
L  - Avatar     👈 Check this
M  - Join Date  👈 Check this
N  - Last Login 👈 Check this
```

If columns are different, update the backend code:
```javascript
phone: data[i][5],  // Column F = index 5
```

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│  profile.js │
└──────┬──────┘
       │
       │ GET: ?action=get-profile&email=xxx
       ▼
┌─────────────────────────────────┐
│  Google Apps Script Backend     │
│                                  │
│  handleGetProfile()              │
│  ├─ Find user in sheet          │
│  ├─ Read columns F-N            │
│  └─ Return profile JSON         │
└────────┬────────────────────────┘
         │
         │ { ok: true, profile: {...} }
         ▼
┌─────────────┐
│  Form fills │
│  with data  │
└─────────────┘

        ...user edits...

┌─────────────┐
│ Click Save  │
└──────┬──────┘
       │
       │ POST: action=update-profile&name=...
       ▼
┌─────────────────────────────────┐
│  Google Apps Script Backend     │
│                                  │
│  handleUpdateProfile()           │
│  ├─ Find user in sheet          │
│  ├─ Update columns F-N          │
│  └─ Return success              │
└────────┬────────────────────────┘
         │
         │ { ok: true, message: '...' }
         ▼
┌─────────────┐
│   Success   │
│   Toast     │
└─────────────┘
```

---

## 🎯 Features Comparison

### BEFORE (localStorage only):

```
❌ No data persistence across devices
❌ No centralized user database
❌ No admin can view profiles
❌ Data lost on browser clear
```

### AFTER (Backend integrated):

```
✅ Data synced across devices
✅ Centralized in Google Sheets
✅ Admin can view/edit all profiles
✅ Data persists permanently
✅ Backup with Google Drive
```

---

## 📸 Avatar Storage Options

### Option 1: Base64 in Sheet (Current)

**Pros:**
- ✅ Simple implementation
- ✅ No external dependencies
- ✅ Works immediately

**Cons:**
- ❌ Large file size (~50-100KB per avatar)
- ❌ Slow to load for many users
- ❌ Sheet size limit

**When to use:** Small team (<50 users)

---

### Option 2: Google Drive (Recommended)

**Pros:**
- ✅ Proper file storage
- ✅ Direct image URLs
- ✅ No sheet bloat
- ✅ Image CDN benefits

**Cons:**
- ❌ Need Drive API
- ❌ Permission management
- ❌ More complex code

**When to use:** Production app (>50 users)

**To enable:**
```javascript
// In backend-profile-handler.gs, line ~120:
// UNCOMMENT THIS:
const avatarUrl = uploadAvatarToDrive(data.avatar, email);
sheet.getRange(userRow, 12).setValue(avatarUrl);

// COMMENT OUT THIS:
// sheet.getRange(userRow, 12).setValue(data.avatar);
```

---

## 🔒 Security Considerations

### Current Implementation:

```
⚠️ Anyone with URL can call get-profile
⚠️ No rate limiting
⚠️ No input validation
```

### Production Recommendations:

```javascript
// 1. Validate JWT token
function handleGetProfile(params) {
  const token = params.token;
  const payload = verifyJWT(token);
  if (!payload) {
    return jsonResponse({ ok: false, message: 'Invalid token' });
  }
  // ... rest of code
}

// 2. Rate limiting
const RATE_LIMIT = 100; // requests per user per hour

// 3. Input sanitization
function sanitizeInput(text) {
  return text.replace(/[<>]/g, '');
}
```

---

## 📈 Performance Tips

### 1. Cache profile data
```javascript
// In profile.js:
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedProfile(email) {
  const cache = localStorage.getItem('profile_cache_' + email);
  if (cache) {
    const data = JSON.parse(cache);
    if (Date.now() - data.timestamp < CACHE_DURATION) {
      return data.profile;
    }
  }
  return null;
}
```

### 2. Lazy load avatar
```javascript
// Load avatar after profile data
async function loadAvatar(avatarUrl) {
  const img = new Image();
  img.onload = () => {
    profileAvatar.src = avatarUrl;
  };
  img.src = avatarUrl;
}
```

### 3. Compress images
```javascript
// Reduce quality for smaller size
canvas.toDataURL('image/jpeg', 0.7);  // 70% quality
```

---

## ✅ Final Checklist

**Sheet Setup:**
- [ ] Added columns F-N
- [ ] Headers correct
- [ ] Test user has email in column B

**Backend:**
- [ ] Added handleGetProfile()
- [ ] Added handleUpdateProfile()
- [ ] Updated doGet()
- [ ] Updated doPost()
- [ ] Deployed new version

**Frontend:**
- [ ] Updated profile.js
- [ ] AUTH_BASE URL correct
- [ ] Files uploaded to server

**Testing:**
- [ ] Profile loads from backend
- [ ] Form fields populate
- [ ] Save updates sheet
- [ ] Avatar upload works
- [ ] Toast notifications show
- [ ] Console shows no errors

---

## 🎉 Success!

**You now have:**
✅ Profile page with backend
✅ Data saved to Google Sheets
✅ Avatar upload working
✅ Sync across devices
✅ Professional user management

**Next steps:**
1. Test with real users
2. Add avatar Drive upload
3. Implement caching
4. Add security layer
5. Monitor performance

---

## 📞 Need Help?

**Common issues:**
1. Sheet structure wrong → Check column letters
2. Backend not working → Check deployment
3. Avatar not saving → Check file size
4. Data not loading → Check console errors

**Debug checklist:**
1. Open browser console (F12)
2. Check Network tab
3. Look for POST/GET requests
4. Check response data
5. Verify sheet updates

---

## 🚀 You're Ready!

**Start testing your profile system now!** 💪

Everything is set up and ready to go. Just follow the steps, test each feature, and you'll have a fully functional profile management system!

**Good luck!** 🎯
