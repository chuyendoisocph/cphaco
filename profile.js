// ========================================
// PROFILE.JS - FIXED VERSION
// Fix: Token key mismatch issue
// ========================================

// ===== CONFIGURATION =====
const AUTH_BASE = 'https://script.google.com/macros/s/AKfycbznIRGMSTXrOdR2-Vl93rLOJyB_voqRsJVietzSqWMywiAJjBaMw_EKL5HD0lL9yw/exec';

// ===== TOKEN KEY CONFIGURATION =====
// Define all possible token keys (in order of priority)
const TOKEN_KEYS = [
    'authToken',        // Most common
    'CP_AUTH_TOKEN',    // Your custom key
    'token',            // Generic
    'jwt',              // JWT standard
    'access_token'      // OAuth standard
];

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

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Profile page loaded');
    
    // Check authentication
    checkAuth();
    
    // Load user profile
    loadUserProfile();
    
    // Setup event listeners
    setupEventListeners();
});

// ===== AUTHENTICATION =====

/**
 * Get auth token from localStorage
 * Checks multiple possible keys
 */

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


function getAuthToken() {
    console.log('🔍 Searching for auth token...');
    
    for (const key of TOKEN_KEYS) {
        const token = localStorage.getItem(key);
        if (token) {
            console.log(`✅ Found token with key: ${key}`);
            return { token, key };
        }
    }
    
    console.log('❌ No auth token found');
    console.log('Checked keys:', TOKEN_KEYS);
    
    // Debug: Show all localStorage items
    console.log('All localStorage items:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`  - ${key}`);
    }
    
    return null;
}

function checkAuth() {
    const tokenData = getAuthToken();
    
    if (!tokenData) {
        console.log('❌ No auth token found, redirecting to signin...');
        setTimeout(() => {
            window.location.href = 'signin.html';
        }, 500);
        return;
    }
    
    const { token, key } = tokenData;
    console.log(`✅ Using token from key: ${key}`);
    
    try {
        // Decode JWT token
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }
        
        const payload = parseJwtPayload(token);
        const exp = payload.exp * 1000;
        
        console.log('Token payload:', payload);
        console.log('Token expires:', new Date(exp).toLocaleString());
        
        if (Date.now() >= exp) {
            console.log('❌ Token expired');
            localStorage.removeItem(key);
            window.location.href = 'signin.html';
            return;
        }
        
        currentUser = payload;
        console.log('✅ User authenticated:', currentUser.email);
        
        // Store token key for future use
        sessionStorage.setItem('TOKEN_KEY', key);
        
    } catch (error) {
        console.error('❌ Error parsing token:', error);
        localStorage.removeItem(tokenData.key);
        window.location.href = 'signin.html';
    }
}

// ===== LOAD USER PROFILE =====

async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        console.log('📥 Fetching profile from backend...');
        
        // Fetch from backend
        const response = await fetch(`${AUTH_BASE}?action=get-profile&email=${encodeURIComponent(currentUser.email)}`, {
            method: 'GET'
        });
        
        const result = await response.json();
        
        if (result.ok && result.profile) {
            const profile = result.profile;
            
            // Set readonly fields
            emailInput.value = profile.email || currentUser.email;
            roleInput.value = profile.role || 'User';
            branchInput.value = profile.branch || '';
            departmentInput.value = profile.department || '';
            
            // Set editable fields
            fullNameInput.value = profile.name || currentUser.name || '';
            phoneInput.value = profile.phone || '';
            birthDateInput.value = profile.birthDate || '';
            addressInput.value = profile.address || '';
            bioInput.value = profile.bio || '';
            
            // Update avatar
            if (profile.avatar) {
                profileAvatar.src = profile.avatar;
                navAvatar.src = profile.avatar;
            }
            
            // Update nav display
            document.getElementById('navUserName').textContent = profile.name || 'User';
            document.getElementById('navUserRole').textContent = profile.role || 'User';
            
            // Update stats
            updateStats(profile);
            
            console.log('✅ Profile loaded from backend');
        } else {
            console.log('⚠️ Backend profile not found, using token data');
            loadFromLocalStorage();
        }
        
        // Update bio count
        updateBioCount();
        
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        loadFromLocalStorage();
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
