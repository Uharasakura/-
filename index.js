/**
 * 游戏合集扩展 - SillyTavern Extension
 * 提供一个可拖拽的游戏面板，支持多种小游戏
 */

// 获取SillyTavern上下文
const context = SillyTavern.getContext();
const { extensionSettings, saveSettingsDebounced, eventSource, event_types } = context;

// 扩展名称
const EXTENSION_NAME = 'game_collection';

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
  gameWindowSize: 'normal',
};

// 全局变量
let gameButton = null;
let currentPanel = null;
let keyboardHandler = null;

/**
 * 获取或初始化扩展设置
 */
function getExtensionSettings() {
  if (!extensionSettings[EXTENSION_NAME]) {
    extensionSettings[EXTENSION_NAME] = structuredClone(defaultSettings);
    saveSettingsDebounced();
  }

  // 确保所有默认键都存在
  for (const key of Object.keys(defaultSettings)) {
    if (!Object.hasOwnProperty.call(extensionSettings[EXTENSION_NAME], key)) {
      extensionSettings[EXTENSION_NAME][key] = defaultSettings[key];
    }
  }

  return extensionSettings[EXTENSION_NAME];
}

/**
 * 保存设置
 */
function saveExtensionSettings() {
  saveSettingsDebounced();
}

/**
 * 获取游戏完整URL
 */
function resolveGameUrl(gameUrl) {
  if (!gameUrl) {
    console.error('[Game Collection] Game URL is empty or undefined');
    return '';
  }

  if (gameUrl.startsWith('http://') || gameUrl.startsWith('https://')) {
    return gameUrl;
  }

  // 对于相对路径，使用扩展目录
  const extensionPath = '/scripts/extensions/third-party/各种小游戏/';
  return extensionPath + gameUrl;
}

/**
 * 创建拖拽功能
 */
function makeDraggable(element, options = {}) {
  const { onDragEnd, constrainToViewport = true } = options;

  let isDragging = false;
  let startX, startY, startLeft, startTop;

  const handleMouseDown = e => {
    if (e.button !== 0) return; // 只处理左键

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = element.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    element.style.userSelect = 'none';
    e.preventDefault();
  };

  const handleMouseMove = e => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newLeft = startLeft + deltaX;
    let newTop = startTop + deltaY;

    if (constrainToViewport) {
      const rect = element.getBoundingClientRect();
      const maxLeft = window.innerWidth - rect.width;
      const maxTop = window.innerHeight - rect.height;

      newLeft = Math.max(0, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));
    }

    element.style.left = `${newLeft}px`;
    element.style.top = `${newTop}px`;
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    element.style.userSelect = '';

    if (onDragEnd) {
      const rect = element.getBoundingClientRect();
      onDragEnd(rect.left, rect.top);
    }
  };

  element.addEventListener('mousedown', handleMouseDown);

  // 返回清理函数
  return () => {
    element.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}

/**
 * 创建游戏图标按钮
 */
function createGameButton() {
  if (gameButton) {
    gameButton.remove();
  }

  gameButton = document.createElement('div');
  gameButton.className = 'game-collection-button';
  gameButton.innerHTML = '🎮';
  gameButton.title = '游戏合集';

  // 设置初始位置
  const settings = getExtensionSettings();
  gameButton.style.left = `${settings.iconPosition.x}px`;
  gameButton.style.top = `${settings.iconPosition.y}px`;

  // 添加点击事件
  gameButton.addEventListener('click', () => {
    if (currentPanel) {
      closeGamePanel();
    } else {
      openGamePanel();
    }
  });

  // 添加拖拽功能
  makeDraggable(gameButton, {
    onDragEnd: (x, y) => {
      const settings = getExtensionSettings();
      settings.iconPosition = { x, y };
      saveExtensionSettings();
    },
  });

  document.body.appendChild(gameButton);
}

/**
 * 创建游戏面板
 */
