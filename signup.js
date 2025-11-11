// ========================================
// SIGNUP.JS - CPHACO.APP (REAL BACKEND)
// User registration with OTP verification
// ========================================

// ===== CONFIGURATION =====
const AUTH_BASE = 'https://script.google.com/macros/s/AKfycbznIRGMSTXrOdR2-Vl93rLOJyB_voqRsJVietzSqWMywiAJjBaMw_EKL5HD0lL9yw/exec';  // 👈 THAY URL

// ===== STATE =====
let currentStep = 1;  // 1 = Form, 2 = OTP
let userEmail = '';
let userFullname = '';
let userPassword = '';

// ===== DOM ELEMENTS =====
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const signupForm = document.getElementById('signupForm');
const fullnameInput = document.getElementById('fullname');
const emailInput = document.getElementById('email');
const termsCheckbox = document.getElementById('terms');

// ===== VALIDATION HELPERS =====

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const passwordRequirements = {
    length: password => password.length >= 8,
    uppercase: password => /[A-Z]/.test(password),
    lowercase: password => /[a-z]/.test(password),
    number: password => /[0-9]/.test(password)
};

function checkPasswordStrength(password) {
    const requirements = document.querySelectorAll('[data-requirement]');
    let metCount = 0;
    
    requirements.forEach(req => {
        const requirement = req.getAttribute('data-requirement');
        const isMet = passwordRequirements[requirement](password);
        
        if (isMet) {
            req.classList.add('met');
            metCount++;
        } else {
            req.classList.remove('met');
        }
    });
    
    return metCount === requirements.length;
}

function showError(input, message) {
    const existingError = input.parentElement.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    input.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `⚠️ ${message}`;
    
    const passwordReqs = input.parentElement.parentElement.querySelector('.password-requirements');
    if (passwordReqs) {
        passwordReqs.insertAdjacentElement('afterend', errorDiv);
    } else {
        input.parentElement.parentElement.appendChild(errorDiv);
    }
}

function removeError(input) {
    input.classList.remove('error');
    const errorMessage = input.parentElement.parentElement.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// ===== PASSWORD TOGGLE =====

if (togglePassword) {
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.style.color = type === 'text' ? 'var(--primary-blue)' : 'var(--text-light)';
    });
}

// ===== REAL-TIME VALIDATION =====

passwordInput.addEventListener('input', function() {
    checkPasswordStrength(this.value);
    if (this.classList.contains('error')) {
        removeError(this);
    }
});

fullnameInput.addEventListener('blur', function() {
    if (this.value && this.value.length < 2) {
        showError(this, 'Họ tên phải có ít nhất 2 ký tự');
    } else {
        removeError(this);
    }
});

emailInput.addEventListener('blur', function() {
    if (this.value && !validateEmail(this.value)) {
        showError(this, 'Vui lòng nhập email hợp lệ');
    } else {
        removeError(this);
    }
});

passwordInput.addEventListener('blur', function() {
    if (this.value && !checkPasswordStrength(this.value)) {
        showError(this, 'Mật khẩu chưa đủ mạnh');
    } else {
        removeError(this);
    }
});

fullnameInput.addEventListener('input', function() {
    if (this.classList.contains('error')) {
        removeError(this);
    }
});

emailInput.addEventListener('input', function() {
    if (this.classList.contains('error')) {
        removeError(this);
    }
});

// ===== API CALLS =====

/**
 * Send OTP to email
 */
async function sendOTP(email) {
    try {
        console.log('Sending OTP to:', email);
        
        const response = await fetch(AUTH_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: 'send-otp',
                email: email
            })
        });
        
        const data = await response.json();
        console.log('Send OTP response:', data);
        
        if (!data.ok) {
            throw new Error(data.error || 'Không thể gửi OTP');
        }
        
        return true;
    } catch (error) {
        console.error('Send OTP error:', error);
        throw error;
    }
}

/**
 * Register user with OTP verification
 */
async function registerUser(fullname, email, password, otpCode) {
    try {
        console.log('Registering user:', email);
        
        const response = await fetch(AUTH_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: 'signup',
                fullname: fullname,
                email: email,
                password: password,
                otpCode: otpCode
            })
        });
        
        const data = await response.json();
        console.log('Signup response:', data);
        
        if (!data.ok) {
            throw new Error(data.error || 'Đăng ký thất bại');
        }
        
        return data;
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
}

// ===== FORM SUBMISSION =====

signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate all fields
    let isValid = true;
    
    // Remove previous errors
    removeError(fullnameInput);
    removeError(emailInput);
    removeError(passwordInput);
    
    // Validate fullname
    if (!fullnameInput.value) {
        showError(fullnameInput, 'Vui lòng nhập họ và tên');
        isValid = false;
    } else if (fullnameInput.value.length < 2) {
        showError(fullnameInput, 'Họ tên phải có ít nhất 2 ký tự');
        isValid = false;
    }
    
    // Validate email
    if (!emailInput.value) {
        showError(emailInput, 'Vui lòng nhập email');
        isValid = false;
    } else if (!validateEmail(emailInput.value)) {
        showError(emailInput, 'Email không hợp lệ');
        isValid = false;
    }
    
    // Validate password
    if (!passwordInput.value) {
        showError(passwordInput, 'Vui lòng nhập mật khẩu');
        isValid = false;
    } else if (!checkPasswordStrength(passwordInput.value)) {
        showError(passwordInput, 'Mật khẩu chưa đủ mạnh. Vui lòng đáp ứng tất cả yêu cầu');
        isValid = false;
    }
    
    // Validate terms
    if (!termsCheckbox.checked) {
        alert('Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Show loading state
    const submitButton = this.querySelector('.submit-button');
    const originalText = submitButton.innerHTML;
    submitButton.classList.add('loading');
    submitButton.innerHTML = '<span>Đang gửi OTP...</span>';
    submitButton.disabled = true;
    
    try {
        // Save form data
        userFullname = fullnameInput.value;
        userEmail = emailInput.value;
        userPassword = passwordInput.value;
        
        // Send OTP
        await sendOTP(userEmail);
        
        submitButton.innerHTML = '<span>OTP đã được gửi!</span>';
        
        // Wait 1 second
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Prompt for OTP
        const otpCode = prompt(`Mã OTP đã được gửi đến ${userEmail}\n\nVui lòng nhập mã OTP (6 chữ số):`);
        
        if (!otpCode) {
            throw new Error('Bạn chưa nhập OTP');
        }
        
        if (!/^\d{6}$/.test(otpCode)) {
            throw new Error('OTP phải là 6 chữ số');
        }
        
        // Register with OTP
        submitButton.innerHTML = '<span>Đang tạo tài khoản...</span>';
        
        const result = await registerUser(userFullname, userEmail, userPassword, otpCode);
        
        // Success
        showSuccessMessage();
        submitButton.innerHTML = '<span>✓ Thành công!</span>';
        
        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = 'signin.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        
        submitButton.classList.remove('loading');
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        
        if (error.message.includes('Email') || error.message.includes('email')) {
            showError(emailInput, error.message);
        } else {
            alert(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
        
        // Shake animation
        signupForm.style.animation = 'shake 0.5s';
        setTimeout(() => {
            signupForm.style.animation = '';
        }, 500);
    }
});

// ===== SUCCESS MESSAGE =====

function showSuccessMessage() {
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = '✓ Tạo tài khoản thành công! Đang chuyển đến trang đăng nhập...';
    
    const formHeader = document.querySelector('.form-header');
    if (formHeader) {
        formHeader.insertAdjacentElement('afterend', successDiv);
    }
}

// ===== VISUAL ENHANCEMENTS =====

// Auto-capitalize fullname
fullnameInput.addEventListener('input', function() {
    const words = this.value.split(' ');
    const capitalizedWords = words.map(word => {
        if (word.length > 0) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word;
    });
    this.value = capitalizedWords.join(' ');
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fullnameInput.value = '';
        emailInput.value = '';
        passwordInput.value = '';
        termsCheckbox.checked = false;
        
        removeError(fullnameInput);
        removeError(emailInput);
        removeError(passwordInput);
        
        document.querySelectorAll('[data-requirement]').forEach(req => {
            req.classList.remove('met');
        });
    }
});

// Page load animation
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Parallax effect
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const orbs = document.querySelectorAll('.gradient-orb');
    
    orbs.forEach((orb, index) => {
        const speed = (index + 1) * 0.05;
        orb.style.transform = `translate(${scrolled * speed}px, ${scrolled * speed * 0.5}px)`;
    });
});

// Input animations
const inputs = document.querySelectorAll('.form-input');

inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.01)';
        this.parentElement.style.transition = 'transform 0.2s ease';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});

// Ripple effect
const buttons = document.querySelectorAll('.submit-button, .social-button');

buttons.forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add ripple animation styles
const style = document.createElement('style');
style.textContent = `
    .submit-button, .social-button {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// Social Login Handlers (placeholder)
const googleButton = document.querySelector('.google-button');
const microsoftButton = document.querySelector('.microsoft-button');

if (googleButton) {
    googleButton.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Đăng ký với Google sẽ được triển khai trong phiên bản production.');
    });
}

if (microsoftButton) {
    microsoftButton.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Đăng ký với Microsoft sẽ được triển khai trong phiên bản production.');
    });
}

console.log('📝 Signup.js loaded - Real Backend Mode');
console.log('AUTH_BASE:', AUTH_BASE);
