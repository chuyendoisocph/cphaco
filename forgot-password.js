// ========================================
// FORGOT-PASSWORD.JS - CPHACO.APP
// Reset password via OTP
// ========================================

// ===== CONFIGURATION =====
const AUTH_BASE = 'https://script.google.com/macros/s/AKfycbwwOc00czKNL_R57w89sVCfnrBoRqEWBHmEBXsCeKni0aWhnHoqW3cIyzt4wwTsl6CSQQ/exec';

// ===== STATE =====
let currentStep = 1;
let userEmail = '';
let resetToken = '';
let resendCooldown = 0;

// ===== DOM ELEMENTS =====
const emailForm = document.getElementById('emailForm');
const otpForm = document.getElementById('otpForm');
const passwordForm = document.getElementById('passwordForm');
const emailInput = document.getElementById('email');
const emailDisplay = document.getElementById('emailDisplay');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const otpInputs = document.querySelectorAll('.otp-input');
const resendLink = document.getElementById('resendLink');
const resendTimer = document.getElementById('resendTimer');
const togglePassword1 = document.getElementById('togglePassword1');
const togglePassword2 = document.getElementById('togglePassword2');

// ===== VALIDATION HELPERS =====

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(input, message) {
    const existingError = input.parentElement.parentElement.querySelector('.error-message');
    if (existingError) existingError.remove();
    
    input.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `⚠️ ${message}`;
    
    input.parentElement.parentElement.appendChild(errorDiv);
}

function removeError(input) {
    input.classList.remove('error');
    const errorMessage = input.parentElement.parentElement.querySelector('.error-message');
    if (errorMessage) errorMessage.remove();
}

function showSuccessMessage(message) {
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) existingSuccess.remove();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const formHeader = document.querySelector('.form-header');
    if (formHeader) {
        formHeader.insertAdjacentElement('afterend', successDiv);
    }
}

// ===== STEP NAVIGATION =====

function goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    
    // Show current step
    document.getElementById(`step${step}`).classList.add('active');
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((stepEl, index) => {
        const stepNum = index + 1;
        stepEl.classList.remove('active', 'completed');
        
        if (stepNum < step) {
            stepEl.classList.add('completed');
        } else if (stepNum === step) {
            stepEl.classList.add('active');
        }
    });
    
    currentStep = step;
}

// ===== API CALLS =====

async function sendOTP(email) {
    try {
        const response = await fetch(AUTH_BASE, {
            method: 'POST',
            body: JSON.stringify({
                action: 'send-otp',
                email: email
            })
        });
        
        const data = await response.json();
        
        if (!data.ok) {
            throw new Error(data.error || 'Không thể gửi OTP');
        }
        
        return true;
    } catch (error) {
        console.error('Send OTP error:', error);
        throw error;
    }
}

async function verifyOTP(email, code) {
    try {
        const response = await fetch(AUTH_BASE, {
            method: 'POST',
            body: JSON.stringify({
                action: 'verify-otp',
                email: email,
                code: code,
                action: 'reset-password'
            })
        });
        
        const data = await response.json();
        
        if (!data.ok) {
            throw new Error(data.error || 'OTP không chính xác');
        }
        
        return data.resetToken;
    } catch (error) {
        console.error('Verify OTP error:', error);
        throw error;
    }
}

async function resetPassword(email, token, newPassword) {
    try {
        const response = await fetch(AUTH_BASE, {
            method: 'POST',
            body: JSON.stringify({
                action: 'reset-password',
                email: email,
                resetToken: token,
                newPassword: newPassword
            })
        });
        
        const data = await response.json();
        
        if (!data.ok) {
            throw new Error(data.error || 'Không thể đặt lại mật khẩu');
        }
        
        return true;
    } catch (error) {
        console.error('Reset password error:', error);
        throw error;
    }
}

// ===== STEP 1: EMAIL FORM =====

emailForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    removeError(emailInput);
    
    // Validate email
    if (!emailInput.value) {
        showError(emailInput, 'Vui lòng nhập email');
        return;
    }
    
    if (!validateEmail(emailInput.value)) {
        showError(emailInput, 'Email không hợp lệ');
        return;
    }
    
    const submitBtn = this.querySelector('.submit-button');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = '<span>Đang gửi...</span>';
    submitBtn.disabled = true;
    
    try {
        userEmail = emailInput.value;
        
        await sendOTP(userEmail);
        
        // Success - go to step 2
        emailDisplay.textContent = userEmail;
        goToStep(2);
        
        // Focus first OTP input
        otpInputs[0].focus();
        
        // Start resend cooldown
        startResendCooldown();
        
    } catch (error) {
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        showError(emailInput, error.message || 'Không thể gửi OTP. Vui lòng thử lại.');
    }
});

// ===== STEP 2: OTP FORM =====

// Auto-focus next input
otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpInputs[index - 1].focus();
        }
    });
    
    // Only allow numbers
    input.addEventListener('keypress', (e) => {
        if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
        }
    });
});

