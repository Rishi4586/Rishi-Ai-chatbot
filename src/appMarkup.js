export const appMarkup = `
  <div id="sidebar-scrim" class="sidebar-scrim" aria-hidden="true"></div>

  <div id="login-popup" class="popup-overlay auth-overlay">
    <div class="popup-content login-box auth-card">
      <button id="close-login" class="auth-close-btn material-symbols-rounded" type="button" aria-label="Close sign in">close</button>
      <p class="auth-eyebrow">Welcome Back</p>
      <h2>Sign in to continue</h2>
      <p class="auth-copy">Pick up your chats, search previous conversations, and continue where you left off.</p>
      <form id="login-form" class="auth-form">
        <label class="auth-field">
          <span>Email address</span>
          <input id="login-email" type="email" name="email" placeholder="you@example.com" autocomplete="email" required>
        </label>
        <label class="auth-field">
          <span>Password</span>
          <input id="login-password" type="password" name="password" placeholder="Enter your password" autocomplete="current-password" required>
        </label>
        <p class="field-hint">Secure access for your saved chats and uploads.</p>
        <button type="submit" class="auth-submit">Sign In</button>
      </form>
      <div class="extra-links">
        <p><a href="#" id="forgot-password-link">Forgot Password?</a></p>
        <p>Don't have an account? <a href="#" id="open-register">Create one</a></p>
      </div>
    </div>
  </div>

  <div id="register-popup" class="popup-overlay auth-overlay">
    <div class="popup-content login-box auth-card">
      <button id="close-register" class="auth-close-btn material-symbols-rounded" type="button" aria-label="Close sign up">close</button>
      <p class="auth-eyebrow">New Here?</p>
      <h2>Create your account</h2>
      <p class="auth-copy">Set up a profile in a few seconds and unlock saved chats, uploads, and persistent history.</p>
      <form id="register-form" class="auth-form">
        <label class="auth-field">
          <span>Email address</span>
          <input id="register-email" type="email" name="email" placeholder="you@example.com" autocomplete="email" required>
        </label>
        <label class="auth-field">
          <span>Password</span>
          <input id="register-password" type="password" name="password" placeholder="Create a strong password" autocomplete="new-password" minlength="6" required>
        </label>
        <p class="field-hint">Use at least 6 characters for a stronger password.</p>
        <button type="submit" class="auth-submit">Create Account</button>
      </form>
      <div class="extra-links">
        <p>Already have an account? <a href="#" id="open-login">Sign in</a></p>
      </div>
    </div>
  </div>

  <div id="guest-limit-popup" class="popup-overlay auth-overlay">
    <div class="popup-content login-box auth-card guest-limit-card">
      <button id="close-guest-limit" class="auth-close-btn material-symbols-rounded" type="button" aria-label="Close limit modal">close</button>
      <p class="auth-eyebrow">Free Plan</p>
      <h2>Limit Reached</h2>
      <p class="auth-copy">You've reached your free limit. Please sign in or sign up to continue.</p>
      <div class="limit-actions">
        <button id="guest-limit-signin" class="auth-submit limit-secondary" type="button">Sign In</button>
        <button id="guest-limit-signup" class="auth-submit" type="button">Sign Up</button>
        <button id="guest-limit-cancel" class="auth-submit limit-cancel" type="button">Cancel</button>
      </div>
    </div>
  </div>

  <div id="rename-chat-popup" class="popup-overlay auth-overlay">
    <div class="popup-content login-box auth-card manage-chat-card">
      <button id="close-rename-chat" class="auth-close-btn material-symbols-rounded" type="button" aria-label="Close rename chat">close</button>
      <p class="auth-eyebrow">Chat Settings</p>
      <h2>Rename chat</h2>
      <p class="auth-copy">Give this conversation a clearer title so it is easier to find later.</p>
      <form id="rename-chat-form" class="auth-form">
        <label class="auth-field">
          <span>Chat title</span>
          <input id="rename-chat-input" type="text" name="chatTitle" placeholder="Enter a chat title" maxlength="56" required>
        </label>
        <div class="limit-actions manage-chat-actions">
          <button id="rename-chat-cancel" class="auth-submit limit-cancel" type="button">Cancel</button>
          <button id="rename-chat-save" class="auth-submit" type="submit">Save Changes</button>
        </div>
      </form>
    </div>
  </div>

  <div id="delete-chat-popup" class="popup-overlay auth-overlay">
    <div class="popup-content login-box auth-card manage-chat-card delete-chat-card">
      <button id="close-delete-chat" class="auth-close-btn material-symbols-rounded" type="button" aria-label="Close delete chat">close</button>
      <p class="auth-eyebrow">Danger Zone</p>
      <h2>Delete chat?</h2>
      <p id="delete-chat-copy" class="auth-copy">This chat will be removed from your history permanently. This action cannot be undone.</p>
      <div class="limit-actions manage-chat-actions">
        <button id="delete-chat-cancel" class="auth-submit limit-cancel" type="button">Cancel</button>
        <button id="delete-chat-confirm" class="auth-submit delete-chat-confirm" type="button">Delete Chat</button>
      </div>
    </div>
  </div>

  <aside id="chat-sidebar" class="chat-sidebar collapsed" aria-label="Saved chats">
    <div class="chat-sidebar-inner">
      <div class="sidebar-top-row">
        <button id="collapse-sidebar-btn" class="sidebar-icon-btn material-symbols-rounded" type="button" aria-label="Toggle sidebar">left_panel_close</button>
        <button id="new-chat-btn" class="new-chat-btn" type="button">
          <span class="material-symbols-rounded">edit_square</span>
          <span class="sidebar-label">New Chat</span>
        </button>
      </div>

      <label class="sidebar-search" for="chat-search-input">
        <span class="material-symbols-rounded">search</span>
        <input id="chat-search-input" type="search" placeholder="Search chats" autocomplete="off">
      </label>

      <div class="sidebar-section-row">
        <span class="sidebar-section-title">Recent chats</span>
        <span id="chat-count-badge" class="chat-count-badge">0</span>
      </div>

      <div id="chat-list" class="chat-list" role="list"></div>
      <div id="chat-list-empty" class="chat-list-empty">
        <p class="empty-title">No saved chats yet</p>
        <p class="empty-copy">Sign in to unlock a searchable conversation history.</p>
      </div>
    </div>
  </aside>

  <header class="fixed-header">
    <div class="header-actions">
      <div class="header-start">
        <button id="mobile-sidebar-toggle" class="header-icon-btn material-symbols-rounded" type="button" aria-label="Toggle chat sidebar" aria-controls="chat-sidebar" aria-expanded="false">menu</button>
        <img src="images/chatbot.png" alt="Logo" class="header-logo">
      </div>
      <div class="model-dropdown">
        <button id="model-dropdown-btn" type="button">OpenRouter</button>
        <div class="model-options">
          <div class="model-option selected" data-model="OpenRouter">
            <span class="model-icon">&#9889;</span>
            <div class="model-text">
              <strong>OpenRouter Free</strong>
              <p>Balanced chat and multimodal support</p>
            </div>
            <span class="checkmark">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#207efd">
                <path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"></path>
              </svg>
            </span>
          </div>
        </div>
      </div>

      <button id="open-changelog" type="button">
        <dotlottie-player
          src="https://lottie.host/8c7347bd-3874-458f-b07a-4b7a3f25aa63/1t5Rg7OmQp.lottie"
          background="transparent"
          speed="1"
          style="width: 24px; height: 24px; display: inline-block; vertical-align: middle;"
          loop
          autoplay>
        </dotlottie-player>
      </button>
      <div class="navbar-auth-actions">
        <button id="login-btn" type="button">Sign In</button>
        <button id="register-btn" type="button">Sign Up</button>
        <button id="logout-btn" type="button">Logout</button>
      </div>
    </div>
  </header>

  <div id="changelog-popup" class="popup-overlay">
    <div class="popup-content">
      <div id="changelog-container">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
          <radialGradient id="a12" cx=".66" fx=".66" cy=".3125" fy=".3125" gradientTransform="scale(1.5)">
            <stop offset="0" stop-color="#7D71FF"></stop>
            <stop offset=".3" stop-color="#7D71FF" stop-opacity=".9"></stop>
            <stop offset=".6" stop-color="#7D71FF" stop-opacity=".6"></stop>
            <stop offset=".8" stop-color="#7D71FF" stop-opacity=".3"></stop>
            <stop offset="1" stop-color="#7D71FF" stop-opacity="0"></stop>
          </radialGradient>
          <circle transform-origin="center" fill="none" stroke="url(#a12)" stroke-width="2" stroke-linecap="round" stroke-dasharray="200 1000" stroke-dashoffset="0" cx="100" cy="100" r="70">
            <animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="0.9" values="360;0" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite"></animateTransform>
          </circle>
          <circle transform-origin="center" fill="none" opacity=".2" stroke="#7D71FF" stroke-width="2" stroke-linecap="round" cx="100" cy="100" r="70"></circle>
        </svg>
      </div>
      <button id="close-changelog-btn" type="button">Close</button>
    </div>
  </div>

  <div id="info-popup" class="popup-overlay">
    <div class="popup-content">
      <h2>Welcome to My Chatbot</h2>
      <p>Created by <strong>Rishi</strong></p>

      <div class="social-links">
        <p>GitHub:
          <a href="https://github.com/adivish" target="_blank" class="social-icon" rel="noreferrer">
            <dotlottie-player src="https://lottie.host/12509ab2-88b5-4a84-9eea-521bd6b6f4d3/cmH1sdcsl9.lottie" background="transparent" speed="1" style="width: 50px; height: 50px" loop autoplay></dotlottie-player>
          </a>
        </p>
        <p>LinkedIn:
          <a href="https://www.linkedin.com/in/aditya-vishal-shaw/" target="_blank" class="social-icon" rel="noreferrer">
            <dotlottie-player src="https://lottie.host/c8be9f5e-b34b-40a1-98da-8efd423a450b/Xe48EbnxF8.lottie" background="transparent" speed="1" style="width: 50px; height: 50px" loop autoplay></dotlottie-player>
          </a>
        </p>
      </div>

      <p>Note: This is hosted on a free hosting platform Render with limited resources.</p>
      <p>Resources used: various open-source internet materials.</p>
      <p><strong style="font-size: small;">Disclaimer:</strong> Responses may be inaccurate or slow. Please verify important information before use.</p>

      <button id="close-popup" type="button">Got it!</button>
    </div>
  </div>

  <main class="container">
    <header class="app-header">
      <h1 class="heading">Hello, there</h1>
      <h4 class="sub-heading">How can I help you today?</h4>
      <p id="model-info" class="model-info">OpenRouter Free keeps the experience flexible, fast, and ready for saved conversations.</p>
    </header>

    <ul class="suggestions">
      <li class="suggestions-item" data-prompt="Design a home office setup for remote work under $500." tabindex="0" role="button" aria-label="Use suggestion: Design a home office setup for remote work under $500.">
        <p class="text">Design a home office setup for remote work under $500.</p>
        <span class="icon material-symbols-rounded">draw</span>
      </li>
      <li class="suggestions-item" data-prompt="How can I level up my web development expertise in 2025?" tabindex="0" role="button" aria-label="Use suggestion: How can I level up my web development expertise in 2025?">
        <p class="text">How can I level up my web development expertise in 2025?</p>
        <span class="icon material-symbols-rounded">lightbulb</span>
      </li>
      <li class="suggestions-item" data-prompt="Suggest some useful tools for debugging JavaScript code." tabindex="0" role="button" aria-label="Use suggestion: Suggest some useful tools for debugging JavaScript code.">
        <p class="text">Suggest some useful tools for debugging JavaScript code.</p>
        <span class="icon material-symbols-rounded">explore</span>
      </li>
      <li class="suggestions-item" data-prompt="Create a React JS component for a simple todo list app." tabindex="0" role="button" aria-label="Use suggestion: Create a React JS component for a simple todo list app.">
        <p class="text">Create a React JS component for a simple todo list app.</p>
        <span class="icon material-symbols-rounded">code_blocks</span>
      </li>
    </ul>

    <div id="chat-window" class="chats-container premium-chat" aria-live="polite"></div>

    <div class="prompt-container">
      <div class="prompt-wrapper">
        <div id="upload-preview" class="upload-preview" hidden>
          <div id="upload-preview-media" class="upload-preview-media"></div>
          <div class="upload-preview-copy">
            <p id="upload-preview-name" class="upload-preview-name">Uploaded file</p>
            <p id="upload-preview-meta" class="upload-preview-meta">Ready to send with your next prompt</p>
          </div>
          <button id="remove-upload-btn" class="material-symbols-rounded upload-remove-btn" type="button" aria-label="Remove uploaded file">close</button>
        </div>

        <div class="prompt-controls-row">
          <form action="#" class="prompt-form" autocomplete="off">
            <div class="prompt-actions">
              <div class="file-upload-wrapper">
                <input id="file-input" type="file" accept=".pdf,image/png,image/jpeg" hidden />
                <button id="add-file-btn" type="button" class="material-symbols-rounded" aria-label="Upload PDF or image">attach_file</button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Ask Chatbot"
              id="message"
              class="prompt-input"
              name="chat-prompt"
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              aria-autocomplete="none"
              required
            />
            <div class="prompt-actions prompt-actions-end">
              <button id="stop-response-btn" type="button" class="material-symbols-rounded" aria-label="Stop response">stop_circle</button>
              <button id="send-prompt-btn" type="submit" class="material-symbols-rounded" aria-label="Send message">send</button>
            </div>
          </form>
          <button id="theme-toggle-btn" class="material-symbols-rounded" type="button" aria-label="Toggle theme">light_mode</button>
          <button id="delete-chats-btn" class="material-symbols-rounded" type="button" aria-label="Clear prompt">delete</button>
        </div>
      </div>
      <p class="disclaimer-text">Chatbot can make mistakes, so double-check important answers.</p>
    </div>
  </main>

  <div id="auth-toast" class="auth-toast" role="status" aria-live="polite"></div>
`;
