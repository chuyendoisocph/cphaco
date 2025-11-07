// Password Toggle
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Change icon (optional - can enhance with different SVG)
    this.style.color = type === 'text' ? 'var(--primary-blue)' : 'var(--text-light)';
});

// Form Validation
const signinForm = document.getElementById('signinForm');
const emailInput = document.getElementById('email');
const rememberCheckbox = document.getElementById('remember');

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Show error message
function showError(input, message) {
    // Remove existing error
    const existingError = input.parentElement.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    input.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `⚠️ ${message}`;
    input.parentElement.parentElement.appendChild(errorDiv);
}

// Remove error message
function removeError(input) {
    input.classList.remove('error');
    const errorMessage = input.parentElement.parentElement.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Input validation on blur
emailInput.addEventListener('blur', function() {
    if (this.value && !validateEmail(this.value)) {
        showError(this, 'Vui lòng nhập email hợp lệ');
    } else {
        removeError(this);
    }
});

passwordInput.addEventListener('blur', function() {
    if (this.value && this.value.length < 6) {
        showError(this, 'Mật khẩu phải có ít nhất 6 ký tự');
    } else {
        removeError(this);
    }
});

// Clear error on input
emailInput.addEventListener('input', function() {
    if (this.classList.contains('error')) {
        removeError(this);
    }
});

passwordInput.addEventListener('input', function() {
    if (this.classList.contains('error')) {
        removeError(this);
    }
});

// Form Submit
signinForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate
    let isValid = true;
    
    if (!emailInput.value) {
        showError(emailInput, 'Vui lòng nhập email');
        isValid = false;
    } else if (!validateEmail(emailInput.value)) {
        showError(emailInput, 'Email không hợp lệ');
        isValid = false;
    }
    
    if (!passwordInput.value) {
        showError(passwordInput, 'Vui lòng nhập mật khẩu');
        isValid = false;
    } else if (passwordInput.value.length < 6) {
        showError(passwordInput, 'Mật khẩu phải có ít nhất 6 ký tự');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Show loading state
    const submitButton = this.querySelector('.submit-button');
    const originalText = submitButton.innerHTML;
    submitButton.classList.add('loading');
    submitButton.innerHTML = '<span>Đang đăng nhập...</span>';
    
    // Simulate API call (replace with actual authentication)
    try {
        await simulateLogin(emailInput.value, passwordInput.value, rememberCheckbox.checked);
        
        // Success
        showSuccessMessage();
        
        // Redirect after 1.5 seconds
        setTimeout(() => {
            // Replace with your actual redirect
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        // Error
        submitButton.classList.remove('loading');
        submitButton.innerHTML = originalText;
        
        showError(passwordInput, error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
});

// Simulate login (replace with actual API call)
function simulateLogin(email, password, remember) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Demo: accept any email/password for testing
            // In production, replace with actual authentication
            if (email && password) {
                // Save to localStorage if remember is checked
                if (remember) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }
                resolve({ success: true });
            } else {
                reject({ message: 'Email hoặc mật khẩu không đúng' });
            }
        }, 1500);
    });
}

// Show success message
function showSuccessMessage() {
    // Remove existing success message
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = '✓ Đăng nhập thành công! Đang chuyển hướng...';
    
    const formHeader = document.querySelector('.form-header');
    formHeader.insertAdjacentElement('afterend', successDiv);
}

// Load remembered email
window.addEventListener('load', function() {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberCheckbox.checked = true;
    }
});

// Social Login Handlers
const googleButton = document.querySelector('.google-button');
const microsoftButton = document.querySelector('.microsoft-button');

googleButton.addEventListener('click', function() {
    handleSocialLogin('Google');
});

microsoftButton.addEventListener('click', function() {
    handleSocialLogin('Microsoft');
});

function handleSocialLogin(provider) {
    // Show loading
    const button = event.currentTarget;
    const originalText = button.innerHTML;
    button.style.opacity = '0.7';
    button.style.pointerEvents = 'none';
    button.innerHTML = `<span>Đang kết nối với ${provider}...</span>`;
    
    // Simulate social login (replace with actual OAuth implementation)
    setTimeout(() => {
        button.style.opacity = '1';
        button.style.pointerEvents = 'auto';
        button.innerHTML = originalText;
        
        // In production, implement actual OAuth flow
        alert(`Đăng nhập với ${provider} sẽ được triển khai trong phiên bản production.`);
    }, 1000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to clear form
    if (e.key === 'Escape') {
        emailInput.value = '';
        passwordInput.value = '';
        removeError(emailInput);
        removeError(passwordInput);
    }
});

// Add smooth transitions on load
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Parallax effect for background orbs
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const orbs = document.querySelectorAll('.gradient-orb');
    
    orbs.forEach((orb, index) => {
        const speed = (index + 1) * 0.05;
        orb.style.transform = `translate(${scrolled * speed}px, ${scrolled * speed * 0.5}px)`;
    });
});

// Form input animations
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

// Add ripple effect to buttons
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

// Add ripple animation styles dynamically
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

// Console message
console.log('🔐 Cphaco.app Sign In loaded successfully!');
console.log('📧 Demo mode: Any email/password will work for testing');
