(() => {
  'use strict';

  // 获取SillyTavern上下文
  const context = SillyTavern.getContext();
  const { extensionSettings, saveSettingsDebounced, eventSource, event_types } = context;

  // 扩展名称
  const MODULE_NAME = 'game_collection';

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
    gameWindowSize: 'normal', // 'minimized', 'normal', 'fullscreen'
  };

  // 全局变量
  let gameButton = null;
  let gamePanel = null;
  let isInitialized = false;

  // 获取设置
  function getSettings() {
    if (!extensionSettings[MODULE_NAME]) {
      extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
      saveSettingsDebounced();
    }
    return extensionSettings[MODULE_NAME];
  }

  // 保存设置
  function saveSettings() {
    saveSettingsDebounced();
  }

  // 生成唯一ID
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 拖拽功能
  function makeDraggable(element, onDragEnd) {
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
    if (element.id === 'gameButton') {
      const { iconPosition } = getSettings();
      setTranslate(iconPosition.x, iconPosition.y, element);
      xOffset = iconPosition.x;
      yOffset = iconPosition.y;
      initialX = iconPosition.x;
      initialY = iconPosition.y;
    }
  }

  // 创建游戏按钮
  function createGameButton() {
    console.log('[游戏合集] 开始创建游戏按钮');

    if (gameButton) {
      console.log('[游戏合集] 移除旧按钮');
      gameButton.remove();
      gameButton = null;
    }

    const button = document.createElement('button');
    button.id = 'gameButton';
    button.className = 'game-icon-button';
    button.innerHTML = '🎮';
    button.title = '游戏合集';

    // 设置data-type用于拖拽识别
    button.dataset.type = 'icon';

    // 点击事件
    button.addEventListener('click', e => {
      e.stopPropagation();
      console.log('[游戏合集] 按钮被点击');
      button.style.display = 'none';
      openGamePanel();
    });

    // 拖拽功能
    makeDraggable(button, (x, y) => {
      const settings = getSettings();
      settings.iconPosition = { x, y };
      saveSettings();
      console.log('[游戏合集] 按钮位置已保存:', { x, y });
    });

    // 确保添加到body
    if (document.body) {
      document.body.appendChild(button);
      gameButton = button;
      console.log('[游戏合集] 游戏按钮已创建并添加到页面');
    } else {
      console.error('[游戏合集] document.body不存在，无法添加按钮');
      setTimeout(() => createGameButton(), 500);
      return;
    }

    return button;
  }

  // 打开游戏面板
  function openGamePanel() {
    if (gamePanel && document.body.contains(gamePanel)) {
      gamePanel.style.display = 'block';
      return;
    }
    createGamePanel();
  }

  // 创建游戏面板
  function createGamePanel() {
    if (gamePanel) {
      gamePanel.remove();
    }

    const panel = document.createElement('div');
    panel.className = 'game-panel';
    panel.id = 'game-collection-panel';

    // 计算中央位置
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const panelWidth = Math.min(600, screenWidth * 0.8);
    const panelHeight = Math.min(500, screenHeight * 0.8);

    panel.style.position = 'fixed';
    panel.style.left = (screenWidth - panelWidth) / 2 + 'px';
    panel.style.top = (screenHeight - panelHeight) / 2 + 'px';
    panel.style.width = panelWidth + 'px';
    panel.style.height = panelHeight + 'px';
    panel.style.zIndex = '10000';

    // 创建面板内容
    panel.innerHTML = createPanelHTML();

    document.body.appendChild(panel);
    gamePanel = panel;

    // 绑定事件
    bindPanelEvents(panel);

    // 隐藏按钮
    if (gameButton) {
      gameButton.style.display = 'none';
    }

    console.log('[游戏合集] 游戏面板已创建');
  }

  // 创建面板HTML
  function createPanelHTML() {
    const settings = getSettings();
    const gamesHTML = settings.games
      .map(
        game => `
                <div class="game-item" data-game-id="${game.id}" data-url="${game.url}">
                    <div class="game-icon">${game.icon}</div>
                    <p class="game-name">${game.name}</p>
                </div>
            `,
      )
      .join('');

    return `
            <div class="game-panel-header">
                <h2 class="game-panel-title">小游戏合集 (双击重置位置)</h2>
                <div class="game-panel-controls">
                    <button class="game-panel-button minimize-button" title="最小化">➖</button>
                    <button class="game-panel-button close-button" title="关闭">✖</button>
                </div>
            </div>
            <div class="game-content">
                <div class="game-grid">
                    ${gamesHTML}
                    <div class="add-game-button">
                        <span class="add-game-icon">➕</span>
                        <p class="add-game-text">添加游戏</p>
                    </div>
                </div>
                <div class="game-container" style="display: none;">
                    <div class="game-container-header">
                        <button class="game-container-button back-button">返回</button>
                        <div class="game-controls">
                            <button class="game-container-button size-button" data-size="normal" title="正常大小">📺</button>
                            <button class="game-container-button size-button" data-size="fullscreen" title="全屏">⛶</button>
                        </div>
                    </div>
                    <iframe class="game-frame" sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>
                </div>
            </div>
        `;
  }

  // 绑定面板事件
  function bindPanelEvents(panel) {
    const minimizeButton = panel.querySelector('.minimize-button');
    const closeButton = panel.querySelector('.close-button');
    const gameItems = panel.querySelectorAll('.game-item');
    const addGameButton = panel.querySelector('.add-game-button');
    const backButton = panel.querySelector('.back-button');
    const sizeButtons = panel.querySelectorAll('.size-button');
    const gameContainer = panel.querySelector('.game-container');
    const gameGrid = panel.querySelector('.game-grid');
    const gameFrame = panel.querySelector('.game-frame');
    const title = panel.querySelector('.game-panel-title');

    // 最小化
    minimizeButton.addEventListener('click', () => {
      panel.classList.toggle('minimized');
      minimizeButton.textContent = panel.classList.contains('minimized') ? '➕' : '➖';
    });

    // 关闭
    closeButton.addEventListener('click', () => {
      closeGamePanel();
    });

    // 双击标题重置位置
    title.addEventListener('dblclick', () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const panelWidth = Math.min(600, screenWidth * 0.8);
      const panelHeight = Math.min(500, screenHeight * 0.8);

      panel.style.left = (screenWidth - panelWidth) / 2 + 'px';
      panel.style.top = (screenHeight - panelHeight) / 2 + 'px';
    });

    // 游戏项点击
    gameItems.forEach(item => {
      item.addEventListener('click', () => {
        const url = item.dataset.url;
        if (url) {
          loadGame(url);
        }
      });
    });

    // 添加游戏
    addGameButton.addEventListener('click', () => {
      showAddGameDialog();
    });

    // 返回按钮
    backButton.addEventListener('click', () => {
      gameContainer.style.display = 'none';
      gameGrid.style.display = 'grid';
      gameFrame.src = '';
    });

    // 尺寸控制
    sizeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const size = button.dataset.size;
        if (size === 'fullscreen') {
          panel.classList.add('fullscreen');
        } else {
          panel.classList.remove('fullscreen');
        }
      });
    });

    // 拖拽
    makeDraggable(panel.querySelector('.game-panel-header'));

    function loadGame(url) {
      gameGrid.style.display = 'none';
      gameContainer.style.display = 'block';
      gameFrame.src = url;

      console.log('[游戏合集] 加载游戏:', url);
    }
  }

  // 关闭游戏面板
  function closeGamePanel() {
    if (gamePanel) {
      gamePanel.remove();
      gamePanel = null;
    }
    if (gameButton) {
      gameButton.style.display = 'flex';
    }
  }

  // 显示添加游戏对话框
  function showAddGameDialog() {
    const overlay = document.createElement('div');
    overlay.className = 'overlay active';

    const dialog = document.createElement('div');
    dialog.className = 'add-game-dialog';
    dialog.innerHTML = `
            <form class="add-game-form">
                <h3>添加新游戏</h3>
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

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);

    const form = dialog.querySelector('form');
    const cancelButton = dialog.querySelector('.cancel');

    form.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(form);

      const newGame = {
        id: generateId(),
        name: formData.get('name').trim(),
        icon: formData.get('icon').trim(),
        url: formData.get('url').trim(),
      };

      // 验证URL
      try {
        new URL(newGame.url);
      } catch {
        alert('请输入有效的URL');
        return;
      }

      const settings = getSettings();
      settings.games.push(newGame);
      saveSettings();

      closeDialog();

      // 重新创建面板
      createGamePanel();

      console.log('[游戏合集] 新游戏已添加:', newGame.name);
    });

    cancelButton.addEventListener('click', closeDialog);

    function closeDialog() {
      overlay.remove();
      dialog.remove();
    }
  }

  // 初始化扩展
  function initializeExtension() {
    if (isInitialized) {
      console.warn('[游戏合集] 扩展已初始化');
      return;
    }

    try {
      console.log('[游戏合集] 初始化开始');

      // 清理已存在的元素
      const existingButton = document.getElementById('game-collection-button');
      if (existingButton) {
        existingButton.remove();
      }

      const existingPanel = document.getElementById('game-collection-panel');
      if (existingPanel) {
        existingPanel.remove();
      }

      // 初始化设置
      getSettings();

      // 创建游戏按钮
      createGameButton();

      isInitialized = true;
      console.log('[游戏合集] 初始化完成');
    } catch (error) {
      console.error('[游戏合集] 初始化失败:', error);
    }
  }

  // 清理函数
  function cleanup() {
    if (gameButton) {
      gameButton.remove();
      gameButton = null;
    }
    if (gamePanel) {
      gamePanel.remove();
      gamePanel = null;
    }
    isInitialized = false;
    console.log('[游戏合集] 已清理');
  }

  // 多种初始化方式确保扩展能正常启动
  function tryInitialize() {
    console.log('[游戏合集] 尝试初始化...');

    if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
      initializeExtension();
    } else {
      console.log('[游戏合集] SillyTavern未就绪，等待中...');
      setTimeout(tryInitialize, 500);
    }
  }

  // 方法1: 监听APP_READY事件
  if (typeof eventSource !== 'undefined' && eventSource && event_types) {
    eventSource.on(event_types.APP_READY, () => {
      console.log('[游戏合集] 接收到APP_READY事件');
      setTimeout(() => {
        initializeExtension();
      }, 1000);
    });
  }

  // 方法2: jQuery ready事件（[[memory:2339685]]）
  $(document).ready(() => {
    console.log('[游戏合集] Document ready');
    setTimeout(tryInitialize, 1500);
  });

  // 方法3: 延迟初始化备用方案
  setTimeout(() => {
    if (!isInitialized) {
      console.log('[游戏合集] 执行备用初始化');
      tryInitialize();
    }
  }, 3000);

  // 页面卸载时清理
  window.addEventListener('beforeunload', cleanup);

  console.log('[游戏合集] 扩展脚本已加载');
})();






