function createGamePanel() {
  const panel = document.createElement('div');
  panel.className = 'game-collection-panel';

  // 计算居中位置
  const panelWidth = 600;
  const panelHeight = 500;
  const centerX = (window.innerWidth - panelWidth) / 2;
  const centerY = (window.innerHeight - panelHeight) / 2;

  panel.style.left = `${centerX}px`;
  panel.style.top = `${centerY}px`;
  panel.style.width = `${panelWidth}px`;
  panel.style.height = `${panelHeight}px`;

  // 创建面板内容
  const header = document.createElement('div');
  header.className = 'game-panel-header';
  header.innerHTML = `
    <h3 class="game-panel-title">小游戏合集</h3>
    <div class="game-panel-controls">
      <button class="game-panel-btn minimize-btn" title="最小化">➖</button>
      <button class="game-panel-btn close-btn" title="关闭">✖</button>
    </div>
  `;

  const content = document.createElement('div');
  content.className = 'game-panel-content';

  const gameGrid = document.createElement('div');
  gameGrid.className = 'game-grid';

  const gameContainer = document.createElement('div');
  gameContainer.className = 'game-container';
  gameContainer.style.display = 'none';

  // 渲染游戏列表
  renderGameGrid(gameGrid);

  content.appendChild(gameGrid);
  content.appendChild(gameContainer);
  panel.appendChild(header);
  panel.appendChild(content);

  // 绑定事件
  bindPanelEvents(panel);

  return panel;
}

/**
 * 渲染游戏网格
 */
function renderGameGrid(container) {
  const settings = getExtensionSettings();

  container.innerHTML = '';

  // 添加游戏项
  settings.games.forEach(game => {
    const gameItem = document.createElement('div');
    gameItem.className = 'game-item';
    gameItem.innerHTML = `
      <div class="game-icon">${game.icon}</div>
      <div class="game-name">${game.name}</div>
    `;

    gameItem.addEventListener('click', () => {
      loadGame(game);
    });

    container.appendChild(gameItem);
  });

  // 添加游戏按钮
  const addButton = document.createElement('div');
  addButton.className = 'game-item add-game';
  addButton.innerHTML = `
    <div class="game-icon">➕</div>
    <div class="game-name">添加游戏</div>
  `;

  addButton.addEventListener('click', showAddGameDialog);
  container.appendChild(addButton);
}

/**
 * 绑定面板事件
 */
function bindPanelEvents(panel) {
  const header = panel.querySelector('.game-panel-header');
  const minimizeBtn = panel.querySelector('.minimize-btn');
  const closeBtn = panel.querySelector('.close-btn');
  const title = panel.querySelector('.game-panel-title');

  // 最小化功能
  minimizeBtn.addEventListener('click', () => {
    panel.classList.toggle('minimized');
    minimizeBtn.textContent = panel.classList.contains('minimized') ? '➕' : '➖';
  });

  // 关闭功能
  closeBtn.addEventListener('click', () => {
    closeGamePanel();
  });

  // 双击标题重置位置
  title.addEventListener('dblclick', () => {
    const panelWidth = 600;
    const panelHeight = 500;
    const centerX = (window.innerWidth - panelWidth) / 2;
    const centerY = (window.innerHeight - panelHeight) / 2;

    panel.style.left = `${centerX}px`;
    panel.style.top = `${centerY}px`;

    const settings = getExtensionSettings();
    settings.panelPosition = { x: centerX, y: centerY };
    saveExtensionSettings();
  });

  // 拖拽功能
  makeDraggable(panel, {
    onDragEnd: (x, y) => {
      const settings = getExtensionSettings();
      settings.panelPosition = { x, y };
      saveExtensionSettings();
    },
  });
}

/**
 * 加载游戏
 */
function loadGame(game) {
  const panel = currentPanel;
  const gameGrid = panel.querySelector('.game-grid');
  const gameContainer = panel.querySelector('.game-container');

  gameGrid.style.display = 'none';
  gameContainer.style.display = 'block';

  const gameUrl = resolveGameUrl(game.url);

  gameContainer.innerHTML = `
    <div class="game-header">
      <button class="game-back-btn">← 返回</button>
      <span class="game-title">${game.name}</span>
      <div class="game-controls">
        <button class="game-control-btn minimize-game" title="最小化 (1)">📱</button>
        <button class="game-control-btn normal-game" title="正常 (2)" style="display: none;">📺</button>
        <button class="game-control-btn fullscreen-game" title="全屏 (3)">⛶</button>
        <button class="game-control-btn exit-fullscreen-game" title="退出全屏 (ESC)" style="display: none;">⛶</button>
        <button class="game-control-btn help-game" title="帮助">❓</button>
      </div>
    </div>
    <iframe class="game-frame normal" src="${gameUrl}" 
            allow="fullscreen" 
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms">
    </iframe>
  `;

  bindGameEvents(gameContainer, game);
  setupKeyboardShortcuts();
}

/**
 * 绑定游戏事件
 */
