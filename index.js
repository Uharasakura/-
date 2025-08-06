// 获取SillyTavern上下文
const context = SillyTavern.getContext();
const { extensionSettings, saveSettingsDebounced } = context;

// 定义扩展名称
const EXTENSION_NAME = 'game_collection';

// 获取扩展文件夹路径
const EXTENSION_DIR = new URL('.', import.meta.url).pathname;

// 默认设置
const defaultSettings = {
  games: [
    {
      name: '数独',
      icon: '🎲',
      url: 'https://raw.githubusercontent.com/Uharasakura/-/main/shudoku.html',
    },
    {
      name: '扫雷',
      icon: '💣',
      url: 'https://raw.githubusercontent.com/Uharasakura/-/main/minesweeper.html',
    },
    {
      name: '贪吃蛇',
      icon: '🐍',
      url: 'https://raw.githubusercontent.com/Uharasakura/-/main/Gluttonous_Snake.html',
    },
    {
      name: '飞行棋',
      icon: '🎯',
      url: 'https://raw.githubusercontent.com/Uharasakura/-/main/Flight_chess.html',
    },
    {
      name: '种田',
      icon: '🌾',
      url: 'https://raw.githubusercontent.com/Uharasakura/-/main/Farming.html',
    },
    {
      name: '彩虹猫',
      icon: '🌈',
      url: 'https://raw.githubusercontent.com/Uharasakura/-/main/Nyan_Cat.html',
    },
  ],
  iconPosition: { x: 20, y: 20 },
  panelPosition: { x: 100, y: 100 },
  gameWindowSize: 'normal', // 'minimized', 'normal', 'fullscreen'
};

// 获取设置
function getSettings() {
  if (!extensionSettings[EXTENSION_NAME]) {
    extensionSettings[EXTENSION_NAME] = Object.assign({}, defaultSettings);
    saveSettingsDebounced();
  }
  return extensionSettings[EXTENSION_NAME];
}

// 保存设置
function saveSettings() {
  saveSettingsDebounced();
}

// 使元素可拖拽
function makeDraggable(element, onDragEnd = null) {
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  element.addEventListener('mousedown', dragStart);
  element.addEventListener('mousemove', drag);
  element.addEventListener('mouseup', dragEnd);
  element.addEventListener('mouseleave', dragEnd);

  element.addEventListener('touchstart', dragStart);
  element.addEventListener('touchmove', drag);
  element.addEventListener('touchend', dragEnd);

  function dragStart(e) {
    if (e.type === 'mousedown') {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    } else {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    }

    if (e.target === element || e.target.closest('.game-panel-header')) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      if (e.type === 'mousemove') {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      } else {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      }

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, element);
    }
  }

  function dragEnd() {
    if (isDragging && onDragEnd) {
      onDragEnd(currentX, currentY);
    }

    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
  }

  // 设置初始位置
  if (element.dataset.type === 'icon') {
    const { iconPosition } = getSettings();
    setTranslate(iconPosition.x, iconPosition.y, element);
    xOffset = iconPosition.x;
    yOffset = iconPosition.y;
    initialX = iconPosition.x;
    initialY = iconPosition.y;
  } else if (element.dataset.type === 'panel') {
    // 面板使用绝对定位，不需要初始transform
    xOffset = 0;
    yOffset = 0;
    initialX = 0;
    initialY = 0;
  }
}

// 获取游戏完整URL
function getGameUrl(gameUrl) {
  if (!gameUrl) {
    console.error('Game URL is empty or undefined');
    return '';
  }

  if (gameUrl.startsWith('http://') || gameUrl.startsWith('https://')) {
    console.log('Using external URL:', gameUrl);
    return gameUrl;
  }

  const fullUrl = EXTENSION_DIR + gameUrl;
  console.log('Using local URL:', fullUrl);
  return fullUrl;
}

// 更新游戏网格
function updateGameGrid() {
  const gameGrid = document.querySelector('.game-grid');
  if (!gameGrid) return;

  // 重新生成游戏项HTML
  const gamesHtml = getSettings()
    .games.map(
      game => `
        <div class="game-item" data-url="${getGameUrl(game.url)}">
            <div class="game-icon">${game.icon}</div>
            <p class="game-name">${game.name}</p>
        </div>
    `,
    )
    .join('');

  // 更新游戏网格内容，保留添加按钮
  gameGrid.innerHTML = `
    ${gamesHtml}
    <div class="add-game-button">
        <span class="add-game-icon">➕</span>
        <p class="add-game-text">添加游戏</p>
    </div>
  `;

  // 重新绑定事件
  bindGameEvents();
}

