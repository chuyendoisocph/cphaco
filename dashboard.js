// ========================================
// DASHBOARD.JS - CPHACO.APP
// SSO Integration với Central Auth
// ========================================

// ===== CONFIGURATION =====
const AUTH_BASE = 'https://script.google.com/macros/s/AKfycbwwOc00czKNL_R57w89sVCfnrBoRqEWBHmEBXsCeKni0aWhnHoqW3cIyzt4wwTsl6CSQQ/exec';
const TOKEN_KEY = 'CP_AUTH_TOKEN';

// ===== APPS DATABASE (định nghĩa sẵn các app có trong hệ thống) =====
const APPS_DATABASE = {
    'BQT001': {
        id: 'BQT001',
        name: 'Đăng ký trực BQT',
        description: 'Quản lý lịch trực Ban Quản Trang',
        url: 'https://script.google.com/macros/s/AKfycbyc0dNDh8rlTn9K0W0CHnHAT2QDgtxqpvXz7g1SfZaOWkel3lDv3_8coBN4Vb7Y8rGwpg/exec',
        icon: '📅',
        color: 'linear-gradient(135deg, #667eea, #764ba2)',
        status: 'active'
    },
    'MAP001': {
        id: 'MAP001',
        name: 'Bản đồ số',
        description: 'Bản đồ số hoa viên OCM',
        url: 'https://script.google.com/macros/s/AKfycbwKuTqXLyIkR8L5htnYDkHFi-HRIIdFo1dnL9XnMa-nIqmMLsdTvczEsVv1xD_Vn4_e/exec',
        icon: '🗺️',
        color: 'linear-gradient(135deg, #f093fb, #f5576c)',
        status: 'active'
    },
    'CARE001': {
        id: 'CARE001',
        name: 'Khu chăm sóc',
        description: 'Quản lý khu chăm sóc và biên bản',
        url: 'https://script.google.com/macros/s/AKfycby5BJzivbuW-tP1uj0wiFLoGIOYuqlhF1tlI1K0K2V7vrLsjN-8mFmVjeIcEU_2b8sW/exec',
        icon: '🌸',
        color: 'linear-gradient(135deg, #4facfe, #00f2fe)',
        status: 'active'
    },
    'SURVEY001': {
        id: 'SURVEY001',
        name: 'Khảo sát TPT',
        description: 'Khảo sát chất lượng phục vụ Thiên Phước Tự',
        url: 'https://script.google.com/macros/s/AKfycbw2kb9e8QKC_ctbqpJMvPBJcoOAXQ2xZUk6ofiUOT1IItKF_t8h1D9kWrvEUV8h2Ng7tg/exec',
        icon: '📊',
        color: 'linear-gradient(135deg, #fa709a, #fee140)',
        status: 'active'
    },
    'ENCODE001': {
        id: 'ENCODE001',
        name: 'Mã hóa vị trí',
        description: 'Công cụ chuyển đổi mã vị trí OCM',
        url: 'https://script.google.com/macros/s/AKfycbyaZ-Bp2RiS4OhGeiPS6jeP0FVIeMcHGf41H2oxrlzS0SBGhegGnMPhiAtcEc8d84Za/exec',
        icon: '🔐',
        color: 'linear-gradient(135deg, #a8edea, #fed6e3)',
        status: 'active'
    },
    'EDIT001': {
        id: 'EDIT001',
        name: 'OCM Editor',
        description: 'Editor bản đồ OCM',
        url: 'https://script.google.com/macros/s/AKfycbwUBElq6ZaGnaPiAkU4bIH0RBK8Li1iT1DmCvmdGN_vhuRKEXF6qzqk5n26vEv07z9GfA/exec',
        icon: '✏️',
        color: 'linear-gradient(135deg, #ff9a9e, #fecfef)',
        status: 'active'
    },
    'CTV001': {
        id: 'CTV001',
        name: 'Cộng tác viên',
        description: 'Portal cộng tác viên (Public)',
        url: 'https://script.google.com/macros/s/AKfycbxqXqfsij6GWAiaHSQOCsZeES4LvR8EM00LCGR0OztH-pNt_TLBnCBc5F35skl3RUmC/exec',
        icon: '👥',
        color: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)',
        status: 'active'
    }
};

