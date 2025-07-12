// --- Mock Data ---
const mockUsers = [
    { id: 1, username: "noa", name: "Noa Levi", avatar: "🦉", groups: [1,2], bio: "Coffee lover. News junkie.", isMe: true },
    { id: 2, username: "amir", name: "Amir Cohen", avatar: "🦁", groups: [1], bio: "Sports and tech.", isMe: false },
    { id: 3, username: "maya", name: "Maya Ben-David", avatar: "🦊", groups: [2], bio: "Travel & food.", isMe: false },
  ];
  const mockGroups = [
    { id: 1, name: "Friends", color: "#e60000" },
    { id: 2, name: "Work", color: "#0077cc" },
  ];
  let mockNewsflashes = [
    { id: 1, userId: 2, groupId: 1, text: "Big game tonight! Who's watching?", created: Date.now() - 1000*60*60 },
    { id: 2, userId: 1, groupId: 2, text: "Project deadline moved to next week.", created: Date.now() - 1000*60*30 },
    { id: 3, userId: 3, groupId: 2, text: "Lunch at the new place?", created: Date.now() - 1000*60*10 },
    { id: 4, userId: 1, groupId: null, text: "Good morning everyone!", created: Date.now() - 1000*60*5 },
  ];
  
  // --- App State ---
  let state = {
    screen: location.hash.replace('#','') || 'login',
    user: null, // will be set after login
    theme: localStorage.getItem('theme') || 'light',
    feedFilter: { sort: 'newest', group: 'all' },
    loginMode: 'login', // or 'register'
    viewUserId: null, // for viewing other profiles
    selectedGroupId: null, // for group feed selection
  };
  
  // --- Utility Functions ---
  function $(sel) { return document.querySelector(sel); }
  function timeAgo(ts) {
    const diff = Math.floor((Date.now() - ts)/1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  }
  function getUser(id) { return mockUsers.find(u => u.id === id); }
  function getGroup(id) { return mockGroups.find(g => g.id === id); }
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    state.theme = theme;
  }
  setTheme(state.theme);
  
  // --- Navigation ---
  window.addEventListener('hashchange', () => {
    state.screen = location.hash.replace('#','') || 'login';
    render();
  });
  function navigate(screen, params={}) {
    if (params.userId) state.viewUserId = params.userId;
    location.hash = screen;
  }
  
  // --- Main Render ---
  function render() {
    const app = $('#app');
    app.innerHTML = '';
    app.appendChild(renderHeader());
    if (state.screen === 'login') {
      const main = document.createElement('main');
      main.appendChild(renderLogin());
      app.appendChild(main);
      return;
    }
    // News-site layout: grid with main and sidebar
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content fade-in';
    const mainCol = document.createElement('div');
    mainCol.className = 'main-col';
    switch(state.screen) {
      case 'feed': mainCol.appendChild(renderFeed()); break;
      case 'groups': mainCol.appendChild(renderGroupsFeed()); break;
      case 'profile': mainCol.appendChild(renderProfile(false)); break;
      case 'me': mainCol.appendChild(renderProfile(true)); break;
      case 'create': mainCol.appendChild(renderCreateNewsflash()); break;
      case 'settings': mainCol.appendChild(renderSettings()); break;
      default: mainCol.appendChild(renderFeed());
    }
    mainContent.appendChild(mainCol);
    mainContent.appendChild(renderSidebar());
    app.appendChild(mainContent);
  }
  
  // --- Header/Nav ---
  function renderHeader() {
    const header = document.createElement('header');
    header.className = 'site-header';
    const inner = document.createElement('div');
    inner.className = 'header-inner';
    // Logo
    const logo = document.createElement('div');
    logo.className = 'logo';
    logo.textContent = 'Friendlines';
    logo.onclick = () => navigate('feed');
    inner.appendChild(logo);
    // Nav
    const nav = document.createElement('nav');
    nav.className = 'main-nav';
    if (state.user) {
      [
        {screen:'feed', label:'Feed'},
        {screen:'groups', label:'Groups'},
        {screen:'create', label:'New'},
        {screen:'me', label:'My Profile'},
        {screen:'settings', label:'Settings'},
      ].forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = item.label;
        if (state.screen === item.screen) btn.classList.add('active');
        btn.onclick = () => navigate(item.screen);
        nav.appendChild(btn);
      });
    }
    inner.appendChild(nav);
    // Utils
    const utils = document.createElement('div');
    utils.className = 'header-utils';
    if (state.user) {
      const avatar = document.createElement('span');
      avatar.className = 'avatar';
      avatar.title = 'Logout';
      avatar.textContent = state.user.avatar;
      avatar.onclick = () => { state.user = null; navigate('login'); };
      utils.appendChild(avatar);
    }
    // Theme toggle
    const themeBtn = document.createElement('button');
    themeBtn.className = 'theme-toggle';
    themeBtn.title = 'Toggle light/dark mode';
    themeBtn.textContent = state.theme === 'dark' ? '🌙' : '☀️';
    themeBtn.onclick = () => setTheme(state.theme === 'dark' ? 'light' : 'dark');
    utils.appendChild(themeBtn);
    inner.appendChild(utils);
    header.appendChild(inner);
    return header;
  }
  
  // --- Sidebar ---
  function renderSidebar() {
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    // Trending/Quick links
    const trending = document.createElement('div');
    trending.innerHTML = `<h3>Trending</h3>`;
    const list = document.createElement('ul');
    list.className = 'sidebar-list';
    // Show 3 most recent newsflashes
    mockNewsflashes.slice(-3).reverse().forEach(flash => {
      const li = document.createElement('li');
      li.textContent = flash.text.slice(0, 40) + (flash.text.length > 40 ? '...' : '');
      li.onclick = () => {
        // Go to author's profile
        state.viewUserId = flash.userId;
        navigate('profile', {userId: flash.userId});
      };
      list.appendChild(li);
    });
    trending.appendChild(list);
    sidebar.appendChild(trending);
  
    // Groups quick links
    if (state.user) {
      const groups = document.createElement('div');
      groups.innerHTML = `<h3>My Groups</h3>`;
      const glist = document.createElement('ul');
      glist.className = 'sidebar-list';
      mockGroups.filter(g => state.user.groups.includes(g.id)).forEach(g => {
        const li = document.createElement('li');
        li.textContent = g.name;
        li.onclick = () => {
          state.screen = 'groups';
          state.selectedGroupId = g.id;
          render();
        };
        glist.appendChild(li);
      });
      groups.appendChild(glist);
      sidebar.appendChild(groups);
    }
    return sidebar;
  }
  
  // --- Login/Register Screen ---
  function renderLogin() {
    const wrap = document.createElement('div');
    wrap.style.maxWidth = '350px';
    wrap.style.margin = '2rem auto';
    wrap.style.background = 'var(--muted)';
    wrap.style.borderRadius = 'var(--radius)';
    wrap.style.padding = '2rem 1.5rem';
    wrap.style.border = '1px solid var(--border)';
    wrap.innerHTML = `
      <h2 style="margin-bottom:1.2rem;">${state.loginMode === 'login' ? 'Login' : 'Register'}</h2>
      <form id="loginForm">
        <div class="form-group">
          <label>Username</label>
          <input type="text" id="login-username" required autocomplete="username">
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="login-password" required autocomplete="current-password">
        </div>
        ${state.loginMode === 'register' ? `
        <div class="form-group">
          <label>Display Name</label>
          <input type="text" id="register-name" required>
        </div>
        ` : ''}
        <button class="btn" type="submit">${state.loginMode === 'login' ? 'Login' : 'Register'}</button>
        <span class="toggle-link" id="toggleLogin">
          ${state.loginMode === 'login' ? 'No account? Register' : 'Have an account? Login'}
        </span>
      </form>
    `;
    setTimeout(() => {
      $('#toggleLogin').onclick = () => {
        state.loginMode = state.loginMode === 'login' ? 'register' : 'login';
        render();
      };
      $('#loginForm').onsubmit = (e) => {
        e.preventDefault();
        const username = $('#login-username').value.trim();
        const password = $('#login-password').value.trim();
        if (state.loginMode === 'login') {
          // Simulate login
          const user = mockUsers.find(u => u.username === username);
          if (user) {
            state.user = user;
            navigate('feed');
          } else {
            alert('User not found (mockup)');
          }
        } else {
          // Simulate registration
          if (mockUsers.find(u => u.username === username)) {
            alert('Username taken (mockup)');
            return;
          }
          const name = $('#register-name').value.trim();
          const newUser = {
            id: mockUsers.length+1,
            username,
            name,
            avatar: "🦉",
            groups: [],
            bio: "",
            isMe: true
          };
          mockUsers.push(newUser);
          state.user = newUser;
          navigate('feed');
        }
      };
    }, 0);
    return wrap;
  }
  
  // --- Feed (Main) ---
  function renderFeed() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<h2 style="margin-bottom:1.2rem;">Main Feed</h2>`;
    wrap.appendChild(renderFeedFilterBar());
    const feed = document.createElement('div');
    feed.className = 'feed-list';
    let flashes = [...mockNewsflashes];
    // Show only newsflashes where user is recipient or author
    flashes = flashes.filter(f =>
      f.userId === state.user.id ||
      (f.groupIds && f.groupIds.some(gid => state.user.groups.includes(gid))) ||
      (f.friendIds && f.friendIds.includes(state.user.id))
    );
    // Sorting/filtering
    if (state.feedFilter.group !== 'all') {
      flashes = flashes.filter(f => f.groupIds && f.groupIds.includes(Number(state.feedFilter.group)));
    }
    flashes.sort((a,b) => state.feedFilter.sort === 'newest' ? b.created - a.created : a.created - b.created);
    flashes.forEach(flash => feed.appendChild(renderNewsflash(flash)));
    if (!flashes.length) {
      feed.innerHTML = `<div style="color:#888;text-align:center;">No newsflashes yet.</div>`;
    }
    wrap.appendChild(feed);
    return wrap;
  }
  function renderFeedFilterBar() {
    const bar = document.createElement('div');
    bar.className = 'filter-bar';
    // Group filter
    const groupSel = document.createElement('select');
    groupSel.innerHTML = `<option value="all">All Groups</option>` +
      mockGroups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    groupSel.value = state.feedFilter.group;
    groupSel.onchange = e => { state.feedFilter.group = e.target.value; render(); };
    bar.appendChild(groupSel);
    // Sort
    const sortSel = document.createElement('select');
    sortSel.innerHTML = `<option value="newest">Newest</option><option value="oldest">Oldest</option>`;
    sortSel.value = state.feedFilter.sort;
    sortSel.onchange = e => { state.feedFilter.sort = e.target.value; render(); };
    bar.appendChild(sortSel);
    return bar;
  }
  
  // --- Groups Feed ---
  function renderGroupsFeed() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<h2 style="margin-bottom:1.2rem;">Groups Feed</h2>`;
    const myGroups = mockGroups.filter(g => state.user.groups.includes(g.id));
    if (!myGroups.length) {
      wrap.innerHTML += `<div style="color:#888;">You are not in any groups.</div>`;
      return wrap;
    }
    // Group selector
    const groupSel = document.createElement('select');
    groupSel.style.marginBottom = '1.2rem';
    groupSel.innerHTML = myGroups.map(g =>
      `<option value="${g.id}">${g.name}</option>`
    ).join('');
    if (!state.selectedGroupId || !myGroups.some(g => g.id == state.selectedGroupId)) {
      state.selectedGroupId = myGroups[0].id;
    }
    groupSel.value = state.selectedGroupId;
    groupSel.onchange = e => {
      state.selectedGroupId = Number(e.target.value);
      render();
    };
    wrap.appendChild(groupSel);

    // Feed
    const feed = document.createElement('div');
    feed.className = 'feed-list';
    let flashes = mockNewsflashes.filter(f =>
      f.groupIds && f.groupIds.includes(Number(state.selectedGroupId))
    );
    flashes.sort((a,b) => b.created - a.created);
    flashes.forEach(flash => feed.appendChild(renderNewsflash(flash)));
    if (!flashes.length) {
      feed.innerHTML = `<div style="color:#888;text-align:center;">No newsflashes in this group yet.</div>`;
    }
    wrap.appendChild(feed);
    return wrap;
  }
  
  // --- Newsflash Card ---
  function renderNewsflash(flash) {
    const card = document.createElement('div');
    card.className = 'newsflash';
    // Optional: placeholder image
    const img = document.createElement('div');
    img.className = 'newsflash-img';
    img.style.background = `url('https://source.unsplash.com/600x180/?news,${flash.id}') center/cover`;
    card.appendChild(img);

    // Header: avatar, name, recipients, time
    const user = getUser(flash.userId);
    const header = document.createElement('div');
    header.className = 'newsflash-header';
    // Avatar
    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.style.width = '32px';
    avatar.style.height = '32px';
    avatar.style.fontSize = '1.1rem';
    avatar.textContent = user.avatar;
    avatar.onclick = () => {
      state.viewUserId = user.id;
      navigate('profile', {userId: user.id});
    };
    header.appendChild(avatar);
    // Name
    const name = document.createElement('span');
    name.textContent = user.name;
    name.style.fontWeight = 'bold';
    name.style.cursor = 'pointer';
    name.onclick = () => {
      state.viewUserId = user.id;
      navigate('profile', {userId: user.id});
    };
    header.appendChild(name);
    // Recipients
    if (flash.groupIds && flash.groupIds.length) {
      flash.groupIds.forEach(gid => {
        const group = getGroup(gid);
        if (group) {
          const groupTag = document.createElement('span');
          groupTag.className = 'group-chip';
          groupTag.style.background = group.color;
          groupTag.textContent = group.name;
          header.appendChild(groupTag);
        }
      });
    }
    if (flash.friendIds && flash.friendIds.length) {
      flash.friendIds.forEach(fid => {
        const friend = getUser(fid);
        if (friend) {
          const friendTag = document.createElement('span');
          friendTag.className = 'friend-chip';
          friendTag.textContent = friend.name;
          header.appendChild(friendTag);
        }
      });
    }
    // Time
    const time = document.createElement('span');
    time.style.marginLeft = 'auto';
    time.textContent = timeAgo(flash.created);
    header.appendChild(time);
    card.appendChild(header);
    // Content
    const content = document.createElement('div');
    content.className = 'newsflash-content';
    content.textContent = flash.text;
    card.appendChild(content);
    // Meta
    const meta = document.createElement('div');
    meta.className = 'newsflash-meta';
    meta.textContent = `@${user.username}`;
    card.appendChild(meta);
    return card;
  }
  
  // --- Profile (Other or Me) ---
  function renderProfile(isMe) {
    const user = isMe ? state.user : getUser(state.viewUserId);
    if (!user) return document.createTextNode('User not found.');
    const wrap = document.createElement('div');
    // Header
    const header = document.createElement('div');
    header.className = 'profile-header';
    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.textContent = user.avatar;
    header.appendChild(avatar);
    const info = document.createElement('div');
    info.className = 'profile-info';
    info.innerHTML = `<span class="name">${user.name}</span>
      <span class="username">@${user.username}</span>
      <span style="color:#888;font-size:0.97rem;">${user.bio || ''}</span>`;
    header.appendChild(info);
    wrap.appendChild(header);
    // Groups
    if (user.groups.length) {
      const groupList = document.createElement('div');
      groupList.className = 'group-list';
      user.groups.forEach(gid => {
        const g = getGroup(gid);
        if (g) {
          const chip = document.createElement('span');
          chip.className = 'group-chip';
          chip.style.background = g.color;
          chip.textContent = g.name;
          groupList.appendChild(chip);
        }
      });
      wrap.appendChild(groupList);
    }
    // Edit bio (if me)
    if (isMe) {
      const bioForm = document.createElement('form');
      bioForm.className = 'form-group';
      bioForm.style.maxWidth = '350px';
      bioForm.innerHTML = `
        <label>Edit Bio</label>
        <input type="text" id="bio-input" value="${user.bio || ''}" maxlength="60">
        <button class="btn" type="submit" style="margin-top:0.5rem;">Save</button>
      `;
      bioForm.onsubmit = e => {
        e.preventDefault();
        user.bio = $('#bio-input').value;
        render();
      };
      wrap.appendChild(bioForm);
    }
    // User's newsflashes
    const feed = document.createElement('div');
    feed.className = 'feed-list';
    let flashes = mockNewsflashes.filter(f => f.userId === user.id);
    flashes.sort((a,b) => b.created - a.created);
    flashes.forEach(flash => feed.appendChild(renderNewsflash(flash)));
    if (!flashes.length) {
      feed.innerHTML = `<div style="color:#888;text-align:center;">No newsflashes yet.</div>`;
    }
    wrap.appendChild(feed);
    return wrap;
  }
  
  // --- Create Newsflash ---
  function renderCreateNewsflash() {
    const wrap = document.createElement('div');
    wrap.style.maxWidth = '400px';
    wrap.style.margin = '0 auto';
    wrap.innerHTML = `<h2 style="margin-bottom:1.2rem;">Create Newsflash</h2>`;
    const form = document.createElement('form');
    // Friends (other users)
    const friends = mockUsers.filter(u => u.id !== state.user.id);
    // Groups
    const myGroups = mockGroups.filter(g => state.user.groups.includes(g.id));
    form.innerHTML = `
      <div class="form-group">
        <label>Text</label>
        <textarea id="newsflash-text" rows="3" maxlength="180" required></textarea>
      </div>
      <div class="form-group">
        <label>Send to Groups</label>
        <div id="group-checkboxes">
          ${myGroups.map(g =>
            `<label style="margin-right:1rem;">
              <input type="checkbox" name="groups" value="${g.id}"> ${g.name}
            </label>`
          ).join('')}
        </div>
      </div>
      <div class="form-group">
        <label>Send to Friends</label>
        <div id="friend-checkboxes">
          ${friends.map(u =>
            `<label style="margin-right:1rem;">
              <input type="checkbox" name="friends" value="${u.id}"> ${u.name}
            </label>`
          ).join('')}
        </div>
      </div>
      <button class="btn" type="submit">Post</button>
    `;
    form.onsubmit = e => {
      e.preventDefault();
      const text = $('#newsflash-text').value.trim();
      const groupIds = Array.from(form.querySelectorAll('input[name="groups"]:checked')).map(cb => Number(cb.value));
      const friendIds = Array.from(form.querySelectorAll('input[name="friends"]:checked')).map(cb => Number(cb.value));
      if (!text || (groupIds.length === 0 && friendIds.length === 0)) {
        alert('Please enter text and select at least one group or friend.');
        return;
      }
      mockNewsflashes.push({
        id: mockNewsflashes.length+1,
        userId: state.user.id,
        groupIds,
        friendIds,
        text,
        created: Date.now()
      });
      navigate('feed');
    };
    wrap.appendChild(form);
    return wrap;
  }
  
  // --- Settings ---
  function renderSettings() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<h2 style="margin-bottom:1.2rem;">Settings</h2>`;
    const panel = document.createElement('div');
    panel.className = 'settings-panel';
    // Theme toggle
    const themeLabel = document.createElement('label');
    const themeSwitch = document.createElement('input');
    themeSwitch.type = 'checkbox';
    themeSwitch.checked = state.theme === 'dark';
    themeSwitch.onchange = () => setTheme(themeSwitch.checked ? 'dark' : 'light');
    themeLabel.appendChild(themeSwitch);
    themeLabel.appendChild(document.createTextNode('Dark Mode'));
    panel.appendChild(themeLabel);
    // Group membership (simulate)
    const groupLabel = document.createElement('label');
    groupLabel.textContent = 'Groups:';
    panel.appendChild(groupLabel);
    mockGroups.forEach(g => {
      const groupToggle = document.createElement('label');
      groupToggle.style.marginLeft = '1.2rem';
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.checked = state.user.groups.includes(g.id);
      chk.onchange = () => {
        if (chk.checked) state.user.groups.push(g.id);
        else state.user.groups = state.user.groups.filter(id => id !== g.id);
        render();
      };
      groupToggle.appendChild(chk);
      groupToggle.appendChild(document.createTextNode(g.name));
      panel.appendChild(groupToggle);
    });
    wrap.appendChild(panel);
    return wrap;
  }
  
  // --- Initial Render ---
  if (state.user) {
    navigate('feed');
  } else {
    navigate('login');
  }
  render();