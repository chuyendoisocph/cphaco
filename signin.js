// ========================================
// SIGNIN.JS - CPHACO.APP (IMPROVED)
// SSO Integration với OTP Authentication
// ========================================

// ===== SSO CONFIGURATION =====
const AUTH_BASE = 'https://script.google.com/macros/s/AKfycbznIRGMSTXrOdR2-Vl93rLOJyB_voqRsJVietzSqWMywiAJjBaMw_EKL5HD0lL9yw/exec';
const APP_ID = 'PORTAL'; // AppID trong sheet APPS
const TOKEN_KEY = 'CP_AUTH_TOKEN';

// ===== DOM ELEMENTS =====
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const signinForm = document.getElementById('signinForm');
const emailInput = document.getElementById('email');
const rememberCheckbox = document.getElementById('remember');

// ===== VALIDATION HELPERS =====

/**
 * Validate email format
 */
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Hiển thị lỗi cho input
 */
function showError(input, message) {
    const existingError = input.parentElement.parentElement.querySelector('.error-message');
    if (existingError) existingError.remove();
    
    input.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `⚠️ ${message}`;
    
    input.parentElement.parentElement.appendChild(errorDiv);
}

/**
 * Xóa lỗi của input
 */
function removeError(input) {
    input.classList.remove('error');
    const errorMessage = input.parentElement.parentElement.querySelector('.error-message');
    if (errorMessage) errorMessage.remove();
}

/**
 * Hiển thị thông báo thành công
 */
function showSuccessMessage(message = '✓ Đăng nhập thành công! Đang chuyển hướng...') {
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) existingSuccess.remove();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const formHeader = document.querySelector('.form-header');
    formHeader.insertAdjacentElement('afterend', successDiv);
}

// ===== PASSWORD TOGGLE =====

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.style.color = type === 'text' ? 'var(--primary-blue)' : 'var(--text-light)';
    });
}

// ===== PASSWORD AUTHENTICATION FLOW =====

/**
 * Đăng nhập bằng email và password
 */
async function loginWithPassword({ email, password, app, returnTo }) {
  try {
    // Dùng form-urlencode để tránh preflight & để GAS parse chuẩn
    const body = new URLSearchParams({
      action: 'login',
      email,
      password,
      app: app || APP_ID || 'PORTAL',
      returnTo: returnTo || 'dashboard.html'
    });

    const response = await fetch(AUTH_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: body.toString()
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || 'Email hoặc mật khẩu không đúng');
    }

    // Lưu token (nếu server trả về)
    if (data.token) {
      try {
        localStorage.setItem(TOKEN_KEY, data.token);
        const userInfo = parseJWT(data.token);
        localStorage.setItem('CP_USER_INFO', JSON.stringify(userInfo));
        console.log('✅ Login successful:', userInfo);
      } catch (e) {
        console.error('Error saving token:', e);
      }
    }

    // Trả về URL redirect dạng string
    return data.redirect || returnTo || 'dashboard.html';

  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}


// ==== JWT utils (Base64URL-safe) ====
// (Đặt trước mọi chỗ dùng parseJWT)

function toBase64(b64url) {
  let s = String(b64url || '').replace(/-/g, '+').replace(/_/g, '/').trim();
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  return s;
}

function b64urlDecodeUtf8(b64url) {
  const b64 = toBase64(b64url);
  const bin = atob(b64);
  // Ưu tiên TextDecoder (chuẩn UTF-8)
  if (typeof TextDecoder !== 'undefined') {
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }
  // Fallback (ít chuẩn nhưng đủ cho ASCII)
  try { return decodeURIComponent(escape(bin)); } catch { return bin; }
}

function normalizeToken(raw) {
  if (!raw) return '';
  let t = String(raw).trim().replace(/^"|"$/g, '');
  if (t.startsWith('Bearer ')) t = t.slice(7).trim();
  try {
    const dec = decodeURIComponent(t);
    if (dec.split('.').length === 3) t = dec;
  } catch (_) {}
  return t.replace(/\s+/g, '');
}