// ===== GLOBAL STATE =====
let currentUser = null;
let userApps = [];
let allActivities = [];

// ===== AUTHENTICATION =====

/**
 * Kiểm tra authentication khi load trang
 */
function checkAuth() {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (!token) {
        // Chưa đăng nhập -> redirect về signin
        redirectToSignin();
        return false;
    }

    try {
        // Decode token (simple JWT decode - không verify signature ở client)
        const payload = parseJWT(token);
        
        // Kiểm tra token có hết hạn không
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.warn('Token đã hết hạn');
            redirectToSignin();
            return false;
        }

        // Lưu thông tin user
        currentUser = payload;
        return true;
        
    } catch (error) {
        console.error('Invalid token:', error);
        redirectToSignin();
        return false;
    }
}

/**
 * Parse JWT token (client-side decode, không verify)
 */
function parseJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        throw new Error('Invalid token format');
    }
}

/**
 * Redirect về trang signin
 */
function redirectToSignin() {
    const currentPath = window.location.pathname;
    window.location.href = `signin.html?returnTo=${encodeURIComponent(currentPath)}`;
}

/**
 * Đăng xuất
 */
function logout() {
    // Xóa token
    localStorage.removeItem(TOKEN_KEY);
    
    // Xóa remembered email nếu có
    localStorage.removeItem('rememberedEmail');
    
    // Hiển thị thông báo
    showToast('Đã đăng xuất thành công', 'success');
    
    // Redirect về signin sau 1s
    setTimeout(() => {
        window.location.href = 'signin.html';
    }, 1000);
}

// ===== USER INFO =====

/**
 * Load và hiển thị thông tin user
 */
function loadUserInfo() {
    if (!currentUser) return;

    const userName = currentUser.name || currentUser.email || 'User';
    const userRole = currentUser.role || 'Nhân viên';
    const userEmail = currentUser.email || '';

    // Cập nhật tên user ở nhiều nơi
    const userNameElements = document.querySelectorAll('#userName, #userNameDisplay, #dropdownUserName');
    userNameElements.forEach(el => {
        if (el) el.textContent = userName;
    });

    // Cập nhật role
    const userRoleElements = document.querySelectorAll('.user-role');
    userRoleElements.forEach(el => {
        if (el) el.textContent = userRole;
    });

    // Cập nhật email trong dropdown
    const emailElement = document.querySelector('.dropdown-user-email');
    if (emailElement) emailElement.textContent = userEmail;

    // Cập nhật greeting theo thời gian
    updateGreeting();
    
    // Cập nhật motivational quote
    updateMotivationalQuote();
}

/**
 * Cập nhật lời chào theo thời gian
 */
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Chào buổi sáng';
    
    if (hour >= 12 && hour < 18) {
        greeting = 'Chào buổi chiều';
    } else if (hour >= 18 || hour < 5) {
        greeting = 'Chào buổi tối';
    }

    const greetingElement = document.getElementById('greeting');
    if (greetingElement) {
        greetingElement.textContent = greeting;
    }
}

/**
 * Cập nhật câu trích dẫn động lực
 */
function updateMotivationalQuote() {
    const quotes = [
        'Hôm nay là một ngày tuyệt vời để làm những điều tuyệt vời!',
        'Hãy bắt đầu ngày mới với năng lượng tích cực!',
        'Mỗi ngày là một cơ hội mới để phát triển!',
        'Nỗ lực của bạn hôm nay sẽ tạo nên thành công ngày mai!',
        'Hãy làm việc thông minh và hiệu quả!',
        'Chúc bạn có một ngày làm việc hiệu quả!'
    ];
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    const quoteElement = document.getElementById('motivationalQuote');
    if (quoteElement) {
        quoteElement.textContent = randomQuote;
    }
}

// ===== APPS MANAGEMENT =====

/**
 * Load danh sách apps mà user có quyền truy cập
 */
