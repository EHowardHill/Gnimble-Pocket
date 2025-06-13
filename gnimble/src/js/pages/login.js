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
    this.isAuthenticated = false;
    this.userProfile = null;
  }

  async connectedCallback() {
    // Check authentication status first
    await this.checkExistingAuth();
    
    // Render appropriate view based on auth status
    if (this.isAuthenticated) {
      this.renderProfileView();
    } else {
      this.renderLoginView();
    }

    this.setupEventListeners();
    this.loadSavedPrimaryColor();
  }

  async checkExistingAuth() {
    if (isAuthenticated()) {
      // Verify token is still valid by making a test API call
      try {
        const username = getUsername();
        if (username) {
          const userData = await fetchUserProfile();
          if (userData) {
            // Token is valid, set authenticated state
            this.isAuthenticated = true;
            this.userProfile = userData;
            return;
          }
        }
      } catch (error) {
        // Token is invalid, clear it
        clearAuthData();
        this.isAuthenticated = false;
        this.userProfile = null;
      }
    }
    this.isAuthenticated = false;
    this.userProfile = null;
  }

  renderProfileView() {
    const username = getUsername();
    const profile = this.userProfile || {};
    const storyCount = profile.stories ? profile.stories.length : 0;
    
    this.innerHTML = `
      <ion-page>
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button fill="clear" id="back-btn">
                <ion-icon name="arrow-back-outline"></ion-icon>
              </ion-button>
            </ion-buttons>
            <ion-title>Profile</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content class="wallpaper ion-padding">
          <div class="profile-container">
            <div class="ion-text-center ion-margin-bottom">
              <h2>Welcome back!</h2>
              <p color="medium">You're signed into Gnimble Cloud</p>
            </div>

            <ion-card>
              <ion-card-content>
                <div class="profile-info">
                  <div class="avatar-section">
                    ${profile.avatar_url ? 
                      `<img src="${profile.avatar_url}" alt="Profile Avatar" class="profile-avatar">` : 
                      `<div class="profile-avatar-placeholder">
                        <ion-icon name="person-outline"></ion-icon>
                      </div>`
                    }
                  </div>
                  
                  <div class="profile-details">
                    <h3>${profile.name || username}</h3>
                    <p class="username">@${username}</p>
                    
                    <div class="stats">
                      <div class="stat-item">
                        <ion-icon name="document-text-outline"></ion-icon>
                        <span>${storyCount} ${storyCount === 1 ? 'story' : 'stories'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                ${storyCount > 0 ? `
                  <div class="stories-preview">
                    <h4>Your Stories</h4>
                    <div class="story-list">
                      ${profile.stories.slice(0, 3).map(story => `
                        <div class="story-item">
                          <ion-icon name="document-outline"></ion-icon>
                          <span>${story}</span>
                        </div>
                      `).join('')}
                      ${storyCount > 3 ? `
                        <div class="story-item more-stories">
                          <ion-icon name="ellipsis-horizontal-outline"></ion-icon>
                          <span>and ${storyCount - 3} more</span>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                ` : ''}

                <div class="profile-actions">
                  <ion-button 
                    expand="block" 
                    fill="outline" 
                    id="home-btn"
                    class="ion-margin-top"
                  >
                    <ion-icon name="home-outline" slot="start"></ion-icon>
                    Go to Home
                  </ion-button>
                  
                  <ion-button 
                    expand="block" 
                    fill="clear" 
                    color="danger"
                    id="signout-btn"
                    class="ion-margin-top"
                  >
                    <ion-icon name="log-out-outline" slot="start"></ion-icon>
                    Sign Out
                  </ion-button>
                </div>
              </ion-card-content>
            </ion-card>
          </div>
        </ion-content>
        
        <ion-footer>
          <ion-toolbar>
            <ion-title size="small">Version 2.0.1</ion-title>
          </ion-toolbar>
        </ion-footer>
      </ion-page>

      <style>
        .profile-container {
          max-width: 400px;
          margin: 0 auto;
          padding-top: 2rem;
        }
        
        ion-card {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        
        .profile-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 1.5rem;
        }
        
        .avatar-section {
          margin-bottom: 1rem;
        }
        
        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--ion-color-primary);
        }
        
        .profile-avatar-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--ion-color-light);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid var(--ion-color-primary);
        }
        
        .profile-avatar-placeholder ion-icon {
          font-size: 2.5rem;
          color: var(--ion-color-medium);
        }
        
        .profile-details h3 {
          margin: 0 0 0.25rem 0;
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .username {
          color: var(--ion-color-medium);
          margin: 0 0 1rem 0;
          font-size: 0.9rem;
        }
        
        .stats {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--ion-color-medium);
          font-size: 0.9rem;
        }
        
        .stat-item ion-icon {
          font-size: 1.1rem;
        }
        
        .stories-preview {
          border-top: 1px solid var(--ion-color-light);
          padding-top: 1rem;
          margin-top: 1rem;
        }
        
        .stories-preview h4 {
          margin: 0 0 0.75rem 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--ion-color-dark);
        }
        
        .story-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .story-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: var(--ion-color-light);
          border-radius: 8px;
          font-size: 0.9rem;
        }
        
        .story-item ion-icon {
          color: var(--ion-color-primary);
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        
        .story-item.more-stories {
          background: var(--ion-color-light-shade);
          color: var(--ion-color-medium);
          font-style: italic;
        }
        
        .profile-actions {
          border-top: 1px solid var(--ion-color-light);
          padding-top: 1rem;
          margin-top: 1rem;
        }
      </style>
    `;
  }

  renderLoginView() {
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
  }

  setupEventListeners() {
    const backBtn = this.querySelector('#back-btn');
    
    if (backBtn) {
      backBtn.addEventListener('click', () => this.handleBack());
    }

    if (this.isAuthenticated) {
      // Profile view event listeners
      const signoutBtn = this.querySelector('#signout-btn');
      const homeBtn = this.querySelector('#home-btn');
      
      if (signoutBtn) {
        signoutBtn.addEventListener('click', () => this.handleSignOut());
      }
      
      if (homeBtn) {
        homeBtn.addEventListener('click', () => this.navigateToHome());
      }
    } else {
      // Login view event listeners
      const loginForm = this.querySelector('#login-form');
      const forgotPasswordBtn = this.querySelector('#forgot-password-btn');
      const signupBtn = this.querySelector('#signup-btn');

      if (loginForm) {
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));
      }
      
      if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', () => this.handleForgotPassword());
      }
      
      if (signupBtn) {
        signupBtn.addEventListener('click', () => this.handleSignup());
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
  }

  async handleSignOut() {
    try {
      // Clear all authentication data
      clearAuthData();
      
      // Show success message
      await this.showToast('Signed out successfully');
      
      // Reset component state
      this.isAuthenticated = false;
      this.userProfile = null;
      
      // Re-render the login view
      this.renderLoginView();
      this.setupEventListeners();
      
    } catch (error) {
      console.error('Error during sign out:', error);
      await this.showToast('Error signing out');
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
          this.userProfile = userData;
        } catch (error) {
          console.warn('Could not fetch user profile, but login was successful:', error);
        }
        
        await this.showToast('Login successful!');
        
        // Update component state and re-render
        this.isAuthenticated = true;
        this.renderProfileView();
        this.setupEventListeners();
        
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