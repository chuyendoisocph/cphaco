// ========================================
// SIGNUP.JS - CPHACO.APP (REAL BACKEND)
// User registration with OTP verification
// 2-Step Form with OTP Input UI
// ========================================

// ===== CONFIGURATION =====
const AUTH_BASE = 'https://script.google.com/macros/s/AKfycbznIRGMSTXrOdR2-Vl93rLOJyB_voqRsJVietzSqWMywiAJjBaMw_EKL5HD0lL9yw/exec';  // 👈 THAY URL

// ===== STATE =====
let currentStep = 1;  // 1 = Form, 2 = OTP
let userEmail = '';
let userFullname = '';
let userPassword = '';
let otpTimerInterval = null;
let resendTimerInterval = null;
let otpExpiryTime = null;

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
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ action: 'send-otp', email }).toString()
    });

    const data = await response.json();
    console.log('Send OTP response:', data);
    if (!data.ok) throw new Error(data.error || 'Không thể gửi OTP');
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
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({
        action: 'signup',
        fullname,
        email,
        password,
        otpCode
      }).toString()
    });

    const data = await response.json();
    console.log('Signup response:', data);
    if (!data.ok) throw new Error(data.error || 'Đăng ký thất bại');
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
    const submitButton = document.getElementById('submitBtn');
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
        
        submitButton.innerHTML = '<span>✓ OTP đã được gửi!</span>';
        
        // Wait 1 second then switch to OTP step
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Switch to OTP step
        switchToOTPStep();
        
    } catch (error) {
        console.error('Send OTP error:', error);
        
        submitButton.classList.remove('loading');
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        
        if (error.message.includes('Email') || error.message.includes('email')) {
            showError(emailInput, error.message);
        } else {
            alert(error.message || 'Không thể gửi OTP. Vui lòng thử lại.');
        }
        
        // Shake animation
        signupForm.style.animation = 'shake 0.5s';
        setTimeout(() => {
            signupForm.style.animation = '';
        }, 500);
    }
});

// ===== OTP STEP FUNCTIONS =====

/**
 * Switch to OTP verification step
 */
function switchToOTPStep() {
    // Update step indicators
    document.getElementById('step1Indicator').classList.add('completed');
    document.getElementById('step1Indicator').classList.remove('active');
    document.getElementById('divider1').classList.add('completed');
    document.getElementById('step2Indicator').classList.add('active');
    
    // Hide registration form, show OTP form
    document.getElementById('registrationStep').style.display = 'none';
    document.getElementById('otpStep').classList.add('active');
    
    // Display email
    document.getElementById('otpEmail').textContent = userEmail;
    
    // Focus first OTP input
    document.getElementById('otp1').focus();
    
    // Start timers
    startOTPTimer();
    startResendTimer();
    
    currentStep = 2;
}

/**
 * Switch back to registration form
 */
function switchToRegistrationStep() {
    // Update step indicators
    document.getElementById('step1Indicator').classList.add('active');
    document.getElementById('step1Indicator').classList.remove('completed');
    document.getElementById('divider1').classList.remove('completed');
    document.getElementById('step2Indicator').classList.remove('active');
    
    // Show registration form, hide OTP form
    document.getElementById('registrationStep').style.display = 'block';
    document.getElementById('otpStep').classList.remove('active');
    
    // Clear OTP inputs
    clearOTPInputs();
    
    // Stop timers
    stopTimers();
    
    // Reset button states
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    submitBtn.innerHTML = '<span>Tiếp tục</span><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4.16666 10H15.8333" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 4.16667L15.8333 10L10 15.8333" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    
    currentStep = 1;
}

/**
 * Start OTP expiry timer (10 minutes)
 */