function loadUserApps() {
    if (!currentUser) return;

    // Lấy danh sách app IDs từ token (nếu có)
    const permissions = currentUser.permissions || [];
    
    // Nếu user là ADMIN -> có quyền truy cập tất cả apps
    if (currentUser.role === 'ADMIN') {
        userApps = Object.values(APPS_DATABASE);
    } else {
        // Lọc apps theo permissions
        userApps = permissions
            .filter(p => p.canView) // Chỉ lấy app có quyền view
            .map(p => APPS_DATABASE[p.appId])
            .filter(app => app); // Loại bỏ undefined
    }

    // Hiển thị apps
    displayApps(userApps);
}

/**
 * Hiển thị danh sách apps
 */
function displayApps(apps) {
    const appsGrid = document.getElementById('appsGrid');
    if (!appsGrid) return;

    if (apps.length === 0) {
        appsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📱</div>
                <h3 class="empty-state-title">Chưa có ứng dụng</h3>
                <p class="empty-state-description">
                    Bạn chưa được cấp quyền truy cập ứng dụng nào.<br>
                    Vui lòng liên hệ quản trị viên để được hỗ trợ.
                </p>
            </div>
        `;
        return;
    }

    appsGrid.innerHTML = apps.map(app => `
        <a href="${app.url}" class="app-card" data-app-id="${app.id}">
            <div class="app-icon-wrapper">
                <div class="app-icon" style="background: ${app.color};">
                    ${app.icon}
                </div>
            </div>
            <div class="app-details">
                <div class="app-name">${app.name}</div>
                <div class="app-description">${app.description}</div>
                <span class="app-status ${app.status}">
                    ${app.status === 'active' ? '● Hoạt động' : '⏳ Sắp ra mắt'}
                </span>
            </div>
            <svg class="app-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" 
                      stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </a>
    `).join('');

    // Add fade-in animation
    const cards = appsGrid.querySelectorAll('.app-card');
    cards.forEach((card, index) => {
        card.style.animation = `fadeIn 0.6s ease ${index * 0.1}s both`;
    });
}

// ===== SEARCH FUNCTIONALITY =====

/**
 * Thiết lập chức năng tìm kiếm
 */
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    // Tìm kiếm khi gõ
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query === '') {
            displayApps(userApps);
            return;
        }

        // Lọc apps theo tên hoặc mô tả
        const filtered = userApps.filter(app => 
            app.name.toLowerCase().includes(query) ||
            app.description.toLowerCase().includes(query)
        );

        displayApps(filtered);
    });

    // Keyboard shortcut Ctrl+K
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
    });
}

// ===== QUICK ACTIONS =====

/**
 * Thiết lập các nút quick action
 */
function setupQuickActions() {
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');
    
    quickActionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = btn.dataset.action;
            handleQuickAction(action);
        });
    });
}

/**
 * Xử lý quick action
 */
function handleQuickAction(action) {
    switch(action) {
        case 'new-task':
            showToast('Tính năng tạo nhiệm vụ đang phát triển', 'info');
            break;
        case 'scan-qr':
            showToast('Tính năng quét QR đang phát triển', 'info');
            break;
        case 'report':
            showToast('Tính năng báo cáo đang phát triển', 'info');
            break;
        case 'help':
            window.open('https://support.cphaco.vn', '_blank');
            break;
        default:
            console.log('Unknown action:', action);
    }
}

// ===== VIEW TOGGLE =====

/**
 * Thiết lập toggle view (grid/list)
 */
function setupViewToggle() {
    const viewBtns = document.querySelectorAll('.view-btn');
    const appsGrid = document.getElementById('appsGrid');
    if (!appsGrid) return;

    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            viewBtns.forEach(b => b.classList.remove('active'));
            
            // Add active to clicked
            btn.classList.add('active');
            
            // Toggle view
            const view = btn.dataset.view;
            if (view === 'list') {
                appsGrid.classList.add('list-view');
            } else {
                appsGrid.classList.remove('list-view');
            }
        });
    });
}

// ===== NOTIFICATIONS =====

/**
 * Load notifications
 */
function loadNotifications() {
    const notifications = [
        {
            id: 1,
            title: 'Chào mừng đến với Cphaco.app',
            message: 'Cảm ơn bạn đã sử dụng hệ thống quản lý của chúng tôi',
            time: '5 phút trước',
            unread: true,
            icon: '👋',
            color: '#0066FF'
        },
        {
            id: 2,
            title: 'Cập nhật hệ thống',
            message: 'Hệ thống đã được cập nhật lên phiên bản mới',
            time: '2 giờ trước',
            unread: true,
            icon: '🔄',
            color: '#10b981'
        },
        {
            id: 3,
            title: 'Bảo trì định kỳ',
            message: 'Hệ thống sẽ bảo trì vào 2h sáng ngày mai',
            time: '1 ngày trước',
            unread: false,
            icon: '⚙️',
            color: '#f59e0b'
        }
    ];

    displayNotifications(notifications);
}

/**
 * Hiển thị notifications
 */
function displayNotifications(notifications) {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;

    if (notifications.length === 0) {
        notificationList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔔</div>
                <h3 class="empty-state-title">Không có thông báo</h3>
                <p class="empty-state-description">Bạn đã xem hết tất cả thông báo</p>
            </div>
        `;
        return;
    }

    notificationList.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.unread ? 'unread' : ''}" data-id="${notif.id}">
            <div style="display: flex; align-items: start; gap: 1rem;">
                <div style="width: 40px; height: 40px; border-radius: 10px; 
                            background: ${notif.color}20; display: flex; align-items: center; 
                            justify-content: center; font-size: 1.25rem; flex-shrink: 0;">
                    ${notif.icon}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">
                        ${notif.title}
                    </div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                        ${notif.message}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-light);">
                        ${notif.time}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Thiết lập notification panel
 */
