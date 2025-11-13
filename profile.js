// ========================================
// PROFILE.JS - FIXED VERSION
// Fix: Token key mismatch issue
// ========================================

// ===== CONFIGURATION =====
const AUTH_BASE = 'https://script.google.com/macros/s/AKfycbznIRGMSTXrOdR2-Vl93rLOJyB_voqRsJVietzSqWMywiAJjBaMw_EKL5HD0lL9yw/exec';
const TOKEN_KEY = 'CP_AUTH_TOKEN';  // đảm bảo mọi file dùng cùng key
const TOKEN_KEYS = ['CP_AUTH_TOKEN','authToken','token','jwt','access_token'];
// ===== TOKEN KEY CONFIGURATION =====


// ===== STATE =====
let currentUser = null;
let selectedImage = null;
let croppedImageData = null;

// ===== DOM ELEMENTS =====
const profileAvatar = document.getElementById('profileAvatar');
const navAvatar = document.getElementById('navAvatar');
const avatarInput = document.getElementById('avatarInput');
const removeAvatarBtn = document.getElementById('removeAvatarBtn');

const profileForm = document.getElementById('profileForm');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const birthDateInput = document.getElementById('birthDate');
const addressInput = document.getElementById('address');
const roleInput = document.getElementById('role');
const branchInput = document.getElementById('branch');
const departmentInput = document.getElementById('department');
const bioInput = document.getElementById('bio');
const bioCount = document.getElementById('bioCount');

const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

const cropModal = document.getElementById('cropModal');
const cropImage = document.getElementById('cropImage');
const closeCropModal = document.getElementById('closeCropModal');
const cancelCropBtn = document.getElementById('cancelCropBtn');
const applyCropBtn = document.getElementById('applyCropBtn');
const rotateLeftBtn = document.getElementById('rotateLeftBtn');
const rotateRightBtn = document.getElementById('rotateRightBtn');
const flipBtn = document.getElementById('flipBtn');

const successToast = document.getElementById('successToast');
const toastMessage = document.getElementById('toastMessage');
const overlay = document.getElementById('overlay');

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', async function() {
    
   console.log('🚀 Profile page loaded');

  // 1. Tạo loader
  window.profileLoader = new ProfileLoader();
  const loader = window.profileLoader;

  // 2. Hiện loader + skeleton
  loader.showPageLoader();
  loader.showSkeletonLoading();

  // 3. Check auth (có redirect thì tự đi)
  checkAuth();

  // 4. Load data (đợi xong)
  try {
    await loadUserProfile();
  } catch (e) {
    console.error('❌ loadUserProfile error:', e);
  }

  // 5. Gắn event listener (avatar, form, crop, ...)
  setupEventListeners();

  // 6. Tắt skeleton + loader, rồi animate
  loader.hideSkeletonLoading();
  loader.hidePageLoader();
  loader.animateContent();
});

// ===== AUTHENTICATION =====

/**
 * Get auth token from localStorage
 * Checks multiple possible keys
 */






function getStoredToken(){
  // thử khôi phục từ cookie nếu lỡ mất localStorage
  const m = document.cookie.match(/(?:^|;\s*)CP_AUTH_TOKEN=([^;]*)/);
  if (m && !localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, decodeURIComponent(m[1]));
  }
  // duyệt theo thứ tự ưu tiên & chỉ nhận token parse được
  for (const k of TOKEN_KEYS) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try { parseJWT(normalizeToken(raw)); return normalizeToken(raw); }
    catch { /* bỏ qua token hỏng */ }
  }
  return null;
}

