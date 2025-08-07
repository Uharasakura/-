// SillyTavern 游戏合集扩展
(() => {
  'use strict';

  // 获取SillyTavern上下文
  const context = SillyTavern.getContext();
  const { extensionSettings, saveSettingsDebounced, eventSource, event_types } = context;

  // 扩展标识
  const EXTENSION_NAME = 'game_collection';

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
    panelPosition: { x: 0, y: 0 },
    gameWindowSize: 'normal',
  };

  // 全局状态
  let gameButton = null;
  let currentPanel = null;
  let isInitialized = false;

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
  function generateUniqueId() {
    return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 安全的URL验证和获取
  function getSafeGameUrl(url) {
    if (!url) {
      console.warn('[游戏合集] 游戏URL为空');
      return '';
    }

    try {
      // 检查是否为有效的HTTP(S) URL
      if (url.startsWith('http://') || url.startsWith('https://')) {
        new URL(url); // 验证URL格式
        return url;
      }
      console.warn('[游戏合集] 无效的游戏URL:', url);
      return '';
    } catch (error) {
      console.error('[游戏合集] URL解析错误:', error);
      return '';
    }
  }

  // 创建可拖拽功能
  function makeDraggable(element, savePositionCallback) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    const startDrag = e => {
      isDragging = true;
      startX = e.clientX || e.touches[0].clientX;
      startY = e.clientY || e.touches[0].clientY;

      const rect = element.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      element.style.cursor = 'grabbing';
      e.preventDefault();
    };

    const drag = e => {
      if (!isDragging) return;

      const currentX = e.clientX || e.touches[0].clientX;
      const currentY = e.clientY || e.touches[0].clientY;

      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      element.style.left = initialLeft + deltaX + 'px';
      element.style.top = initialTop + deltaY + 'px';
    };

    const stopDrag = () => {
      if (!isDragging) return;

      isDragging = false;
      element.style.cursor = 'move';

      // 保存位置
      if (savePositionCallback) {
        const rect = element.getBoundingClientRect();
        savePositionCallback(rect.left, rect.top);
      }
    };

    // 绑定事件
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('touchstart', startDrag);

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);

    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);

    // 设置初始样式
    element.style.cursor = 'move';
    element.style.userSelect = 'none';
    element.style.touchAction = 'none';

    return () => {
      element.removeEventListener('mousedown', startDrag);
      element.removeEventListener('touchstart', startDrag);
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('touchmove', drag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
    };
  }

  // 创建游戏按钮
  function createGameButton() {
    // 清理已存在的按钮
    if (gameButton) {
      gameButton.remove();
      gameButton = null;
    }

    const button = document.createElement('button');
    button.id = 'game-collection-button';
    button.className = 'game-icon-button';
    button.innerHTML = '🎮';
    button.title = '游戏合集';

    // 设置位置
    const settings = getSettings();
    button.style.left = settings.iconPosition.x + 'px';
    button.style.top = settings.iconPosition.y + 'px';

    // 点击事件
    button.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openGamePanel();
    });

    // 使按钮可拖拽
    makeDraggable(button, (x, y) => {
      const settings = getSettings();
      settings.iconPosition = { x, y };
      saveSettings();
    });

    document.body.appendChild(button);
    gameButton = button;

    console.log('[游戏合集] 游戏按钮已创建');
  }

  // 打开游戏面板
  function openGamePanel() {
    // 如果面板已存在，直接显示
    if (currentPanel && document.contains(currentPanel)) {
      currentPanel.style.display = 'block';
      if (gameButton) gameButton.style.display = 'none';
      return;
    }

    createGamePanel();
  }

  // 创建游戏面板
  function createGamePanel() {
    // 清理已存在的面板
    if (currentPanel) {
      currentPanel.remove();
      currentPanel = null;
    }

    const panel = document.createElement('div');
    panel.className = 'game-panel';
    panel.id = 'game-collection-panel';

    // 计算中央位置
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const panelWidth = Math.min(600, screenWidth * 0.8);
    const panelHeight = Math.min(500, screenHeight * 0.8);
    const centerX = (screenWidth - panelWidth) / 2;
    const centerY = (screenHeight - panelHeight) / 2;

    panel.style.left = centerX + 'px';
    panel.style.top = centerY + 'px';
    panel.style.width = panelWidth + 'px';
    panel.style.height = panelHeight + 'px';

    // 创建面板HTML
    panel.innerHTML = createPanelHTML();

    document.body.appendChild(panel);
    currentPanel = panel;

    // 绑定面板事件
    bindPanelEvents(panel);

    // 隐藏游戏按钮
    if (gameButton) gameButton.style.display = 'none';

    console.log('[游戏合集] 游戏面板已创建');
  }

  // 创建面板HTML
  function createPanelHTML() {
    const settings = getSettings();
    const gamesHTML = settings.games
      .map(
        game => `
      <div class="game-item" data-game-id="${game.id}" data-url="${getSafeGameUrl(game.url)}">
        <div class="game-icon">${game.icon}</div>
        <p class="game-name">${game.name}</p>
      </div>
    `,
      )
      .join('');

    return `
      <div class="game-panel-header">
        <h2 class="game-panel-title">小游戏合集</h2>
        <div class="game-panel-controls">
          <button class="game-panel-button minimize-button" title="最小化">➖</button>
          <button class="game-panel-button close-button" title="关闭">✖</button>
        </div>
      </div>
      <div class="game-grid">
        ${gamesHTML}
        <div class="add-game-button">
          <span class="add-game-icon">➕</span>
          <p class="add-game-text">添加游戏</p>
        </div>
      </div>
      <div class="game-container" style="display: none;"></div>
    `;
  }

  // 绑定面板事件
  function bindPanelEvents(panel) {
    const minimizeButton = panel.querySelector('.minimize-button');
    const closeButton = panel.querySelector('.close-button');
    const gameItems = panel.querySelectorAll('.game-item');
    const addGameButton = panel.querySelector('.add-game-button');
    const gameContainer = panel.querySelector('.game-container');
    const panelTitle = panel.querySelector('.game-panel-title');

    // 最小化按钮
    minimizeButton.addEventListener('click', () => {
      panel.classList.toggle('minimized');
      minimizeButton.textContent = panel.classList.contains('minimized') ? '➕' : '➖';
    });

    // 关闭按钮
    closeButton.addEventListener('click', () => {
      closeGamePanel();
    });

    // 双击标题重置位置
    panelTitle.addEventListener('dblclick', () => {
      resetPanelPosition(panel);
    });

    // 游戏项点击事件
    gameItems.forEach(item => {
      item.addEventListener('click', () => {
        const gameId = item.dataset.gameId;
        const url = item.dataset.url;

        if (!url) {
          console.error('[游戏合集] 游戏URL无效:', gameId);
          showErrorMessage('游戏链接无效，无法加载游戏');
          return;
        }

        loadGame(url, gameContainer, panel);
      });
    });

    // 添加游戏按钮
    addGameButton.addEventListener('click', () => {
      showAddGameDialog();
    });

    // 使面板可拖拽
    makeDraggable(panel, (x, y) => {
      const settings = getSettings();
      settings.panelPosition = { x, y };
      saveSettings();
    });
  }

  // 重置面板位置
  function resetPanelPosition(panel) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const panelWidth = Math.min(600, screenWidth * 0.8);
    const panelHeight = Math.min(500, screenHeight * 0.8);
    const centerX = (screenWidth - panelWidth) / 2;
    const centerY = (screenHeight - panelHeight) / 2;

    panel.style.left = centerX + 'px';
    panel.style.top = centerY + 'px';
    panel.style.transform = 'none';

    const settings = getSettings();
    settings.panelPosition = { x: centerX, y: centerY };
    saveSettings();
  }

  // 关闭游戏面板
  function closeGamePanel() {
    if (currentPanel) {
      currentPanel.remove();
      currentPanel = null;
    }

    if (gameButton) {
      gameButton.style.display = 'flex';
    }
  }

  // 加载游戏
  function loadGame(url, gameContainer, panel) {
    console.log('[游戏合集] 正在加载游戏:', url);

    // 创建游戏iframe
    const gameFrame = document.createElement('iframe');
    gameFrame.src = url;
    gameFrame.className = 'game-container normal';
    gameFrame.allow = 'fullscreen';
    gameFrame.sandbox = 'allow-scripts allow-same-origin allow-popups allow-forms allow-modals';

    // 创建返回按钮
    const backButton = document.createElement('button');
    backButton.className = 'game-panel-button';
    backButton.textContent = '返回';
    backButton.style.marginBottom = '10px';

    backButton.addEventListener('click', () => {
      gameContainer.style.display = 'none';
      panel.querySelector('.game-grid').style.display = 'grid';
    });

    // 清空容器并添加新内容
    gameContainer.innerHTML = '';
    gameContainer.appendChild(backButton);
    gameContainer.appendChild(gameFrame);
    gameContainer.style.display = 'block';

    // 隐藏游戏网格
    panel.querySelector('.game-grid').style.display = 'none';

    // 游戏加载事件监听
    gameFrame.addEventListener('load', () => {
      console.log('[游戏合集] 游戏加载成功:', url);
    });

    gameFrame.addEventListener('error', () => {
      console.error('[游戏合集] 游戏加载失败:', url);
      showErrorMessage('游戏加载失败，请检查网络连接或游戏链接');
    });
  }

  // 显示错误消息
  function showErrorMessage(message) {
    // 创建错误提示
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 10px;
      z-index: 10000;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    errorDiv.innerHTML = `
      <div style="margin-bottom: 15px;">${message}</div>
      <button onclick="this.parentElement.remove()" style="
        background: white;
        color: red;
        border: none;
        padding: 8px 16px;
        border-radius: 5px;
        cursor: pointer;
      ">确定</button>
    `;

    document.body.appendChild(errorDiv);

    // 3秒后自动移除
    setTimeout(() => {
      if (document.contains(errorDiv)) {
        errorDiv.remove();
      }
    }, 3000);
  }

  // 显示添加游戏对话框
  function showAddGameDialog() {
    const overlay = document.createElement('div');
    overlay.className = 'overlay active';

    const dialog = document.createElement('div');
    dialog.className = 'add-game-dialog';
    dialog.innerHTML = `
      <form class="add-game-form">
        <div class="form-group">
          <label class="form-label">游戏名称</label>
          <input type="text" class="form-input" name="name" required placeholder="请输入游戏名称">
        </div>
        <div class="form-group">
          <label class="form-label">图标 (emoji)</label>
          <input type="text" class="form-input" name="icon" required placeholder="🎮">
        </div>
        <div class="form-group">
          <label class="form-label">游戏URL</label>
          <input type="url" class="form-input" name="url" required placeholder="https://example.com/game.html">
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

    // 表单提交
    form.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(form);

      const newGame = {
        id: generateUniqueId(),
        name: formData.get('name').trim(),
        icon: formData.get('icon').trim(),
        url: formData.get('url').trim(),
      };

      // 验证URL
      const safeUrl = getSafeGameUrl(newGame.url);
      if (!safeUrl) {
        showErrorMessage('请输入有效的游戏URL（必须以http://或https://开头）');
        return;
      }

      newGame.url = safeUrl;

      // 添加到设置
      const settings = getSettings();
      settings.games.push(newGame);
      saveSettings();

      // 关闭对话框
      closeDialog();

      // 重新创建面板以显示新游戏
      createGamePanel();

      console.log('[游戏合集] 新游戏已添加:', newGame.name);
    });

    // 取消按钮
    cancelButton.addEventListener('click', closeDialog);

    function closeDialog() {
      dialog.remove();
      overlay.remove();
    }
  }

  // 初始化扩展
  function initializeExtension() {
    if (isInitialized) {
      console.warn('[游戏合集] 扩展已经初始化，跳过重复初始化');
      return;
    }

    console.log('[游戏合集] 正在初始化扩展...');

    try {
      // 初始化设置
      getSettings();

      // 创建游戏按钮
      createGameButton();

      isInitialized = true;
      console.log('[游戏合集] 扩展初始化完成');
    } catch (error) {
      console.error('[游戏合集] 扩展初始化失败:', error);
    }
  }

  // 清理函数
  function cleanup() {
    console.log('[游戏合集] 正在清理扩展...');

    if (gameButton) {
      gameButton.remove();
      gameButton = null;
    }

    if (currentPanel) {
      currentPanel.remove();
      currentPanel = null;
    }

    isInitialized = false;
  }

  // 监听APP_READY事件
  eventSource.on(event_types.APP_READY, () => {
    console.log('[游戏合集] 接收到APP_READY事件');
    initializeExtension();
  });

  // 监听页面卸载事件
  window.addEventListener('beforeunload', cleanup);

  console.log('[游戏合集] 扩展脚本已加载');
})();



























