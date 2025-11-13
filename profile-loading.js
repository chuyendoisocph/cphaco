// ========================================
// PROFILE-LOADING.JS
// Gamma-style loading & animations
// ========================================

class ProfileLoader {
  constructor() {
    this.pageLoader          = document.getElementById('pageLoader');
    this.loadingBackdrop     = document.getElementById('loadingBackdrop');
    this.loadingBackdropText = document.getElementById('loadingBackdropText');
  }

  // ---------- PAGE LOADER ----------
  showPageLoader() {
    if (this.pageLoader) {
      this.pageLoader.classList.remove('hidden');
    }
  }

  hidePageLoader() {
    if (this.pageLoader) {
      setTimeout(() => {
        this.pageLoader.classList.add('hidden');
      }, 500); // cho mượt
    }
  }

  // ---------- BACKDROP ----------
  showLoadingBackdrop(text = 'Đang xử lý...') {
    if (this.loadingBackdrop && this.loadingBackdropText) {
      this.loadingBackdropText.textContent = text;
      this.loadingBackdrop.classList.add('active');
    }
  }

  hideLoadingBackdrop() {
    if (this.loadingBackdrop) {
      this.loadingBackdrop.classList.remove('active');
    }
  }

  // ---------- ANIMATION CONTENT ----------
  animateContent() {
    const sidebar = document.querySelector('.profile-sidebar');
    if (sidebar) sidebar.classList.add('slide-in-left');

    const main = document.querySelector('.profile-main');
    if (main) main.classList.add('slide-in-right');

    const nav = document.querySelector('.top-nav');
    if (nav) nav.classList.add('fade-in');

    const formSections = document.querySelectorAll('.form-section');
    formSections.forEach((section, index) => {
      section.classList.add('slide-in-up', `stagger-${index + 1}`);
    });

    const stats = document.querySelectorAll('.stat-item');
    stats.forEach((stat, index) => {
      stat.classList.add('slide-in-up', `stagger-${index + 1}`);
    });
  }

  // ---------- SKELETON ----------
  showSkeletonLoading() {
    const avatarSection = document.querySelector('.avatar-section');
    if (avatarSection) {
      avatarSection.classList.add('loading');
      const avatar = avatarSection.querySelector('.profile-avatar');
      if (avatar) avatar.style.visibility = 'hidden';
    }

    const statsSection = document.querySelector('.profile-stats');
    if (statsSection) statsSection.classList.add('loading');

    const formSections = document.querySelectorAll('.form-section');
    formSections.forEach(section => section.classList.add('loading'));
  }

  hideSkeletonLoading() {
    const avatarSection = document.querySelector('.avatar-section');
    if (avatarSection) {
      avatarSection.classList.remove('loading');
      const avatar = avatarSection.querySelector('.profile-avatar');
      if (avatar) avatar.style.visibility = 'visible';
    }

    const statsSection = document.querySelector('.profile-stats');
    if (statsSection) statsSection.classList.remove('loading');

    const formSections = document.querySelectorAll('.form-section');
    formSections.forEach(section => section.classList.remove('loading'));
  }
}

// Xuất global để profile.js dùng
window.ProfileLoader = ProfileLoader;
