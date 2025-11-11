// ========================================
// CHANGE-PASSWORD.JS - CPHACO.APP
// Handle change password in dashboard
// Paste code này vào cuối dashboard.js HOẶC import riêng
// ========================================

/**
 * Setup Change Password Modal
 * Call this function in dashboard initialization
 */
function setupChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    const closeBtn = document.getElementById('closeChangePasswordModal');
    const cancelBtn = document.getElementById('cancelChangePassword');
    const form = document.getElementById('changePasswordForm');
    
    if (!modal || !form) {
        console.warn('Change password modal not found');
        return;
    }
    
    // Open modal from user dropdown
    const changePasswordLink = document.querySelector('[data-action="change-password"]');
    if (changePasswordLink) {
        changePasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            openChangePasswordModal();
        });
    }
    
    // Close modal handlers
    closeBtn.addEventListener('click', closeChangePasswordModal);
    cancelBtn.addEventListener('click', closeChangePasswordModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeChangePasswordModal();
        }
    });
    
    // ESC to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeChangePasswordModal();
        }
    });
    
    // Password toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const input = document.getElementById(targetId);
            
            if (input) {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                this.style.color = type === 'text' ? 'var(--primary-blue)' : 'var(--text-light)';
            }
        });
    });
    
    // Form submission
    form.addEventListener('submit', handleChangePassword);
    
    // Real-time validation
    const newPasswordInput = document.getElementById('newPasswordModal');
    const confirmPasswordInput = document.getElementById('confirmPasswordModal');
    
    if (newPasswordInput && confirmPasswordInput) {
        newPasswordInput.addEventListener('input', () => {
            removeModalError(newPasswordInput);
            
            if (confirmPasswordInput.value && newPasswordInput.value !== confirmPasswordInput.value) {
                showModalError(confirmPasswordInput, 'Mật khẩu không khớp');
            } else {
                removeModalError(confirmPasswordInput);
            }
        });
        
        confirmPasswordInput.addEventListener('input', function() {
            removeModalError(this);
            
            if (this.value && this.value !== newPasswordInput.value) {
                showModalError(this, 'Mật khẩu không khớp');
            }
        });
    }
}

/**
 * Open modal
 */
function openChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    const overlay = document.getElementById('overlay');
    
    if (modal) {
        modal.classList.add('active');
        
        // Close other panels
        document.getElementById('userDropdown')?.classList.remove('active');
        document.getElementById('notificationPanel')?.classList.remove('active');
        
        if (overlay) {
            overlay.classList.add('active');
        }
        
        // Focus first input
        setTimeout(() => {
            document.getElementById('currentPassword')?.focus();
        }, 300);
    }
}

/**
 * Close modal
 */
function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    const overlay = document.getElementById('overlay');
    const form = document.getElementById('changePasswordForm');
    
    if (modal) {
        modal.classList.remove('active');
        
        if (overlay && !document.querySelector('.notification-panel.active, .user-dropdown.active')) {
            overlay.classList.remove('active');
        }
        
        // Reset form
        if (form) {
            form.reset();
            
            // Remove all errors
            form.querySelectorAll('.form-input').forEach(input => {
                removeModalError(input);
            });
        }
    }
}

/**
 * Handle form submission
 */
async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPasswordModal').value;
    const confirmPassword = document.getElementById('confirmPasswordModal').value;
    
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPasswordModal');
    const confirmPasswordInput = document.getElementById('confirmPasswordModal');
    
    // Remove previous errors
    removeModalError(currentPasswordInput);
    removeModalError(newPasswordInput);
    removeModalError(confirmPasswordInput);
    
    // Validate
    let isValid = true;
    
    if (!currentPassword) {
        showModalError(currentPasswordInput, 'Vui lòng nhập mật khẩu hiện tại');
        isValid = false;
    }
    
    if (!newPassword) {
        showModalError(newPasswordInput, 'Vui lòng nhập mật khẩu mới');
        isValid = false;
    } else if (newPassword.length < 8) {
        showModalError(newPasswordInput, 'Mật khẩu phải có ít nhất 8 ký tự');
        isValid = false;
    } else if (newPassword === currentPassword) {
        showModalError(newPasswordInput, 'Mật khẩu mới phải khác mật khẩu hiện tại');
        isValid = false;
    }
    
    if (!confirmPassword) {
        showModalError(confirmPasswordInput, 'Vui lòng xác nhận mật khẩu');
        isValid = false;
    } else if (newPassword !== confirmPassword) {
        showModalError(confirmPasswordInput, 'Mật khẩu không khớp');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Show loading
    const submitBtn = e.target.querySelector('.btn-primary');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = '<span>Đang cập nhật...</span>';
    submitBtn.disabled = true;
    
    try {
        // Get current user email from token
        const token = localStorage.getItem('CP_AUTH_TOKEN');
        if (!token) {
            throw new Error('Phiên đăng nhập đã hết hạn');
        }
        
        const user = parseJWT(token);
        const email = user.email;
        
        // Call API to change password
        const response = await fetch(AUTH_BASE, {
            method: 'POST',
            body: JSON.stringify({
                action: 'change-password',
                email: email,
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });
        
        const data = await response.json();
        
        if (!data.ok) {
            throw new Error(data.error || 'Không thể đổi mật khẩu');
        }
        
        // Success
        showToast('✓ Mật khẩu đã được thay đổi thành công!', 'success');
        
        // Close modal
        setTimeout(() => {
            closeChangePasswordModal();
        }, 1000);
        
    } catch (error) {
        console.error('Change password error:', error);
        
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        if (error.message.includes('hiện tại')) {
            showModalError(currentPasswordInput, error.message);
        } else {
            showModalError(confirmPasswordInput, error.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
        }
    }
}

/**
 * Show error for modal input
 */
function showModalError(input, message) {
    const existingError = input.parentElement.parentElement.querySelector('.error-message');
    if (existingError) existingError.remove();
    
    input.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `⚠️ ${message}`;
    
    input.parentElement.parentElement.appendChild(errorDiv);
}

/**
 * Remove error from modal input
 */
function removeModalError(input) {
    input.classList.remove('error');
    const errorMessage = input.parentElement.parentElement.querySelector('.error-message');
    if (errorMessage) errorMessage.remove();
}

// Export function để sử dụng trong dashboard
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { setupChangePasswordModal };
}

console.log('🔐 Change Password module loaded');