function parseJWT(token) {
  const t = normalizeToken(token);
  const parts = t.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  // Decode header/payload theo Base64URL
  const header  = JSON.parse(b64urlDecodeUtf8(parts[0]));
  const payload = JSON.parse(b64urlDecodeUtf8(parts[1]));
  // (Tuỳ chọn) kiểm tra alg
  if (header.alg && header.alg !== 'HS256') {
    console.warn('Unexpected JWT alg:', header.alg);
  }
  return payload;
}





/**
 * Verify 2FA code
 */
async function verify2FA({ email, code, tempToken, app, returnTo }) {
  try {
    const body = new URLSearchParams({
      action: 'verify-2fa',
      email,
      code,
      tempToken,
      app: app || APP_ID || 'PORTAL',
      returnTo: returnTo || 'dashboard.html'
    });

    const response = await fetch(AUTH_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: body.toString()
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || 'Mã 2FA không chính xác');
    }

    // Nếu server trả token ở bước 2FA, lưu luôn
    if (data.token) {
      try {
        persistToken(data.token)
        const userInfo = parseJWT(data.token);
        localStorage.setItem('CP_USER_INFO', JSON.stringify(userInfo));
        console.log('✅ 2FA verification successful:', userInfo);
      } catch (e) {
        console.error('Error saving token:', e);
      }
    }

    return data; // có data.redirect
  } catch (error) {
    console.error('2FA verification error:', error);
    throw error;
  }
}



// ===== FORM SUBMISSION =====

signinForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Remove previous errors
    removeError(emailInput);
    removeError(passwordInput);
    
    // Validate email
    let isValid = true;
    
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
    } else if (passwordInput.value.length < 6) {
        showError(passwordInput, 'Mật khẩu phải có ít nhất 6 ký tự');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Get submit button
    const submitButton = this.querySelector('.submit-button');
    const originalText = submitButton.innerHTML;
    
    // Show loading state
    submitButton.classList.add('loading');
    submitButton.innerHTML = '<span>Đang đăng nhập…</span>';
    submitButton.disabled = true;
    
    // Get returnTo URL
    const urlParams = new URLSearchParams(location.search);
    const returnTo = urlParams.get('returnTo') || 'dashboard.html';
    
    let redirectUrl = returnTo; // Declare outside try block
    
    try {
        console.log('Logging in with:', emailInput.value);
        
        // Login with password
        const loginResponse = await loginWithPassword({
            email: emailInput.value,
            password: passwordInput.value,
            app: APP_ID,
            returnTo: returnTo
        });
        
        // Check if 2FA is required
        if (loginResponse.requires2FA) {
            // Show 2FA prompt
            submitButton.innerHTML = '<span>Nhập mã 2FA...</span>';
            
            const twoFACode = prompt('Nhập mã 2FA từ ứng dụng Authenticator (6 chữ số):');
            
            if (!twoFACode) {
                throw new Error('Bạn chưa nhập mã 2FA');
            }
            
            if (!/^\d{6}$/.test(twoFACode)) {
                throw new Error('Mã 2FA phải là 6 chữ số');
            }
            
            submitButton.innerHTML = '<span>Đang xác thực 2FA...</span>';
            
            // Verify 2FA
            const verify2FAResponse = await verify2FA({
                email: emailInput.value,
                code: twoFACode,
                tempToken: loginResponse.tempToken,
                app: APP_ID,
                returnTo: returnTo
            });
            
            // Save token from 2FA verification
            if (verify2FAResponse.token) {
                localStorage.setItem(TOKEN_KEY, verify2FAResponse.token);
                const userInfo = parseJWT(verify2FAResponse.token);
                localStorage.setItem('CP_USER_INFO', JSON.stringify(userInfo));
            }
            
              redirectUrl = (verify2FAResponse && typeof verify2FAResponse.redirect === 'string' && verify2FAResponse.redirect.trim())
    ? verify2FAResponse.redirect
    : returnTo;
        } else {
            // No 2FA required - response is the redirect URL string
            // Không 2FA: lưu token + lấy redirect chính xác
    if (loginResponse.token) {
        localStorage.setItem(TOKEN_KEY, loginResponse.token);
        const userInfo = parseJWT(loginResponse.token);
        localStorage.setItem('CP_USER_INFO', JSON.stringify(userInfo));
    }
      redirectUrl = (typeof loginResponse === 'string' && loginResponse.trim())
    ? loginResponse
    : returnTo;
        }
        
        // Remember email if checkbox is checked
        if (rememberCheckbox && rememberCheckbox.checked) {
            localStorage.setItem('rememberedEmail', emailInput.value);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
        
        // Show success message
        showSuccessMessage();
        submitButton.innerHTML = '<span>✓ Thành công!</span>';
        
        // Redirect after 1 second
        setTimeout(() => {
            redirectUrl = (typeof redirectUrl === 'string' && redirectUrl.trim()) ? redirectUrl : 'dashboard.html';

            window.location.href = redirectUrl;
        }, 1000);
        
    } catch (error) {
        console.error('Authentication error:', error);
        
        // Reset button
        submitButton.classList.remove('loading');
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        
        // Show error
        const errorMessage = error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.';
        showError(passwordInput, errorMessage);
        
        // Shake animation for error
        signinForm.style.animation = 'shake 0.5s';
        setTimeout(() => {
            signinForm.style.animation = '';
        }, 500);
    }
});