function setupNotifications() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPanel = document.getElementById('notificationPanel');
    const closeNotifications = document.getElementById('closeNotifications');
    const overlay = document.getElementById('overlay');

    if (!notificationBtn || !notificationPanel) return;

    // Open panel
    notificationBtn.addEventListener('click', () => {
        notificationPanel.classList.add('active');
        overlay.classList.add('active');
    });

    // Close panel
    closeNotifications.addEventListener('click', () => {
        notificationPanel.classList.remove('active');
        overlay.classList.remove('active');
    });

    // Close when click overlay
    overlay.addEventListener('click', () => {
        notificationPanel.classList.remove('active');
        document.getElementById('userDropdown').classList.remove('active');
        overlay.classList.remove('active');
    });

    // Load notifications
    loadNotifications();
}

// ===== USER MENU =====

/**
 * Thiết lập user menu dropdown
 */
function setupUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    const userDropdown = document.getElementById('userDropdown');
    const overlay = document.getElementById('overlay');

    if (!userMenu || !userDropdown) return;

    // Toggle dropdown
    userMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = userDropdown.classList.contains('active');
        
        // Close notification panel if open
        document.getElementById('notificationPanel')?.classList.remove('active');
        
        // Toggle user dropdown
        userDropdown.classList.toggle('active');
        overlay.classList.toggle('active', !isActive);
    });

    // Logout handler
    const logoutBtn = userDropdown.querySelector('.dropdown-item.danger');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (confirm('Bạn có chắc muốn đăng xuất?')) {
                logout();
            }
        });
    }
}

// ===== ACTIVITIES =====

/**
 * Load recent activities
 */
function loadActivities() {
    const activities = [
        {
            icon: '📅',
            color: 'linear-gradient(135deg, #667eea, #764ba2)',
            title: 'Truy cập Đăng ký trực BQT',
            description: 'Đã xem lịch trực tháng 11',
            time: '10 phút trước'
        },
        {
            icon: '🗺️',
            color: 'linear-gradient(135deg, #f093fb, #f5576c)',
            title: 'Cập nhật Bản đồ số',
            description: 'Đã chỉnh sửa vị trí A-123',
            time: '1 giờ trước'
        },
        {
            icon: '🌸',
            color: 'linear-gradient(135deg, #4facfe, #00f2fe)',
            title: 'Xem Khu chăm sóc',
            description: 'Đã kiểm tra biên bản khu A',
            time: '2 giờ trước'
        },
        {
            icon: '📊',
            color: 'linear-gradient(135deg, #fa709a, #fee140)',
            title: 'Khảo sát TPT',
            description: 'Đã hoàn thành 5 khảo sát',
            time: 'Hôm qua'
        }
    ];

    displayActivities(activities);
}

