(() => {
  'use strict';

  // 获取SillyTavern上下文
  const context = SillyTavern.getContext();
  const { extensionSettings, saveSettingsDebounced } = context;

  // 定义扩展名称
  const EXTENSION_NAME = 'game_collection';

  // 获取扩展文件夹路径 - 使用正确的路径获取方式
  const extensionFolderPath = `scripts/extensions/third-party/${EXTENSION_NAME}`;

  // 默认设置
  const defaultSettings = {
    games: [
      {
        id: 'sudoku',
        name: '数独',
        icon: '🎲',
        url: 'https://raw.githubusercontent.com/Uharasakura/-/main/shudoku.html',
      },
      {
        id: 'minesweeper',
        name: '扫雷',
        icon: '💣',
        url: 'https://raw.githubusercontent.com/Uharasakura/-/main/minesweeper.html',
      },
      {
        id: 'snake',
        name: '贪吃蛇',
        icon: '🐍',
        url: 'https://raw.githubusercontent.com/Uharasakura/-/main/Gluttonous_Snake.html',
      },
      {
        id: 'flight_chess',
        name: '飞行棋',
        icon: '🎯',
        url: 'https://raw.githubusercontent.com/Uharasakura/-/main/Flight_chess.html',
      },
      {
        id: 'farming',
        name: '种田',
        icon: '🌾',
        url: 'https://raw.githubusercontent.com/Uharasakura/-/main/Farming.html',
      },
      {
        id: 'nyan_cat',
        name: '彩虹猫',
        icon: '🌈',
        url: 'https://raw.githubusercontent.com/Uharasakura/-/main/Nyan_Cat.html',
      },
    ],
    iconPosition: { x: 20, y: 20 },
    panelPosition: { x: 100, y: 100 },
    gameWindowSize: 'normal',
  };

  // 获取设置
  function getSettings() {
    if (!extensionSettings[EXTENSION_NAME]) {
      extensionSettings[EXTENSION_NAME] = structuredClone(defaultSettings);
      saveSettingsDebounced();
    }
    return extensionSettings[EXTENSION_NAME];
  }

  // 保存设置
  function saveSettings() {
    saveSettingsDebounced();
  }

  // 生成唯一ID
  function generateId() {
    return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 获取游戏完整URL
  function getGameUrl(gameUrl) {
    if (!gameUrl) {
      console.warn('Game URL is empty');
      return '';
    }

    if (gameUrl.startsWith('http://') || gameUrl.startsWith('https://')) {
      return gameUrl;
    }

    // 对于本地文件，使用扩展文件夹路径
    return `/${extensionFolderPath}/${gameUrl}`;
  }

  // 使元素可拖拽
  function makeDraggable(element, onDragEnd = null) {
    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;
    let xOffset = 0;
    let yOffset = 0;

    const dragStart = e => {
      if (e.type === 'touchstart') {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
      } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
      }

      if (e.target === element || e.target.closest('.game-panel-header')) {
        isDragging = true;
        element.style.cursor = 'grabbing';
      }
    };

    const drag = e => {
      if (isDragging) {
        e.preventDefault();

        if (e.type === 'touchmove') {
          currentX = e.touches[0].clientX - initialX;
          currentY = e.touches[0].clientY - initialY;
        } else {
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
        }

        xOffset = currentX;
        yOffset = currentY;
        setTranslate(currentX, currentY, element);
      }
    };

    const dragEnd = () => {
      if (isDragging) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        element.style.cursor = 'move';

        if (onDragEnd) {
          onDragEnd(currentX, currentY);
        }
      }
    };

    const setTranslate = (xPos, yPos, el) => {
      el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    };

    // 绑定事件
    element.addEventListener('mousedown', dragStart);
    element.addEventListener('mousemove', drag);
    element.addEventListener('mouseup', dragEnd);
    element.addEventListener('mouseleave', dragEnd);

    element.addEventListener('touchstart', dragStart, { passive: false });
    element.addEventListener('touchmove', drag, { passive: false });
    element.addEventListener('touchend', dragEnd);

    // 设置初始位置
    if (element.dataset.type === 'icon') {
      const { iconPosition } = getSettings();
      setTranslate(iconPosition.x, iconPosition.y, element);
      xOffset = iconPosition.x;
      yOffset = iconPosition.y;
      initialX = iconPosition.x;
      initialY = iconPosition.y;
    }
  }

  // 渲染游戏网格
  function renderGameGrid() {
    const games = getSettings().games;
    return games
      .map(
        game => `
      <div class="game-item" data-game-id="${game.id}" data-url="${getGameUrl(game.url)}">
        <div class="game-icon">${game.icon}</div>
        <p class="game-name">${game.name}</p>
      </div>
    `,
      )
      .join('');
  }

  // 创建游戏面板
  function createGamePanel() {
    // 清理已存在的面板
    const existingPanel = document.querySelector('.game-panel');
    if (existingPanel) {
      existingPanel.remove();
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
        ${renderGameGrid()}
        <div class="add-game-button">
          <span class="add-game-icon">➕</span>
          <p class="add-game-text">添加游戏</p>
        </div>
      </div>
      <div class="game-container" style="display: none;"></div>
    `;

    document.body.appendChild(panel);

    // 绑定事件
    bindPanelEvents(panel);

    return panel;
  }

  // 绑定面板事件
  function bindPanelEvents(panel) {
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

    // 面板控制按钮
    minimizeButton.addEventListener('click', () => {
      panel.classList.toggle('minimized');
      minimizeButton.textContent = panel.classList.contains('minimized') ? '➕' : '➖';
    });

    closeButton.addEventListener('click', () => {
      panel.remove();
      if (window.gameButton) {
        window.gameButton.style.display = 'flex';
      }
    });

    // 游戏项点击事件
    gameItems.forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        const gameId = item.dataset.gameId;
        const url = item.dataset.url;

        if (!url) {
          console.error('Game URL is missing for game:', gameId);
          return;
        }

        loadGame(url, gameContainer, panel);
      });
    });

    // 添加游戏按钮
    addGameButton.addEventListener('click', showAddGameDialog);

    // 使面板可拖拽
    makeDraggable(panel, (x, y) => {
      const settings = getSettings();
      const rect = panel.getBoundingClientRect();
      settings.panelPosition = { x: rect.left, y: rect.top };
      saveSettings();
    });
  }

  // 加载游戏
  function loadGame(url, gameContainer, panel) {
    const gameFrame = document.createElement('iframe');
    gameFrame.src = url;
    gameFrame.className = 'game-container normal';
    gameFrame.allow = 'fullscreen';
    gameFrame.sandbox = 'allow-scripts allow-same-origin allow-popups allow-forms';

    // 创建窗口控制按钮
    const windowControls = document.createElement('div');
    windowControls.className = 'game-window-controls';
    windowControls.innerHTML = `
      <button class="game-window-button minimize-btn" title="最小化">📱</button>
      <button class="game-window-button normal-btn" title="正常大小" style="display: none;">📺</button>
      <button class="game-window-button fullscreen-btn" title="全屏">⛶</button>
      <button class="game-window-button exit-fullscreen-btn" title="退出全屏" style="display: none;">⛶</button>
      <button class="game-window-button help-btn" title="帮助">❓</button>
    `;

    // 清空容器并添加新内容
    gameContainer.innerHTML = '';
    gameContainer.appendChild(gameFrame);
    gameContainer.appendChild(windowControls);
    gameContainer.style.display = 'block';

    // 隐藏游戏网格
    panel.querySelector('.game-grid').style.display = 'none';

    // 添加返回按钮
    const backButton = document.createElement('button');
    backButton.className = 'game-panel-button';
    backButton.textContent = '返回';
    backButton.style.marginBottom = '10px';
    backButton.addEventListener('click', () => {
      gameContainer.style.display = 'none';
      panel.querySelector('.game-grid').style.display = 'grid';
      gameFrame.className = 'game-container normal';
      panel.classList.remove('fullscreen-mode');
    });

    gameContainer.insertBefore(backButton, gameFrame);

    // 绑定窗口控制按钮事件
    bindWindowControls(windowControls, gameFrame, panel);

    // 游戏加载事件
    gameFrame.addEventListener('load', () => {
      console.log('Game loaded:', url);
    });

    gameFrame.addEventListener('error', () => {
      console.error('Failed to load game:', url);
      showErrorMessage(gameContainer, '游戏加载失败');
    });
  }

  // 绑定窗口控制按钮
  function bindWindowControls(windowControls, gameFrame, panel) {
    const minimizeBtn = windowControls.querySelector('.minimize-btn');
    const normalBtn = windowControls.querySelector('.normal-btn');
    const fullscreenBtn = windowControls.querySelector('.fullscreen-btn');
    const exitFullscreenBtn = windowControls.querySelector('.exit-fullscreen-btn');
    const helpBtn = windowControls.querySelector('.help-btn');

    minimizeBtn.addEventListener('click', () => {
      gameFrame.className = 'game-container minimized';
      minimizeBtn.style.display = 'none';
      normalBtn.style.display = 'block';
      panel.classList.remove('fullscreen-mode');
    });

    normalBtn.addEventListener('click', () => {
      gameFrame.className = 'game-container normal';
      normalBtn.style.display = 'none';
      minimizeBtn.style.display = 'block';
      panel.classList.remove('fullscreen-mode');
    });

    fullscreenBtn.addEventListener('click', () => {
      gameFrame.className = 'game-container fullscreen';
      fullscreenBtn.style.display = 'none';
      exitFullscreenBtn.style.display = 'block';
      panel.classList.add('fullscreen-mode');
    });

    exitFullscreenBtn.addEventListener('click', () => {
      gameFrame.className = 'game-container normal';
      exitFullscreenBtn.style.display = 'none';
      fullscreenBtn.style.display = 'block';
      panel.classList.remove('fullscreen-mode');
    });

    helpBtn.addEventListener('click', showHelpDialog);
  }

  // 显示帮助对话框
  function showHelpDialog() {
    const helpDialog = document.createElement('div');
    helpDialog.className = 'add-game-dialog';
    helpDialog.innerHTML = `
      <h3 style="color: #fff; margin-top: 0;">游戏窗口控制</h3>
      <div style="color: #fff; line-height: 1.6;">
        <p><strong>📱</strong> - 最小化窗口</p>
        <p><strong>📺</strong> - 正常大小</p>
        <p><strong>⛶</strong> - 全屏模式</p>
        <p><strong>双击标题栏</strong> - 重置面板位置</p>
        <p><strong>拖拽标题栏</strong> - 移动面板</p>
      </div>
      <div class="form-buttons">
        <button class="form-button submit" onclick="this.closest('.add-game-dialog').remove(); this.closest('.overlay').remove();">确定</button>
      </div>
    `;

    const overlay = document.createElement('div');
    overlay.className = 'overlay active';

    document.body.appendChild(overlay);
    document.body.appendChild(helpDialog);
  }

  // 显示错误信息
  function showErrorMessage(container, message) {
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
      <h3>${message}</h3>
      <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px; background: #fff; border: none; border-radius: 5px; cursor: pointer;">关闭</button>
    `;
    container.appendChild(errorDiv);
  }

  // 显示添加游戏对话框
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
        id: generateId(),
        name: formData.get('name'),
        icon: formData.get('icon'),
        url: formData.get('url'),
      };

      const settings = getSettings();
      settings.games.push(newGame);
      saveSettings();

      // 重新创建游戏面板
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
    getSettings();
    window.gameButton = gameButton = createGameButton();
  });
})();


