// sau login/2FA, lưu cả 2 nơi:
function persistToken(token){
  if (!token) return;
  const t = normalizeToken(token);
  localStorage.setItem(TOKEN_KEY, t);
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(t)}; path=/; max-age=${60*60*24*7}; samesite=lax`;
}

function toBase64(b64url) {
  let s = String(b64url || '').replace(/-/g, '+').replace(/_/g, '/').trim();
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  return s;
}

function b64urlDecodeUtf8(b64url) {
  const b64 = toBase64(b64url);
  const bin = atob(b64);
  // Ưu tiên TextDecoder (chuẩn UTF-8)
  if (typeof TextDecoder !== 'undefined') {
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }
  // Fallback (ít chuẩn nhưng đủ cho ASCII)
  try { return decodeURIComponent(escape(bin)); } catch { return bin; }
}

function normalizeToken(raw) {
  if (!raw) return '';
  let t = String(raw).trim().replace(/^"|"$/g, '');
  if (t.startsWith('Bearer ')) t = t.slice(7).trim();
  try {
    const dec = decodeURIComponent(t);
    if (dec.split('.').length === 3) t = dec;
  } catch (_) {}
  return t.replace(/\s+/g, '');
}

function parseJWT(token) {
  const t = normalizeToken(token);
  const parts = t.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  // Decode header/payload theo Base64URL
  const header  = JSON.parse(b64urlDecodeUtf8(parts[0]));
  const payload = JSON.parse(b64urlDecodeUtf8(parts[1]));
  // (Tuỳ chọn) kiểm tra alg
  if (header.alg && header.alg !== 'HS256') {
    console.warn('Unexpected JWT alg:', header.alg);
  }
  return payload;
}




function safeParseJwt(token) {
  const t = normalizeToken(token);
  const parts = t.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  // chỉ nhận phần payload gồm các ký tự hợp lệ base64url
  if (!/^[A-Za-z0-9\-_]+$/.test(parts[1])) {
    throw new Error('Invalid base64url payload');
  }
  const payload = JSON.parse(b64urlDecodeUtf8(parts[1]));
  return { payload, raw: t };
}

// Chỉ trả token hợp lệ; nếu token ở key này hỏng → thử key tiếp theo
function getAuthToken() {
  console.log('🔍 Searching for auth token...');
  const badKeys = [];
  for (const key of TOKEN_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const { payload, raw: cleaned } = safeParseJwt(raw);
      console.log(`✅ Valid token at key: ${key}`, payload);
      // Ghi đè lại bản đã chuẩn hoá (nếu khác)
      if (cleaned !== raw) localStorage.setItem(key, cleaned);
      return { token: cleaned, key, payload };
    } catch (e) {
      console.warn(`⚠️ Invalid token at key ${key}:`, e.message);
      badKeys.push(key);
      continue;
    }
  }
  // Tuỳ chọn: dọn token hỏng để lần sau khỏi vướng
  badKeys.forEach(k => localStorage.removeItem(k));
  console.log('❌ No valid auth token found');
  return null;
}
function checkAuth() {
  const token = getStoredToken();              // xem mục C
  if (!token) return redirectToSignin();

  try {
    const payload = parseJWT(token);           // DÙNG base64URL decoder (mục B)
    const expMs = (payload.exp || 0) * 1000;
    if (!payload.exp || Date.now() >= expMs) {
      console.warn('Token expired');
      // cách ly để debug, đừng xoá trắng
      localStorage.setItem(TOKEN_KEY + '_BAD', token);
      // localStorage.removeItem(TOKEN_KEY);   // nếu muốn, tuỳ
      return redirectToSignin();
    }
    // OK
    currentUser = payload;
    return payload;

  } catch (err) {
    console.error('Token parse error:', err);
    localStorage.setItem(TOKEN_KEY + '_BAD', token);
    // localStorage.removeItem(TOKEN_KEY);
    return redirectToSignin();
  }
}
function redirectToSignin() {
  if (!location.pathname.endsWith('/signin.html')) {
    location.href = 'signin.html';
  }
}




//
function b64urlToUtf8(b64url) {
  let base64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) base64 += '='.repeat(4 - pad);
  const bin = atob(base64);
  // chuyển nhị phân → utf8 an toàn
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function parseJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  return JSON.parse(b64urlToUtf8(parts[1]));
}





function restoreTokenFromCookie() {
  const m = document.cookie.match(new RegExp('(?:^|; )' + TOKEN_KEY + '=([^;]*)'));
  if (m && !localStorage.getItem(TOKEN_KEY)) {
    const t = decodeURIComponent(m[1]);
    localStorage.setItem(TOKEN_KEY, t);
    console.log('🔁 Restored token from cookie mirror');
  }
}



// Gọi persistToken() ngay sau khi login/verify-2FA thành công:
async function afterLoginSuccess(data) {
  if (data && data.token) {
    persistToken(data.token);                  // LƯU CẢ 2 NƠI
    const payload = parseJWT(data.token);      // dùng hàm ở mục B
    localStorage.setItem('CP_USER_INFO', JSON.stringify(payload));
  }
}


// ===== LOAD USER PROFILE =====

async function loadUserProfile() {
  if (!currentUser) return;


  try {
    console.log('📥 Fetching profile from backend...');
    const response = await fetch(`${AUTH_BASE}?action=get-profile&email=${encodeURIComponent(currentUser.email)}`);
    const result = await response.json();

    if (result.ok && result.profile) {
      const profile = result.profile;
      // ... fill form & avatar & stats như anh đang làm ...
    } else {
      console.log('⚠️ Backend profile not found, dùng localStorage');
      loadFromLocalStorage();
    }

    updateBioCount();
  } catch (error) {
    console.error('❌ Error loading profile:', error);
    loadFromLocalStorage();
  } finally {
    
  }
}
function loadFromLocalStorage() {
    emailInput.value = currentUser.email || '';
    roleInput.value = currentUser.role || 'User';
    branchInput.value = currentUser.branch || '';
    departmentInput.value = '';
    
    const savedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    
    fullNameInput.value = currentUser.name || savedProfile.fullName || '';
    phoneInput.value = savedProfile.phone || '';
    birthDateInput.value = savedProfile.birthDate || '';
    addressInput.value = savedProfile.address || '';
    bioInput.value = savedProfile.bio || '';
    
    if (savedProfile.avatar) {
        profileAvatar.src = savedProfile.avatar;
        navAvatar.src = savedProfile.avatar;
    }
    
    document.getElementById('navUserName').textContent = currentUser.name || 'User';
    document.getElementById('navUserRole').textContent = currentUser.role || 'User';
    
    updateStats();
}

function updateStats(profile = null) {
    if (profile) {
        document.getElementById('joinDate').textContent = profile.joinDate || '15/01/2024';
        document.getElementById('lastLogin').textContent = profile.lastLogin || new Date().toLocaleDateString('vi-VN');
        document.getElementById('appsCount').textContent = profile.appsCount || '8';
    } else {
        const stats = JSON.parse(localStorage.getItem('userStats') || '{}');
        document.getElementById('joinDate').textContent = stats.joinDate || '15/01/2024';
        document.getElementById('lastLogin').textContent = stats.lastLogin || new Date().toLocaleDateString('vi-VN');
        document.getElementById('appsCount').textContent = stats.appsCount || '8';
    }
}

// ===== EVENT LISTENERS =====

function setupEventListeners() {
    avatarInput.addEventListener('change', handleAvatarSelect);
    removeAvatarBtn.addEventListener('click', handleRemoveAvatar);
    profileForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', handleCancel);
    bioInput.addEventListener('input', updateBioCount);
    closeCropModal.addEventListener('click', closeCropModalFunc);
    cancelCropBtn.addEventListener('click', closeCropModalFunc);
    applyCropBtn.addEventListener('click', handleApplyCrop);
    rotateLeftBtn.addEventListener('click', () => rotateCropImage(-90));
    rotateRightBtn.addEventListener('click', () => rotateCropImage(90));
    flipBtn.addEventListener('click', flipCropImage);
    overlay.addEventListener('click', closeCropModalFunc);
}

// ===== AVATAR UPLOAD =====

function handleAvatarSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chọn file ảnh hợp lệ', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('Kích thước ảnh không được vượt quá 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        selectedImage = e.target.result;
        cropImage.src = selectedImage;
        openCropModal();
    };
    reader.readAsDataURL(file);
}

let cropRotation = 0;
let cropFlipped = false;

function openCropModal() {
    cropModal.classList.add('active');
    overlay.classList.add('active');
    cropRotation = 0;
    cropFlipped = false;
}

function closeCropModalFunc() {
    cropModal.classList.remove('active');
    overlay.classList.remove('active');
    avatarInput.value = '';
}

function rotateCropImage(degrees) {
    cropRotation += degrees;
    applyCropTransform();
}

function flipCropImage() {
    cropFlipped = !cropFlipped;
    applyCropTransform();
}

function applyCropTransform() {
    let transform = `rotate(${cropRotation}deg)`;
    if (cropFlipped) {
        transform += ' scaleX(-1)';
    }
    cropImage.style.transform = transform;
}

async function handleApplyCrop() {
    try {
        applyCropBtn.classList.add('loading');
        applyCropBtn.disabled = true;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 400;
        canvas.width = size;
        canvas.height = size;
        
        const img = new Image();
        img.src = selectedImage;
        
        await new Promise(resolve => {
            img.onload = resolve;
        });
        
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate((cropRotation * Math.PI) / 180);
        
        if (cropFlipped) {
            ctx.scale(-1, 1);
        }
        
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
        
        croppedImageData = canvas.toDataURL('image/jpeg', 0.9);
        
        profileAvatar.src = croppedImageData;
        navAvatar.src = croppedImageData;
        
        closeCropModalFunc();
        
        showToast('Đã cập nhật ảnh đại diện. Nhớ nhấn "Lưu thay đổi" để hoàn tất!', 'info');
        
    } catch (error) {
        console.error('Error cropping image:', error);
        showToast('Không thể xử lý ảnh. Vui lòng thử lại.', 'error');
    } finally {
        applyCropBtn.classList.remove('loading');
        applyCropBtn.disabled = false;
    }
}

function handleRemoveAvatar() {
    if (confirm('Bạn có chắc muốn xóa ảnh đại diện?')) {
        const defaultAvatar = 'https://i.pravatar.cc/200?img=12';
        profileAvatar.src = defaultAvatar;
        navAvatar.src = defaultAvatar;
        croppedImageData = null;
        showToast('Đã xóa ảnh đại diện. Nhớ nhấn "Lưu thay đổi" để hoàn tất!', 'info');
    }
}

// ===== FORM HANDLING =====

function updateBioCount() {
    bioCount.textContent = bioInput.value.length;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!fullNameInput.value.trim()) {
        showToast('Vui lòng nhập họ và tên', 'error');
        fullNameInput.focus();
        return;
    }
    
    saveBtn.classList.add('loading');
    saveBtn.disabled = true;
    
    try {
        const profileData = {
            email: currentUser.email,
            name: fullNameInput.value.trim(),
            phone: phoneInput.value.trim(),
            birthDate: birthDateInput.value,
            address: addressInput.value.trim(),
            bio: bioInput.value.trim(),
            avatar: croppedImageData || profileAvatar.src
        };
        
        console.log('💾 Saving profile to backend...');
        
        const response = await fetch(AUTH_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                action: 'update-profile',
                ...profileData
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ Profile saved to backend');
            localStorage.setItem('userProfile', JSON.stringify(profileData));
            showToast('✓ Cập nhật hồ sơ thành công!', 'success');
            
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            throw new Error(result.message || 'Failed to save profile');
        }
        
    } catch (error) {
        console.error('❌ Error saving profile:', error);
        
        const profileData = {
            fullName: fullNameInput.value.trim(),
            phone: phoneInput.value.trim(),
            birthDate: birthDateInput.value,
            address: addressInput.value.trim(),
            bio: bioInput.value.trim(),
            avatar: croppedImageData || profileAvatar.src
        };
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        
        showToast('⚠️ Đã lưu tạm thời. Backend không khả dụng.', 'warning');
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    } finally {
        saveBtn.classList.remove('loading');
        saveBtn.disabled = false;
    }
}

function handleCancel() {
    if (confirm('Bạn có chắc muốn hủy? Các thay đổi sẽ không được lưu.')) {
        window.location.href = 'dashboard.html';
    }
}

// ===== TOAST NOTIFICATION =====

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    successToast.classList.add('show');
    
    setTimeout(() => {
        successToast.classList.remove('show');
    }, 3000);
}

// ===== UTILITIES =====

fullNameInput.addEventListener('input', function() {
    const words = this.value.split(' ');
    const capitalizedWords = words.map(word => {
        if (word.length > 0) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word;
    });
    this.value = capitalizedWords.join(' ');
});

phoneInput.addEventListener('input', function() {
    let value = this.value.replace(/\D/g, '');
    
    if (value.length > 10) {
        value = value.slice(0, 10);
    }
    
    if (value.length > 6) {
        value = value.slice(0, 4) + ' ' + value.slice(4, 7) + ' ' + value.slice(7);
    } else if (value.length > 4) {
        value = value.slice(0, 4) + ' ' + value.slice(4);
    }
    
    this.value = value;
});

console.log('✅ Profile.js loaded');
console.log('🔗 Backend URL:', AUTH_BASE);
