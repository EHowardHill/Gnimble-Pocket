import {
  isAuthenticated,
  getAuthToken,
  getUsername,
  getUserData,
  saveUserData,
  clearAuthData,
  makeApiCall,
  fetchUserProfile
} from '../shared.js';

// Define Login Page Component
class PageLogin extends HTMLElement {
  constructor() {
    super();
    this.isLoading = false;
  }

  async connectedCallback() {
    this.innerHTML = `
      <ion-page>
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button fill="clear" id="back-btn">
                <ion-icon name="arrow-back-outline"></ion-icon>
              </ion-button>
            </ion-buttons>
            <ion-title>Sign In</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content class="wallpaper ion-padding">
          <div class="login-container">
            <div class="ion-text-center ion-margin-bottom">
              <h2>Sign into Gnimble Cloud</h2>
              <p color="medium">Backup and share your stories</p>
            </div>

            <ion-card>
              <ion-card-content>
                <form id="login-form">
                  <ion-item>
                    <ion-label position="stacked">Username</ion-label>
                    <ion-input 
                      id="username-input" 
                      type="text" 
                      placeholder="Enter your username"
                      required
                      autocomplete="username"
                    ></ion-input>
                  </ion-item>

                  <ion-item>
                    <ion-label position="stacked">Password</ion-label>
                    <ion-input 
                      id="password-input" 
                      type="password" 
                      placeholder="Enter your password"
                      required
                      autocomplete="current-password"
                    ></ion-input>
                  </ion-item>

                  <div class="ion-margin-top">
                    <ion-button 
                      expand="block" 
                      id="login-btn" 
                      type="submit"
                    >
                      <ion-spinner name="dots" id="login-spinner" style="display: none;"></ion-spinner>
                      <span id="login-text">Sign In</span>
                    </ion-button>
                  </div>
                </form>

                <div class="ion-text-center ion-margin-top">
                  <ion-button fill="clear" size="small" id="forgot-password-btn">
                    Forgot Password?
                  </ion-button>
                </div>
              </ion-card-content>
            </ion-card>

            <div class="ion-text-center ion-margin-top">
              <ion-text color="medium">
                <p>Don't have an account?<br><ion-button fill="clear" size="small" id="signup-btn">Sign Up</ion-button></p>
              </ion-text>
            </div>
          </div>
        </ion-content>
        
        <ion-footer>
          <ion-toolbar>
            <ion-title size="small">Version 2.0.1</ion-title>
          </ion-toolbar>
        </ion-footer>
      </ion-page>

      <style>
        .login-container {
          max-width: 400px;
          margin: 0 auto;
          padding-top: 2rem;
        }
        
        ion-card {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        
        #login-spinner {
          margin-right: 8px;
        }
        
        .error-message {
          color: var(--ion-color-danger);
          font-size: 0.875rem;
          margin-top: 0.5rem;
          text-align: center;
        }
      </style>
    `;

    this.setupEventListeners();

    // Check if user is already logged in
    await this.checkExistingAuth();

    // Load saved primary color if it exists
    this.loadSavedPrimaryColor();
  }

  setupEventListeners() {
    const loginForm = this.querySelector('#login-form');
    const forgotPasswordBtn = this.querySelector('#forgot-password-btn');
    const signupBtn = this.querySelector('#signup-btn');
    const backBtn = this.querySelector('#back-btn');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    
    if (forgotPasswordBtn) {
      forgotPasswordBtn.addEventListener('click', () => this.handleForgotPassword());
    }
    
    if (signupBtn) {
      signupBtn.addEventListener('click', () => this.handleSignup());
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => this.handleBack());
    }

    // Enable form submission on Enter key
    const inputs = this.querySelectorAll('ion-input');
    inputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !this.isLoading) {
          this.handleLogin(e);
        }
      });
    });
  }

  async checkExistingAuth() {
    if (isAuthenticated()) {
      // Verify token is still valid by making a test API call
      try {
        const username = getUsername();
        if (username) {
          const userData = await fetchUserProfile();
          if (userData) {
            // Token is valid, redirect to home
            this.navigateToHome();
            return;
          }
        }
      } catch (error) {
        // Token is invalid, clear it
        clearAuthData();
      }
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    if (this.isLoading) return;

    const usernameInput = this.querySelector('#username-input');
    const passwordInput = this.querySelector('#password-input');

    if (!usernameInput || !passwordInput) {
      this.showError('Form elements not found');
      return;
    }

    let username, password;
    
    try {
      const usernameEl = await usernameInput.getInputElement();
      const passwordEl = await passwordInput.getInputElement();
      username = usernameEl.value.trim();
      password = passwordEl.value.trim();
    } catch (error) {
      console.error('Error getting input values:', error);
      this.showError('Error reading form values');
      return;
    }

    if (!username || !password) {
      this.showError('Please enter both username and password');
      return;
    }

    this.setLoading(true);
    this.clearError();

    try {
      const response = await makeApiCall('/api/login', {
        user: username,
        password: password
      });

      if (response.success === 1) {
        // Login successful - save auth data
        localStorage.setItem('gnimble-auth-token', response.token);
        localStorage.setItem('gnimble-username', username);
        
        // Fetch and save user data
        try {
          const userData = await fetchUserProfile();
          saveUserData(userData);
        } catch (error) {
          console.warn('Could not fetch user profile, but login was successful:', error);
        }
        
        await this.showToast('Login successful!');
        this.navigateToHome();
      } else {
        // Login failed
        this.showError('Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Login failed. Please check your connection and try again.');
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    const spinner = this.querySelector('#login-spinner');
    const text = this.querySelector('#login-text');
    const button = this.querySelector('#login-btn');

    if (spinner && text && button) {
      if (loading) {
        spinner.style.display = 'inline-block';
        text.textContent = 'Signing In...';
        button.disabled = true;
      } else {
        spinner.style.display = 'none';
        text.textContent = 'Sign In';
        button.disabled = false;
      }
    }
  }

  showError(message) {
    this.clearError();
    const form = this.querySelector('#login-form');
    if (form) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      errorDiv.id = 'login-error';
      form.appendChild(errorDiv);
    }
  }

  clearError() {
    const existingError = this.querySelector('#login-error');
    if (existingError) {
      existingError.remove();
    }
  }

  handleForgotPassword() {
    this.showToast('Password reset functionality coming soon!');
  }

  handleSignup() {
    this.showToast('Sign up functionality coming soon!');
  }

  handleBack() {
    this.navigateToHome();
  }

  navigateToHome() {
    window.location.href = '/';
  }

  loadSavedPrimaryColor() {
    const savedColor = localStorage.getItem('gnimble-primary-color');
    if (savedColor) {
      document.documentElement.style.setProperty('--ion-color-primary', savedColor);
    }
  }

  async showToast(message) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    toast.position = 'bottom';

    document.body.appendChild(toast);
    await toast.present();
  }
}

// Register the custom element
customElements.define('page-login', PageLogin);

export default PageLogin;