// Password Toggle
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.style.color = type === 'text' ? 'var(--primary-blue)' : 'var(--text-light)';
});

// Form Elements
const signupForm = document.getElementById('signupForm');
const fullnameInput = document.getElementById('fullname');
const emailInput = document.getElementById('email');
const termsCheckbox = document.getElementById('terms');

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Password validation requirements
const passwordRequirements = {
    length: password => password.length >= 8,
    uppercase: password => /[A-Z]/.test(password),
    lowercase: password => /[a-z]/.test(password),
    number: password => /[0-9]/.test(password)
};

// Check password strength
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

// Password input event
passwordInput.addEventListener('input', function() {
    checkPasswordStrength(this.value);
    if (this.classList.contains('error')) {
        removeError(this);
    }
});

// Show error message
function showError(input, message) {
    const existingError = input.parentElement.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    input.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `⚠️ ${message}`;
    
    // Insert after password requirements if it exists
    const passwordReqs = input.parentElement.parentElement.querySelector('.password-requirements');
    if (passwordReqs) {
        passwordReqs.insertAdjacentElement('afterend', errorDiv);
    } else {
        input.parentElement.parentElement.appendChild(errorDiv);
    }
}

// Remove error message
function removeError(input) {
    input.classList.remove('error');
    const errorMessage = input.parentElement.parentElement.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Validation on blur
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

// Clear error on input
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

// Form Submit
signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate all fields
    let isValid = true;
    
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
    submitButton.innerHTML = '<span>Đang tạo tài khoản...</span>';
    
    // Simulate API call (replace with actual registration)
    try {
        await simulateSignup(fullnameInput.value, emailInput.value, passwordInput.value);
        
        // Success
        showSuccessMessage();
        
        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = 'signin.html';
        }, 2000);
        
    } catch (error) {
        submitButton.classList.remove('loading');
        submitButton.innerHTML = originalText;
        
        if (error.field === 'email') {
            showError(emailInput, error.message);
        } else {
            alert(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
    }
});

// Simulate signup (replace with actual API call)
function simulateSignup(fullname, email, password) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Check if email already exists (demo)
            const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const emailExists = existingUsers.some(user => user.email === email);
            
            if (emailExists) {
                reject({ 
                    field: 'email',
                    message: 'Email này đã được sử dụng' 
                });
                return;
            }
            
            // Save user (demo - in production, send to backend)
            const newUser = {
                fullname,
                email,
                password, // In production, NEVER store plain passwords!
                createdAt: new Date().toISOString()
            };
            
            existingUsers.push(newUser);
            localStorage.setItem('users', JSON.stringify(existingUsers));
            
            resolve({ success: true });
        }, 1500);
    });
}

// Show success message
function showSuccessMessage() {
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = '✓ Tạo tài khoản thành công! Đang chuyển đến trang đăng nhập...';
    
    const formHeader = document.querySelector('.form-header');
    formHeader.insertAdjacentElement('afterend', successDiv);
}

// Social Login Handlers
const googleButton = document.querySelector('.google-button');
const microsoftButton = document.querySelector('.microsoft-button');

googleButton.addEventListener('click', function() {
    handleSocialSignup('Google');
});

microsoftButton.addEventListener('click', function() {
    handleSocialSignup('Microsoft');
});

function handleSocialSignup(provider) {
    const button = event.currentTarget;
    const originalText = button.innerHTML;
    button.style.opacity = '0.7';
    button.style.pointerEvents = 'none';
    button.innerHTML = `<span>Đang kết nối với ${provider}...</span>`;
    
    setTimeout(() => {
        button.style.opacity = '1';
        button.style.pointerEvents = 'auto';
        button.innerHTML = originalText;
        
        alert(`Đăng ký với ${provider} sẽ được triển khai trong phiên bản production.`);
    }, 1000);
}

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
        
        // Reset password requirements
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
`;
document.head.appendChild(style);

// Auto-capitalize fullname
fullnameInput.addEventListener('input', function() {
    // Capitalize first letter of each word
    const words = this.value.split(' ');
    const capitalizedWords = words.map(word => {
        if (word.length > 0) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word;
    });
    this.value = capitalizedWords.join(' ');
});

console.log('📝 Cphaco.app Sign Up loaded successfully!');
console.log('🔐 Demo mode: All data stored in localStorage');
