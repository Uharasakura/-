// 获取SillyTavern上下文
const context = SillyTavern.getContext();
const { extensionSettings, saveSettingsDebounced } = context;

// 定义扩展名称
const EXTENSION_NAME = 'game_collection';

// 获取扩展文件夹路径
const EXTENSION_DIR = new URL('.', import.meta.url).pathname;

// 全局变量
let gameButton = null;
let gamePanel = null;
let keyboardHandler = null;

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
  // 如果是绝对URL，直接返回
  if (gameUrl.startsWith('http://') || gameUrl.startsWith('https://')) {
    // 如果是GitHub链接，确保使用raw.githubusercontent.com
    if (gameUrl.includes('github.com') && gameUrl.includes('/blob/')) {
      return gameUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }
    return gameUrl;
  }

  // 相对路径，添加扩展目录前缀
  return EXTENSION_DIR + gameUrl;
}

// 创建游戏面板
function createGamePanel() {
  // 如果面板已存在，先移除
  if (gamePanel) {
    closeGamePanel();
  }

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
  const gameItems = panel.querySelectorAll('.game-item');
  const addGameButton = panel.querySelector('.add-game-button');
  const gameContainer = panel.querySelector('.game-container');
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
    closeGamePanel();
  });

  gameItems.forEach(item => {
    item.addEventListener('click', () => {
      const originalUrl = item.dataset.url;
      const processedUrl = getGameUrl(originalUrl);
      console.log('游戏原始URL:', originalUrl);
      console.log('处理后URL:', processedUrl);
      loadGame(processedUrl, panel, gameContainer);
    });
  });

  addGameButton.addEventListener('click', showAddGameDialog);

  document.body.appendChild(panel);
  gamePanel = panel;

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

  // 设置键盘事件处理器
  setupKeyboardHandler();

  return panel;
}

// 加载游戏函数
function loadGame(url, panel, gameContainer) {
  console.log('加载游戏URL:', url);

  // 清空容器
  gameContainer.innerHTML = '';

  // 创建返回按钮
  const backButton = document.createElement('button');
  backButton.className = 'game-panel-button';
  backButton.textContent = '返回游戏列表';
  backButton.style.marginBottom = '10px';

  // 创建游戏iframe
  const gameFrame = document.createElement('iframe');
  gameFrame.className = 'game-container normal';
  gameFrame.src = url;
  gameFrame.allow = 'fullscreen; autoplay; encrypted-media; gyroscope; picture-in-picture';
  gameFrame.sandbox = 'allow-scripts allow-same-origin allow-popups allow-forms allow-modals';
  gameFrame.loading = 'lazy';

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

  // 组装容器
  gameContainer.appendChild(backButton);
  gameContainer.appendChild(gameFrame);
  gameContainer.appendChild(windowControls);

  // 显示游戏容器，隐藏游戏列表
  gameContainer.style.display = 'block';
  panel.querySelector('.game-grid').style.display = 'none';

  // 绑定返回按钮事件
  backButton.addEventListener('click', () => {
    gameContainer.style.display = 'none';
    panel.querySelector('.game-grid').style.display = 'grid';
    gameFrame.className = 'game-container normal';
    panel.classList.remove('fullscreen-mode');
  });

  // 绑定窗口控制按钮事件
  setupWindowControls(windowControls, gameFrame, panel);

  // 监听iframe加载事件
  gameFrame.addEventListener('load', () => {
    console.log('游戏加载成功:', url);
  });

  gameFrame.addEventListener('error', e => {
    console.error('游戏加载失败:', url, e);
  });
}

// 设置窗口控制按钮
function setupWindowControls(windowControls, gameFrame, panel) {
  const minimizeBtn = windowControls.querySelector('.minimize-btn');
  const normalBtn = windowControls.querySelector('.normal-btn');
  const fullscreenBtn = windowControls.querySelector('.fullscreen-btn');
  const exitFullscreenBtn = windowControls.querySelector('.exit-fullscreen-btn');
  const helpBtn = windowControls.querySelector('.help-btn');

  // 设置窗口状态的辅助函数
  const setWindowState = state => {
    gameFrame.className = `game-container ${state}`;

    // 更新按钮显示状态
    minimizeBtn.style.display = state === 'minimized' ? 'none' : 'block';
    normalBtn.style.display = state === 'normal' ? 'none' : 'block';
    fullscreenBtn.style.display = state === 'fullscreen' ? 'none' : 'block';
    exitFullscreenBtn.style.display = state === 'fullscreen' ? 'block' : 'none';

    // 设置面板模式
    if (state === 'fullscreen') {
      panel.classList.add('fullscreen-mode');
    } else {
      panel.classList.remove('fullscreen-mode');
    }

    // 保存设置
    const settings = getSettings();
    settings.gameWindowSize = state;
    saveSettings();
  };

  // 绑定按钮事件
  minimizeBtn.addEventListener('click', () => setWindowState('minimized'));
  normalBtn.addEventListener('click', () => setWindowState('normal'));
  fullscreenBtn.addEventListener('click', () => setWindowState('fullscreen'));
  exitFullscreenBtn.addEventListener('click', () => setWindowState('normal'));

  // 帮助按钮
  helpBtn.addEventListener('click', () => {
    showHelpDialog();
  });

  // 初始化按钮状态
  const savedState = getSettings().gameWindowSize || 'normal';
  setWindowState(savedState);
}

