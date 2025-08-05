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

    if (e.target === element) {
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
    const { panelPosition } = getSettings();
    setTranslate(panelPosition.x, panelPosition.y, element);
    xOffset = panelPosition.x;
    yOffset = panelPosition.y;
    initialX = panelPosition.x;
    initialY = panelPosition.y;
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

      gameContainer.innerHTML = '';
      gameContainer.appendChild(gameFrame);
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
      });

      gameContainer.insertBefore(backButton, gameFrame);
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





