function startOTPTimer() {
    otpExpiryTime = Date.now() + (10 * 60 * 1000); // 10 minutes
    
    otpTimerInterval = setInterval(() => {
        const now = Date.now();
        const remaining = otpExpiryTime - now;
        
        if (remaining <= 0) {
            clearInterval(otpTimerInterval);
            document.getElementById('timerDisplay').textContent = '0:00';
            document.getElementById('otpTimer').classList.add('expired');
            document.getElementById('otpTimer').innerHTML = '⚠️ Mã OTP đã hết hạn. Vui lòng <strong>gửi lại</strong>.';
            return;
        }
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        document.getElementById('timerDisplay').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

/**
 * Start resend cooldown timer (60 seconds)
 */
function startResendTimer() {
    let countdown = 60;
    const resendBtn = document.getElementById('resendBtn');
    const resendTimerSpan = document.getElementById('resendTimer');
    
    resendBtn.disabled = true;
    
    resendTimerInterval = setInterval(() => {
        countdown--;
        resendTimerSpan.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(resendTimerInterval);
            resendBtn.disabled = false;
            resendBtn.textContent = 'Gửi lại mã';
        }
    }, 1000);
}

/**
 * Stop all timers
 */
function stopTimers() {
    if (otpTimerInterval) {
        clearInterval(otpTimerInterval);
        otpTimerInterval = null;
    }
    if (resendTimerInterval) {
        clearInterval(resendTimerInterval);
        resendTimerInterval = null;
    }
}

/**
 * Clear OTP inputs
 */
function clearOTPInputs() {
    for (let i = 1; i <= 6; i++) {
        const input = document.getElementById('otp' + i);
        input.value = '';
        input.classList.remove('filled', 'error');
    }
}

/**
 * Get OTP code from inputs
 */
function getOTPCode() {
    let code = '';
    for (let i = 1; i <= 6; i++) {
        code += document.getElementById('otp' + i).value;
    }
    return code;
}

// ===== OTP INPUT HANDLING =====

// Setup OTP inputs
const otpInputs = [];
for (let i = 1; i <= 6; i++) {
    const input = document.getElementById('otp' + i);
    otpInputs.push(input);
    
    // Handle input
    input.addEventListener('input', function(e) {
        // Only allow numbers
        this.value = this.value.replace(/[^0-9]/g, '');
        
        if (this.value) {
            this.classList.add('filled');
            this.classList.remove('error');
            
            // Move to next input
            const nextInput = otpInputs[otpInputs.indexOf(this) + 1];
            if (nextInput) {
                nextInput.focus();
            }
        } else {
            this.classList.remove('filled');
        }
    });
    
    // Handle keydown
    input.addEventListener('keydown', function(e) {
        // Backspace - move to previous input
        if (e.key === 'Backspace' && !this.value) {
            const prevInput = otpInputs[otpInputs.indexOf(this) - 1];
            if (prevInput) {
                prevInput.focus();
            }
        }
        
        // Arrow keys
        if (e.key === 'ArrowLeft') {
            const prevInput = otpInputs[otpInputs.indexOf(this) - 1];
            if (prevInput) prevInput.focus();
        }
        if (e.key === 'ArrowRight') {
            const nextInput = otpInputs[otpInputs.indexOf(this) + 1];
            if (nextInput) nextInput.focus();
        }
    });
    
    // Handle paste
    input.addEventListener('paste', function(e) {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        
        for (let j = 0; j < pastedData.length && j < 6; j++) {
            otpInputs[j].value = pastedData[j];
            otpInputs[j].classList.add('filled');
        }
        
        // Focus last filled input
        if (pastedData.length < 6) {
            otpInputs[pastedData.length].focus();
        }
    });
}

// ===== OTP FORM SUBMISSION =====

const otpForm = document.getElementById('otpForm');

otpForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const otpCode = getOTPCode();
    
    // Validate OTP
    if (otpCode.length !== 6) {
        otpInputs.forEach(input => input.classList.add('error'));
        alert('Vui lòng nhập đầy đủ 6 số');
        return;
    }
    
    if (!/^\d{6}$/.test(otpCode)) {
        otpInputs.forEach(input => input.classList.add('error'));
        alert('OTP chỉ bao gồm số');
        return;
    }
    
    // Show loading
    const verifyBtn = document.getElementById('verifyBtn');
    const originalText = verifyBtn.innerHTML;
    verifyBtn.classList.add('loading');
    verifyBtn.innerHTML = '<span>Đang xác thực...</span>';
    verifyBtn.disabled = true;
    
    try {
        // Register with OTP
        const result = await registerUser(userFullname, userEmail, userPassword, otpCode);
        
        // Success
        verifyBtn.innerHTML = '<span>✓ Thành công!</span>';
        
        // Stop timers
        stopTimers();
        
        // Show success message
        showSuccessMessage();
        
        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = 'signin.html';
        }, 2000);
        
    } catch (error) {
        console.error('Verification error:', error);
        
        verifyBtn.classList.remove('loading');
        verifyBtn.innerHTML = originalText;
        verifyBtn.disabled = false;
        
        // Highlight inputs as error
        otpInputs.forEach(input => input.classList.add('error'));
        
        alert(error.message || 'Xác thực thất bại. Vui lòng thử lại.');
        
        // Clear inputs
        clearOTPInputs();
        document.getElementById('otp1').focus();
    }
});

// ===== RESEND OTP =====

document.getElementById('resendBtn').addEventListener('click', async function() {
    this.disabled = true;
    this.textContent = 'Đang gửi...';
    
    try {
        await sendOTP(userEmail);
        
        // Restart timers
        stopTimers();
        startOTPTimer();
        startResendTimer();
        
        // Clear inputs
        clearOTPInputs();
        document.getElementById('otp1').focus();
        
        // Reset timer display
        document.getElementById('otpTimer').classList.remove('expired');
        document.getElementById('otpTimer').innerHTML = 'Mã hết hạn sau: <strong id="timerDisplay">10:00</strong>';
        
        alert('✓ Mã OTP mới đã được gửi!');
        
    } catch (error) {
        this.disabled = false;
        this.textContent = 'Gửi lại mã';
        alert(error.message || 'Không thể gửi lại OTP. Vui lòng thử lại.');
    }
});

// ===== BACK TO FORM =====

document.getElementById('backToForm').addEventListener('click', function(e) {
    e.preventDefault();
    
    if (confirm('Bạn có chắc muốn quay lại? Mã OTP hiện tại sẽ hết hiệu lực.')) {
        switchToRegistrationStep();
    }
});

// ===== SUCCESS MESSAGE =====

function showSuccessMessage() {
    // Remove existing success message if any
    const existing = document.querySelector('.success-message');
    if (existing) {
        existing.remove();
    }
    
    const existingOverlay = document.querySelector('.success-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    document.body.appendChild(overlay);
    
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <div class="success-icon">
            <svg viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7"></path>
            </svg>
        </div>
        <h3 class="success-title">🎉 Đăng ký thành công!</h3>
        <p class="success-text">Đang chuyển đến trang đăng nhập...</p>
    `;
    
    document.body.appendChild(successDiv);
    
    // Auto remove after animation
    setTimeout(() => {
        successDiv.style.animation = 'successPop 0.3s ease reverse';
        overlay.style.animation = 'fadeIn 0.3s ease reverse';
        
        setTimeout(() => {
            successDiv.remove();
            overlay.remove();
        }, 300);
    }, 1700); // Remove before redirect
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
