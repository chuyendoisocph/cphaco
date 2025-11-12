# ⚡ QUICK REFERENCE: Profile Backend
## 3 Simple Steps to Integrate

---

## 🎯 What You Need to Do

### 1️⃣ Update Sheet (5 minutes)

**Add 9 new columns to USERS sheet:**

```
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

✅ **Done!** Your sheet is ready.

---

### 2️⃣ Update Backend (10 minutes)

**Add to `auth-service.gs`:**

```javascript
// In doGet():
case 'get-profile':
  return handleGetProfile(e.parameter);

// In doPost():
case 'update-profile':
  return handleUpdateProfile(data);

// At end of file:
// Copy all functions from backend-profile-handler.gs
```

✅ **Deploy new version**

---

### 3️⃣ Update Frontend (2 minutes)

**Replace `profile.js`:**

```
❌ Delete: profile.js (old)
✅ Rename: profile-upgraded.js → profile.js
```

✅ **Done!** Test it!

---

## 🧪 Quick Test

```
1. Dashboard → Click avatar → "Hồ sơ"
   → Should load profile from backend ✅

2. Change name, add phone
   → Click "Lưu thay đổi"
   → Check sheet for updates ✅

3. Upload avatar
   → Click "Lưu thay đổi"  
   → Check column L in sheet ✅
```

---

## 📊 Before vs After

### BEFORE:
```
profile.js → localStorage
   ↓
Data lost on clear cache ❌
No sync across devices ❌
```

### AFTER:
```
profile.js → Backend → Google Sheet
   ↓           ↓          ↓
Load profile  Save data   Persist forever
✅            ✅          ✅
```

---

## 🔧 Key Code Changes

### Frontend (profile.js):

**OLD:**
```javascript
async function loadUserProfile() {
  // Load from localStorage
  const savedProfile = JSON.parse(localStorage.getItem('userProfile'));
  fullNameInput.value = savedProfile.fullName;
}
```

**NEW:**
```javascript
async function loadUserProfile() {
  // Fetch from backend
  const response = await fetch(`${AUTH_BASE}?action=get-profile&email=${email}`);
  const result = await response.json();
  fullNameInput.value = result.profile.name;
}
```

---

### Backend (auth-service.gs):

**NEW FUNCTION:**
```javascript
function handleGetProfile(params) {
  const email = params.email;
  // Find user in sheet
  // Return profile data
  return jsonResponse({ ok: true, profile: data });
}

function handleUpdateProfile(data) {
  const email = data.email;
  // Find user row
  // Update columns F-N
  return jsonResponse({ ok: true, message: 'Updated' });
}
```

---

## 📋 Column Mapping

```
Sheet Column → Profile Field → Index
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A  Name         → name        → [0]
B  Email        → email       → [1]
C  Password     → password    → [2]
D  Verified     → verified    → [3]
E  Role         → role        → [4]
F  Phone        → phone       → [5] 👈 NEW
G  Birth Date   → birthDate   → [6] 👈 NEW
H  Address      → address     → [7] 👈 NEW
I  Bio          → bio         → [8] 👈 NEW
J  Branch       → branch      → [9] 👈 NEW
K  Department   → department  → [10] 👈 NEW
L  Avatar       → avatar      → [11] 👈 NEW
M  Join Date    → joinDate    → [12] 👈 NEW
N  Last Login   → lastLogin   → [13] 👈 NEW
```

---

## 🐛 Common Issues

### Issue 1: "User not found"
```
Check: Email in column B?
Fix: Verify exact email match
```

### Issue 2: "Backend not available"
```
Check: Deployment URL correct?
Fix: Re-deploy and update AUTH_BASE
```

### Issue 3: Wrong data showing
```
Check: Column letters correct?
Fix: Adjust indices in backend code
```

---

## ✅ Success Indicators

**Console logs you should see:**

```
🚀 Profile page loaded
✅ User authenticated: user@email.com
📥 Fetching profile from backend...
✅ Profile loaded from backend
💾 Saving profile to backend...
✅ Profile saved to backend
✓ Cập nhật hồ sơ thành công!
```

---

## 🎯 Final Result

**User can:**
✅ View profile from database
✅ Edit name, phone, address, bio
✅ Upload & crop avatar
✅ Save changes to Google Sheet
✅ Data persists across devices
✅ Admin can view all profiles

---

## 📁 Files Summary

```
Frontend:
├── profile.html          (no changes)
├── profile.css           (no changes)
└── profile.js            ✅ UPDATED

Backend:
└── auth-service.gs       ✅ UPDATED
    ├── doGet() + case
    ├── doPost() + case  
    ├── handleGetProfile()
    └── handleUpdateProfile()

Sheet:
└── USERS                 ✅ UPDATED
    └── Columns F-N added
```

---

## 📞 Quick Help

**Can't load profile?**
→ Check AUTH_BASE URL

**Can't save profile?**  
→ Check sheet columns F-N exist

**Avatar not working?**
→ Check file size <5MB

**Console errors?**
→ Check Network tab in DevTools

---

## 🚀 You're Done!

**3 steps completed = Full backend integration!** ✅

Now test it and enjoy your professional profile system! 💪

---

## 📥 Download All Files:

- [profile-upgraded.js](computer:///mnt/user-data/outputs/profile-upgraded.js) - Frontend
- [backend-profile-handler.gs](computer:///mnt/user-data/outputs/backend-profile-handler.gs) - Backend
- [Full Integration Guide](computer:///mnt/user-data/outputs/BACKEND_INTEGRATION_GUIDE.md) - Detailed docs
- [Quick Fix for Links](computer:///mnt/user-data/outputs/QUICK_FIX_LINKS.md) - Dashboard links

**Everything you need is ready!** 🎉