// 显示帮助对话框
function showHelpDialog() {
  const helpDialog = document.createElement('div');
  helpDialog.className = 'help-dialog';
  helpDialog.innerHTML = `
    <h3>游戏窗口快捷键</h3>
    <div style="color: #fff; line-height: 1.6;">
      <p><strong>1</strong> - 最小化窗口</p>
      <p><strong>2</strong> - 正常大小</p>
      <p><strong>3</strong> - 全屏模式</p>
      <p><strong>ESC</strong> - 退出全屏</p>
      <p><strong>鼠标拖拽</strong> - 移动窗口位置</p>
      <p><strong>双击标题栏</strong> - 重置面板位置到屏幕中央</p>
    </div>
    <div class="form-buttons">
      <button class="form-button submit" onclick="this.closest('.help-dialog').remove(); document.querySelector('.overlay').remove();">确定</button>
    </div>
  `;

  const overlay = document.createElement('div');
  overlay.className = 'overlay active';

  document.body.appendChild(overlay);
  document.body.appendChild(helpDialog);
}

// 设置键盘事件处理器
function setupKeyboardHandler() {
  // 移除旧的处理器
  if (keyboardHandler) {
    document.removeEventListener('keydown', keyboardHandler);
  }

  keyboardHandler = e => {
    // 只在面板打开且游戏窗口显示时响应快捷键
    if (!gamePanel || !gamePanel.querySelector('.game-container[style*="block"]')) return;

    const gameFrame = gamePanel.querySelector('.game-container iframe');
    if (!gameFrame) return;

    const windowControls = gamePanel.querySelector('.game-window-controls');
    if (!windowControls) return;

    const minimizeBtn = windowControls.querySelector('.minimize-btn');
    const normalBtn = windowControls.querySelector('.normal-btn');
    const fullscreenBtn = windowControls.querySelector('.fullscreen-btn');
    const exitFullscreenBtn = windowControls.querySelector('.exit-fullscreen-btn');

    switch (e.key) {
      case '1':
        if (minimizeBtn && minimizeBtn.style.display !== 'none') {
          minimizeBtn.click();
        }
        break;
      case '2':
        if (normalBtn && normalBtn.style.display !== 'none') {
          normalBtn.click();
        }
        break;
      case '3':
        if (fullscreenBtn && fullscreenBtn.style.display !== 'none') {
          fullscreenBtn.click();
        }
        break;
      case 'Escape':
        if (exitFullscreenBtn && exitFullscreenBtn.style.display !== 'none') {
          exitFullscreenBtn.click();
        }
        break;
    }
  };

  document.addEventListener('keydown', keyboardHandler);
}

// 关闭游戏面板
function closeGamePanel() {
  if (keyboardHandler) {
    document.removeEventListener('keydown', keyboardHandler);
    keyboardHandler = null;
  }

  if (gamePanel) {
    gamePanel.remove();
    gamePanel = null;
  }

  if (gameButton) {
    gameButton.style.display = 'flex';
  }
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

    // 重新创建游戏面板
    closeGamePanel();
    createGamePanel();

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
  // 如果按钮已存在，先移除
  if (gameButton) {
    gameButton.remove();
    gameButton = null;
  }

  const button = document.createElement('button');
  button.id = 'gameButton';
  button.className = 'game-icon-button';
  button.dataset.type = 'icon';
  button.innerHTML = '🎮';
  button.title = '游戏合集';

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

  gameButton = button;
  return button;
}

// 监听APP_READY事件
context.eventSource.on(context.event_types.APP_READY, () => {
  console.log('游戏合集扩展已准备就绪');
  getSettings(); // 初始化设置
  createGameButton();
});




