// 绑定游戏事件
function bindGameEvents() {
  const gameItems = document.querySelectorAll('.game-item');
  const addGameButton = document.querySelector('.add-game-button');

  // 为游戏项绑定点击事件
  gameItems.forEach(item => {
    // 移除旧的事件监听器（如果存在）
    const newItem = item.cloneNode(true);
    item.parentNode.replaceChild(newItem, item);
  });

  // 重新获取更新后的元素
  const newGameItems = document.querySelectorAll('.game-item');
  newGameItems.forEach(item => {
    item.addEventListener('click', handleGameClick);
  });

  // 为添加按钮绑定事件
  if (addGameButton) {
    addGameButton.addEventListener('click', showAddGameDialog);
  }
}

// 处理游戏点击事件
function handleGameClick(event) {
  const item = event.currentTarget;
  const url = item.dataset.url;

  console.log('Game clicked:', url); // 调试日志

  if (!url) {
    console.error('Game URL is missing');
    return;
  }

  const panel = document.querySelector('.game-panel');
  const gameContainer = panel.querySelector('.game-container');

  const gameFrame = document.createElement('iframe');
  gameFrame.src = url;
  gameFrame.className = 'game-container normal';
  gameFrame.allow = 'fullscreen';
  gameFrame.sandbox = 'allow-scripts allow-same-origin allow-popups allow-forms';

  // 创建窗口控制按钮
  const windowControls = document.createElement('div');
  windowControls.className = 'game-window-controls';
  windowControls.innerHTML = `
    <button class="game-window-button minimize-btn" title="最小化 (快捷键: 1)">📱</button>
    <button class="game-window-button normal-btn" title="正常大小 (快捷键: 2)" style="display: none;">📺</button>
    <button class="game-window-button fullscreen-btn" title="全屏 (快捷键: 3)">⛶</button>
    <button class="game-window-button exit-fullscreen-btn" title="退出全屏 (快捷键: ESC)" style="display: none;">⛶</button>
    <button class="game-window-button help-btn" title="快捷键帮助">❓</button>
  `;

  gameContainer.innerHTML = '';
  gameContainer.appendChild(gameFrame);
  gameContainer.appendChild(windowControls);
  gameContainer.style.display = 'block';

  panel.querySelector('.game-grid').style.display = 'none';

  // 添加返回按钮
  const backButton = document.createElement('button');
  backButton.className = 'game-panel-button';
  backButton.textContent = '返回';
  backButton.style.marginBottom = '10px';
  backButton.addEventListener('click', () => {
    gameContainer.style.display = 'none';
    panel.querySelector('.game-grid').style.display = 'grid';
    // 重置游戏窗口状态
    gameFrame.className = 'game-container normal';
    panel.classList.remove('fullscreen-mode');
  });

  gameContainer.insertBefore(backButton, gameFrame);

  // 绑定窗口控制按钮事件
  bindWindowControls(windowControls, gameFrame, panel);

  // 监听iframe的load和error事件
  gameFrame.addEventListener('load', () => {
    console.log('Game loaded successfully:', url);
  });

  gameFrame.addEventListener('error', error => {
    console.error('Failed to load game:', url, error);

    // 显示错误信息给用户
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #fff;
      background: rgba(255, 0, 0, 0.8);
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      z-index: 1000;
    `;
    errorDiv.innerHTML = `
      <h3>游戏加载失败</h3>
      <p>无法加载游戏：${url}</p>
      <p>请检查URL是否正确或网络连接</p>
      <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px; background: #fff; border: none; border-radius: 5px; cursor: pointer;">关闭</button>
    `;

    gameContainer.appendChild(errorDiv);
  });

  // 添加超时检测
  setTimeout(() => {
    if (!gameFrame.contentDocument || gameFrame.contentDocument.readyState !== 'complete') {
      console.warn('Game loading timeout for:', url);
    }
  }, 10000); // 10秒超时
}

// 绑定窗口控制按钮事件
function bindWindowControls(windowControls, gameFrame, panel) {
  const minimizeBtn = windowControls.querySelector('.minimize-btn');
  const normalBtn = windowControls.querySelector('.normal-btn');
  const fullscreenBtn = windowControls.querySelector('.fullscreen-btn');
  const exitFullscreenBtn = windowControls.querySelector('.exit-fullscreen-btn');
  const helpBtn = windowControls.querySelector('.help-btn');

  // 帮助按钮
  helpBtn.addEventListener('click', () => {
    const helpDialog = document.createElement('div');
    helpDialog.className = 'help-dialog';
    helpDialog.innerHTML = `
      <h3 style="color: #fff; margin-top: 0;">游戏窗口快捷键</h3>
      <div style="color: #fff; line-height: 1.6;">
        <p><strong>1</strong> - 最小化窗口</p>
        <p><strong>2</strong> - 正常大小</p>
        <p><strong>3</strong> - 全屏模式</p>
        <p><strong>ESC</strong> - 退出全屏</p>
        <p><strong>鼠标拖拽</strong> - 移动窗口位置</p>
        <p><strong>双击标题栏</strong> - 重置面板位置到屏幕中央</p>
      </div>
      <div class="form-buttons">
        <button class="form-button submit" onclick="this.closest('.help-dialog').remove(); this.closest('.overlay').remove();">确定</button>
      </div>
    `;

    const overlay = document.createElement('div');
    overlay.className = 'overlay active';

    document.body.appendChild(overlay);
    document.body.appendChild(helpDialog);
  });

  // 最小化按钮
  minimizeBtn.addEventListener('click', () => {
    gameFrame.className = 'game-container minimized';
    minimizeBtn.style.display = 'none';
    normalBtn.style.display = 'block';
    panel.classList.remove('fullscreen-mode');
  });

  // 正常大小按钮
  normalBtn.addEventListener('click', () => {
    gameFrame.className = 'game-container normal';
    normalBtn.style.display = 'none';
    minimizeBtn.style.display = 'block';
    panel.classList.remove('fullscreen-mode');
  });

  // 全屏按钮
  fullscreenBtn.addEventListener('click', () => {
    gameFrame.className = 'game-container fullscreen';
    fullscreenBtn.style.display = 'none';
    exitFullscreenBtn.style.display = 'block';
    panel.classList.add('fullscreen-mode');
  });

  // 退出全屏按钮
  exitFullscreenBtn.addEventListener('click', () => {
    gameFrame.className = 'game-container normal';
    exitFullscreenBtn.style.display = 'none';
    fullscreenBtn.style.display = 'block';
    panel.classList.remove('fullscreen-mode');
  });
}

// 创建游戏面板
function createGamePanel() {
  const panel = document.createElement('div');
  panel.className = 'game-panel';
  panel.dataset.type = 'panel';

  // 计算屏幕中央位置
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const panelWidth = Math.min(600, screenWidth * 0.8);
  const panelHeight = Math.min(500, screenHeight * 0.8);
  const centerX = (screenWidth - panelWidth) / 2;
  const centerY = (screenHeight - panelHeight) / 2;

  // 设置面板初始位置为屏幕中央
  panel.style.left = `${centerX}px`;
  panel.style.top = `${centerY}px`;
  panel.style.width = `${panelWidth}px`;
  panel.style.height = `${panelHeight}px`;

  panel.innerHTML = `
        <div class="game-panel-header">
            <h2 class="game-panel-title">小游戏合集</h2>
            <div class="game-panel-controls">
                <button class="game-panel-button minimize-button" title="最小化">➖</button>
                <button class="game-panel-button close-button" title="关闭">✖</button>
            </div>
        </div>
        <div class="game-grid">
            ${getSettings()
              .games.map(
                game => `
                <div class="game-item" data-url="${getGameUrl(game.url)}">
                    <div class="game-icon">${game.icon}</div>
                    <p class="game-name">${game.name}</p>
                </div>
            `,
              )
              .join('')}
            <div class="add-game-button">
                <span class="add-game-icon">➕</span>
                <p class="add-game-text">添加游戏</p>
            </div>
        </div>
        <div class="game-container" style="display: none;"></div>
    `;

  // 添加事件监听器
  const minimizeButton = panel.querySelector('.minimize-button');
  const closeButton = panel.querySelector('.close-button');
  const panelTitle = panel.querySelector('.game-panel-title');

  // 双击标题栏重置面板位置到屏幕中央
  panelTitle.addEventListener('dblclick', () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const panelWidth = Math.min(600, screenWidth * 0.8);
    const panelHeight = Math.min(500, screenHeight * 0.8);
    const centerX = (screenWidth - panelWidth) / 2;
    const centerY = (screenHeight - panelHeight) / 2;

    panel.style.left = `${centerX}px`;
    panel.style.top = `${centerY}px`;
    panel.style.transform = 'none';

    // 保存新位置
    const settings = getSettings();
    settings.panelPosition = { x: centerX, y: centerY };
    saveSettings();
  });

  minimizeButton.addEventListener('click', () => {
    panel.classList.toggle('minimized');
    minimizeButton.textContent = panel.classList.contains('minimized') ? '➕' : '➖';
  });

  closeButton.addEventListener('click', () => {
    panel.remove();
    gameButton.style.display = 'flex';
  });

  // 使用统一的事件绑定函数
  bindGameEvents();

  document.body.appendChild(panel);

  // 使面板可拖拽
  makeDraggable(panel, (x, y) => {
    const settings = getSettings();
    // 计算面板的实际位置
    const rect = panel.getBoundingClientRect();
    settings.panelPosition = {
      x: rect.left,
      y: rect.top,
    };
    saveSettings();
  });

  // 添加键盘快捷键支持
  const handleKeyPress = e => {
    // 只在面板打开时响应快捷键
    if (!document.querySelector('.game-panel')) return;

    const gameFrame = document.querySelector('.game-container iframe');
    if (!gameFrame) return;

    const windowControls = document.querySelector('.game-window-controls');
    if (!windowControls) return;

    const minimizeBtn = windowControls.querySelector('.minimize-btn');
    const normalBtn = windowControls.querySelector('.normal-btn');
    const fullscreenBtn = windowControls.querySelector('.fullscreen-btn');
    const exitFullscreenBtn = windowControls.querySelector('.exit-fullscreen-btn');

    switch (e.key) {
      case '1': // 数字键1 - 最小化
        if (minimizeBtn.style.display !== 'none') {
          minimizeBtn.click();
        }
        break;
      case '2': // 数字键2 - 正常大小
        if (normalBtn.style.display !== 'none') {
          normalBtn.click();
        }
        break;
      case '3': // 数字键3 - 全屏
        if (fullscreenBtn.style.display !== 'none') {
          fullscreenBtn.click();
        } else if (exitFullscreenBtn.style.display !== 'none') {
          exitFullscreenBtn.click();
        }
        break;
      case 'Escape': // ESC键 - 退出全屏或返回
        if (exitFullscreenBtn.style.display !== 'none') {
          exitFullscreenBtn.click();
        } else if (gameFrame.classList.contains('fullscreen')) {
          exitFullscreenBtn.click();
        }
        break;
    }
  };

  // 添加键盘事件监听器
  document.addEventListener('keydown', handleKeyPress);

  // 在面板关闭时移除键盘事件监听器
  closeButton.addEventListener('click', () => {
    document.removeEventListener('keydown', handleKeyPress);
  });

  return panel;
}

// 创建添加游戏对话框
function showAddGameDialog() {
  const dialog = document.createElement('div');
  dialog.className = 'add-game-dialog';
  dialog.innerHTML = `
        <form class="add-game-form">
            <div class="form-group">
                <label class="form-label">游戏名称</label>
                <input type="text" class="form-input" name="name" required>
            </div>
            <div class="form-group">
                <label class="form-label">图标 (emoji)</label>
                <input type="text" class="form-input" name="icon" required>
            </div>
            <div class="form-group">
                <label class="form-label">游戏URL</label>
                <input type="url" class="form-input" name="url" required>
            </div>
            <div class="form-buttons">
                <button type="button" class="form-button cancel">取消</button>
                <button type="submit" class="form-button submit">添加</button>
            </div>
        </form>
    `;

  const overlay = document.createElement('div');
  overlay.className = 'overlay active';

  document.body.appendChild(overlay);
  document.body.appendChild(dialog);

  const form = dialog.querySelector('form');
  const cancelButton = dialog.querySelector('.cancel');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(form);
    const newGame = {
      name: formData.get('name'),
      icon: formData.get('icon'),
      url: formData.get('url'),
    };

    const settings = getSettings();
    settings.games.push(newGame);
    saveSettings();

    // 更新游戏网格而不是重新创建整个面板
    updateGameGrid();

    closeDialog();
  });

  cancelButton.addEventListener('click', closeDialog);

  function closeDialog() {
    dialog.remove();
    overlay.remove();
  }
}

// 创建游戏按钮
function createGameButton() {
  const button = document.createElement('button');
  button.id = 'gameButton';
  button.className = 'game-icon-button';
  button.dataset.type = 'icon';
  button.innerHTML = '🎮';

  button.addEventListener('click', () => {
    button.style.display = 'none';
    createGamePanel();
  });

  document.body.appendChild(button);

  // 使图标可拖拽
  makeDraggable(button, (x, y) => {
    const settings = getSettings();
    settings.iconPosition = { x, y };
    saveSettings();
  });

  return button;
}

// 初始化
let gameButton;

// 监听APP_READY事件
context.eventSource.on(context.event_types.APP_READY, () => {
  console.log('Game Collection Extension Ready');
  getSettings(); // 初始化设置
  gameButton = createGameButton();
});

























