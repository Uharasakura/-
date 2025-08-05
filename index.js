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
      url: 'minesweeper.html',
    },
    {
      name: '贪吃蛇',
      icon: '🐍',
      url: 'Gluttonous_Snake.html',
    },
    {
      name: '飞行棋',
      icon: '🎯',
      url: 'Flight_chess.html',
    },
    {
      name: '种田',
      icon: '🌾',
      url: 'Farming.html',
    },
  ],
  // 设置默认位置为右下角
  iconPosition: { x: window.innerWidth - 100, y: window.innerHeight - 100 },
  panelPosition: { x: 50, y: 50 },
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

// 确保位置在可视区域内
function ensureInViewport(x, y, width, height) {
  const maxX = window.innerWidth - width;
  const maxY = window.innerHeight - height;

  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  };
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
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  element.addEventListener('touchstart', dragStart);
  document.addEventListener('touchmove', drag);
  document.addEventListener('touchend', dragEnd);

  function dragStart(e) {
    if (e.type === 'mousedown') {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    } else {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    }

    if (e.target === element || e.target.parentElement === element) {
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

      // 确保元素在可视区域内
      const pos = ensureInViewport(currentX, currentY, element.offsetWidth, element.offsetHeight);
      currentX = pos.x;
      currentY = pos.y;
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
    const pos = ensureInViewport(iconPosition.x, iconPosition.y, element.offsetWidth, element.offsetHeight);
    setTranslate(pos.x, pos.y, element);
    xOffset = pos.x;
    yOffset = pos.y;
    initialX = pos.x;
    initialY = pos.y;
  } else if (element.dataset.type === 'panel') {
    const { panelPosition } = getSettings();
    const pos = ensureInViewport(panelPosition.x, panelPosition.y, element.offsetWidth, element.offsetHeight);
    setTranslate(pos.x, pos.y, element);
    xOffset = pos.x;
    yOffset = pos.y;
    initialX = pos.x;
    initialY = pos.y;
  }
}

// 获取游戏完整URL
function getGameUrl(gameUrl) {
  if (gameUrl.startsWith('http://') || gameUrl.startsWith('https://')) {
    return gameUrl;
  }
  return EXTENSION_DIR + gameUrl;
}

// 创建游戏面板
function createGamePanel() {
  const panel = document.createElement('div');
  panel.className = 'game-panel';
  panel.dataset.type = 'panel';
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

  minimizeButton.addEventListener('click', () => {
    panel.classList.toggle('minimized');
    minimizeButton.textContent = panel.classList.contains('minimized') ? '➕' : '➖';
  });

  closeButton.addEventListener('click', () => {
    panel.remove();
    gameButton.style.display = 'flex';
  });

  gameItems.forEach(item => {
    item.addEventListener('click', () => {
      const url = item.dataset.url;
      const gameFrame = document.createElement('iframe');
      gameFrame.src = url;
      gameFrame.className = 'game-container';
      gameFrame.allow = 'fullscreen';
      gameFrame.sandbox = 'allow-scripts allow-same-origin allow-popups allow-forms';

      // 设置游戏容器样式
      gameContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 10px;
        height: calc(100% - 60px);
        width: 100%;
        overflow: hidden;
      `;

      gameContainer.innerHTML = '';

      // 添加返回按钮
      const backButton = document.createElement('button');
      backButton.className = 'game-panel-button';
      backButton.textContent = '返回';
      backButton.style.marginBottom = '10px';
      backButton.addEventListener('click', () => {
        gameContainer.style.display = 'none';
        panel.querySelector('.game-grid').style.display = 'grid';
      });

      gameContainer.appendChild(backButton);
      gameContainer.appendChild(gameFrame);
      gameContainer.style.display = 'flex';

      panel.querySelector('.game-grid').style.display = 'none';
    });
  });

  addGameButton.addEventListener('click', showAddGameDialog);

  document.body.appendChild(panel);

  // 使面板可拖拽
  makeDraggable(panel, (x, y) => {
    const settings = getSettings();
    settings.panelPosition = { x, y };
    saveSettings();
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

    // 重新创建游戏面板
    document.querySelector('.game-panel').remove();
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