/**
 * Hiển thị activities
 */
function displayActivities(activities) {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    if (activities.length === 0) {
        activityList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3 class="empty-state-title">Chưa có hoạt động</h3>
                <p class="empty-state-description">Hoạt động của bạn sẽ được hiển thị ở đây</p>
            </div>
        `;
        return;
    }

    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item fade-in">
            <div class="activity-icon" style="background: ${activity.color};">
                ${activity.icon}
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
            </div>
            <div class="activity-time">${activity.time}</div>
        </div>
    `).join('');
}

// ===== STATISTICS =====

/**
 * Load và hiển thị thống kê
 */
function loadStatistics() {
    // Mock data - trong thực tế sẽ fetch từ API
    const stats = {
        tasksCompleted: Math.floor(Math.random() * 20) + 10,
        productivity: Math.floor(Math.random() * 30) + 70,
        streak: Math.floor(Math.random() * 10) + 5
    };

    // Cập nhật UI
    const tasksElement = document.getElementById('tasksCompleted');
    const productivityElement = document.getElementById('productivity');
    const streakElement = document.getElementById('streak');

    if (tasksElement) animateCounter(tasksElement, stats.tasksCompleted);
    if (productivityElement) animateCounter(productivityElement, stats.productivity, '%');
    if (streakElement) animateCounter(streakElement, stats.streak);
}

/**
 * Animation cho counter
 */
function animateCounter(element, target, suffix = '') {
    const duration = 1000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + suffix;
    }, 16);
}

// ===== TOAST NOTIFICATIONS =====

/**
 * Hiển thị toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('achievementToast');
    if (!toast) return;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const titles = {
        success: 'Thành công',
        error: 'Lỗi',
        warning: 'Cảnh báo',
        info: 'Thông tin'
    };

    const iconElement = toast.querySelector('.achievement-icon');
    const titleElement = toast.querySelector('.achievement-title');
    const textElement = toast.querySelector('.achievement-text');

    if (iconElement) iconElement.textContent = icons[type] || icons.info;
    if (titleElement) titleElement.textContent = titles[type] || titles.info;
    if (textElement) textElement.textContent = message;

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== PAGE LOAD ANIMATION =====

/**
 * Animation khi load trang
 */
function pageLoadAnimation() {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
}

// ===== INITIALIZATION =====

/**
 * Khởi tạo tất cả chức năng khi DOM ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Cphaco Dashboard loading...');

    // 1. Kiểm tra authentication
    if (!checkAuth()) {
        console.warn('❌ Not authenticated');
        return;
    }

    console.log('✅ Authenticated:', currentUser);

    // 2. Load user info
    loadUserInfo();

    // 3. Load user apps
    loadUserApps();

    // 4. Setup các chức năng
    setupSearch();
    setupQuickActions();
    setupViewToggle();
    setupNotifications();
    setupUserMenu();
    setupChangePasswordModal();

    // 5. Load data
    loadStatistics();
    loadActivities();

    // 6. Page animation
    pageLoadAnimation();

    // 7. Welcome message
    setTimeout(() => {
        showToast(`Chào mừng ${currentUser.name || currentUser.email}!`, 'success');
    }, 500);

    console.log('✅ Dashboard loaded successfully!');
});

// ===== ERROR HANDLING =====

/**
 * Global error handler
 */
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    showToast('Đã xảy ra lỗi. Vui lòng thử lại.', 'error');
});

/**
 * Unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled rejection:', e.reason);
    showToast('Đã xảy ra lỗi. Vui lòng thử lại.', 'error');
});

console.log('📱 Dashboard.js loaded');
