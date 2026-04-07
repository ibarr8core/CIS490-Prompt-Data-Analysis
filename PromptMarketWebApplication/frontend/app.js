/* Prompt Marketplace - App.js */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    sessionUser: 'sessionUser',
    users: 'users',
    prompts: 'prompts',
    comments: 'comments',
    votes: 'votes',
    saves: 'saves',
    follows: 'follows',
    reports: 'reports',
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

  const SKIN_TONES = [
    { hex: '#FDDBB4', label: 'Light' },
    { hex: '#F1C27D', label: 'Medium Light' },
    { hex: '#E0AC69', label: 'Medium' },
    { hex: '#C68642', label: 'Medium Dark' },
    { hex: '#8D5524', label: 'Dark' },
    { hex: '#4B2E1A', label: 'Deep' }
  ];

  const EYE_COLORS = [
    { hex: '#3a2800', label: 'Brown' },
    { hex: '#1a5fa8', label: 'Blue' },
    { hex: '#2d6a2d', label: 'Green' },
    { hex: '#5a5a5a', label: 'Grey' },
    { hex: '#8b6914', label: 'Hazel' },
    { hex: '#cc4400', label: 'Amber' }
  ];

  const SHIRT_COLORS = [
    { hex: '#9E9E9E', label: 'Grey' },
    { hex: '#E8E8E8', label: 'White' },
    { hex: '#2a2a2a', label: 'Black' },
    { hex: '#1a3a6b', label: 'Navy' },
    { hex: '#8B0000', label: 'Red' },
    { hex: '#1a5c1a', label: 'Green' }
  ];

  const ACHIEVEMENTS_DEF = [
    { id: 'free_beanie',   name: 'Starter Beanie',   desc: 'Free for all users!',              cosmetic: 'beanie',   slot: 'head', cosmeticName: 'Starter Beanie',  icon: '&#129296;', check: () => true                  },
    { id: 'free_glasses',  name: 'Round Glasses',    desc: 'Free for all users!',              cosmetic: 'glasses',  slot: 'face', cosmeticName: 'Round Glasses',   icon: '&#128083;', check: () => true                  },
    { id: 'first_prompt',  name: 'First Post',       desc: 'Post your first prompt',           cosmetic: 'cap',      slot: 'head', cosmeticName: 'Starter Cap',     icon: '&#127913;', check: s => s.promptCount >= 1     },
    { id: 'first_comment', name: 'Conversationalist',desc: 'Leave your first comment',         cosmetic: 'bg_emoji', slot: 'bg',   cosmeticName: 'Emoji Rain',      icon: '&#128172;', check: s => s.commentCount >= 1    },
    { id: 'five_prompts',  name: 'Getting Started',  desc: '5 prompts posted',                 cosmetic: 'shades',   slot: 'face', cosmeticName: 'Cool Shades',     icon: '&#128374;', check: s => s.promptCount >= 5     },
    { id: 'first_save',    name: 'Trendsetter',      desc: 'Get a prompt saved by someone',    cosmetic: 'bg_stars', slot: 'bg',   cosmeticName: 'Star Field',      icon: '&#11088;',  check: s => s.saveCount >= 1       },
    { id: 'ten_prompts',   name: 'Regular Creator',  desc: '10 prompts posted',                cosmetic: 'hoodie',   slot: 'body', cosmeticName: 'Creator Hoodie',  icon: '&#129405;', check: s => s.promptCount >= 10    },
    { id: 'top_creator',   name: 'Top Creator',      desc: '25+ upvotes earned',               cosmetic: 'crown',    slot: 'head', cosmeticName: 'Gold Crown',      icon: '&#128081;', check: s => s.totalUpvotes >= 25   }
  ];

  // Shared inline placeholder (avoids dependency on local image assets).
  const THUMBNAIL_FALLBACK_SRC =
    'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22320%22%20height%3D%22160%22%20viewBox%3D%220%200%20320%20160%22%3E%3Crect%20width%3D%22320%22%20height%3D%22160%22%20fill%3D%22%23e5e7eb%22/%3E%3Cpath%20d%3D%22M0%20120%20L80%2060%20L160%20110%20L240%2070%20L320%20120%20L320%20160%20L0%20160%20Z%22%20fill%3D%22%23cbd5e1%22/%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20font-size%3D%2214%22%20fill%3D%22%239197a3%22%3ENo%20image%3C/text%3E%3C/svg%3E';

  // --- 1) Helpers ---
  function load(key) {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : (key === STORAGE_KEYS.users || key === STORAGE_KEYS.prompts || key === STORAGE_KEYS.comments || key === STORAGE_KEYS.votes || key === STORAGE_KEYS.saves || key === STORAGE_KEYS.follows || key === STORAGE_KEYS.reports ? [] : null);
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

  function mapBackendPromptToLocal(prompt) {
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
      creatorName: prompt.author_username || 'Unknown'
    };
  }

  // --- Avatar helpers ---
  function shadeHex(hex, amt) {
    const c = v => Math.min(255, Math.max(0, Math.round(v)));
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return '#' + [r, g, b].map(v => c(v + amt).toString(16).padStart(2, '0')).join('');
  }

  function buildAvatarSVG(gender, skin, cosmetics, eyeColor, shirtColor) {
    eyeColor   = eyeColor   || '#3a2800';
    shirtColor = shirtColor || '#9E9E9E';

    const sl  = shadeHex(skin,  25);
    const sm  = shadeHex(skin,  10);
    const sd  = shadeHex(skin, -20);
    const sdd = shadeHex(skin, -40);
    const lipFill = '#d4848a';
    const lipLine = '#a85a60';

    const bodyPath = gender === 'f'
      ? 'M 40,170 L 55,155 L 75,146 L 88,140 L 88,150 L 112,150 L 112,140 L 125,146 L 145,155 L 160,170 L 160,280 L 40,280 Z'
      : 'M 28,170 L 45,152 L 68,143 L 88,138 L 88,150 L 112,150 L 112,138 L 132,143 L 155,152 L 172,170 L 172,280 L 28,280 Z';
    const bodyShadowPath = gender === 'f'
      ? 'M 40,170 L 55,155 L 75,146 L 88,140 L 88,280 L 40,280 Z'
      : 'M 28,170 L 45,152 L 68,143 L 88,138 L 88,280 L 28,280 Z';

    const bodyFill   = cosmetics.includes('hoodie') ? '#16213e' : shirtColor;
    const bodyShadow = cosmetics.includes('hoodie') ? '#0f3460' : shadeHex(shirtColor, -25);

    const beanieSVG = cosmetics.includes('beanie') ? `
      <g style="shape-rendering:crispEdges">
        <rect x="64" y="45" width="72" height="24" rx="10" fill="#CC5500"/>
        <rect x="68" y="36" width="64" height="17" rx="8"  fill="#CC5500"/>
        <rect x="75" y="29" width="50" height="13" rx="7"  fill="#CC5500"/>
        <rect x="64" y="57" width="72" height="10" rx="2"  fill="#A34400"/>
        <line x1="82"  y1="45" x2="82"  y2="60" stroke="#A34400" stroke-width="1.5" opacity="0.5"/>
        <line x1="93"  y1="41" x2="93"  y2="60" stroke="#A34400" stroke-width="1.5" opacity="0.5"/>
        <line x1="100" y1="39" x2="100" y2="60" stroke="#A34400" stroke-width="1.5" opacity="0.5"/>
        <line x1="107" y1="41" x2="107" y2="60" stroke="#A34400" stroke-width="1.5" opacity="0.5"/>
        <line x1="118" y1="45" x2="118" y2="60" stroke="#A34400" stroke-width="1.5" opacity="0.5"/>
      </g>` : '';

    const capSVG = cosmetics.includes('cap') ? `
      <g style="shape-rendering:crispEdges">
        <rect x="76" y="16" width="48" height="10" fill="#16213e"/>
        <rect x="70" y="26" width="60" height="10" fill="#16213e"/>
        <rect x="64" y="36" width="72" height="10" fill="#16213e"/>
        <rect x="62" y="46" width="76" height="16" fill="#1a1a2e"/>
        <rect x="50" y="62" width="100" height="10" fill="#0f3460"/>
        <rect x="98" y="22" width="4" height="4" fill="#00d4aa"/>
        <rect x="94" y="26" width="4" height="4" fill="#00d4aa"/>
        <rect x="102" y="26" width="4" height="4" fill="#00d4aa"/>
        <rect x="98" y="30" width="4" height="4" fill="#00d4aa"/>
      </g>` : '';

    const crownSVG = cosmetics.includes('crown') ? `
      <g style="shape-rendering:crispEdges">
        <rect x="64"  y="32" width="72" height="10" fill="#FFD700"/>
        <rect x="64"  y="22" width="12" height="10" fill="#FFD700"/>
        <rect x="67"  y="14" width="6"  height="8"  fill="#FFD700"/>
        <rect x="94"  y="18" width="12" height="14" fill="#FFD700"/>
        <rect x="97"  y="10" width="6"  height="8"  fill="#FFD700"/>
        <rect x="124" y="22" width="12" height="10" fill="#FFD700"/>
        <rect x="127" y="14" width="6"  height="8"  fill="#FFD700"/>
        <rect x="66"  y="34" width="6"  height="6"  fill="#FF4081"/>
        <rect x="97"  y="34" width="6"  height="6"  fill="#00BCD4"/>
        <rect x="128" y="34" width="6"  height="6"  fill="#FF4081"/>
      </g>` : '';

    const glassesSVG = cosmetics.includes('glasses') ? `
      <g style="shape-rendering:crispEdges">
        <circle cx="83"  cy="91" r="13" fill="none" stroke="#1a1a1a" stroke-width="3"/>
        <circle cx="117" cy="91" r="13" fill="none" stroke="#1a1a1a" stroke-width="3"/>
        <rect x="96"  y="88" width="8"  height="3" fill="#1a1a1a" rx="1"/>
        <rect x="52"  y="88" width="18" height="3" fill="#1a1a1a" rx="1"/>
        <rect x="130" y="88" width="18" height="3" fill="#1a1a1a" rx="1"/>
      </g>` : '';

    const shadesSVG = cosmetics.includes('shades') ? `
      <g>
        <ellipse cx="83"  cy="91" rx="20" ry="12" fill="#1a1a2e" stroke="#f0f0f0" stroke-width="3"/>
        <ellipse cx="117" cy="91" rx="20" ry="12" fill="#1a1a2e" stroke="#f0f0f0" stroke-width="3"/>
        <rect x="103" y="88" width="14" height="5" fill="#f0f0f0"/>
        <rect x="56"  y="88" width="8"  height="4" fill="#f0f0f0"/>
        <rect x="136" y="88" width="8"  height="4" fill="#f0f0f0"/>
      </g>` : '';

    const hoodieSVG = cosmetics.includes('hoodie') ? `
      <g>
        <path d="M 82,132 Q 100,150 118,132 Q 112,152 100,156 Q 88,152 82,132 Z" fill="#0f3460"/>
        <line x1="96"  y1="156" x2="91"  y2="192" stroke="#0d2347" stroke-width="2.5"/>
        <line x1="104" y1="156" x2="109" y2="192" stroke="#0d2347" stroke-width="2.5"/>
        <rect x="74" y="198" width="52" height="28" rx="4" fill="#0f3460"/>
      </g>` : '';

    return `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" class="avatar-svg">
      <path d="${bodyPath}" fill="${bodyFill}"/>
      <path d="${bodyShadowPath}" fill="${bodyShadow}" opacity="0.4"/>
      <rect x="88" y="132" width="24" height="18" fill="${sm}"/>
      <polygon points="100,38 133,52 100,90"   fill="${sl}"/>
      <polygon points="67,52 100,38 100,90"    fill="${sm}"/>
      <polygon points="133,52 148,82 100,90"   fill="${sm}"/>
      <polygon points="52,82 67,52 100,90"     fill="${sd}"/>
      <polygon points="148,82 143,115 100,90"  fill="${sm}"/>
      <polygon points="57,115 52,82 100,90"    fill="${sd}"/>
      <polygon points="143,115 125,132 100,90" fill="${sd}"/>
      <polygon points="75,132 57,115 100,90"   fill="${sdd}"/>
      <polygon points="125,132 100,136 100,90" fill="${sdd}"/>
      <polygon points="100,136 75,132 100,90"  fill="${sdd}"/>
      <polygon points="148,82 156,90 153,108 143,115" fill="${sd}"/>
      <rect x="73"  y="78" width="20" height="3" rx="1.5" fill="${sdd}" opacity="0.65"/>
      <rect x="107" y="78" width="20" height="3" rx="1.5" fill="${sdd}" opacity="0.65"/>
      <ellipse cx="83"  cy="91" rx="10" ry="7" fill="white"/>
      <ellipse cx="117" cy="91" rx="10" ry="7" fill="white"/>
      <ellipse cx="83"  cy="91" rx="6.5" ry="5" fill="${eyeColor}"/>
      <ellipse cx="117" cy="91" rx="6.5" ry="5" fill="${eyeColor}"/>
      <circle cx="83"  cy="91" r="2.5" fill="#111"/>
      <circle cx="117" cy="91" r="2.5" fill="#111"/>
      <circle cx="85"  cy="89" r="1.5" fill="white" opacity="0.9"/>
      <circle cx="119" cy="89" r="1.5" fill="white" opacity="0.9"/>
      <polygon points="100,102 96,114 104,114" fill="${sd}" opacity="0.3"/>
      ${gender === 'f'
        ? `<path d="M 89,122 Q 94,116 100,120 Q 106,116 111,122 Q 100,134 89,122 Z" fill="${lipFill}"/>
           <path d="M 89,122 Q 94,116 100,120 Q 106,116 111,122" fill="none" stroke="${lipLine}" stroke-width="1.5"/>`
        : `<path d="M 92,122 Q 96,119 100,121 Q 104,119 108,122 Q 100,130 92,122 Z" fill="${lipFill}"/>
           <path d="M 92,122 Q 96,119 100,121 Q 104,119 108,122" fill="none" stroke="${lipLine}" stroke-width="1.5"/>`}
      ${hoodieSVG}
      ${beanieSVG}
      ${capSVG}
      ${crownSVG}
      ${glassesSVG}
      ${shadesSVG}
    </svg>`;
  }

  function buildAvatarCustomizer(gender, skin, eyeColor, shirtColor) {
    const mkSwatches = (items, activeVal, attr) =>
      items.map(t => `<button class="skin-swatch${t.hex === activeVal ? ' active' : ''}" ${attr}="${t.hex}" style="background:${t.hex}" title="${t.label}" aria-label="${t.label}"></button>`).join('');

    return `<div class="avatar-customizer">
      <div class="customizer-section">
        <span class="customizer-label">Body</span>
        <div class="avatar-gender-toggle">
          <button class="gender-btn${gender === 'm' ? ' active' : ''}" data-gender="m">&#9794; Male</button>
          <button class="gender-btn${gender === 'f' ? ' active' : ''}" data-gender="f">&#9792; Female</button>
        </div>
      </div>
      <div class="customizer-section">
        <span class="customizer-label">Skin</span>
        <div class="avatar-skin-swatches">${mkSwatches(SKIN_TONES, skin, 'data-skin')}</div>
      </div>
      <div class="customizer-section">
        <span class="customizer-label">Eyes</span>
        <div class="avatar-skin-swatches">${mkSwatches(EYE_COLORS, eyeColor, 'data-eye-color')}</div>
      </div>
      <div class="customizer-section">
        <span class="customizer-label">Shirt</span>
        <div class="avatar-skin-swatches">${mkSwatches(SHIRT_COLORS, shirtColor, 'data-shirt-color')}</div>
      </div>
    </div>`;
  }

  function buildAchievementsList(defs, unlockedIds, isOwn, equippedBySlot) {
    equippedBySlot = equippedBySlot || {};
    return defs.map(a => {
      const on = unlockedIds.includes(a.id);
      const equipped = equippedBySlot[a.slot] === a.cosmetic;
      const equipBtn = (on && isOwn)
        ? `<button class="equip-btn${equipped ? ' equipped' : ''}" data-equip="${a.cosmetic}" data-slot="${a.slot}">${equipped ? 'On' : 'Equip'}</button>`
        : '';
      return `<div class="achievement-item ${on ? 'unlocked' : 'locked'}">
        <span class="badge${on ? '' : ' badge-locked'}">${on ? a.icon : '&#128274;'}</span>
        <div class="achievement-info">
          <div class="achievement-name">${a.name}</div>
          <div class="achievement-cosmetic">${on ? a.cosmeticName : '???'}</div>
          ${!on ? `<div class="achievement-desc">${a.desc}</div>` : ''}
        </div>
        ${equipBtn}
      </div>`;
    }).join('');
  }

  function updateAvatarSettings(userId, updates) {
    const users = load(STORAGE_KEYS.users) || [];
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return;
    Object.assign(users[idx], updates);
    save(STORAGE_KEYS.users, users);
    const session = getSessionUser();
    if (session && session.id === userId) setSessionUser(Object.assign({}, session, updates));
  }

  function startBgAnimation(canvas, type) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    let stopped = false, animId = null;

    if (type === 'bg_emoji') {
      const pool = ['✨','💡','🤖','💬','⭐','🎯','📝','💻','🔥','🧠','🎮','🌟','💎','🚀'];
      const cols = Math.floor(W / 15);
      const drops = Array.from({ length: cols }, () => Math.random() * -H);
      const colEmoji = drops.map(() => pool[Math.floor(Math.random() * pool.length)]);
      let tick = 0;
      (function draw() {
        if (stopped) return;
        ctx.fillStyle = 'rgba(10, 18, 36, 0.14)';
        ctx.fillRect(0, 0, W, H);
        ctx.font = '11px serif';
        drops.forEach((y, i) => {
          if (tick % 8 === i % 8) colEmoji[i] = pool[Math.floor(Math.random() * pool.length)];
          ctx.fillText(colEmoji[i], i * 15 + 1, y);
          drops[i] += 1.1;
          if (drops[i] > H + 15) drops[i] = Math.random() * -40;
        });
        tick++;
        animId = requestAnimationFrame(draw);
      })();
    } else if (type === 'bg_stars') {
      const pool = ['⭐','✨','🌟','💫','🔆','🌙'];
      const stars = Array.from({ length: 20 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vy: -(0.3 + Math.random() * 0.4),
        e: pool[Math.floor(Math.random() * pool.length)]
      }));
      (function draw() {
        if (stopped) return;
        ctx.clearRect(0, 0, W, H);
        ctx.font = '11px serif';
        stars.forEach(s => {
          ctx.fillText(s.e, s.x, s.y);
          s.y += s.vy;
          if (s.y < -15) { s.y = H + 10; s.x = Math.random() * W; s.e = pool[Math.floor(Math.random() * pool.length)]; }
        });
        animId = requestAnimationFrame(draw);
      })();
    }

    return { stop() { stopped = true; if (animId) cancelAnimationFrame(animId); } };
  }

  // --- 2) Seed demo data ---
  function seedDemoDataIfEmpty() {
    if (load(STORAGE_KEYS.users)?.length > 0) return;
    const users = [
      { id: 'u1', fullName: 'Admin User', email: 'admin@prompt.demo', username: 'admin', password: 'Admin123!', role: 'admin', avatarUrl: '', createdAt: new Date().toISOString() },
      { id: 'u2', fullName: 'Demo User', email: 'demo@prompt.demo', username: 'demo', password: 'Demo123!', role: 'user', avatarUrl: '', createdAt: new Date().toISOString() }
    ];
    save(STORAGE_KEYS.users, users);

    const comments = [
      { id: 'c1', promptId: 'p1', userId: 'u2', body: 'Used this for my thesis outline. Very helpful!', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 'c2', promptId: 'p1', userId: 'u1', body: 'Glad it helped. You can extend with more subsections.', createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
      { id: 'c3', promptId: 'p2', userId: 'u1', body: 'Clean and practical. Saved for my next PR.', createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'c4', promptId: 'p3', userId: 'u2', body: 'Perfect for exam prep. Thanks!', createdAt: new Date().toISOString() }
    ];
    save(STORAGE_KEYS.comments, comments);

    const votes = [
      { userId: 'u2', promptId: 'p1', vote: 1 },
      { userId: 'u1', promptId: 'p2', vote: 1 },
      { userId: 'u2', promptId: 'p2', vote: 1 },
      { userId: 'u1', promptId: 'p3', vote: 1 },
      { userId: 'u2', promptId: 'p3', vote: -1 },
      { userId: 'u1', promptId: 'p4', vote: 1 },
      { userId: 'u2', promptId: 'p5', vote: 1 },
      { userId: 'u1', promptId: 'p6', vote: 1 }
    ];
    save(STORAGE_KEYS.votes, votes);

    const saves = [
      { userId: 'u2', promptId: 'p1' },
      { userId: 'u2', promptId: 'p3' },
      { userId: 'u1', promptId: 'p2' }
    ];
    save(STORAGE_KEYS.saves, saves);

    const follows = [
      { followerId: 'u2', followingId: 'u1' },
      { followerId: 'u1', followingId: 'u2' }
    ];
    save(STORAGE_KEYS.follows, follows);

    const reports = [
      { id: 'r1', promptId: 'p1', userId: 'u2', reason: 'Spam', createdAt: new Date().toISOString() }
    ];
    save(STORAGE_KEYS.reports, reports);
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
      const initial = (user.username || user.fullName || 'U').charAt(0).toUpperCase();
      right = `
        <a class="nav-link" href="${base}pages/explore.html">Explore</a>
        <a class="nav-link" href="${base}pages/postcreation.html">Create</a>
        <div class="avatar-wrap" id="avatarDropdownWrap">
          <div class="avatar-circle" id="avatarBtn" title="${user.username}">${initial}</div>
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

  function getPromptScore(promptId) {
    const votes = load(STORAGE_KEYS.votes) || [];
    let score = 0;
    votes.forEach(v => {
      if (v.promptId === promptId) score += v.vote;
    });
    return score;
  }

  function getPromptCommentCount(promptId) {
    const comments = load(STORAGE_KEYS.comments) || [];
    return comments.filter(c => c.promptId === promptId).length;
  }

  function isSaved(userId, promptId) {
    const saves = load(STORAGE_KEYS.saves) || [];
    return saves.some(s => s.userId === userId && s.promptId === promptId);
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

    const votes = load(STORAGE_KEYS.votes) || [];
    const comments = load(STORAGE_KEYS.comments) || [];
    const saves = load(STORAGE_KEYS.saves) || [];

    prompts = prompts.map(p => {
      const score = votes.filter(v => v.promptId === p.id).reduce((a, v) => a + v.vote, 0);
      const up = votes.filter(v => v.promptId === p.id && v.vote === 1).length;
      const down = votes.filter(v => v.promptId === p.id && v.vote === -1).length;
      const commentCount = comments.filter(c => c.promptId === p.id).length;
      const saveCount = saves.filter(s => s.promptId === p.id).length;
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
          role: apiUser.role
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
              <img src="${API_BASE}/prompts/${p.id}/thumbnail" alt="" onerror='this.onerror=null; this.src="${THUMBNAIL_FALLBACK_SRC}"'>
            </div>
            <div class="prompt-title">${escapeHtml(p.title)}</div>
            <div class="prompt-creator">${escapeHtml(p.creatorName)}</div>
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
          window.location.href = base + 'pages/prompt.html?id=' + id;
        });
      });
      container.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          const user = getSessionUser();
          if (!user) { alert('Login required to save prompts.'); window.location.href = base + 'pages/login.html'; return; }
          const pid = this.getAttribute('data-prompt-id');
          let saves = load(STORAGE_KEYS.saves) || [];
          const idx = saves.findIndex(s => s.userId === user.id && s.promptId === pid);
          if (idx >= 0) saves.splice(idx, 1);
          else saves.push({ userId: user.id, promptId: pid });
          save(STORAGE_KEYS.saves, saves);
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
    const score = getPromptScore(prompt.id);
    const commentCount = getPromptCommentCount(prompt.id);
    const saved = user && isSaved(user.id, prompt.id);
    const votes = load(STORAGE_KEYS.votes) || [];
    const myVote = user ? votes.find(v => v.userId === user.id && v.promptId === prompt.id) : null;
    const follows = load(STORAGE_KEYS.follows) || [];
    const following = user && follows.some(f => f.followerId === user.id && f.followingId === prompt.userId);

    function requireLogin(msg) {
      if (!user) {
        alert(msg + ' Please log in.');
        window.location.href = base + 'pages/login.html';
        return false;
      }
      return true;
    }

    const promptIdInt = parseInt(prompt.id, 10);
    const canDeletePrompt =
      user &&
      !Number.isNaN(promptIdInt) &&
      (user.role === 'admin' || String(prompt.userId) === String(user.id));

    container.innerHTML = `
      <div class="card mb-3">
        <div class="prompt-detail-thumbnail">
          <img src="${API_BASE}/prompts/${prompt.id}/thumbnail" alt="" onerror='this.onerror=null; this.src="${THUMBNAIL_FALLBACK_SRC}"'>
        </div>
        <h1 class="h2">${escapeHtml(prompt.title)}</h1>
        <p class="text-muted text-small">by ${escapeHtml((creator && creator.username) || prompt.creatorName || 'Unknown')} · ${formatDate(prompt.createdAt)}</p>
        <p>${escapeHtml(prompt.description || '')}</p>
        <div class="prompt-stats mb-2">
          <span class="stat-chip">↑ ${(score > 0 ? score : 0)}</span>
          <span class="stat-chip">↓ ${(score < 0 ? -score : 0)}</span>
          <span class="stat-chip">💬 ${commentCount}</span>
        </div>
        <div class="prompt-content-box mb-3">${escapeHtml(prompt.content || '')}</div>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
          <button type="button" class="btn btn-outline btn-sm" id="btnUpvote" data-vote="1">↑ Upvote</button>
          <button type="button" class="btn btn-outline btn-sm" id="btnDownvote" data-vote="-1">↓ Downvote</button>
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

    const comments = (load(STORAGE_KEYS.comments) || []).filter(c => c.promptId === prompt.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
    const usersMap = {};
    (load(STORAGE_KEYS.users) || []).forEach(u => { usersMap[u.id] = u; });
    const preview = document.getElementById('promptCommentsPreview');
    if (preview) preview.innerHTML = comments.length ? comments.map(c => `
      <div class="comment-item">
        <div class="comment-author">${escapeHtml((usersMap[c.userId] && usersMap[c.userId].username) || 'User')}</div>
        <div class="comment-body">${escapeHtml(c.body)}</div>
        <div class="comment-meta">${formatDate(c.createdAt)}</div>
      </div>
    `).join('') : '<p class="text-muted">No comments yet.</p>';

    const btnUpvote = document.getElementById('btnUpvote');
    const btnDownvote = document.getElementById('btnDownvote');
    const btnSave = document.getElementById('btnSave');
    const btnFollow = document.getElementById('btnFollow');
    const btnReport = document.getElementById('btnReport');
    const btnCopyPrompt = document.getElementById('btnCopyPrompt');

    function applyVote(vote) {
      if (!requireLogin('Login required to vote.')) return;
      let votes = load(STORAGE_KEYS.votes) || [];
      const idx = votes.findIndex(v => v.userId === user.id && v.promptId === prompt.id);
      if (idx >= 0) votes[idx].vote = vote;
      else votes.push({ userId: user.id, promptId: prompt.id, vote });
      save(STORAGE_KEYS.votes, votes);
      window.location.reload();
    }
    if (btnUpvote) btnUpvote.addEventListener('click', () => applyVote(1));
    if (btnDownvote) btnDownvote.addEventListener('click', () => applyVote(-1));

    if (btnSave) btnSave.addEventListener('click', function () {
      if (!requireLogin('Login required to save.')) return;
      let saves = load(STORAGE_KEYS.saves) || [];
      const idx = saves.findIndex(s => s.userId === user.id && s.promptId === prompt.id);
      if (idx >= 0) saves.splice(idx, 1);
      else saves.push({ userId: user.id, promptId: prompt.id });
      save(STORAGE_KEYS.saves, saves);
      this.textContent = isSaved(user.id, prompt.id) ? '★ Saved' : '☆ Save';
      this.classList.toggle('saved', isSaved(user.id, prompt.id));
    });

    if (btnFollow) btnFollow.addEventListener('click', function () {
      if (!requireLogin('Login required to follow.')) return;
      let follows = load(STORAGE_KEYS.follows) || [];
      const idx = follows.findIndex(f => f.followerId === user.id && f.followingId === prompt.userId);
      if (idx >= 0) follows.splice(idx, 1);
      else follows.push({ followerId: user.id, followingId: prompt.userId });
      save(STORAGE_KEYS.follows, follows);
      this.textContent = follows.some(f => f.followerId === user.id && f.followingId === prompt.userId) ? 'Following' : 'Follow creator';
    });

    if (btnReport) btnReport.addEventListener('click', function () {
      if (!requireLogin('Login required to report.')) return;
      const reason = prompt('Reason for report (e.g. Spam, Inappropriate):') || 'Other';
      const reports = load(STORAGE_KEYS.reports) || [];
      reports.push({ id: id(), promptId: prompt.id, userId: user.id, reason, createdAt: new Date().toISOString() });
      save(STORAGE_KEYS.reports, reports);
      alert('Thank you. Your report has been submitted.');
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

          // Keep local demo state consistent with the backend delete.
          const promptIdStr = String(prompt.id);
          const updatedPrompts = (load(STORAGE_KEYS.prompts) || []).filter(p => String(p.id) !== promptIdStr);
          save(STORAGE_KEYS.prompts, updatedPrompts);

          const updatedVotes = (load(STORAGE_KEYS.votes) || []).filter(v => String(v.promptId) !== promptIdStr);
          save(STORAGE_KEYS.votes, updatedVotes);

          const updatedSaves = (load(STORAGE_KEYS.saves) || []).filter(s => String(s.promptId) !== promptIdStr);
          save(STORAGE_KEYS.saves, updatedSaves);

          const updatedComments = (load(STORAGE_KEYS.comments) || []).filter(c => String(c.promptId) !== promptIdStr);
          save(STORAGE_KEYS.comments, updatedComments);

          window.location.href = base + 'pages/explore.html';
        } catch (err) {
          console.error('Error deleting prompt:', err.message);
          alert('Delete failed. Please try again.');
        }
      });
    }
  }

  function initComments() {
    const params = new URLSearchParams(window.location.search);
    const promptId = params.get('promptId');
    const base = getBase();
    const user = getSessionUser();
    const prompts = load(STORAGE_KEYS.prompts) || [];
    const prompt = prompts.find(p => p.id === promptId);
    const container = document.getElementById('commentsPageContent');
    const backLink = document.getElementById('backToPrompt');
    if (backLink) backLink.href = base + 'pages/prompt.html?id=' + (promptId || '');

    if (!prompt || !container) {
      if (container) container.innerHTML = '<p class="msg msg-error">Prompt not found.</p>';
      return;
    }

    const titleEl = document.getElementById('commentsPromptTitle');
    if (titleEl) titleEl.textContent = prompt.title;

    function renderComments() {
      const comments = (load(STORAGE_KEYS.comments) || []).filter(c => c.promptId === promptId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const usersMap = {};
      (load(STORAGE_KEYS.users) || []).forEach(u => { usersMap[u.id] = u; });
      const listEl = document.getElementById('commentsList');
      if (!listEl) return;
      listEl.innerHTML = comments.map(c => `
        <div class="comment-item" data-comment-id="${c.id}">
          <div class="comment-author">${escapeHtml((usersMap[c.userId] && usersMap[c.userId].username) || 'User')}</div>
          <div class="comment-body">${escapeHtml(c.body)}</div>
          <div class="comment-meta">${formatDate(c.createdAt)}</div>
          ${user && user.id === c.userId ? '<div class="comment-actions"><button type="button" class="btn btn-outline btn-sm btn-delete-comment" data-id="' + c.id + '">Delete</button></div>' : ''}
        </div>
      `).join('');
      listEl.querySelectorAll('.btn-delete-comment').forEach(btn => {
        btn.addEventListener('click', function () {
          let comments = load(STORAGE_KEYS.comments) || [];
          comments = comments.filter(c => c.id !== this.getAttribute('data-id'));
          save(STORAGE_KEYS.comments, comments);
          renderComments();
        });
      });
    }

    const form = document.getElementById('addCommentForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!user) {
          window.location.href = base + 'pages/login.html';
          return;
        }
        const body = (form.body && form.body.value || '').trim();
        if (!body) return;
        const comments = load(STORAGE_KEYS.comments) || [];
        comments.push({ id: id(), promptId, userId: user.id, body, createdAt: new Date().toISOString() });
        save(STORAGE_KEYS.comments, comments);
        form.body.value = '';
        renderComments();
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
    const base = getBase();
    if (!form) return;

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
          const imgHtml = `<div class="prompt-thumbnail"><img src="${API_BASE}/prompts/${p.id}/thumbnail" alt="" onerror='this.onerror=null; this.src="${THUMBNAIL_FALLBACK_SRC}"'></div>`;
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
          return { ...p, id: String(created.id) };
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
    const profileUserId = params.get('user') || user.id;
    const profileUser = getUserById(profileUserId);
    const base = getBase();
    const isOwn = user.id === profileUserId;

    if (!profileUser) {
      const container = document.getElementById('profileContent');
      if (container) container.innerHTML = '<p class="msg msg-error">User not found.</p>';
      return;
    }

    const prompts = load(STORAGE_KEYS.prompts) || [];
    const follows = load(STORAGE_KEYS.follows) || [];
    const followerCount = follows.filter(f => f.followingId === profileUserId).length;
    const followingCount = follows.filter(f => f.followerId === profileUserId).length;

    const container = document.getElementById('profileContent');
    if (!container) return;

    const tabContainer = document.getElementById('profileTabsContent');
    const postsContainer = document.getElementById('profilePosts');
    const commentsContainer = document.getElementById('profileComments');
    const savedContainer = document.getElementById('profileSaved');
    const upvotedContainer = document.getElementById('profileUpvoted');
    const downvotedContainer = document.getElementById('profileDownvoted');

    const profileNameEl = document.getElementById('profileUsername');
    const profileStatsEl = document.getElementById('profileStats');
    if (profileNameEl) profileNameEl.textContent = profileUser.username || profileUser.fullName;
    if (profileStatsEl) profileStatsEl.textContent = `${followerCount} followers · ${followingCount} following`;

    const votes = load(STORAGE_KEYS.votes) || [];
    const saves = load(STORAGE_KEYS.saves) || [];
    const comments = load(STORAGE_KEYS.comments) || [];

    const myPrompts = prompts.filter(p => p.userId === profileUserId && !p.removed);
    const myComments = comments.filter(c => c.userId === profileUserId);
    const mySaved = (saves.filter(s => s.userId === user.id).map(s => prompts.find(p => p.id === s.promptId))).filter(Boolean).filter(p => !p.removed);
    const myUpvoted = (votes.filter(v => v.userId === user.id && v.vote === 1).map(v => prompts.find(p => p.id === v.promptId))).filter(Boolean).filter(p => !p.removed);
    const myDownvoted = (votes.filter(v => v.userId === user.id && v.vote === -1).map(v => prompts.find(p => p.id === v.promptId))).filter(Boolean).filter(p => !p.removed);

    function renderPromptList(arr, el) {
      if (!el) return;
      const usersMap = {};
      (load(STORAGE_KEYS.users) || []).forEach(u => { usersMap[u.id] = u; });
      el.innerHTML = arr.length ? arr.map(p => `
        <div class="prompt-card" data-prompt-id="${p.id}">
          <div class="prompt-title">${escapeHtml(p.title)}</div>
          <div class="prompt-creator">${escapeHtml((usersMap[p.userId] && usersMap[p.userId].username) || '')}</div>
          <div class="prompt-desc">${escapeHtml((p.description || '').slice(0, 80))}...</div>
          <div class="prompt-stats"><span class="stat-chip">↑</span> <span class="stat-chip">💬 ${comments.filter(c => c.promptId === p.id).length}</span></div>
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
      (load(STORAGE_KEYS.users) || []).forEach(u => { usersMap[u.id] = u; });
      prompts.forEach(p => { promptsMap[p.id] = p; });
      el.innerHTML = arr.length ? arr.map(c => `
        <div class="comment-item">
          <div class="comment-author">on "${escapeHtml((promptsMap[c.promptId] && promptsMap[c.promptId].title) || '')}"</div>
          <div class="comment-body">${escapeHtml(c.body)}</div>
          <div class="comment-meta">${formatDate(c.createdAt)}</div>
          <a href="${base}pages/prompt.html?id=${c.promptId}" class="btn btn-outline btn-sm mt-1">View prompt</a>
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
    const profilePromptIds = new Set(myPrompts.map(p => p.id));
    const totalUpvotes  = votes.filter(v => profilePromptIds.has(v.promptId) && v.vote === 1).length;
    const receivedSaves = saves.filter(s => profilePromptIds.has(s.promptId)).length;
    const avatarStats   = { promptCount: myPrompts.length, totalUpvotes, commentCount: myComments.length, saveCount: receivedSaves };
    const unlockedIds      = ACHIEVEMENTS_DEF.filter(a => a.check(avatarStats)).map(a => a.id);
    const unlockedCosmetics = ACHIEVEMENTS_DEF.filter(a => unlockedIds.includes(a.id)).map(a => a.cosmetic);

    const avatarEl       = document.getElementById('avatarDisplay');
    const customizerEl   = document.getElementById('avatarCustomizer');
    const achievementsEl = document.getElementById('achievementsList');
    let bgHandle = null;

    function getSlots() {
      const u = load(STORAGE_KEYS.users)?.find(x => x.id === profileUserId) || profileUser;
      return {
        head: u.equippedHead !== undefined ? u.equippedHead : 'beanie',
        face: u.equippedFace !== undefined ? u.equippedFace : 'glasses',
        body: u.equippedBody || null,
        bg:   u.equippedBg   || null
      };
    }

    function rerenderAvatar() {
      const u = load(STORAGE_KEYS.users)?.find(x => x.id === profileUserId) || profileUser;
      const slots = getSlots();
      const dc = [slots.head, slots.face, slots.body].filter(c => c && unlockedCosmetics.includes(c));
      if (bgHandle) { bgHandle.stop(); bgHandle = null; }
      if (!avatarEl) return;
      avatarEl.innerHTML = buildAvatarSVG(u.avatarGender || 'm', u.avatarSkin || '#E0AC69', dc, u.avatarEyeColor || '#3a2800', u.avatarShirtColor || '#9E9E9E');
      if (slots.bg && unlockedCosmetics.includes(slots.bg)) {
        const canvas = document.createElement('canvas');
        canvas.className = 'avatar-bg-canvas';
        canvas.width = 148; canvas.height = 207;
        avatarEl.insertBefore(canvas, avatarEl.firstChild);
        bgHandle = startBgAnimation(canvas, slots.bg);
      }
    }

    function rerenderAchievements() {
      if (achievementsEl) achievementsEl.innerHTML = buildAchievementsList(ACHIEVEMENTS_DEF, unlockedIds, isOwn, getSlots());
    }

    rerenderAvatar();
    rerenderAchievements();

    if (isOwn && customizerEl) {
      const u = load(STORAGE_KEYS.users)?.find(x => x.id === profileUserId) || profileUser;
      customizerEl.innerHTML = buildAvatarCustomizer(u.avatarGender || 'm', u.avatarSkin || '#E0AC69', u.avatarEyeColor || '#3a2800', u.avatarShirtColor || '#9E9E9E');
      customizerEl.addEventListener('click', e => {
        const gBtn  = e.target.closest('[data-gender]');
        const sBtn  = e.target.closest('[data-skin]');
        const ecBtn = e.target.closest('[data-eye-color]');
        const scBtn = e.target.closest('[data-shirt-color]');
        if (!gBtn && !sBtn && !ecBtn && !scBtn) return;
        const updates = {};
        if (gBtn)  updates.avatarGender     = gBtn.dataset.gender;
        if (sBtn)  updates.avatarSkin       = sBtn.dataset.skin;
        if (ecBtn) updates.avatarEyeColor   = ecBtn.dataset.eyeColor;
        if (scBtn) updates.avatarShirtColor = scBtn.dataset.shirtColor;
        updateAvatarSettings(profileUserId, updates);
        if (gBtn)  customizerEl.querySelectorAll('[data-gender]').forEach(b => b.classList.toggle('active', b.dataset.gender === updates.avatarGender));
        if (sBtn)  customizerEl.querySelectorAll('[data-skin]').forEach(b => b.classList.toggle('active', b.dataset.skin === updates.avatarSkin));
        if (ecBtn) customizerEl.querySelectorAll('[data-eye-color]').forEach(b => b.classList.toggle('active', b.dataset.eyeColor === updates.avatarEyeColor));
        if (scBtn) customizerEl.querySelectorAll('[data-shirt-color]').forEach(b => b.classList.toggle('active', b.dataset.shirtColor === updates.avatarShirtColor));
        rerenderAvatar();
      });
    }

    if (isOwn && achievementsEl) {
      achievementsEl.addEventListener('click', e => {
        const btn = e.target.closest('[data-equip]');
        if (!btn) return;
        const cosmetic = btn.dataset.equip;
        const slot = btn.dataset.slot;
        if (!unlockedCosmetics.includes(cosmetic)) return;
        const u = load(STORAGE_KEYS.users)?.find(x => x.id === profileUserId);
        if (!u) return;
        const slotKey = 'equipped' + slot.charAt(0).toUpperCase() + slot.slice(1);
        updateAvatarSettings(profileUserId, { [slotKey]: u[slotKey] === cosmetic ? null : cosmetic });
        rerenderAvatar();
        rerenderAchievements();
      });
    }

    showTab('posts');
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
    if (form.avatarUrl) form.avatarUrl.value = fullUser.avatarUrl || '';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const fullName = (form.fullName && form.fullName.value || '').trim();
      const email = (form.email && form.email.value || '').trim();
      const username = (form.username && form.username.value || '').trim();
      if (!fullName || !email || !username) { alert('Please fill required fields.'); return; }
      if (!validateEmail(email)) { alert('Invalid email.'); return; }
      const users = load(STORAGE_KEYS.users) || [];
      const others = users.filter(u => u.id !== user.id);
      if (others.some(u => (u.email || '').toLowerCase() === email.toLowerCase())) { alert('Email already in use.'); return; }
      if (others.some(u => (u.username || '').toLowerCase() === username.toLowerCase())) { alert('Username already taken.'); return; }
      fullUser.fullName = fullName;
      fullUser.email = email;
      fullUser.username = username;
      fullUser.avatarUrl = (form.avatarUrl && form.avatarUrl.value || '').trim() || '';
      save(STORAGE_KEYS.users, users);
      setSessionUser({ ...user, fullName, email, username });
      alert('Profile updated.');
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

    const reports = load(STORAGE_KEYS.reports) || [];
    const prompts = load(STORAGE_KEYS.prompts) || [];
    const users = load(STORAGE_KEYS.users) || [];

    function render() {
      const list = reports.map(r => {
        const p = prompts.find(x => x.id === r.promptId);
        const u = users.find(x => x.id === r.userId);
        return { ...r, prompt: p, reporter: u };
      }).filter(r => r.prompt);

      container.innerHTML = `
        <h1 class="h2 mb-3">Moderation</h1>
        <div class="card">
          <table class="report-table">
            <thead>
              <tr><th>Prompt</th><th>Reported by</th><th>Reason</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${list.length ? list.map(r => `
                <tr data-report-id="${r.id}" data-prompt-id="${r.promptId}" data-user-id="${r.prompt.userId}">
                  <td><a href="${base}pages/prompt.html?id=${r.promptId}">${escapeHtml(r.prompt.title)}</a></td>
                  <td>${escapeHtml(r.reporter ? r.reporter.username : '')}</td>
                  <td>${escapeHtml(r.reason)}</td>
                  <td>${formatDate(r.createdAt)}</td>
                  <td class="actions">
                    <button type="button" class="btn btn-danger btn-sm btn-remove-prompt">Remove prompt</button>
                    <button type="button" class="btn btn-outline btn-sm btn-ban-user">Ban user</button>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="5">No reports.</td></tr>'}
            </tbody>
          </table>
        </div>
      `;

      container.querySelectorAll('.btn-remove-prompt').forEach(btn => {
        btn.addEventListener('click', function () {
          const row = this.closest('tr');
          const promptId = row.getAttribute('data-prompt-id');
          const prompts = load(STORAGE_KEYS.prompts) || [];
          const p = prompts.find(x => x.id === promptId);
          if (p) { p.removed = true; save(STORAGE_KEYS.prompts, prompts); }
          const reports = load(STORAGE_KEYS.reports) || [];
          const newReports = reports.filter(r => r.promptId !== promptId);
          save(STORAGE_KEYS.reports, newReports);
          render();
        });
      });
      container.querySelectorAll('.btn-ban-user').forEach(btn => {
        btn.addEventListener('click', function () {
          const row = this.closest('tr');
          const userId = row.getAttribute('data-user-id');
          const users = load(STORAGE_KEYS.users) || [];
          const u = users.find(x => x.id === userId);
          if (u) { u.banned = true; save(STORAGE_KEYS.users, users); }
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
