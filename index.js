// 获取SillyTavern上下文
const context = SillyTavern.getContext();
const { extensionSettings, saveSettingsDebounced } = context;

// 定义扩展名称
const EXTENSION_NAME = 'game_collection';

// 默认设置
const defaultSettings = {
  games: [
    {
      name: '数独',
      icon: '🎲',
      url: 'shudoku.html',
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

// 创建游戏面板
function createGamePanel() {
  const panel = document.createElement('div');
  panel.className = 'game-panel';
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
                <div class="game-item" data-url="${game.url}">
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
    gameButton.style.display = 'block';
  });

  gameItems.forEach(item => {
    item.addEventListener('click', () => {
      const url = item.dataset.url;
      const gameFrame = document.createElement('iframe');
      gameFrame.src = url;
      gameFrame.className = 'game-container';

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
  button.innerHTML = '🎮';
  button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 20px;
        cursor: pointer;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
    `;

  button.addEventListener('mouseover', () => {
    button.style.transform = 'scale(1.1)';
  });

  button.addEventListener('mouseout', () => {
    button.style.transform = 'scale(1)';
  });

  button.addEventListener('click', () => {
    button.style.display = 'none';
    createGamePanel();
  });

  document.body.appendChild(button);
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
