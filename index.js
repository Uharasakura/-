// 获取SillyTavern上下文
const context = SillyTavern.getContext();
const { extensionSettings, saveSettingsDebounced } = context;

// 定义扩展名称
const EXTENSION_NAME = 'game_collection';

// 获取扩展文件夹路径
const EXTENSION_DIR = new URL('.', import.meta.url).pathname;

// 检测是否为移动设备
function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  );
}

// 获取默认位置
function getDefaultPositions() {
  const isMobile = isMobileDevice();
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  if (isMobile) {
    return {
      icon: {
        x: screenWidth - 60,
        y: screenHeight - 180, // 增加底部边距，避免遮挡
      },
      panel: {
        x: 10,
        y: 10,
      },
    };
  } else {
    return {
      icon: {
        x: screenWidth - 100,
        y: screenHeight - 100,
      },
      panel: {
        x: 50,
        y: 50,
      },
    };
  }
}

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
  iconVisible: true,
  ...getDefaultPositions(),
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
  const maxX = window.innerWidth - width - 10;
  const maxY = window.innerHeight - height - 10;
  const minX = 10;
  const minY = 10;

  const minBottomMargin = isMobileDevice() ? 160 : 10;
  const adjustedMaxY = window.innerHeight - height - minBottomMargin;

  return {
    x: Math.min(Math.max(minX, x), maxX),
    y: Math.min(Math.max(minY, y), adjustedMaxY),
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
    const { icon } = getSettings();
    const pos = ensureInViewport(icon.x, icon.y, element.offsetWidth, element.offsetHeight);
    setTranslate(pos.x, pos.y, element);
    xOffset = pos.x;
    yOffset = pos.y;
    initialX = pos.x;
    initialY = pos.y;
  } else if (element.dataset.type === 'panel') {
    const { panel } = getSettings();
    const pos = ensureInViewport(panel.x, panel.y, element.offsetWidth, element.offsetHeight);
    setTranslate(pos.x, pos.y, element);
    xOffset = pos.x;
    yOffset = pos.y;
    initialX = pos.x;
    initialY = pos.y;
  }
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
  const settings = getSettings();
  const defaultPos = getDefaultPositions();

  if (gameButton) {
    const pos = ensureInViewport(settings.icon.x, settings.icon.y, gameButton.offsetWidth, gameButton.offsetHeight);
    gameButton.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    settings.icon = { x: pos.x, y: pos.y };
  }

  const panel = document.querySelector('.game-panel');
  if (panel) {
    const pos = ensureInViewport(settings.panel.x, settings.panel.y, panel.offsetWidth, panel.offsetHeight);
    panel.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    settings.panel = { x: pos.x, y: pos.y };
  }

  saveSettings();
});

// 创建游戏按钮
function createGameButton() {
  const button = document.createElement('button');
  button.id = 'gameButton';
  button.className = 'game-icon-button';
  button.dataset.type = 'icon';
  button.innerHTML = '🎮';
  button.title = '小游戏合集';

  button.addEventListener('click', () => {
    button.style.display = 'none';
    createGamePanel();
  });

  document.body.appendChild(button);

  makeDraggable(button, (x, y) => {
    const settings = getSettings();
    settings.icon = { x, y };
    saveSettings();
  });

  return button;
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
    settings.panel = { x, y };
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

// 切换游戏图标显示状态
function toggleGameButton() {
  const settings = getSettings();
  if (settings.iconVisible) {
    if (!gameButton) {
      gameButton = createGameButton();
    }
    gameButton.style.display = 'flex';
  } else if (gameButton) {
    gameButton.style.display = 'none';
  }
}

// 初始化
let gameButton;

// 监听APP_READY事件
context.eventSource.on(context.event_types.APP_READY, () => {
  console.log('Game Collection Extension Ready');

  // 初始化设置并显示图标
  getSettings();
  toggleGameButton();
});