// Add shake animation CSS
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(shakeStyle);

// ===== AUTO-FILL REMEMBERED EMAIL =====

window.addEventListener('load', function() {
    // Load remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
    
    // Check if already logged in
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        try {
            const payload = parseJWT(token);
            
            // Check if token is still valid
            if (payload.exp && payload.exp * 1000 > Date.now()) {
                console.log('Already authenticated, redirecting...');
                
                const urlParams = new URLSearchParams(location.search);
                const returnTo = urlParams.get('returnTo') || 'dashboard.html';
                
                window.location.href = returnTo;
                return;
            } else {
                // Token expired, remove it
                //localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem('CP_USER_INFO');
            }
        } catch (e) {
            console.error('Invalid token:', e);
           // localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem('CP_USER_INFO');
        }
    }
    
    // Page fade-in animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// ===== INPUT VALIDATION ON BLUR =====

emailInput.addEventListener('blur', function() {
    if (this.value && !validateEmail(this.value)) {
        showError(this, 'Email không hợp lệ');
    } else {
        removeError(this);
    }
});

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

// ===== VISUAL ENHANCEMENTS =====

/**
 * Parallax effect cho gradient orbs
 */
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const orbs = document.querySelectorAll('.gradient-orb');
    
    orbs.forEach((orb, index) => {
        const speed = (index + 1) * 0.05;
        orb.style.transform = `translate(${scrolled * speed}px, ${scrolled * speed * 0.5}px)`;
    });
});

/**
 * Ripple effect cho buttons
 */
(function setupRippleEffect() {
    const buttons = document.querySelectorAll('.submit-button, .social-button');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
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
})();

// ===== SOCIAL LOGIN HANDLERS =====

const googleButton = document.querySelector('.google-button');
const microsoftButton = document.querySelector('.microsoft-button');

if (googleButton) {
    googleButton.addEventListener('click', function(e) {
        e.preventDefault();
        handleSocialLogin('Google');
    });
}

if (microsoftButton) {
    microsoftButton.addEventListener('click', function(e) {
        e.preventDefault();
        handleSocialLogin('Microsoft');
    });
}

/**
 * Handle social login (placeholder)
 */
function handleSocialLogin(provider) {
    const button = event.currentTarget;
    const originalText = button.innerHTML;
    
    button.style.opacity = '0.7';
    button.style.pointerEvents = 'none';
    button.innerHTML = `<span>Đang kết nối với ${provider}...</span>`;
    
    setTimeout(() => {
        button.style.opacity = '1';
        button.style.pointerEvents = 'auto';
        button.innerHTML = originalText;
        
        alert(`Đăng nhập với ${provider} sẽ được triển khai trong phiên bản production.`);
    }, 1000);
}

// ===== KEYBOARD SHORTCUTS =====

document.addEventListener('keydown', function(e) {
    // ESC to clear form
    if (e.key === 'Escape') {
        emailInput.value = '';
        passwordInput.value = '';
        if (rememberCheckbox) rememberCheckbox.checked = false;
        
        removeError(emailInput);
        removeError(passwordInput);
    }
    
    // Ctrl+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        signinForm.dispatchEvent(new Event('submit'));
    }
});

// ===== ERROR HANDLING =====

window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled rejection:', e.reason);
});

console.log('🔐 Signin.js loaded - Password Authentication Mode');
