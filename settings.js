// ========================================
// SETTINGS.JS - Application Settings
// ========================================

// ===== STATE =====
let settings = {
    general: {
        language: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
        autoLogin: false
    },
    notifications: {
        email: true,
        desktop: false,
        sound: true,
        weeklyDigest: true
    },
    security: {
        twoFA: false,
        autoLogout: true
    },
    appearance: {
        darkMode: false,
        themeColor: 'blue',
        animations: true,
        fontSize: 'medium'
    }
};

// ===== DOM ELEMENTS =====
const settingsNavBtns = document.querySelectorAll('.settings-nav-btn');
const settingsSections = document.querySelectorAll('.settings-section');

// General
const languageSelect = document.getElementById('languageSelect');
const timezoneSelect = document.getElementById('timezoneSelect');
const autoLoginToggle = document.getElementById('autoLoginToggle');

// Notifications
const emailNotifToggle = document.getElementById('emailNotifToggle');
const desktopNotifToggle = document.getElementById('desktopNotifToggle');
const soundNotifToggle = document.getElementById('soundNotifToggle');
const weeklyDigestToggle = document.getElementById('weeklyDigestToggle');

// Security
const setup2FABtn = document.getElementById('setup2FABtn');
const manageSessionsBtn = document.getElementById('manageSessionsBtn');
const autoLogoutToggle = document.getElementById('autoLogoutToggle');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');

// Appearance
const darkModeToggle = document.getElementById('darkModeToggle');
const themeColorSelect = document.getElementById('themeColorSelect');
const animationsToggle = document.getElementById('animationsToggle');
const fontSizeSelect = document.getElementById('fontSizeSelect');

// Toast
const successToast = document.getElementById('successToast');
const toastMessage = document.getElementById('toastMessage');

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('⚙️ Settings page loaded');
    
    // Load saved settings
    loadSettings();
    
    // Setup navigation
    setupNavigation();
    
    // Setup event listeners
    setupEventListeners();
});

// ===== LOAD SETTINGS =====

function loadSettings() {
    // Load from localStorage
    const savedSettings = localStorage.getItem('appSettings');
    
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
    }
    
    // Apply settings to UI
    applySettingsToUI();
    
    console.log('✅ Settings loaded:', settings);
}

function applySettingsToUI() {
    // General
    languageSelect.value = settings.general.language;
    timezoneSelect.value = settings.general.timezone;
    setToggle(autoLoginToggle, settings.general.autoLogin);
    
    // Notifications
    setToggle(emailNotifToggle, settings.notifications.email);
    setToggle(desktopNotifToggle, settings.notifications.desktop);
    setToggle(soundNotifToggle, settings.notifications.sound);
    setToggle(weeklyDigestToggle, settings.notifications.weeklyDigest);
    
    // Security
    setToggle(autoLogoutToggle, settings.security.autoLogout);
    
    // Appearance
    setToggle(darkModeToggle, settings.appearance.darkMode);
    themeColorSelect.value = settings.appearance.themeColor;
    setToggle(animationsToggle, settings.appearance.animations);
    fontSizeSelect.value = settings.appearance.fontSize;
    
    // Apply dark mode if enabled
    if (settings.appearance.darkMode) {
        document.body.classList.add('dark-mode');
    }
}

// ===== NAVIGATION =====

function setupNavigation() {
    settingsNavBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            switchSection(section);
        });
    });
}

function switchSection(sectionId) {
    // Update nav buttons
    settingsNavBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });
    
    // Update sections
    settingsSections.forEach(section => {
        section.classList.toggle('active', section.id === sectionId + '-section');
    });
}

// ===== EVENT LISTENERS =====

