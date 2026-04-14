/* Prompt Marketplace - App.js */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    sessionUser: 'sessionUser',
    users: 'users',
    prompts: 'prompts',
    resetToken: 'resetToken'
  };
  const API_BASE_URL = (
    (window.PROMPTMARKET_CONFIG && window.PROMPTMARKET_CONFIG.API_BASE_URL) ||
    window.API_BASE_URL ||
    window.__API_BASE_URL ||
    'https://promptmarket-api-802312334335.us-central1.run.app'
  ).replace(/\/+$/, '');
  const API_BASE = API_BASE_URL + '/api';

  const MODELS = ['All', 'ChatGPT', 'Claude', 'Gemini', 'Sora', 'Cursor', 'Copilot'];
  const CATEGORIES = [
    'Academic Writing', 'Coding & Development', 'Study & Exam Prep',
    'Research and Analysis', 'Design & Media', 'Career & Professional',
    'Productivity & Organization', 'AI Automation'
  ];


  const ACHIEVEMENTS_DEF = [
    { id: 'free_beanie',   name: 'Welcome Aboard',      desc: 'You showed up — that\'s step one.',       icon: '🎉', check: () => true                  },
    { id: 'free_glasses',  name: 'Curious Mind',         desc: 'Curiosity is your superpower.',           icon: '🔭', check: () => true                  },
    { id: 'first_prompt',  name: 'First Words',          desc: 'You published your very first prompt.',   icon: '✍️', check: s => s.promptCount >= 1     },
    { id: 'first_comment', name: 'In the Convo',         desc: 'You jumped into the conversation.',       icon: '💬', check: s => s.commentCount >= 1    },
    { id: 'five_prompts',  name: 'On a Roll',            desc: 'Five prompts down, more to go.',          icon: '🎯', check: s => s.promptCount >= 5     },
    { id: 'first_save',    name: 'Worth Saving',         desc: 'Someone bookmarked your work.',           icon: '⭐', check: s => s.saveCount >= 1       },
    { id: 'ten_prompts',   name: 'Prolific',             desc: 'Ten prompts posted — you\'re committed.', icon: '🚀', check: s => s.promptCount >= 10    },
    { id: 'top_creator',   name: 'Hall of Fame',         desc: 'Your prompts earned 25+ upvotes.',        icon: '👑', check: s => s.totalUpvotes >= 25   }
  ];

  // Shared inline placeholder (avoids dependency on local image assets).
  const THUMBNAIL_FALLBACK_SRC =
    'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22320%22%20height%3D%22160%22%20viewBox%3D%220%200%20320%20160%22%3E%3Crect%20width%3D%22320%22%20height%3D%22160%22%20fill%3D%22%23e5e7eb%22/%3E%3Cpath%20d%3D%22M0%20120%20L80%2060%20L160%20110%20L240%2070%20L320%20120%20L320%20160%20L0%20160%20Z%22%20fill%3D%22%23cbd5e1%22/%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20font-size%3D%2214%22%20fill%3D%22%239197a3%22%3ENo%20image%3C/text%3E%3C/svg%3E';

  // --- 1) Helpers ---
  function load(key) {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : (key === STORAGE_KEYS.users || key === STORAGE_KEYS.prompts ? [] : null);
    } catch (_) {
      return null;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function qs(sel, el = document) { return el.querySelector(sel); }
  function qsAll(sel, el = document) { return el.querySelectorAll(sel); }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
  }

  function getPasswordIssues(pw) {
    const issues = [];
    const value = pw || '';
    if (!value || value.length < 8) issues.push('at least 8 characters');
    if (!/[A-Z]/.test(value)) issues.push('one uppercase letter');
    if (!/[0-9]/.test(value)) issues.push('one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) issues.push('one special character');
    return issues;
  }

  function getPasswordErrorText(pw) {
    const issues = getPasswordIssues(pw);
    if (!issues.length) return 'Password does not meet the required format.';
    if (issues.length === 1) return 'Password must include: ' + issues[0] + '.';
    return 'Password must include: ' + issues.slice(0, -1).join(', ') + ' and ' + issues[issues.length - 1] + '.';
  }

  function validatePassword(pw) {
    return getPasswordIssues(pw).length === 0;
  }

  function getSessionUser() {
    return load(STORAGE_KEYS.sessionUser);
  }

  function setSessionUser(user) {
    save(STORAGE_KEYS.sessionUser, user);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.sessionUser);
  }

  function requireAuth(redirectTo) {
    const user = getSessionUser();
    if (!user) {
      window.location.href = redirectTo || (getBase() + 'pages/login.html');
      return null;
    }
    if (user.banned) {
      logout();
      window.location.href = getBase() + 'pages/login.html';
      return null;
    }
    return user;
  }

  function requireAdmin() {
    const user = requireAuth(getBase() + 'pages/login.html');
    if (!user) return null;
    if (user.role !== 'admin') return false;
    return user;
  }

  function getBase() {
    const path = window.location.pathname || '/';
    let base;
    if (path.includes('/pages/')) {
      base = path.replace(/\/pages\/[^/]+$/, '/');
    } else {
      base = path.replace(/[^/]+$/, '') || '/';
    }
    return base.endsWith('/') ? base : base + '/';
  }

  function navigate(path) {
    window.location.href = getBase() + path;
  }

  function id() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  async function apiFetchJson(path, options) {
    const res = await fetch(API_BASE + path, options);
    if (!res.ok) {
      throw new Error('Request failed: ' + res.status);
    }
    return res.json();
  }

  function escapeHtmlAttr(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  /**
   * Thumbnail display: prefer remote URL; else MySQL blob via API; else placeholder.
   * thumbnail_mime_type is informational (server sets Content-Type on blob route).
   */
  function getPromptThumbnailSrc(p) {
    if (!p) return THUMBNAIL_FALLBACK_SRC;
    const url = (p.thumbnail_url != null && p.thumbnail_url !== '')
      ? String(p.thumbnail_url).trim()
      : '';
    if (url) return url;
    const idStr = p.id != null ? String(p.id).trim() : '';
    if (idStr && /^\d+$/.test(idStr)) {
      return API_BASE + '/prompts/' + encodeURIComponent(idStr) + '/thumbnail';
    }
    return THUMBNAIL_FALLBACK_SRC;
  }

  function mapBackendPromptToLocal(prompt) {
    const thumb =
      prompt.thumbnail_url != null && String(prompt.thumbnail_url).trim() !== ''
        ? String(prompt.thumbnail_url).trim()
        : null;
    return {
      id: String(prompt.id),
      userId: String(prompt.author_id),
      title: prompt.title || '',
      description: prompt.description || '',
      category: prompt.category_name || '',
      model: prompt.model || 'ChatGPT',
      content: prompt.content || '',
      tags: Array.isArray(prompt.tags) ? prompt.tags.map(t => t.name) : [],
      createdAt: prompt.created_at || new Date().toISOString(),
      removed: false,
      creatorName: prompt.author_username || 'Unknown',
      creatorAvatarStyle: prompt.author_avatar_style || null,
      creatorAvatarSeed: prompt.author_avatar_seed || null,
      thumbnail_url: thumb,
      upvotes: Number(prompt.upvotes) || 0,
      downvotes: Number(prompt.downvotes) || 0,
      commentCount: Number(prompt.comment_count) || 0,
      saveCount: Number(prompt.save_count) || 0
    };
  }

  // In-memory sets populated from the API; avoids per-prompt round trips on listing pages.
  let _savedPromptIds = new Set();   // prompt ids (strings) saved by the current user
  let _userVotes = {};               // prompt id -> 1 or -1, current user's votes

  // --- Avatar helpers ---
  const AVATAR_STYLES = [
    { id: 'adventurer', label: 'Adventurer' },
    { id: 'avataaars',  label: 'Avataaars'  },
    { id: 'pixel-art',  label: 'Pixel Art'  },
    { id: 'bottts',     label: 'Bottts'     },
    { id: 'lorelei',    label: 'Lorelei'    },
    { id: 'fun-emoji',  label: 'Fun Emoji'  }
  ];

  const AVATAR_SEEDS = [
    'cosmic','spark','nova','pixel','drift','echo','blaze','storm','frost','sage',
    'vex','quill','miro','zeno','lyra','coda','wren','kite','dusk','finn'
  ];

  function dicebearUrl(username, style, seed) {
    const s = style || 'adventurer';
    const seedVal = seed || username || 'user';
    return `https://api.dicebear.com/9.x/${s}/svg?seed=${encodeURIComponent(seedVal)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=solid`;
  }

  function buildAchievementsBadges(defs, unlockedIds) {
    return `<div class="achievement-badges">` + defs.map(a => {
      const on = unlockedIds.includes(a.id);
      return `<div class="achievement-badge ${on ? 'unlocked' : 'locked'}">
        <div class="badge-icon">${on ? a.icon : '🔒'}</div>
        <div class="badge-name">${a.name}</div>
        <div class="badge-desc">${on ? a.desc : a.desc}</div>
      </div>`;
    }).join('') + `</div>`;
  }

  // --- 2) Seed demo data ---
  function seedDemoDataIfEmpty() {
    if (load(STORAGE_KEYS.users)?.length > 0) return;
    save(STORAGE_KEYS.users, [
      { id: 'u1', fullName: 'Admin User', email: 'admin@prompt.demo', username: 'admin', password: 'Admin123!', role: 'admin', avatarUrl: '', createdAt: new Date().toISOString() },
      { id: 'u2', fullName: 'Demo User', email: 'demo@prompt.demo', username: 'demo', password: 'Demo123!', role: 'user', avatarUrl: '', createdAt: new Date().toISOString() }
    ]);
  }

  // --- 3) Navbar ---
  function renderNavbar() {
    const el = document.getElementById('navbar');
    if (!el) return;
    const user = getSessionUser();
    const base = getBase();
    const isExplore = window.location.pathname.includes('explore');
    const isProfile = window.location.pathname.includes('profile');
    const searchPage = isExplore || isProfile ? 'filter' : 'navigate';

    let right = '';
    if (!user) {
      right = `
        <a class="nav-link" href="${base}pages/explore.html">Explore</a>
        <a class="nav-link" href="${base}pages/login.html">Login</a>
        <a class="btn btn-primary btn-sm" href="${base}pages/register.html">Register</a>
      `;
    } else {
      right = `
        <a class="nav-link" href="${base}pages/explore.html">Explore</a>
        <a class="nav-link" href="${base}pages/postcreation.html">Create</a>
        <div class="avatar-wrap" id="avatarDropdownWrap">
          <img class="avatar-circle" id="avatarBtn" src="${dicebearUrl(user.username, user.avatar_style, user.avatar_seed)}" alt="${user.username}" title="${user.username}" />
          <div class="avatar-dropdown" id="avatarDropdown">
            <a href="${base}pages/profile.html">Profile</a>
            <a href="${base}pages/accountsettings.html">Account Settings</a>
            ${user.role === 'admin' ? '<a href="' + base + 'pages/moderation.html">Moderation</a>' : ''}
            <a href="#" id="navLogout">Logout</a>
          </div>
        </div>
      `;
    }

    const logoHref = user ? base + 'pages/explore.html' : base + (base.endsWith('index.html') ? '' : 'index.html');
    if (!logoHref.includes('index') && !logoHref.endsWith('/')) {
      // ensure logo goes to index when logged out and we're in subfolder
    }
    const logoLink = user ? (base + 'pages/explore.html') : (base.replace(/\/pages\/[^/]*$/, '/') || base + '../') + 'index.html';
    const finalLogo = (base.includes('/pages/') && !user) ? base.replace(/pages\/[^/]+\.html$/, '') + 'index.html' : (user ? base + 'pages/explore.html' : base + 'index.html');

    el.innerHTML = `
      <div class="navbar">
        <div class="navbar-left">
          <a class="logo" href="${finalLogo}"><img src="${base}img/csusm_logo_white.png" alt="CSUSM" class="logo-img"></a>
        </div>
        <div class="navbar-center">
          <input type="text" class="nav-search" id="navSearch" placeholder="Search prompts..." data-mode="${searchPage}">
        </div>
        <div class="navbar-right">${right}</div>
      </div>
    `;

    const searchInput = document.getElementById('navSearch');
    if (searchInput) {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      if (q) searchInput.value = q;
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          const val = this.value.trim();
          if (searchPage === 'filter') {
            this.dispatchEvent(new CustomEvent('search', { detail: val }));
          } else {
            window.location.href = base + 'pages/explore.html' + (val ? '?q=' + encodeURIComponent(val) : '');
          }
        }
      });
    }

    const avatarBtn = document.getElementById('avatarBtn');
    const avatarDropdown = document.getElementById('avatarDropdown');
    if (avatarBtn && avatarDropdown) {
      avatarBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        avatarDropdown.classList.toggle('show');
      });
      document.addEventListener('click', function () {
        avatarDropdown.classList.remove('show');
      });
    }

    const navLogout = document.getElementById('navLogout');
    if (navLogout) {
      navLogout.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
        window.location.href = base + 'index.html';
      });
    }
  }

  function isSaved(userId, promptId) {
    return _savedPromptIds.has(String(promptId));
  }

  function getPromptsFiltered(opts) {
    let prompts = (load(STORAGE_KEYS.prompts) || []).filter(p => !p.removed);
    const users = load(STORAGE_KEYS.users) || [];
    const model = (opts && opts.model) || 'All';
    const category = opts && opts.category;
    const query = (opts && opts.query) || '';

    if (model && model !== 'All') prompts = prompts.filter(p => p.model === model);
    if (category) prompts = prompts.filter(p => p.category === category);
    if (query) {
      const q = query.toLowerCase();
      prompts = prompts.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    prompts = prompts.map(p => {
      const up = p.upvotes || 0;
      const down = p.downvotes || 0;
      const score = up - down;
      const commentCount = p.commentCount || 0;
      const saveCount = p.saveCount || 0;
      const engagement = score + commentCount + saveCount;
      const creator = users.find(u => u.id === p.userId);
      return {
        ...p,
        score,
        upvotes: up,
        downvotes: down,
        commentCount,
        saveCount,
        engagement,
        creatorName: p.creatorName || (creator ? (creator.username || creator.fullName) : 'Unknown')
      };
    });

    const sortBy = (opts && opts.sortBy) || 'trending';
    if (sortBy === 'new') prompts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === 'top') prompts.sort((a, b) => b.score - a.score);
    else prompts.sort((a, b) => b.engagement - a.engagement);

    return prompts;
  }

  function getUserById(id) {
    return (load(STORAGE_KEYS.users) || []).find(u => u.id === id);
  }

  /**
   * Merge GET /api/users/:id JSON with optional local demo row (cosmetics, fullName, etc.).
   */
  function mergeApiUserWithLocal(apiRow, local) {
    const idStr = String(apiRow.id);
    const base = {
      id: idStr,
      username: apiRow.username,
      email: apiRow.email,
      role: apiRow.role,
      fullName: (local && local.fullName) || apiRow.username,
      avatar_style: apiRow.avatar_style || 'adventurer',
      avatar_seed: apiRow.avatar_seed || null
    };
    return local ? Object.assign({}, local, base) : base;
  }

  /**
   * Primary: GET /api/users/:id for numeric ids.
   * Fallback: localStorage demo users (e.g. u1) when non-numeric or API unavailable.
   */
  async function resolveProfileUser(profileUserId) {
    const idStr = String(profileUserId);
    const local = getUserById(idStr);
    const numId = parseInt(idStr, 10);
    if (!Number.isNaN(numId) && numId > 0) {
      try {
        const res = await fetch(API_BASE + '/users/' + encodeURIComponent(numId));
        if (res.ok) {
          const data = await res.json();
          return mergeApiUserWithLocal(data, local);
        }
        if (res.status === 404) {
          return local || null;
        }
        return local || null;
      } catch (err) {
        console.error('Profile user fetch failed:', err);
        return local || null;
      }
    }
    return local || null;
  }

  // --- 4) Page initializers ---
  function initIndex() {
    const user = getSessionUser();
    const base = getBase();
    const continueBtn = document.getElementById('continueExplore');
    const loginBtn = document.getElementById('goLogin');
    const registerBtn = document.getElementById('goRegister');
    const forgotLink = document.getElementById('forgotLink');
    if (continueBtn) continueBtn.href = base + 'pages/explore.html';
    if (loginBtn) loginBtn.href = base + 'pages/login.html';
    if (registerBtn) registerBtn.href = base + 'pages/register.html';
    if (forgotLink) forgotLink.href = base + 'pages/forgotpassword.html';
    const loggedInBlock = document.getElementById('loggedInBlock');
    const loggedOutBlock = document.getElementById('loggedOutBlock');
    if (loggedInBlock && loggedOutBlock) {
      if (user) {
        loggedOutBlock.style.display = 'none';
        loggedInBlock.style.display = 'block';
        const c = loggedInBlock.querySelector('a');
        if (c) c.href = base + 'pages/explore.html';
      } else {
        loggedInBlock.style.display = 'none';
        loggedOutBlock.style.display = 'block';
      }
    }
  }

  function initLogin() {
    const form = document.getElementById('loginForm');
    const msg = document.getElementById('loginMessage');
    const base = getBase();
    if (!form) return;
    const forgotLink = document.getElementById('forgotLinkLogin');
    const registerLink = document.getElementById('registerLinkLogin');
    if (forgotLink) forgotLink.href = base + 'pages/forgotpassword.html';
    if (registerLink) registerLink.href = base + 'pages/register.html';

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const emailOrUser = (form.emailOrUsername && form.emailOrUsername.value || '').trim();
      const password = (form.password && form.password.value || '').trim();
      if (msg) msg.className = 'msg msg-error';
      if (!emailOrUser) {
        if (msg) { msg.textContent = 'Please enter your email or username.'; msg.style.display = 'block'; }
        return;
      }
      if (!password) {
        if (msg) { msg.textContent = 'Please enter your password.'; msg.style.display = 'block'; }
        return;
      }
      try {
        const apiUser = await apiFetchJson('/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrUsername: emailOrUser, password })
        });
        setSessionUser({
          id: String(apiUser.id),
          username: apiUser.username,
          fullName: apiUser.username,
          email: apiUser.email,
          role: apiUser.role,
          avatar_style: apiUser.avatar_style || 'adventurer',
          avatar_seed: apiUser.avatar_seed || null
        });
        window.location.href = base + 'pages/explore.html';
      } catch (_) {
        if (msg) { msg.textContent = 'Invalid email/username or password.'; msg.style.display = 'block'; }
      }
    });
  }

  function initRegister() {
    const form = document.getElementById('registerForm');
    const msg = document.getElementById('registerMessage');
    const base = getBase();
    if (!form) return;
    const loginLink = document.getElementById('loginLinkRegister');
    if (loginLink) loginLink.href = base + 'pages/login.html';

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fullName = (form.fullName && form.fullName.value || '').trim();
      const email = (form.email && form.email.value || '').trim();
      const username = (form.username && form.username.value || '').trim();
      const password = form.password && form.password.value || '';
      const verify = form.verify && form.verify.value || '';
      if (msg) { msg.className = 'msg msg-error'; msg.style.display = 'none'; }

      if (!fullName) { if (msg) { msg.textContent = 'Please enter your full name.'; msg.style.display = 'block'; } return; }
      if (!email) { if (msg) { msg.textContent = 'Please enter your email.'; msg.style.display = 'block'; } return; }
      if (!validateEmail(email)) { if (msg) { msg.textContent = 'Please enter a valid email address.'; msg.style.display = 'block'; } return; }
      if (!username) { if (msg) { msg.textContent = 'Please enter a username.'; msg.style.display = 'block'; } return; }
      if (!validatePassword(password)) {
        if (msg) { msg.textContent = getPasswordErrorText(password); msg.style.display = 'block'; }
        return;
      }
      if (password !== verify) { if (msg) { msg.textContent = 'Passwords do not match.'; msg.style.display = 'block'; } return; }

      try {
        const newUser = await apiFetchJson('/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        setSessionUser({
          id: String(newUser.id),
          username: newUser.username,
          fullName,
          email: newUser.email,
          role: newUser.role
        });
        window.location.href = base + 'pages/explore.html';
      } catch (err) {
        if (msg) {
          msg.textContent = err.message && err.message.includes('409')
            ? 'Username or email already exists.'
            : 'Registration failed. Please try again.';
          msg.style.display = 'block';
        }
      }
    });
  }

  function initForgotPassword() {
    const form = document.getElementById('forgotForm');
    const successMsg = document.getElementById('forgotSuccess');
    const base = getBase();
    if (!form) return;
    const backLink = document.getElementById('backToLoginForgot');
    if (backLink) backLink.href = base + 'pages/login.html';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = (form.email && form.email.value || '').trim();
      const token = id();
      save(STORAGE_KEYS.resetToken, token);
      if (successMsg) {
        successMsg.style.display = 'block';
        const link = qs('#resetLinkDemo', successMsg) || (successMsg.querySelector && successMsg.querySelector('#resetLinkDemo'));
        const resetUrl = base + 'pages/resetpassword.html?token=' + encodeURIComponent(token);
        successMsg.innerHTML = 'If an account exists for that email, we\'ve sent a reset link. For this demo, use this link: <a id="resetLinkDemo" href="' + resetUrl + '">Reset password</a>';
      }
    });
  }

  function initResetPassword() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const form = document.getElementById('resetForm');
    const msg = document.getElementById('resetMessage');
    const base = getBase();
    if (!form) return;
    const loginLink = document.getElementById('loginLinkReset');
    if (loginLink) loginLink.href = base + 'pages/login.html';

    if (!token) {
      if (msg) { msg.className = 'msg msg-error'; msg.textContent = 'Invalid or missing reset token.'; msg.style.display = 'block'; }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const stored = load(STORAGE_KEYS.resetToken);
      if (!token || token !== stored) {
        if (msg) { msg.className = 'msg msg-error'; msg.textContent = 'Invalid or expired reset token.'; msg.style.display = 'block'; }
        return;
      }
      const newPw = form.newPassword && form.newPassword.value || '';
      const verify = form.verify && form.verify.value || '';
      if (!validatePassword(newPw)) {
        if (msg) { msg.className = 'msg msg-error'; msg.textContent = getPasswordErrorText(newPw); msg.style.display = 'block'; }
        return;
      }
      if (newPw !== verify) {
        if (msg) { msg.className = 'msg msg-error'; msg.textContent = 'Passwords do not match.'; msg.style.display = 'block'; }
        return;
      }
      localStorage.removeItem(STORAGE_KEYS.resetToken);
      if (msg) { msg.className = 'msg msg-success'; msg.textContent = 'Password reset successfully. You can now log in.'; msg.style.display = 'block'; }
      form.reset();
    });
  }

  function initExplore() {
    const base = getBase();
    const container = document.getElementById('explorePrompts');
    const creatorsEl = document.getElementById('exploreCreators');
    const filterModel = document.getElementById('filterModel');
    const filterCategory = document.getElementById('filterCategory');
    const sortSelect = document.getElementById('sortSelect');
    const navSearch = document.getElementById('navSearch');

    const user = getSessionUser();
    if (user && !isNaN(parseInt(user.id, 10))) {
      fetch(API_BASE + '/saves?user_id=' + user.id)
        .then(r => r.ok ? r.json() : [])
        .then(rows => { _savedPromptIds = new Set((rows || []).map(r => String(r.prompt_id))); })
        .catch(() => {});
    }

    async function refreshPromptsFromBackend(opts) {
      try {
        const params = new URLSearchParams();
        if (opts && opts.query) params.set('q', opts.query);
        const backendPrompts = await apiFetchJson('/prompts' + (params.toString() ? '?' + params.toString() : ''));
        save(STORAGE_KEYS.prompts, (backendPrompts || []).map(mapBackendPromptToLocal));
      } catch (e) {
        console.error('Error loading prompts from backend:', e.message);
      }
    }

    async function renderPrompts(opts) {
      await refreshPromptsFromBackend(opts);
      const list = getPromptsFiltered(opts);
      const user = getSessionUser();
      if (!container) return;
      container.innerHTML = list.map(p => {
        const saved = user && isSaved(user.id, p.id);
        return `
          <article class="prompt-card" data-prompt-id="${p.id}">
            <div class="prompt-thumbnail">
              <img src="${escapeHtmlAttr(getPromptThumbnailSrc(p))}" alt="" onerror='this.onerror=null; this.src="${THUMBNAIL_FALLBACK_SRC}"'>
            </div>
            <div class="prompt-title">${escapeHtml(p.title)}</div>
            <div class="prompt-creator">${userChip(p.userId, p.creatorName, p.creatorAvatarStyle, p.creatorAvatarSeed, base)}</div>
            <div class="prompt-desc">${escapeHtml((p.description || '').slice(0, 100))}${(p.description || '').length > 100 ? '...' : ''}</div>
            <div class="prompt-stats">
              <span class="stat-chip">↑ ${p.upvotes}</span>
              <span class="stat-chip">↓ ${p.downvotes}</span>
              <span class="stat-chip">💬 ${p.commentCount}</span>
              <span class="stat-chip">★</span>
              <button type="button" class="save-btn ${saved ? 'saved' : ''}" data-prompt-id="${p.id}" title="Save" aria-label="Save">${saved ? '★' : '☆'}</button>
            </div>
          </article>
        `;
      }).join('');

      container.querySelectorAll('.prompt-card').forEach(card => {
        const id = card.getAttribute('data-prompt-id');
        card.addEventListener('click', function (e) {
          if (e.target.closest('.save-btn')) return;
          if (e.target.closest('.user-chip')) return;
          window.location.href = base + 'pages/prompt.html?id=' + id;
        });
      });
      container.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', async function (e) {
          e.stopPropagation();
          const user = getSessionUser();
          if (!user) { alert('Login required to save prompts.'); window.location.href = base + 'pages/login.html'; return; }
          const pid = this.getAttribute('data-prompt-id');
          const alreadySaved = _savedPromptIds.has(pid);
          try {
            await fetch(API_BASE + '/saves', {
              method: alreadySaved ? 'DELETE' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: parseInt(user.id, 10), prompt_id: parseInt(pid, 10) })
            });
            if (alreadySaved) _savedPromptIds.delete(pid);
            else _savedPromptIds.add(pid);
          } catch (err) {
            console.error('Save toggle failed:', err.message);
          }
          renderPrompts(getExploreOpts());
        });
      });
    }

    function getExploreOpts() {
      const model = filterModel && filterModel.querySelector('input:checked');
      const category = filterCategory && filterCategory.querySelector('input:checked');
      const sortBy = sortSelect && sortSelect.value || 'trending';
      const q = (navSearch && navSearch.value || '').trim() || (new URLSearchParams(window.location.search).get('q') || '');
      return {
        model: model && model.value,
        category: category && category.value,
        sortBy,
        query: q
      };
    }

    const users = load(STORAGE_KEYS.users) || [];
    const prompts = load(STORAGE_KEYS.prompts) || [];
    const creatorCounts = {};
    prompts.forEach(p => {
      if (!p.removed) creatorCounts[p.userId] = (creatorCounts[p.userId] || 0) + 1;
    });
    const topCreators = users.filter(u => creatorCounts[u.id]).sort((a, b) => (creatorCounts[b.id] || 0) - (creatorCounts[a.id] || 0)).slice(0, 5);
    if (creatorsEl) {
      creatorsEl.innerHTML = topCreators.map(u => `
        <a class="creator-card" href="${base}pages/profile.html?user=${u.id}">
          <div class="creator-avatar">${(u.username || u.fullName || 'U').charAt(0).toUpperCase()}</div>
          <div>
            <div class="creator-name">${escapeHtml(u.username || u.fullName)}</div>
            <div class="creator-meta">${creatorCounts[u.id] || 0} prompts</div>
          </div>
        </a>
      `).join('');
    }

    if (filterModel) filterModel.addEventListener('change', () => { renderPrompts(getExploreOpts()); });
    if (filterCategory) filterCategory.addEventListener('change', () => { renderPrompts(getExploreOpts()); });
    if (sortSelect) sortSelect.addEventListener('change', () => { renderPrompts(getExploreOpts()); });
    if (navSearch) navSearch.addEventListener('search', function () { renderPrompts(getExploreOpts()); });

    const initialQ = new URLSearchParams(window.location.search).get('q');
    if (navSearch && initialQ) navSearch.value = initialQ;
    renderPrompts(getExploreOpts());
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function userChip(userId, username, avatarStyle, avatarSeed, base) {
    const href = (base || getBase()) + 'pages/profile.html?user=' + encodeURIComponent(userId);
    const src = dicebearUrl(username, avatarStyle, avatarSeed);
    return `<a class="user-chip" href="${href}"><img class="user-chip-avatar" src="${escapeHtmlAttr(src)}" alt="${escapeHtml(username)}" /><span class="user-chip-name">${escapeHtml(username)}</span></a>`;
  }

  async function initPrompt() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const base = getBase();
    const user = getSessionUser();
    const prompts = load(STORAGE_KEYS.prompts) || [];
    let prompt = prompts.find(p => p.id === id && !p.removed);
    const container = document.getElementById('promptDetail');
    const backBtn = document.getElementById('backToExplore');
    if (backBtn) backBtn.href = base + 'pages/explore.html';

    if (!prompt) {
      try {
        const backendPrompt = await apiFetchJson('/prompts/' + encodeURIComponent(id));
        prompt = mapBackendPromptToLocal(backendPrompt);
        const updatedPrompts = (load(STORAGE_KEYS.prompts) || []).filter(p => p.id !== prompt.id);
        updatedPrompts.push(prompt);
        save(STORAGE_KEYS.prompts, updatedPrompts);
      } catch (_) {
        // Fallback to existing behavior below.
      }
    }

    if (!prompt || !container) {
      if (container) container.innerHTML = '<p class="msg msg-error">Prompt not found.</p>';
      return;
    }

    const creator = getUserById(prompt.userId);

    // Load per-prompt stats and user state from API in parallel
    let promptUpvotes = prompt.upvotes || 0;
    let promptDownvotes = prompt.downvotes || 0;
    let promptCommentCount = prompt.commentCount || 0;
    let myVoteValue = null;
    let isSavedPrompt = false;
    let isFollowing = false;

    const promptIdInt = parseInt(prompt.id, 10);
    const userIdInt = user ? parseInt(user.id, 10) : null;

    if (!Number.isNaN(promptIdInt)) {
      await Promise.all([
        fetch(API_BASE + '/votes?prompt_id=' + promptIdInt)
          .then(r => r.ok ? r.json() : [])
          .then(rows => {
            promptUpvotes   = rows.filter(v => v.value === 1).length;
            promptDownvotes = rows.filter(v => v.value === -1).length;
            if (user && userIdInt) {
              const mine = rows.find(v => v.user_id === userIdInt);
              myVoteValue = mine ? mine.value : null;
            }
          }).catch(() => {}),
        user && userIdInt ? fetch(API_BASE + '/saves?user_id=' + userIdInt)
          .then(r => r.ok ? r.json() : [])
          .then(rows => {
            _savedPromptIds = new Set((rows || []).map(r => String(r.prompt_id)));
            isSavedPrompt = _savedPromptIds.has(String(prompt.id));
          }).catch(() => {}) : Promise.resolve(),
        user && userIdInt ? fetch(API_BASE + '/follows?user_id=' + userIdInt)
          .then(r => r.ok ? r.json() : { following: [] })
          .then(data => {
            const followingList = (data.following || []).map(f => f.following_id);
            isFollowing = followingList.includes(parseInt(prompt.userId, 10));
          }).catch(() => {}) : Promise.resolve(),
        fetch(API_BASE + '/comments?prompt_id=' + promptIdInt)
          .then(r => r.ok ? r.json() : [])
          .then(rows => { promptCommentCount = rows.length; })
          .catch(() => {})
      ]);
    }

    const score = promptUpvotes - promptDownvotes;
    const commentCount = promptCommentCount;
    const saved = isSavedPrompt;
    const following = isFollowing;
    const myVote = myVoteValue !== null ? { value: myVoteValue } : null;

    const canDeletePrompt =
      user &&
      !Number.isNaN(promptIdInt) &&
      (user.role === 'admin' || String(prompt.userId) === String(user.id));

    function requireLogin(msg) {
      if (!user) {
        alert(msg + ' Please log in.');
        window.location.href = base + 'pages/login.html';
        return false;
      }
      return true;
    }

    container.innerHTML = `
      <div class="card mb-3">
        <div class="prompt-detail-thumbnail">
          <img src="${escapeHtmlAttr(getPromptThumbnailSrc(prompt))}" alt="" onerror='this.onerror=null; this.src="${THUMBNAIL_FALLBACK_SRC}"'>
        </div>
        <h1 class="h2">${escapeHtml(prompt.title)}</h1>
        <p class="text-muted text-small">${userChip(prompt.userId, (creator && creator.username) || prompt.creatorName || 'Unknown', prompt.creatorAvatarStyle, prompt.creatorAvatarSeed, base)} · ${formatDate(prompt.createdAt)}</p>
        <p>${escapeHtml(prompt.description || '')}</p>
        <div class="prompt-stats mb-2">
          <span class="stat-chip">↑ ${promptUpvotes}</span>
          <span class="stat-chip">↓ ${promptDownvotes}</span>
          <span class="stat-chip">💬 ${commentCount}</span>
        </div>
        <div class="prompt-content-box mb-3">${escapeHtml(prompt.content || '')}</div>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
          <button type="button" class="btn btn-outline btn-sm ${myVoteValue === 1 ? 'voted' : ''}" id="btnUpvote" data-vote="1">↑ Upvote</button>
          <button type="button" class="btn btn-outline btn-sm ${myVoteValue === -1 ? 'voted' : ''}" id="btnDownvote" data-vote="-1">↓ Downvote</button>
          <button type="button" class="btn btn-outline btn-sm ${saved ? 'saved' : ''}" id="btnSave">${saved ? '★ Saved' : '☆ Save'}</button>
          <button type="button" class="btn btn-outline btn-sm" id="btnFollow">${following ? 'Following' : 'Follow creator'}</button>
          <button type="button" class="btn btn-outline btn-sm" id="btnReport">Report</button>
          <button type="button" class="btn btn-outline btn-sm" id="btnCopyPrompt">Copy Prompt</button>
          ${canDeletePrompt ? '<button type="button" class="btn btn-danger btn-sm" id="btnDeletePrompt">Delete Prompt</button>' : ''}
          <a href="${base}pages/explore.html" class="btn btn-outline btn-sm">Back to Explore</a>
        </div>
      </div>
      <div class="card">
        <h3>Comments</h3>
        <div id="promptCommentsPreview"></div>
        <a href="${base}pages/comments.html?promptId=${prompt.id}" class="btn btn-outline btn-sm mt-2">View all comments</a>
      </div>
    `;

    const preview = document.getElementById('promptCommentsPreview');
    if (preview && !Number.isNaN(promptIdInt)) {
      fetch(API_BASE + '/comments?prompt_id=' + promptIdInt)
        .then(r => r.ok ? r.json() : [])
        .then(comments => {
          const top3 = (comments || []).slice(0, 3);
          preview.innerHTML = top3.length ? top3.map(c => `
            <div class="comment-item">
              <div class="comment-author">${userChip(c.author_id, c.author_username || 'User', c.avatar_style, c.avatar_seed, base)}</div>
              <div class="comment-body">${escapeHtml(c.content)}</div>
              <div class="comment-meta">${formatDate(c.created_at)}</div>
            </div>
          `).join('') : '<p class="text-muted">No comments yet.</p>';
        })
        .catch(() => { preview.innerHTML = '<p class="text-muted">No comments yet.</p>'; });
    }

    const btnUpvote = document.getElementById('btnUpvote');
    const btnDownvote = document.getElementById('btnDownvote');
    const btnSave = document.getElementById('btnSave');
    const btnFollow = document.getElementById('btnFollow');
    const btnReport = document.getElementById('btnReport');
    const btnCopyPrompt = document.getElementById('btnCopyPrompt');

    async function applyVote(vote) {
      if (!requireLogin('Login required to vote.')) return;
      try {
        if (myVoteValue === vote) {
          // Same vote clicked again — toggle off
          await fetch(API_BASE + '/votes', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userIdInt, prompt_id: promptIdInt })
          });
        } else {
          // New vote or switching direction
          await fetch(API_BASE + '/votes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userIdInt, prompt_id: promptIdInt, value: vote })
          });
        }
      } catch (err) {
        console.error('Vote failed:', err.message);
      }
      window.location.reload();
    }
    if (btnUpvote) btnUpvote.addEventListener('click', () => applyVote(1));
    if (btnDownvote) btnDownvote.addEventListener('click', () => applyVote(-1));

    if (btnSave) btnSave.addEventListener('click', async function () {
      if (!requireLogin('Login required to save.')) return;
      const nowSaved = _savedPromptIds.has(String(prompt.id));
      try {
        await fetch(API_BASE + '/saves', {
          method: nowSaved ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userIdInt, prompt_id: promptIdInt })
        });
        if (nowSaved) _savedPromptIds.delete(String(prompt.id));
        else _savedPromptIds.add(String(prompt.id));
      } catch (err) {
        console.error('Save failed:', err.message);
      }
      const s = _savedPromptIds.has(String(prompt.id));
      this.textContent = s ? '★ Saved' : '☆ Save';
      this.classList.toggle('saved', s);
    });

    let _following = isFollowing;
    if (btnFollow) btnFollow.addEventListener('click', async function () {
      if (!requireLogin('Login required to follow.')) return;
      try {
        await fetch(API_BASE + '/follows', {
          method: _following ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ follower_id: userIdInt, following_id: parseInt(prompt.userId, 10) })
        });
        _following = !_following;
        this.textContent = _following ? 'Following' : 'Follow creator';
      } catch (err) {
        console.error('Follow failed:', err.message);
      }
    });

    if (btnReport) btnReport.addEventListener('click', async function () {
      if (!requireLogin('Login required to report.')) return;
      const reason = window.prompt('Reason for report (e.g. Spam, Inappropriate):') || 'Other';
      try {
        await fetch(API_BASE + '/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reporter_id: userIdInt, prompt_id: promptIdInt, reason })
        });
        alert('Thank you. Your report has been submitted.');
      } catch (err) {
        console.error('Report failed:', err.message);
        alert('Failed to submit report. Please try again.');
      }
    });

    if (btnCopyPrompt) {
      btnCopyPrompt.addEventListener('click', async function () {
        const text = (prompt.title ? 'Title: ' + prompt.title + '\\n\\n' : '') + (prompt.content || '');
        if (!text.trim()) {
          alert('Nothing to copy for this prompt.');
          return;
        }

        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
          alert('Prompt copied to clipboard.');
        } catch (err) {
          console.error('Copy failed:', err && err.message ? err.message : err);
          alert('Could not copy the prompt. Please try again.');
        }
      });
    }

    // Demo-friendly authorization check: show delete button only for the prompt owner or admin.
    // Future work: enforce ownership/admin checks on the backend too.
    const btnDeletePrompt = document.getElementById('btnDeletePrompt');
    if (btnDeletePrompt) {
      btnDeletePrompt.addEventListener('click', async function () {
        if (!confirm('Are you sure you want to delete this prompt?')) return;
        try {
          const res = await fetch(API_BASE + '/prompts/' + promptIdInt, { method: 'DELETE' });
          if (!res.ok) throw new Error('Delete failed with status ' + res.status);

          // Remove from local prompts cache so the listing doesn't show a stale entry.
          const promptIdStr = String(prompt.id);
          const updatedPrompts = (load(STORAGE_KEYS.prompts) || []).filter(p => String(p.id) !== promptIdStr);
          save(STORAGE_KEYS.prompts, updatedPrompts);

          window.location.href = base + 'pages/explore.html';
        } catch (err) {
          console.error('Error deleting prompt:', err.message);
          alert('Delete failed. Please try again.');
        }
      });
    }
  }

  async function initComments() {
    const params = new URLSearchParams(window.location.search);
    const promptId = params.get('promptId');
    const promptIdInt = parseInt(promptId, 10);
    const base = getBase();
    const user = getSessionUser();
    const container = document.getElementById('commentsPageContent');
    const backLink = document.getElementById('backToPrompt');
    if (backLink) backLink.href = base + 'pages/prompt.html?id=' + (promptId || '');

    if (!promptId || Number.isNaN(promptIdInt) || !container) {
      if (container) container.innerHTML = '<p class="msg msg-error">Prompt not found.</p>';
      return;
    }

    // Show title from local cache if available
    const prompts = load(STORAGE_KEYS.prompts) || [];
    const cachedPrompt = prompts.find(p => p.id === promptId);
    const titleEl = document.getElementById('commentsPromptTitle');
    if (titleEl && cachedPrompt) titleEl.textContent = cachedPrompt.title;

    async function renderComments() {
      const listEl = document.getElementById('commentsList');
      if (!listEl) return;
      try {
        const comments = await fetch(API_BASE + '/comments?prompt_id=' + promptIdInt)
          .then(r => r.ok ? r.json() : []);
        listEl.innerHTML = comments.length ? comments.map(c => `
          <div class="comment-item" data-comment-id="${c.id}">
            <div class="comment-author">${userChip(c.author_id, c.author_username || 'User', c.avatar_style, c.avatar_seed, base)}</div>
            <div class="comment-body">${escapeHtml(c.content)}</div>
            <div class="comment-meta">${formatDate(c.created_at)}</div>
            ${user && String(user.id) === String(c.author_id) ? '<div class="comment-actions"><button type="button" class="btn btn-outline btn-sm btn-delete-comment" data-id="' + c.id + '">Delete</button></div>' : ''}
          </div>
        `).join('') : '<p class="text-muted">No comments yet.</p>';
      } catch (_) {
        listEl.innerHTML = '<p class="text-muted">Could not load comments.</p>';
      }
      listEl.querySelectorAll('.btn-delete-comment').forEach(btn => {
        btn.addEventListener('click', async function () {
          const cid = this.getAttribute('data-id');
          try {
            await fetch(API_BASE + '/comments/' + cid, { method: 'DELETE' });
            renderComments();
          } catch (err) {
            console.error('Delete comment failed:', err.message);
          }
        });
      });
    }

    const form = document.getElementById('addCommentForm');
    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!user) { window.location.href = base + 'pages/login.html'; return; }
        const body = (form.body && form.body.value || '').trim();
        if (!body) return;
        try {
          await fetch(API_BASE + '/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt_id: promptIdInt, author_id: parseInt(user.id, 10), content: body })
          });
          form.body.value = '';
          renderComments();
        } catch (err) {
          console.error('Add comment failed:', err.message);
        }
      });
    }

    const addArea = document.getElementById('addCommentArea');
    if (addArea && !user) {
      addArea.innerHTML = '<p class="text-muted"><a href="' + base + 'pages/login.html">Log in</a> to post a comment.</p>';
    }
    renderComments();
  }

  function initCreatePrompt() {
    const loginUrl = getBase() + 'pages/login.html?msg=login_required';
    const user = requireAuth(loginUrl);
    if (!user) return;

    const form = document.getElementById('createPromptForm');
    const msgEl = document.getElementById('createPromptMessage');
    const backendDemoCard = document.getElementById('backendPromptsDemo');
    const backendListEl = document.getElementById('backendPromptsList');
    const aiBadgeEl = document.getElementById('aiValidationResult');
    const base = getBase();
    if (!form) return;

    // --- AI validation state ---
    // Tracks the result of the last completed AI check so the submit handler
    // can block without firing a redundant API call.
    let aiState = {
      checked: false,      // has a check been run for the current content?
      allowed: null,       // null = unknown, true = allowed, false = blocked
      message: '',
      contentChecked: ''   // the content string that was last checked
    };

    /** Render the AI badge in one of four visual states. */
    function showAiBadge(state, message) {
      if (!aiBadgeEl) return;
      const icons = { checking: '⚙', ok: '✅', error: '❌', warn: '⚠️' };
      aiBadgeEl.innerHTML = `
        <div class="ai-badge ai-badge--${state}">
          <span class="ai-badge__icon">${icons[state] || ''}</span>
          <span class="ai-badge__text"><strong>AI Check:</strong> ${escapeHtml(message)}</span>
        </div>`;
    }

    function clearAiBadge() {
      if (aiBadgeEl) aiBadgeEl.innerHTML = '';
    }

    /**
     * Calls POST /api/ai/validate and updates aiState + the badge.
     * Returns true if the prompt is allowed, false if blocked.
     * On any network/API error it fails-open (returns true).
     */
    async function runAiCheck() {
      const title   = (form.title   && form.title.value   || '').trim();
      const desc    = (form.description && form.description.value || '').trim();
      const content = (form.content && form.content.value || '').trim();

      if (!content) {
        clearAiBadge();
        aiState = { checked: false, allowed: null, message: '', contentChecked: '' };
        return true; // nothing to check yet
      }

      // Skip repeat call if content hasn't changed since last check
      if (aiState.checked && aiState.contentChecked === content) {
        return aiState.allowed !== false;
      }

      showAiBadge('checking', 'Validating your prompt…');

      try {
        const res = await fetch(API_BASE + '/ai/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description: desc, content })
        });

        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        aiState = {
          checked: true,
          allowed: data.allowed !== false,
          message: data.message || '',
          contentChecked: content
        };

        if (data.allowed === false) {
          showAiBadge('error', data.message || 'AI flagged this prompt. Please revise it.');
          return false;
        } else if (data.reason === 'error') {
          // AI check failed — fail-open with a neutral notice
          showAiBadge('warn', 'AI check unavailable. You may proceed, but please ensure your prompt is original and valid.');
          return true;
        } else {
          showAiBadge('ok', data.message || 'Prompt looks good!');
          return true;
        }
      } catch (err) {
        console.warn('[AI validate] Check failed:', err.message);
        // Fail-open on network/parse errors
        aiState = { checked: true, allowed: true, message: '', contentChecked: content };
        showAiBadge('warn', 'AI check could not be reached. Proceeding without validation.');
        return true;
      }
    }

    apiFetchJson('/categories')
      .then(function (rows) {
        if (!form.category) return;
        form.category.innerHTML = '<option value="">Choose category</option>';
        (rows || []).forEach(function (cat) {
          const opt = document.createElement('option');
          opt.value = String(cat.id);
          opt.textContent = cat.name;
          form.category.appendChild(opt);
        });
      })
      .catch(function () {
        CATEGORIES.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat;
          opt.textContent = cat;
          if (form.category) form.category.appendChild(opt);
        });
      });
    MODELS.filter(m => m !== 'All').forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      if (form.model) form.model.appendChild(opt);
    });

    const fakeUpload = document.getElementById('fakeUploadBtn');
    if (fakeUpload) {
      fakeUpload.addEventListener('click', function () {
        const fileInput = document.getElementById('thumbnailFile');
        if (fileInput) fileInput.click();
      });
    }

    // Trigger AI check when user finishes typing in the content box
    const contentArea = document.getElementById('content');
    if (contentArea) {
      contentArea.addEventListener('blur', function () {
        const val = (this.value || '').trim();
        if (val.length > 10) runAiCheck(); // only fire on non-trivially-empty input
      });
    }

    async function loadBackendPrompts() {
      if (!backendDemoCard || !backendListEl) return;
      try {
        const res = await fetch(API_BASE + '/prompts');
        if (!res.ok) {
          throw new Error('Failed to load prompts from backend.');
        }
        const prompts = await res.json();
        if (!Array.isArray(prompts) || prompts.length === 0) {
          backendListEl.innerHTML = '<p class="text-muted">No prompts found in database yet.</p>';
          backendDemoCard.style.display = 'block';
          return;
        }
        backendListEl.innerHTML = prompts.slice(0, 10).map(p => {
          const safeTitle = escapeHtml(p.title || '');
          const safeDesc = escapeHtml((p.description || '').slice(0, 120));
          const imgHtml = `<div class="prompt-thumbnail"><img src="${escapeHtmlAttr(getPromptThumbnailSrc(p))}" alt="" onerror='this.onerror=null; this.src="${THUMBNAIL_FALLBACK_SRC}"'></div>`;
          return (
            '<div class="prompt-card simple" data-backend-id="' + p.id + '">' +
              '<div class="prompt-card-main">' +
                imgHtml +
                '<div>' +
                  '<div class="prompt-title">' + safeTitle + '</div>' +
                  (safeDesc ? '<div class="prompt-desc">' + safeDesc + '</div>' : '') +
                '</div>' +
              '</div>' +
            '</div>'
          );
        }).join('');
        backendDemoCard.style.display = 'block';
      } catch (e) {
        // For the beginner-friendly demo we simply keep the card hidden if the backend is not reachable.
        console.error('Error loading backend prompts demo:', e.message);
      }
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (msgEl) { msgEl.style.display = 'none'; msgEl.className = 'msg'; }

      const title = (form.title && form.title.value || '').trim();
      const description = (form.description && form.description.value || '').trim();
      const category = form.category && form.category.value || '';
      const categoryLabel = form.category && form.category.options && form.category.selectedIndex >= 0
        ? form.category.options[form.category.selectedIndex].text
        : category;
      const model = form.model && form.model.value || '';
      const content = (form.content && form.content.value || '').trim();
      const thumbnailFile =
        (form.thumbnailFile && form.thumbnailFile.files && form.thumbnailFile.files[0]) ? form.thumbnailFile.files[0] : null;

      if (thumbnailFile && thumbnailFile.size > 5 * 1024 * 1024) {
        if (msgEl) { msgEl.className = 'msg msg-error'; msgEl.textContent = 'Thumbnail must be under 5 MB.'; msgEl.style.display = 'block'; }
        return;
      }
      if (!title) {
        if (msgEl) { msgEl.className = 'msg msg-error'; msgEl.textContent = 'Title is required.'; msgEl.style.display = 'block'; }
        return;
      }
      if (!description) {
        if (msgEl) { msgEl.className = 'msg msg-error'; msgEl.textContent = 'Description is required.'; msgEl.style.display = 'block'; }
        return;
      }
      if (!category) {
        if (msgEl) { msgEl.className = 'msg msg-error'; msgEl.textContent = 'Please select a category.'; msgEl.style.display = 'block'; }
        return;
      }
      if (!model) {
        if (msgEl) { msgEl.className = 'msg msg-error'; msgEl.textContent = 'Please select an AI model.'; msgEl.style.display = 'block'; }
        return;
      }

      // --- AI validation gate (hard block) ---
      // Always run (or re-use cached) AI check before allowing the POST.
      const aiAllowed = await runAiCheck();
      if (!aiAllowed) {
        // Badge already shows the error; scroll to it so the user sees it.
        if (aiBadgeEl) aiBadgeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (msgEl) {
          msgEl.className = 'msg msg-error';
          msgEl.textContent = 'Your prompt was blocked by the AI validator. Please revise it and try again.';
          msgEl.style.display = 'block';
        }
        return; // hard block — do not proceed
      }

      const tags = (form.tags && form.tags.value || '').trim().split(/[\s,]+/).filter(Boolean);

      const tempPromptId = id();

      // Local demo object so the rest of the existing frontend continues to work as before.
      const newPrompt = {
        id: tempPromptId,
        userId: user.id,
        title,
        description,
        category: categoryLabel,
        model,
        content: content || '',
        tags,
        createdAt: new Date().toISOString(),
        removed: false
      };

      // Insert into localStorage (existing behavior, kept for compatibility).
      const prompts = load(STORAGE_KEYS.prompts) || [];
      prompts.push(newPrompt);
      save(STORAGE_KEYS.prompts, prompts);

      try {
        // Multipart/form-data for image upload.
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('content', content || '');
        formData.append('model', model || 'ChatGPT');
        formData.append('author_id', String(parseInt(user.id, 10) || 1));
        if (/^\d+$/.test(category)) {
          formData.append('category_id', category);
        }
        if (tags.length) {
          formData.append('tags', tags.join(','));
        }
        if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

        const res = await fetch(API_BASE + '/prompts', { method: 'POST', body: formData });

        if (!res.ok) {
          throw new Error('Backend returned ' + res.status);
        }

        const created = await res.json();
        // Update localStorage id to the MySQL id so other features (like thumbnail serving) work.
        const updatedPrompts = (load(STORAGE_KEYS.prompts) || []).map(p => {
          if (p.id !== tempPromptId) return p;
          const url =
            created.thumbnail_url != null && String(created.thumbnail_url).trim() !== ''
              ? String(created.thumbnail_url).trim()
              : null;
          return { ...p, id: String(created.id), thumbnail_url: url };
        });
        save(STORAGE_KEYS.prompts, updatedPrompts);

        if (msgEl) {
          msgEl.className = 'msg msg-success';
          msgEl.textContent = 'Prompt created successfully and stored in the database.';
          msgEl.style.display = 'block';
        }

        // Refresh the small backend demo list so you can see the new prompt.
        await loadBackendPrompts();
      } catch (err) {
        console.error('Error creating prompt via backend:', err.message);
        if (msgEl) {
          msgEl.className = 'msg msg-error';
          msgEl.textContent = 'Prompt saved locally, but there was a problem saving to the database.';
          msgEl.style.display = 'block';
        }
      }

      // For now, keep the user on the create page so the demo list is visible.
      // If you prefer the old behavior, you can redirect to the prompt detail page here.
      // window.location.href = base + 'pages/prompt.html?id=' + newPrompt.id;
    });

    // Try to show existing backend prompts for the demo on page load.
    loadBackendPrompts();
  }

  function initProfile() {
    const user = requireAuth();
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const profileUserId = String(params.get('user') || user.id);
    const base = getBase();
    const isOwn = String(user.id) === profileUserId;

    const profileNameElEarly = document.getElementById('profileUsername');
    const profileStatsElEarly = document.getElementById('profileStats');
    if (profileNameElEarly) profileNameElEarly.textContent = 'Loading…';
    if (profileStatsElEarly) profileStatsElEarly.textContent = '';

    resolveProfileUser(profileUserId).then(async function (profileUser) {
      const container = document.getElementById('profileContent');
      if (!profileUser) {
        if (container) container.innerHTML = '<p class="msg msg-error">User not found.</p>';
        return;
      }

      // Fetch all profile data from API in parallel (use profileUserId, not logged-in user.id)
      let prompts = [];
      let followerCount = 0;
      let followingCount = 0;
      let votes = [];
      let saves = [];
      let myComments = [];
      try {
        const [followData, allPromptsRaw, votesRaw, savesRaw, commentsRaw] = await Promise.all([
          fetch(API_BASE + '/follows?user_id=' + profileUserId).then(r => r.ok ? r.json() : { followers: [], following: [] }),
          apiFetchJson('/prompts').catch(() => []),
          fetch(API_BASE + '/votes?user_id=' + profileUserId).then(r => r.ok ? r.json() : []),
          fetch(API_BASE + '/saves?user_id=' + profileUserId).then(r => r.ok ? r.json() : []),
          fetch(API_BASE + '/comments?author_id=' + profileUserId).then(r => r.ok ? r.json() : []),
        ]);
        followerCount = (followData.followers || []).length;
        followingCount = (followData.following || []).length;
        prompts = (allPromptsRaw || []).map(mapBackendPromptToLocal);
        save(STORAGE_KEYS.prompts, prompts);
        votes = votesRaw || [];
        saves = savesRaw || [];
        myComments = commentsRaw || [];
      } catch (_) {}

      if (!container) return;

      const postsContainer = document.getElementById('profilePosts');
      const commentsContainer = document.getElementById('profileComments');
      const savedContainer = document.getElementById('profileSaved');
      const upvotedContainer = document.getElementById('profileUpvoted');
      const downvotedContainer = document.getElementById('profileDownvoted');

      const profileNameEl = document.getElementById('profileUsername');
      const profileStatsEl = document.getElementById('profileStats');
      if (profileNameEl) profileNameEl.textContent = profileUser.username || profileUser.fullName;
      if (profileStatsEl) profileStatsEl.textContent = `${followerCount} followers · ${followingCount} following`;

      const myPrompts = prompts.filter(p => String(p.userId) === String(profileUserId));
      const promptsById = {};
      prompts.forEach(p => { promptsById[String(p.id)] = p; });
      const mySaved = saves.map(s => promptsById[String(s.prompt_id)]).filter(Boolean);
      const myUpvoted = votes.filter(v => v.value === 1).map(v => promptsById[String(v.prompt_id)]).filter(Boolean);
      const myDownvoted = votes.filter(v => v.value === -1).map(v => promptsById[String(v.prompt_id)]).filter(Boolean);

      function renderPromptList(arr, el) {
        if (!el) return;
        const usersMap = {};
        (load(STORAGE_KEYS.users) || []).forEach(u => { usersMap[String(u.id)] = u; });
        usersMap[profileUserId] = profileUser;
        el.innerHTML = arr.length ? arr.map(p => `
        <div class="prompt-card" data-prompt-id="${p.id}">
          <div class="prompt-title">${escapeHtml(p.title)}</div>
          <div class="prompt-creator">${escapeHtml((usersMap[String(p.userId)] && usersMap[String(p.userId)].username) || '')}</div>
          <div class="prompt-desc">${escapeHtml((p.description || '').slice(0, 80))}...</div>
          <div class="prompt-stats"><span class="stat-chip">↑ ${p.upvotes || 0}</span> <span class="stat-chip">💬 ${p.commentCount || 0}</span></div>
        </div>
      `).join('') : '<p class="text-muted">Nothing here yet.</p>';
        el.querySelectorAll('.prompt-card').forEach(card => {
          card.addEventListener('click', () => { window.location.href = base + 'pages/prompt.html?id=' + card.getAttribute('data-prompt-id'); });
        });
      }

      function renderCommentList(arr, el) {
        if (!el) return;
        const usersMap = {};
        const promptsMap = {};
        (load(STORAGE_KEYS.users) || []).forEach(u => { usersMap[String(u.id)] = u; });
        usersMap[profileUserId] = profileUser;
        prompts.forEach(p => { promptsMap[p.id] = p; });
        el.innerHTML = arr.length ? arr.map(c => `
        <div class="comment-item">
          <div class="comment-author">on "${escapeHtml((promptsMap[c.prompt_id] && promptsMap[c.prompt_id].title) || '')}"</div>
          <div class="comment-body">${escapeHtml(c.content)}</div>
          <div class="comment-meta">${formatDate(c.created_at)}</div>
          <a href="${base}pages/prompt.html?id=${c.prompt_id}" class="btn btn-outline btn-sm mt-1">View prompt</a>
        </div>
      `).join('') : '<p class="text-muted">No comments yet.</p>';
      }

      const tabs = document.querySelectorAll('.tab[data-tab]');
      function showTab(name) {
        [postsContainer, commentsContainer, savedContainer, upvotedContainer, downvotedContainer].forEach((el, i) => {
          if (!el) return;
          const names = ['posts', 'comments', 'saved', 'upvoted', 'downvoted'];
          el.style.display = names[i] === name ? 'block' : 'none';
        });
        tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === name));
      }
      tabs.forEach(t => {
        t.addEventListener('click', () => showTab(t.getAttribute('data-tab')));
      });

      renderPromptList(myPrompts, postsContainer);
      renderCommentList(myComments, commentsContainer);
      renderPromptList(mySaved, savedContainer);
      renderPromptList(myUpvoted, upvotedContainer);
      renderPromptList(myDownvoted, downvotedContainer);

      // --- Avatar & Achievements ---
      // Use pre-computed counts from the enriched prompt objects
      const totalUpvotes  = myPrompts.reduce((sum, p) => sum + (p.upvotes || 0), 0);
      const receivedSaves = myPrompts.reduce((sum, p) => sum + (p.saveCount || 0), 0);
      const avatarStats   = { promptCount: myPrompts.length, totalUpvotes, commentCount: myComments.length, saveCount: receivedSaves };
      const unlockedIds = ACHIEVEMENTS_DEF.filter(a => a.check(avatarStats)).map(a => a.id);

      const avatarEl       = document.getElementById('avatarDisplay');
      const customizerEl   = document.getElementById('avatarCustomizer');
      const achievementsEl = document.getElementById('achievementsList');
      function rerenderAvatar() {
        if (!avatarEl) return;
        const username = profileUser.username || 'user';
        avatarEl.innerHTML = `<img src="${dicebearUrl(username, profileUser.avatar_style, profileUser.avatar_seed)}" class="avatar-svg" alt="${username}'s avatar" />`;
      }

      function rerenderAchievements() {
        if (achievementsEl) achievementsEl.innerHTML = buildAchievementsBadges(ACHIEVEMENTS_DEF, unlockedIds);
      }

      rerenderAvatar();
      rerenderAchievements();

      if (isOwn && customizerEl) {
        const currentStyle = profileUser.avatar_style || 'adventurer';
        const currentSeed  = profileUser.avatar_seed  || (profileUser.username || 'user');
        customizerEl.innerHTML = `
          <div class="avatar-controls">
            <div class="avatar-style-mini" id="avatarStyleMini">
              ${AVATAR_STYLES.map(s => `
                <button type="button" class="style-mini-btn${s.id === currentStyle ? ' active' : ''}" data-style="${s.id}" title="${s.label}">
                  <img src="${dicebearUrl(currentSeed, s.id, currentSeed)}" alt="${s.label}" />
                </button>
              `).join('')}
            </div>
            <div class="avatar-seed-row">
              <button type="button" class="btn btn-outline btn-sm" id="randomizeAvatarBtn">🎲 Randomize</button>
              <button type="button" class="btn btn-primary btn-sm" id="saveAvatarBtn">Save</button>
            </div>
          </div>
        `;

        let liveStyle = currentStyle;
        let liveSeed  = currentSeed;

        const miniPicker = customizerEl.querySelector('#avatarStyleMini');
        miniPicker.addEventListener('click', e => {
          const btn = e.target.closest('[data-style]');
          if (!btn) return;
          liveStyle = btn.dataset.style;
          miniPicker.querySelectorAll('.style-mini-btn').forEach(b => b.classList.toggle('active', b.dataset.style === liveStyle));
          if (avatarEl) avatarEl.innerHTML = `<img src="${dicebearUrl(liveSeed, liveStyle, liveSeed)}" class="avatar-svg" alt="avatar" />`;
        });

        customizerEl.querySelector('#randomizeAvatarBtn').addEventListener('click', () => {
          liveSeed = AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)] + Math.floor(Math.random() * 999);
          if (avatarEl) avatarEl.innerHTML = `<img src="${dicebearUrl(liveSeed, liveStyle, liveSeed)}" class="avatar-svg" alt="avatar" />`;
          miniPicker.querySelectorAll('.style-mini-btn img').forEach(img => {
            const s = img.closest('[data-style]').dataset.style;
            img.src = dicebearUrl(liveSeed, s, liveSeed);
          });
        });

        customizerEl.querySelector('#saveAvatarBtn').addEventListener('click', () => {
          fetch(`${API_BASE}/users/${profileUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar_style: liveStyle, avatar_seed: liveSeed })
          }).then(r => r.json()).then(updated => {
            if (updated.error) { alert(updated.error); return; }
            profileUser.avatar_style = updated.avatar_style;
            profileUser.avatar_seed  = updated.avatar_seed;
            const session = getSessionUser();
            if (session && String(session.id) === String(profileUser.id)) {
              setSessionUser({ ...session, avatar_style: updated.avatar_style, avatar_seed: updated.avatar_seed });
              // Update navbar avatar img without a full re-render
              const navAvatarImg = document.getElementById('avatarBtn');
              if (navAvatarImg) navAvatarImg.src = dicebearUrl(updated.username || session.username, updated.avatar_style, updated.avatar_seed);
            }
          }).catch(() => alert('Failed to save avatar.'));
        });
      }

      showTab('posts');
    }).catch(function (err) {
      console.error('initProfile:', err);
      const container = document.getElementById('profileContent');
      if (container) container.innerHTML = '<p class="msg msg-error">Could not load profile.</p>';
    });
  }

  function initSettings() {
    const user = requireAuth();
    if (!user) return;
    const fullUser = getUserById(user.id);
    const base = getBase();
    const form = document.getElementById('settingsForm');
    const deleteBtn = document.getElementById('deleteAccountBtn');
    const modal = document.getElementById('deleteConfirmModal');
    const modalCancel = document.getElementById('modalCancel');
    const modalConfirm = document.getElementById('modalConfirm');

    if (!fullUser || !form) return;
    if (form.fullName) form.fullName.value = fullUser.fullName || '';
    if (form.email) form.email.value = fullUser.email || '';
    if (form.username) form.username.value = fullUser.username || '';

    const stylePicker = document.getElementById('avatarStylePicker');
    const styleInput  = document.getElementById('avatarStyle');
    const currentStyle = fullUser.avatar_style || 'adventurer';
    if (styleInput) styleInput.value = currentStyle;
    if (stylePicker) {
      stylePicker.innerHTML = AVATAR_STYLES.map(s => `
        <button type="button" class="style-option${s.id === currentStyle ? ' active' : ''}" data-style="${s.id}" title="${s.label}">
          <img src="${dicebearUrl(fullUser.username || 'user', s.id)}" alt="${s.label}" />
          <span>${s.label}</span>
        </button>
      `).join('');
      stylePicker.addEventListener('click', e => {
        const btn = e.target.closest('[data-style]');
        if (!btn) return;
        stylePicker.querySelectorAll('.style-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (styleInput) styleInput.value = btn.dataset.style;
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const fullName    = (form.fullName && form.fullName.value || '').trim();
      const email       = (form.email && form.email.value || '').trim();
      const username    = (form.username && form.username.value || '').trim();
      const avatar_style = styleInput ? styleInput.value : 'adventurer';
      if (!fullName || !email || !username) { alert('Please fill required fields.'); return; }
      if (!validateEmail(email)) { alert('Invalid email.'); return; }

      fetch(`${API_BASE}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, avatar_style })
      })
        .then(r => r.json())
        .then(updated => {
          if (updated.error) { alert(updated.error); return; }
          setSessionUser({ ...user, fullName, email, username, avatar_style: updated.avatar_style });
          alert('Profile updated.');
        })
        .catch(() => alert('Failed to save. Please try again.'));
    });

    const pwForm = document.getElementById('changePasswordForm');
    if (pwForm) {
      pwForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const current = pwForm.currentPassword && pwForm.currentPassword.value || '';
        const newPw = pwForm.newPassword && pwForm.newPassword.value || '';
        const verify = pwForm.verifyPassword && pwForm.verifyPassword.value || '';
        if (fullUser.password !== current) { alert('Current password is incorrect.'); return; }
        if (!validatePassword(newPw)) { alert(getPasswordErrorText(newPw)); return; }
        if (newPw !== verify) { alert('New passwords do not match.'); return; }
        fullUser.password = newPw;
        const users = load(STORAGE_KEYS.users) || [];
        const idx = users.findIndex(u => u.id === fullUser.id);
        if (idx >= 0) users[idx] = fullUser;
        save(STORAGE_KEYS.users, users);
        alert('Password updated.');
        pwForm.reset();
      });
    }

    if (deleteBtn && modal) {
      deleteBtn.addEventListener('click', () => modal.classList.remove('hidden'));
      if (modalCancel) modalCancel.addEventListener('click', () => modal.classList.add('hidden'));
      if (modalConfirm) modalConfirm.addEventListener('click', () => {
        const users = load(STORAGE_KEYS.users) || [];
        const updated = users.filter(u => u.id !== user.id);
        save(STORAGE_KEYS.users, updated);
        logout();
        window.location.href = base + 'index.html';
      });
    }
  }

  function initModeration() {
    const admin = requireAdmin();
    const base = getBase();
    const container = document.getElementById('moderationContent');
    if (!container) return;
    if (admin === false) {
      container.innerHTML = `
        <div class="card access-denied">
          <h2>Access denied</h2>
          <p>You do not have permission to view this page.</p>
          <a href="${base}pages/explore.html" class="btn btn-primary">Go to Explore</a>
        </div>
      `;
      return;
    }
    if (!admin) return;

    async function render() {
      let reports = [];
      try {
        reports = await fetch(API_BASE + '/reports').then(r => r.ok ? r.json() : []);
      } catch (_) {}

      container.innerHTML = `
        <h1 class="h2 mb-3">Moderation</h1>
        <div class="card">
          <table class="report-table">
            <thead>
              <tr><th>Prompt</th><th>Reported by</th><th>Reason</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${reports.length ? reports.map(r => `
                <tr data-report-id="${r.id}" data-prompt-id="${r.prompt_id || ''}" data-prompt-title="${escapeHtmlAttr(r.prompt_title || '')}">
                  <td>${r.prompt_id ? `<a href="${base}pages/prompt.html?id=${r.prompt_id}">${escapeHtml(r.prompt_title || '')}</a>` : escapeHtml(r.reported_username || '')}</td>
                  <td>${escapeHtml(r.reporter_username || '')}</td>
                  <td>${escapeHtml(r.reason)}</td>
                  <td>${formatDate(r.created_at)}</td>
                  <td class="actions">
                    ${r.prompt_id ? '<button type="button" class="btn btn-danger btn-sm btn-remove-prompt">Remove prompt</button>' : ''}
                    <button type="button" class="btn btn-outline btn-sm btn-dismiss-report" data-id="${r.id}">Dismiss</button>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="5">No reports.</td></tr>'}
            </tbody>
          </table>
        </div>
      `;

      container.querySelectorAll('.btn-remove-prompt').forEach(btn => {
        btn.addEventListener('click', async function () {
          const row = this.closest('tr');
          const promptId = parseInt(row.getAttribute('data-prompt-id'), 10);
          if (!Number.isNaN(promptId)) {
            try {
              await fetch(API_BASE + '/prompts/' + promptId, { method: 'DELETE' });
              // Clean local cache
              const cached = load(STORAGE_KEYS.prompts) || [];
              save(STORAGE_KEYS.prompts, cached.filter(p => String(p.id) !== String(promptId)));
            } catch (err) {
              console.error('Remove prompt failed:', err.message);
            }
          }
          render();
        });
      });
      container.querySelectorAll('.btn-dismiss-report').forEach(btn => {
        btn.addEventListener('click', async function () {
          const rid = this.getAttribute('data-id');
          try {
            await fetch(API_BASE + '/reports/' + rid, { method: 'DELETE' });
          } catch (err) {
            console.error('Dismiss report failed:', err.message);
          }
          render();
        });
      });
    }
    render();
  }

  // --- 5) Startup ---
  function init() {
    seedDemoDataIfEmpty();
    renderNavbar();
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path.endsWith('/')) initIndex();
    else if (path.includes('login.html')) initLogin();
    else if (path.includes('register.html')) initRegister();
    else if (path.includes('forgotpassword.html')) initForgotPassword();
    else if (path.includes('resetpassword.html')) initResetPassword();
    else if (path.includes('explore.html')) initExplore();
    else if (path.includes('prompt.html') && !path.includes('postcreation')) initPrompt();
    else if (path.includes('comments.html')) initComments();
    else if (path.includes('postcreation.html')) initCreatePrompt();
    else if (path.includes('profile.html')) initProfile();
    else if (path.includes('accountsettings.html')) initSettings();
    else if (path.includes('moderation.html')) initModeration();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
