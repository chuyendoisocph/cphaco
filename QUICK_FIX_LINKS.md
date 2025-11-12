# ⚡ QUICK FIX: Dashboard Links

## 🎯 Problem:
Click "Hồ sơ" or "Cài đặt" → Page reloads ❌

## ✅ Solution (2 Changes):

### Change 1: Line 207
```html
<!-- FIND THIS: -->
<a href="#" class="dropdown-item">
    <span>Cài đặt</span>
</a>

<!-- REPLACE WITH: -->
<a href="settings.html" class="dropdown-item">
    <span>Cài đặt</span>
</a>
```

**Change:** `href="#"` → `href="settings.html"` ✅

---

### Change 2: Line 214
```html
<!-- FIND THIS: -->
<a href="#" class="dropdown-item">
    <span>Hồ sơ</span>
</a>

<!-- REPLACE WITH: -->
<a href="profile.html" class="dropdown-item">
    <span>Hồ sơ</span>
</a>
```

**Change:** `href="#"` → `href="profile.html"` ✅

---

## 📝 How to Fix:

### Option 1: Manual Edit

1. Open `dashboard.html` in text editor
2. Find line 207 (Ctrl+G → 207)
3. Change `href="#"` to `href="settings.html"`
4. Find line 214 (Ctrl+G → 214)
5. Change `href="#"` to `href="profile.html"`
6. Save
7. Refresh browser (Ctrl+Shift+R)
8. ✅ Done!

---

### Option 2: Find & Replace

**In your text editor:**

1. **Find & Replace #1:**
   ```
   Find:    <a href="#" class="dropdown-item">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 12a3 3 0 1 0 0-6
   
   Replace: <a href="settings.html" class="dropdown-item">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 12a3 3 0 1 0 0-6
   ```

2. **Find & Replace #2:**
   ```
   Find:    <a href="#" class="dropdown-item">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="6" r="3"
   
   Replace: <a href="profile.html" class="dropdown-item">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="6" r="3"
   ```

3. Save
4. ✅ Done!

---

## 🧪 Test:

```
1. Open dashboard.html
2. Click avatar (top right)
3. Dropdown opens
4. Click "Cài đặt"
   → Should go to settings.html ✅
5. Go back
6. Click "Hồ sơ"  
   → Should go to profile.html ✅
```

---

## 📊 Before & After:

```
BEFORE:
Dashboard → Click "Hồ sơ" → href="#" → Reload ❌

AFTER:
Dashboard → Click "Hồ sơ" → href="profile.html" → Open profile ✅
```

---

## ✅ Checklist:

- [ ] Open dashboard.html
- [ ] Find line 207
- [ ] Change to `href="settings.html"`
- [ ] Find line 214
- [ ] Change to `href="profile.html"`
- [ ] Save file
- [ ] Clear cache (Ctrl+Shift+R)
- [ ] Test "Cài đặt" link
- [ ] Test "Hồ sơ" link
- [ ] ✅ Both work!

---

## 🎉 Done!

**Now all links work:**
- ✅ Cài đặt → settings.html
- ✅ Hồ sơ → profile.html  
- ✅ Đổi mật khẩu → forgot-password.html
- ✅ Đăng xuất → index.html

**Perfect!** 🚀