function setupEventListeners() {
    // General
    languageSelect.addEventListener('change', () => {
        settings.general.language = languageSelect.value;
        saveSettings();
        showToast('Đã cập nhật ngôn ngữ');
    });
    
    timezoneSelect.addEventListener('change', () => {
        settings.general.timezone = timezoneSelect.value;
        saveSettings();
        showToast('Đã cập nhật múi giờ');
    });
    
    autoLoginToggle.addEventListener('click', () => {
        settings.general.autoLogin = toggleSwitch(autoLoginToggle);
        saveSettings();
        showToast(settings.general.autoLogin ? 'Đã bật tự động đăng nhập' : 'Đã tắt tự động đăng nhập');
    });
    
    // Notifications
    emailNotifToggle.addEventListener('click', () => {
        settings.notifications.email = toggleSwitch(emailNotifToggle);
        saveSettings();
        showToast(settings.notifications.email ? 'Đã bật thông báo email' : 'Đã tắt thông báo email');
    });
    
    desktopNotifToggle.addEventListener('click', () => {
        settings.notifications.desktop = toggleSwitch(desktopNotifToggle);
        saveSettings();
        
        if (settings.notifications.desktop) {
            requestNotificationPermission();
        }
        
        showToast(settings.notifications.desktop ? 'Đã bật thông báo desktop' : 'Đã tắt thông báo desktop');
    });
    
    soundNotifToggle.addEventListener('click', () => {
        settings.notifications.sound = toggleSwitch(soundNotifToggle);
        saveSettings();
        showToast(settings.notifications.sound ? 'Đã bật âm thanh thông báo' : 'Đã tắt âm thanh thông báo');
    });
    
    weeklyDigestToggle.addEventListener('click', () => {
        settings.notifications.weeklyDigest = toggleSwitch(weeklyDigestToggle);
        saveSettings();
        showToast(settings.notifications.weeklyDigest ? 'Đã đăng ký bản tin' : 'Đã hủy đăng ký bản tin');
    });
    
    // Security
    setup2FABtn.addEventListener('click', handle2FASetup);
    manageSessionsBtn.addEventListener('click', handleManageSessions);
    
    autoLogoutToggle.addEventListener('click', () => {
        settings.security.autoLogout = toggleSwitch(autoLogoutToggle);
        saveSettings();
        showToast(settings.security.autoLogout ? 'Đã bật tự động đăng xuất' : 'Đã tắt tự động đăng xuất');
    });
    
    deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    
    // Appearance
    darkModeToggle.addEventListener('click', () => {
        settings.appearance.darkMode = toggleSwitch(darkModeToggle);
        saveSettings();
        
        if (settings.appearance.darkMode) {
            document.body.classList.add('dark-mode');
            showToast('Đã bật chế độ tối');
        } else {
            document.body.classList.remove('dark-mode');
            showToast('Đã tắt chế độ tối');
        }
    });
    
    themeColorSelect.addEventListener('change', () => {
        settings.appearance.themeColor = themeColorSelect.value;
        saveSettings();
        applyThemeColor(settings.appearance.themeColor);
        showToast('Đã thay đổi màu chủ đạo');
    });
    
    animationsToggle.addEventListener('click', () => {
        settings.appearance.animations = toggleSwitch(animationsToggle);
        saveSettings();
        
        if (!settings.appearance.animations) {
            document.body.classList.add('no-animations');
        } else {
            document.body.classList.remove('no-animations');
        }
        
        showToast(settings.appearance.animations ? 'Đã bật hiệu ứng' : 'Đã tắt hiệu ứng');
    });
    
    fontSizeSelect.addEventListener('change', () => {
        settings.appearance.fontSize = fontSizeSelect.value;
        saveSettings();
        applyFontSize(settings.appearance.fontSize);
        showToast('Đã thay đổi kích thước font');
    });
}

// ===== TOGGLE SWITCH UTILITIES =====

function setToggle(toggle, isActive) {
    if (isActive) {
        toggle.classList.add('active');
    } else {
        toggle.classList.remove('active');
    }
}

function toggleSwitch(toggle) {
    const isActive = toggle.classList.toggle('active');
    return isActive;
}

// ===== SAVE SETTINGS =====

function saveSettings() {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    console.log('💾 Settings saved:', settings);
}

// ===== NOTIFICATION PERMISSION =====

