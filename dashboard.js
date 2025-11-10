// Apps Data - Configure permissions here
const apps = [
    {
        id: 1,
        name: 'Bản đồ số',
        description: 'Hệ thống định vị và tìm kiếm vị trí mộ phần trực quan, nhanh chóng',
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
        </svg>`,
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        url: 'https://script.google.com/macros/s/AKfycbwKuTqXLyIkR8L5htnYDkHFi-HRIIdFo1dnL9XnMa-nIqmMLsdTvczEsVv1xD_Vn4_e/exec',
        badge: 'popular',
        uses: 1243,
        rating: 4.8
    },
    {
        id: 2,
        name: 'Đăng ký lịch trực',
        description: 'Quản lý lịch trực và phân công công việc cho nhân viên',
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>`,
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        url: 'https://script.google.com/macros/s/AKfycbyc0dNDh8rlTn9K0W0CHnHAT2QDgtxqpvXz7g1SfZaOWkel3lDv3_8coBN4Vb7Y8rGwpg/exec',
        badge: 'new',
        uses: 856,
        rating: 4.9
    },
    {
        id: 3,
        name: 'Khảo sát chất lượng',
        description: 'Thu thập phản hồi và đánh giá chất lượng phục vụ',
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>`,
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        url: 'https://script.google.com/macros/s/AKfycbw2kb9e8QKC_ctbqpJMvPBJcoOAXQ2xZUk6ofiUOT1IItKF_t8h1D9kWrvEUV8h2Ng7tg/exec',
        uses: 654,
        rating: 4.7
    },
    {
        id: 4,
        name: 'Tra cứu mộ phần',
        description: 'Tìm kiếm thông tin mộ phần nhanh chóng và chính xác',
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
        </svg>`,
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        url: 'https://script.google.com/macros/s/AKfycbyaZ-Bp2RiS4OhGeiPS6jeP0FVIeMcHGf41H2oxrlzS0SBGhegGnMPhiAtcEc8d84Za/exec',
        uses: 2341,
        rating: 4.9
    },
    {
        id: 5,
        name: 'Quản lý Tổ trưởng',
        description: 'Theo dõi và quản lý hoạt động của các tổ trưởng',
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>`,
        gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        url: 'https://script.google.com/macros/s/AKfycbyNVy2eYv5ZqiKfXvxKm9T0OY2KHqr0P2rlCJB9LrRCpQnvfMfwNMOCN_cCeFU7YvOm/exec',
        uses: 432,
        rating: 4.6
    },
    {
        id: 7,
        name: 'Cộng tác viên',
        description: 'Quản lý thông tin và hoạt động của cộng tác viên',
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>`,
        gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        url: 'https://script.google.com/macros/s/AKfycbxqXqfsij6GWAiaHSQOCsZeES4LvR8EM00LCGR0OztH-pNt_TLBnCBc5F35skl3RUmC/exec',
        uses: 789,
        rating: 4.8
    },
    {
        id: 8,
        name: 'Khu chăm sóc',
        description: 'Quản lý các khu vực chăm sóc và bảo dưỡng',
        icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>`,
        gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        url: 'https://script.google.com/macros/s/AKfycby5BJzivbuW-tP1uj0wiFLoGIOYuqlhF1tlI1K0K2V7vrLsjN-8mFmVjeIcEU_2b8sW/exec',
        uses: 567,
        rating: 4.7
    }
];

// Motivational Quotes
const quotes = [
    "Hôm nay là một ngày tuyệt vời để làm những điều tuyệt vời!",
    "Mỗi ngày là một cơ hội mới để phát triển bản thân.",
    "Thành công bắt đầu từ những điều nhỏ nhất.",
    "Hãy biến ước mơ thành hiện thực!",
    "Bạn mạnh mẽ hơn bạn nghĩ!",
    "Hãy tạo ra sự khác biệt ngày hôm nay!",
    "Nhiệt huyết là chìa khóa của thành công.",
    "Mỗi bước tiến đều có ý nghĩa!"
];

// Get greeting based on time
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
}

// Get random quote
function getRandomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)];
}

// Initialize Dashboard
function initializeDashboard() {
    // Set greeting
    document.getElementById('greeting').textContent = getGreeting();
    document.getElementById('motivationalQuote').textContent = getRandomQuote();
    
    // Get user name from localStorage or use default
    const userName = localStorage.getItem('userName') || 'Văn A';
    document.getElementById('userNameDisplay').textContent = userName;
    document.getElementById('userName').textContent = `Nguyễn ${userName}`;
    document.getElementById('dropdownUserName').textContent = `Nguyễn ${userName}`;
    
    // Load apps
    loadApps();
    
    // Load activities
    loadActivities();
    
    // Load notifications
    loadNotifications();
    
    // Animate stats
    animateStats();
    
    // Show welcome achievement
    setTimeout(() => {
        showAchievement(`Chào mừng trở lại, ${userName}!`);
    }, 1000);
}

// Load Apps
function loadApps() {
    const appsGrid = document.getElementById('appsGrid');
    appsGrid.innerHTML = '';
    
    apps.forEach((app, index) => {
        const appCard = document.createElement('a');
        appCard.href = app.url;
        appCard.target = '_blank';
        appCard.className = 'app-card';
        appCard.style.animationDelay = `${index * 0.1}s`;
        
        let badgeHTML = '';
        if (app.badge === 'new') {
            badgeHTML = '<span class="app-badge new">Mới</span>';
        } else if (app.badge === 'popular') {
            badgeHTML = '<span class="app-badge popular">Phổ biến</span>';
        }
        
        appCard.innerHTML = `
            <div class="app-card-header">
                <div class="app-icon-large" style="background: ${app.gradient};">
                    ${app.icon}
                </div>
                ${badgeHTML}
            </div>
            <div class="app-card-body">
                <h3 class="app-card-title">${app.name}</h3>
                <p class="app-card-description">${app.description}</p>
            </div>
            <div class="app-card-footer">
                <div class="app-stats">
                    <div class="app-stat">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 1.33334L10.06 5.50668L14.6667 6.18001L11.3333 9.42668L12.12 14.0133L8 11.8467L3.88 14.0133L4.66667 9.42668L1.33334 6.18001L5.94 5.50668L8 1.33334Z" fill="currentColor"/>
                        </svg>
                        ${app.rating}
                    </div>
                    <div class="app-stat">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M13.3333 8V12.6667C13.3333 13.0203 13.1929 13.3594 12.9428 13.6095C12.6928 13.8595 12.3536 14 12 14H4C3.64638 14 3.30724 13.8595 3.05719 13.6095C2.80714 13.3594 2.66667 13.0203 2.66667 12.6667V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M10.6667 4L8 1.33334L5.33334 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M8 1.33334V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        ${app.uses}
                    </div>
                </div>
                <button class="app-launch-btn" onclick="event.preventDefault(); launchApp('${app.name}', '${app.url}')">
                    <span>Mở</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M12 8.66667V12.6667C12 13.0203 11.8595 13.3594 11.6095 13.6095C11.3594 13.8595 11.0203 14 10.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V5.33333C2 4.97971 2.14048 4.64057 2.39052 4.39052C2.64057 4.14048 2.97971 4 3.33333 4H7.33333M10 2H14M14 2V6M14 2L6.66667 9.33333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        `;
        
        appsGrid.appendChild(appCard);
    });
}

// Launch App
function launchApp(appName, appUrl) {
    // Track app launch
    const launches = JSON.parse(localStorage.getItem('appLaunches') || '{}');
    launches[appName] = (launches[appName] || 0) + 1;
    localStorage.setItem('appLaunches', JSON.stringify(launches));
    
    // Update stats
    const tasksCompleted = parseInt(document.getElementById('tasksCompleted').textContent) + 1;
    document.getElementById('tasksCompleted').textContent = tasksCompleted;
    
    // Show toast
    showAchievement(`Đang mở ${appName}...`);
    
    // Open app
    window.open(appUrl, '_blank');
}

// Load Activities
function loadActivities() {
    const activities = [
        {
            icon: '📊',
            title: 'Xuất báo cáo thành công',
            description: 'Báo cáo tháng 1/2025 đã được tạo',
            time: '5 phút trước',
            bgColor: 'linear-gradient(135deg, #667eea, #764ba2)'
        },
        {
            icon: '✅',
            title: 'Hoàn thành nhiệm vụ',
            description: 'Cập nhật thông tin mộ phần khu A',
            time: '1 giờ trước',
            bgColor: 'linear-gradient(135deg, #f093fb, #f5576c)'
        },
        {
            icon: '📝',
            title: 'Đăng ký lịch trực',
            description: 'Đã đăng ký ca trực ngày 10/01',
            time: '3 giờ trước',
            bgColor: 'linear-gradient(135deg, #4facfe, #00f2fe)'
        },
        {
            icon: '⭐',
            title: 'Nhận đánh giá 5 sao',
            description: 'Từ khảo sát chất lượng dịch vụ',
            time: 'Hôm qua',
            bgColor: 'linear-gradient(135deg, #fa709a, #fee140)'
        }
    ];
    
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';
    
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon" style="background: ${activity.bgColor}; color: white;">
                ${activity.icon}
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
            </div>
            <div class="activity-time">${activity.time}</div>
        `;
        activityList.appendChild(activityItem);
    });
}