function bindGameEvents(container, game) {
  const backBtn = container.querySelector('.game-back-btn');
  const gameFrame = container.querySelector('.game-frame');
  const minimizeBtn = container.querySelector('.minimize-game');
  const normalBtn = container.querySelector('.normal-game');
  const fullscreenBtn = container.querySelector('.fullscreen-game');
  const exitFullscreenBtn = container.querySelector('.exit-fullscreen-game');
  const helpBtn = container.querySelector('.help-game');

  // 返回按钮
  backBtn.addEventListener('click', () => {
    returnToGameGrid();
  });

  // 游戏控制按钮
  minimizeBtn.addEventListener('click', () => setGameSize('minimized'));
  normalBtn.addEventListener('click', () => setGameSize('normal'));
  fullscreenBtn.addEventListener('click', () => setGameSize('fullscreen'));
  exitFullscreenBtn.addEventListener('click', () => setGameSize('normal'));

  // 帮助按钮
  helpBtn.addEventListener('click', showHelpDialog);

  // 游戏加载事件
  gameFrame.addEventListener('load', () => {
    console.log(`[Game Collection] Game loaded: ${game.name}`);
  });

  gameFrame.addEventListener('error', () => {
    console.error(`[Game Collection] Failed to load game: ${game.name}`);
    showGameError(game);
  });
}

/**
 * 设置游戏窗口大小
 */
function setGameSize(size) {
  const gameFrame = document.querySelector('.game-frame');
  const panel = currentPanel;
  const controls = document.querySelectorAll('.game-control-btn');

  if (!gameFrame) return;

  // 移除所有大小类
  gameFrame.classList.remove('minimized', 'normal', 'fullscreen');
  gameFrame.classList.add(size);

  // 更新控制按钮显示
  controls.forEach(btn => (btn.style.display = 'block'));

  switch (size) {
    case 'minimized':
      document.querySelector('.minimize-game').style.display = 'none';
      document.querySelector('.normal-game').style.display = 'block';
      break;
    case 'normal':
      document.querySelector('.normal-game').style.display = 'none';
      document.querySelector('.exit-fullscreen-game').style.display = 'none';
      break;
    case 'fullscreen':
      document.querySelector('.fullscreen-game').style.display = 'none';
      document.querySelector('.exit-fullscreen-game').style.display = 'block';
      panel.classList.add('fullscreen-mode');
      return;
  }

  panel.classList.remove('fullscreen-mode');
}

/**
 * 返回游戏网格
 */
function returnToGameGrid() {
  const panel = currentPanel;
  const gameGrid = panel.querySelector('.game-grid');
  const gameContainer = panel.querySelector('.game-container');

  gameContainer.style.display = 'none';
  gameGrid.style.display = 'grid';

  panel.classList.remove('fullscreen-mode');
  removeKeyboardShortcuts();
}

/**
 * 设置键盘快捷键
 */
function setupKeyboardShortcuts() {
  if (keyboardHandler) {
    document.removeEventListener('keydown', keyboardHandler);
  }

  keyboardHandler = e => {
    if (!currentPanel || !document.querySelector('.game-frame')) return;

    switch (e.key) {
      case '1':
        setGameSize('minimized');
        break;
      case '2':
        setGameSize('normal');
        break;
      case '3':
        setGameSize('fullscreen');
        break;
      case 'Escape':
        if (document.querySelector('.game-frame.fullscreen')) {
          setGameSize('normal');
        }
        break;
    }
  };

  document.addEventListener('keydown', keyboardHandler);
}

/**
 * 移除键盘快捷键
 */
function removeKeyboardShortcuts() {
  if (keyboardHandler) {
    document.removeEventListener('keydown', keyboardHandler);
    keyboardHandler = null;
  }
}

/**
 * 显示添加游戏对话框
 */