function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('✅ Notification permission granted');
                
                // Show test notification
                new Notification('Cphaco.app', {
                    body: 'Bạn sẽ nhận được thông báo desktop từ giờ!',
                    icon: 'https://i.postimg.cc/FzqRG7Kp/CPH-LOGO-1.png'
                });
            } else {
                console.log('❌ Notification permission denied');
                settings.notifications.desktop = false;
                setToggle(desktopNotifToggle, false);
                saveSettings();
                showToast('Trình duyệt không cho phép thông báo', 'error');
            }
        });
    }
}

// ===== 2FA SETUP =====

function handle2FASetup() {
    alert('Tính năng xác thực 2 bước sẽ được triển khai trong phiên bản tiếp theo.\n\nBạn sẽ có thể cài đặt Google Authenticator hoặc nhận mã qua SMS.');
    
    // TODO: Implement 2FA setup flow
    // - Generate QR code
    // - User scans with authenticator app
    // - Verify code
    // - Enable 2FA
}

// ===== MANAGE SESSIONS =====

function handleManageSessions() {
    alert('Quản lý phiên đăng nhập:\n\n' +
          '• Máy tính - Chrome (Hiện tại)\n' +
          '• iPhone - Safari (2 ngày trước)\n' +
          '• iPad - Safari (1 tuần trước)\n\n' +
          'Tính năng này sẽ được triển khai đầy đủ trong phiên bản tiếp theo.');
    
    // TODO: Implement session management
    // - List all active sessions
    // - Show device, browser, location
    // - Allow terminating sessions
}

// ===== DELETE ACCOUNT =====

function handleDeleteAccount() {
    const confirmed = confirm(
        '⚠️ CẢNH BÁO: Hành động này KHÔNG THỂ HOÀN TÁC!\n\n' +
        'Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn:\n' +
        '• Thông tin cá nhân\n' +
        '• Lịch sử hoạt động\n' +
        '• Quyền truy cập ứng dụng\n\n' +
        'Bạn có CHẮC CHẮN muốn xóa tài khoản?'
    );
    
    if (!confirmed) return;
    
    // Double confirm
    const email = prompt('Nhập email của bạn để xác nhận:');
    const currentUser = getCurrentUser();
    
    if (email !== currentUser?.email) {
        alert('❌ Email không khớp. Hủy xóa tài khoản.');
        return;
    }
    
    // Final confirmation
    const finalConfirm = confirm('Đây là xác nhận cuối cùng. Tiếp tục xóa tài khoản?');
    
    if (finalConfirm) {
        // TODO: Call backend to delete account
        alert('Tính năng xóa tài khoản sẽ được triển khai trong phiên bản production.\n\nĐể xóa tài khoản, vui lòng liên hệ admin.');
        
        // In production:
        // 1. Call API to delete account
        // 2. Clear all local data
        // 3. Logout
        // 4. Redirect to goodbye page
    }
}

// ===== THEME COLOR =====

function applyThemeColor(color) {
    const colorMap = {
        blue: { primary: '#0066FF', secondary: '#00C9FF' },
        purple: { primary: '#667eea', secondary: '#764ba2' },
        green: { primary: '#10b981', secondary: '#059669' },
        red: { primary: '#ef4444', secondary: '#dc2626' }
    };
    
    const colors = colorMap[color];
    
    if (colors) {
        document.documentElement.style.setProperty('--primary-color', colors.primary);
        document.documentElement.style.setProperty('--secondary-color', colors.secondary);
    }
}

// ===== FONT SIZE =====

function applyFontSize(size) {
    const sizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px'
    };
    
    document.documentElement.style.setProperty('--base-font-size', sizeMap[size]);
}

// ===== UTILITIES =====

function getCurrentUser() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch (error) {
        return null;
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

// ===== LOAD USER INFO =====

function loadUserInfo() {
    const user = getCurrentUser();
    
    if (user) {
        document.getElementById('navUserName').textContent = user.name || 'User';
    }
}

// Load user info on page load
loadUserInfo();

console.log('✅ Settings.js loaded');