// Load Notifications
function loadNotifications() {
    const notifications = [
        {
            icon: '🔔',
            title: 'Lịch trực mới',
            text: 'Bạn có ca trực vào ngày mai lúc 8:00 AM',
            time: '10 phút trước',
            unread: true,
            bgColor: 'linear-gradient(135deg, #667eea, #764ba2)'
        },
        {
            icon: '📢',
            title: 'Thông báo quan trọng',
            text: 'Họp toàn thể vào 14:00 chiều nay',
            time: '30 phút trước',
            unread: true,
            bgColor: 'linear-gradient(135deg, #f093fb, #f5576c)'
        },
        {
            icon: '🎉',
            title: 'Chúc mừng!',
            text: 'Bạn đã hoàn thành 100 nhiệm vụ',
            time: '2 giờ trước',
            unread: true,
            bgColor: 'linear-gradient(135deg, #fa709a, #fee140)'
        },
        {
            icon: '💡',
            title: 'Mẹo hữu ích',
            text: 'Dùng Ctrl+K để tìm kiếm nhanh',
            time: '1 ngày trước',
            unread: false,
            bgColor: 'linear-gradient(135deg, #4facfe, #00f2fe)'
        }
    ];
    
    const notificationList = document.getElementById('notificationList');
    notificationList.innerHTML = '';
    
    notifications.forEach(notif => {
        const notifItem = document.createElement('div');
        notifItem.className = `notification-item ${notif.unread ? 'unread' : ''}`;
        notifItem.innerHTML = `
            <div class="notification-item-icon" style="background: ${notif.bgColor}; color: white;">
                ${notif.icon}
            </div>
            <div class="notification-item-content">
                <div class="notification-item-title">${notif.title}</div>
                <div class="notification-item-text">${notif.text}</div>
                <div class="notification-item-time">${notif.time}</div>
            </div>
        `;
        notificationList.appendChild(notifItem);
    });
}