function showAddGameDialog() {
  const dialog = document.createElement('div');
  dialog.className = 'game-dialog-overlay';

  dialog.innerHTML = `
    <div class="game-dialog">
      <h3>添加新游戏</h3>
      <form class="add-game-form">
        <div class="form-group">
          <label>游戏名称</label>
          <input type="text" name="name" required>
        </div>
        <div class="form-group">
          <label>图标 (Emoji)</label>
          <input type="text" name="icon" required maxlength="2">
        </div>
        <div class="form-group">
          <label>游戏URL</label>
          <input type="url" name="url" required>
        </div>
        <div class="form-buttons">
          <button type="button" class="cancel-btn">取消</button>
          <button type="submit" class="submit-btn">添加</button>
        </div>
      </form>
    </div>
  `;

  const form = dialog.querySelector('.add-game-form');
  const cancelBtn = dialog.querySelector('.cancel-btn');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(form);

    const newGame = {
      name: formData.get('name').trim(),
      icon: formData.get('icon').trim(),
      url: formData.get('url').trim(),
    };

    const settings = getExtensionSettings();
    settings.games.push(newGame);
    saveExtensionSettings();

    // 重新渲染游戏网格
    const gameGrid = currentPanel.querySelector('.game-grid');
    renderGameGrid(gameGrid);

    dialog.remove();
  });

  cancelBtn.addEventListener('click', () => {
    dialog.remove();
  });

  dialog.addEventListener('click', e => {
    if (e.target === dialog) {
      dialog.remove();
    }
  });

  document.body.appendChild(dialog);
}

/**
 * 显示帮助对话框
 */
function showHelpDialog() {
  const dialog = document.createElement('div');
  dialog.className = 'game-dialog-overlay';

  dialog.innerHTML = `
    <div class="game-dialog">
      <h3>游戏控制帮助</h3>
      <div class="help-content">
        <p><strong>键盘快捷键：</strong></p>
        <ul>
          <li><kbd>1</kbd> - 最小化游戏窗口</li>
          <li><kbd>2</kbd> - 正常大小</li>
          <li><kbd>3</kbd> - 全屏模式</li>
          <li><kbd>ESC</kbd> - 退出全屏</li>
        </ul>
        <p><strong>其他功能：</strong></p>
        <ul>
          <li>拖拽面板标题栏可移动面板</li>
          <li>双击标题栏重置面板位置</li>
          <li>点击游戏图标可直接启动游戏</li>
        </ul>
      </div>
      <div class="form-buttons">
        <button type="button" class="close-help-btn">关闭</button>
      </div>
    </div>
  `;

  const closeBtn = dialog.querySelector('.close-help-btn');
  closeBtn.addEventListener('click', () => dialog.remove());

  dialog.addEventListener('click', e => {
    if (e.target === dialog) {
      dialog.remove();
    }
  });

  document.body.appendChild(dialog);
}

/**
 * 显示游戏错误
 */
function showGameError(game) {
  const dialog = document.createElement('div');
  dialog.className = 'game-dialog-overlay';

  dialog.innerHTML = `
    <div class="game-dialog error-dialog">
      <h3>游戏加载失败</h3>
      <p>无法加载游戏："${game.name}"</p>
      <p>URL: ${resolveGameUrl(game.url)}</p>
      <p>请检查网络连接或游戏链接是否正确。</p>
      <div class="form-buttons">
        <button type="button" class="close-error-btn">关闭</button>
      </div>
    </div>
  `;

  const closeBtn = dialog.querySelector('.close-error-btn');
  closeBtn.addEventListener('click', () => dialog.remove());

  setTimeout(() => dialog.remove(), 5000); // 5秒后自动关闭

  document.body.appendChild(dialog);
}

/**
 * 打开游戏面板
 */
function openGamePanel() {
  if (currentPanel) return;

  currentPanel = createGamePanel();
  document.body.appendChild(currentPanel);

  // 隐藏游戏按钮
  if (gameButton) {
    gameButton.style.display = 'none';
  }
}

/**
 * 关闭游戏面板
 */
function closeGamePanel() {
  if (currentPanel) {
    currentPanel.remove();
    currentPanel = null;
  }

  // 显示游戏按钮
  if (gameButton) {
    gameButton.style.display = 'block';
  }

  removeKeyboardShortcuts();
}

/**
 * 初始化扩展
 */
function initializeExtension() {
  console.log('[Game Collection] Extension initializing...');

  // 初始化设置
  getExtensionSettings();

  // 创建游戏按钮
  createGameButton();

  console.log('[Game Collection] Extension initialized successfully');
}

/**
 * 清理扩展
 */
function cleanupExtension() {
  console.log('[Game Collection] Extension cleaning up...');

  if (gameButton) {
    gameButton.remove();
    gameButton = null;
  }

  closeGamePanel();
  removeKeyboardShortcuts();

  console.log('[Game Collection] Extension cleaned up');
}

// 监听APP_READY事件
eventSource.on(event_types.APP_READY, initializeExtension);

// 导出清理函数供其他地方调用
window.gameCollectionCleanup = cleanupExtension;