// Paste OTP code
document.addEventListener('paste', (e) => {
    if (currentStep === 2) {
        const paste = e.clipboardData.getData('text');
        if (/^\d{6}$/.test(paste)) {
            e.preventDefault();
            paste.split('').forEach((char, i) => {
                if (otpInputs[i]) {
                    otpInputs[i].value = char;
                }
            });
            otpInputs[5].focus();
        }
    }
});

otpForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get OTP code
    const code = Array.from(otpInputs).map(input => input.value).join('');
    
    if (code.length !== 6) {
        alert('Vui lòng nhập đầy đủ 6 chữ số');
        otpInputs[0].focus();
        return;
    }
    
    const submitBtn = this.querySelector('.submit-button');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = '<span>Đang xác thực...</span>';
    submitBtn.disabled = true;
    
    try {
        resetToken = await verifyOTP(userEmail, code);
        
        // Success - go to step 3
        goToStep(3);
        newPasswordInput.focus();
        
    } catch (error) {
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Clear OTP inputs
        otpInputs.forEach(input => {
            input.value = '';
            input.classList.add('error');
        });
        
        setTimeout(() => {
            otpInputs.forEach(input => input.classList.remove('error'));
            otpInputs[0].focus();
        }, 500);
        
        alert(error.message || 'Mã OTP không chính xác. Vui lòng thử lại.');
    }
});

// ===== RESEND OTP =====

function startResendCooldown() {
    resendCooldown = 60; // 60 seconds
    resendLink.classList.add('disabled');
    resendTimer.style.display = 'inline';
    
    const interval = setInterval(() => {
        resendCooldown--;
        resendTimer.textContent = `(${resendCooldown}s)`;
        
        if (resendCooldown <= 0) {
            clearInterval(interval);
            resendLink.classList.remove('disabled');
            resendTimer.style.display = 'none';
        }
    }, 1000);
}

resendLink.addEventListener('click', async function(e) {
    e.preventDefault();
    
    if (resendCooldown > 0) return;
    
    try {
        await sendOTP(userEmail);
        
        // Clear OTP inputs
        otpInputs.forEach(input => input.value = '');
        otpInputs[0].focus();
        
        showSuccessMessage('✓ Mã OTP mới đã được gửi!');
        
        // Start cooldown again
        startResendCooldown();
        
    } catch (error) {
        alert(error.message || 'Không thể gửi lại OTP. Vui lòng thử lại.');
    }
});

// ===== STEP 3: PASSWORD FORM =====

// Password toggle
if (togglePassword1) {
    togglePassword1.addEventListener('click', function() {
        const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        newPasswordInput.setAttribute('type', type);
        this.style.color = type === 'text' ? 'var(--primary-blue)' : 'var(--text-light)';
    });
}

if (togglePassword2) {
    togglePassword2.addEventListener('click', function() {
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        this.style.color = type === 'text' ? 'var(--primary-blue)' : 'var(--text-light)';
    });
}

// Real-time validation
newPasswordInput.addEventListener('input', function() {
    removeError(this);
    
    if (confirmPasswordInput.value && this.value !== confirmPasswordInput.value) {
        showError(confirmPasswordInput, 'Mật khẩu không khớp');
    } else {
        removeError(confirmPasswordInput);
    }
});

confirmPasswordInput.addEventListener('input', function() {
    removeError(this);
    
    if (this.value && this.value !== newPasswordInput.value) {
        showError(this, 'Mật khẩu không khớp');
    }
});

passwordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    removeError(newPasswordInput);
    removeError(confirmPasswordInput);
    
    // Validate
    let isValid = true;
    
    if (!newPasswordInput.value) {
        showError(newPasswordInput, 'Vui lòng nhập mật khẩu mới');
        isValid = false;
    } else if (newPasswordInput.value.length < 8) {
        showError(newPasswordInput, 'Mật khẩu phải có ít nhất 8 ký tự');
        isValid = false;
    }
    
    if (!confirmPasswordInput.value) {
        showError(confirmPasswordInput, 'Vui lòng xác nhận mật khẩu');
        isValid = false;
    } else if (newPasswordInput.value !== confirmPasswordInput.value) {
        showError(confirmPasswordInput, 'Mật khẩu không khớp');
        isValid = false;
    }
    
    if (!isValid) return;
    
    const submitBtn = this.querySelector('.submit-button');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = '<span>Đang cập nhật...</span>';
    submitBtn.disabled = true;
    
    try {
        await resetPassword(userEmail, resetToken, newPasswordInput.value);
        
        // Success - go to step 4
        goToStep(4);
        
    } catch (error) {
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        showError(confirmPasswordInput, error.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    }
});

// ===== VISUAL ENHANCEMENTS =====

// Parallax effect
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const orbs = document.querySelectorAll('.gradient-orb');
    
    orbs.forEach((orb, index) => {
        const speed = (index + 1) * 0.05;
        orb.style.transform = `translate(${scrolled * speed}px, ${scrolled * speed * 0.5}px)`;
    });
});

// Page load animation
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to go back
    if (e.key === 'Escape' && currentStep > 1 && currentStep < 4) {
        if (confirm('Bạn có muốn quay lại bước trước?')) {
            goToStep(currentStep - 1);
        }
    }
});

console.log('🔐 Forgot Password page loaded');