// Animate Stats
function animateStats() {
    const stats = [
        { id: 'tasksCompleted', target: 12 },
        { id: 'streak', target: 7 }
    ];
    
    stats.forEach(stat => {
        const element = document.getElementById(stat.id);
        let current = 0;
        const increment = stat.target / 20;
        const timer = setInterval(() => {
            current += increment;
            if (current >= stat.target) {
                element.textContent = stat.target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 50);
    });
}

// Show Achievement Toast
function showAchievement(text) {
    const toast = document.getElementById('achievementToast');
    toast.querySelector('.achievement-text').textContent = text;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Search Functionality
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const appCards = document.querySelectorAll('.app-card');
    
    appCards.forEach(card => {
        const title = card.querySelector('.app-card-title').textContent.toLowerCase();
        const description = card.querySelector('.app-card-description').textContent.toLowerCase();
        
        if (title.includes(query) || description.includes(query)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Escape to clear search
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.value = '';
        searchInput.blur();
        loadApps(); // Reset apps display
    }
});

// Notification Panel
const notificationBtn = document.getElementById('notificationBtn');
const notificationPanel = document.getElementById('notificationPanel');
const closeNotifications = document.getElementById('closeNotifications');
const overlay = document.getElementById('overlay');

notificationBtn.addEventListener('click', () => {
    notificationPanel.classList.add('active');
    overlay.classList.add('active');
});

closeNotifications.addEventListener('click', () => {
    notificationPanel.classList.remove('active');
    overlay.classList.remove('active');
});

overlay.addEventListener('click', () => {
    notificationPanel.classList.remove('active');
    overlay.classList.remove('active');
});

// User Dropdown
const userMenu = document.querySelector('.user-menu');
const userDropdown = document.getElementById('userDropdown');

userMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Close notification panel if open
    notificationPanel.classList.remove('active');
    overlay.classList.remove('active');
    
    // Toggle user dropdown (NO overlay needed)
    userDropdown.classList.toggle('active');
});

// Close user dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('active');
    }
});

// View Toggle
const viewButtons = document.querySelectorAll('.view-btn');
viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const view = btn.dataset.view;
        const appsGrid = document.getElementById('appsGrid');
        
        if (view === 'list') {
            appsGrid.style.gridTemplateColumns = '1fr';
        } else {
            appsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
        }
    });
});

// Quick Actions
const quickActionBtns = document.querySelectorAll('.quick-action-btn');
quickActionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        showAchievement(`Đang thực hiện: ${btn.textContent.trim()}`);
    });
});

// Initialize on load
window.addEventListener('load', () => {
    initializeDashboard();
    
    // Page transition
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Service Worker (optional - for offline support)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed
    });
}

console.log('🚀 Cphaco Dashboard loaded successfully!');
console.log('💡 Tip: Press Ctrl+K to search apps');
