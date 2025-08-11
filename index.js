/**
 * 小游戏合集扩展
 */

const MODULE_NAME = 'mini-games-collection';

// 配置
const defaultSettings = {
  panelPosition: { x: 20, y: 50 },
  panelSize: { width: 400, height: 750 },
  customGames: [],
};

const builtInGames = [
  {
    name: '贪吃蛇',
    icon: '🐍',
    file: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/Gluttonous_Snake.html',
    description: '经典贪吃蛇游戏',
  },
  {
    name: '种田',
    icon: '🌾',
    file: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/Farming.html',
    description: '休闲种田游戏',
  },
  {
    name: '飞行棋',
    icon: '✈️',
    file: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/Flight_chess.html',
    description: '经典飞行棋游戏',
  },
  {
    name: 'Nyan Cat',
    icon: '🐱',
    file: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/Nyan_Cat.html',
    description: '彩虹猫跑酷游戏',
  },
  {
    name: '扫雷',
    icon: '💣',
    file: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/minesweeper.html',
    description: '经典扫雷游戏',
  },
  {
    name: '数独',
    icon: '🔢',
    file: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/shudoku.html',
    description: '数独益智游戏',
  },
];

// 全局变量
let gamePanel = null;
let isGamePanelVisible = false;
let settings = {};

// 工具函数
const isMobile = () =>
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
const getContext = () => SillyTavern.getContext();
const getSettings = () => {
  const { extensionSettings } = getContext();
  if (!extensionSettings[MODULE_NAME]) {
    extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
  }
  return extensionSettings[MODULE_NAME];
};
const saveSettings = () => getContext().saveSettingsDebounced();

// 创建面板HTML
function createPanelHTML() {
  settings = getSettings();
  const allGames = [...builtInGames, ...settings.customGames];
  const gamesHTML = allGames
    .map(
      game =>
        `<div class="game-item" data-game="${game.file}" title="${game.description}">
       <div class="game-icon">${game.icon}</div>
       <div class="game-name">${game.name}</div>
     </div>`,
    )
    .join('');

  return `
    <div id="mini-games-panel" class="mini-games-panel">
      <div class="panel-header draggable-handle">
        <div class="panel-title">
          <span class="title-icon">🎮</span>
          <span class="title-text">小游戏合集</span>
        </div>
        <div class="panel-controls">
          <button class="control-btn minimize-btn" title="最小化">−</button>
          <button class="control-btn close-btn" title="关闭">×</button>
        </div>
      </div>
      <div class="panel-content">
        <div class="games-grid">${gamesHTML}</div>
        <div class="panel-footer">
          <button class="add-game-btn">+ 添加外链游戏</button>
        </div>
      </div>
      <div class="game-iframe-container" style="display: none;">
        <div class="iframe-header">
          <button class="back-btn">← 返回游戏列表</button>
          <span class="current-game-title"></span>
        </div>
        <iframe class="game-iframe" 
                frameborder="0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-orientation-lock allow-popups allow-modals allow-downloads allow-top-navigation-by-user-activation"
                allow="accelerometer; gyroscope; gamepad; fullscreen; autoplay; keyboard-map; clipboard-read; clipboard-write"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
      ${isMobile() ? '<div class="resize-handle mobile-resize" title="拖拽调整大小">⌟</div>' : ''}
    </div>
  `;
}

// 创建面板
function createGamePanel() {
  if (gamePanel) gamePanel.remove();

  gamePanel = document.createElement('div');
  gamePanel.innerHTML = createPanelHTML();
  gamePanel = gamePanel.firstElementChild;

  // 设置位置和大小
  if (isMobile()) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    Object.assign(gamePanel.style, {
      position: 'fixed',
      top: '40px',
      left: '50%',
      width: Math.min(screenWidth - 20, 420) + 'px',
      height: Math.min(screenHeight - 80, 700) + 'px',
      transform: 'translateX(-50%)',
      zIndex: '999999',
      maxWidth: '95vw',
      maxHeight: '85vh',
    });
    gamePanel.classList.add('mobile-panel');
  } else {
    // 电脑端也根据屏幕高度动态调整
    const maxHeight = Math.min(window.innerHeight - 100, settings.panelSize.height);
    Object.assign(gamePanel.style, {
      position: 'fixed',
      left: settings.panelPosition.x + 'px',
      top: settings.panelPosition.y + 'px',
      width: settings.panelSize.width + 'px',
      height: maxHeight + 'px',
      zIndex: '10000',
    });
  }

  // 添加拖拽功能
  setupDragging(gamePanel);

  // 添加事件监听
  gamePanel.addEventListener('click', handleClick);
  if (isMobile()) {
    gamePanel.addEventListener('touchend', handleClick);
  }

  document.body.appendChild(gamePanel);
}

// 统一事件处理（合并桌面端和移动端逻辑）
function handleClick(event) {
  const target = event.target;
  const minimizeBtn = target.closest('.minimize-btn');
  const closeBtn = target.closest('.close-btn');
  const backBtn = target.closest('.back-btn');
  const addGameBtn = target.closest('.add-game-btn');
  const gameItem = target.closest('.game-item');

  if (!minimizeBtn && !closeBtn && !backBtn && !addGameBtn && !gameItem) return;

  event.preventDefault();
  event.stopPropagation();

  // 最小化按钮
  if (minimizeBtn) {
    const panelContent = gamePanel.querySelector('.panel-content');
    const gameContainer = gamePanel.querySelector('.game-iframe-container');
    const isMinimized = gamePanel.classList.contains('minimized');

    if (isMinimized) {
      // 展开：恢复到之前的状态
      gamePanel.classList.remove('minimized');

      // 先恢复尺寸，然后显示内容
      if (isMobile()) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        gamePanel.style.width = Math.min(screenWidth - 20, 420) + 'px';
        gamePanel.style.height = Math.min(screenHeight - 80, 700) + 'px';
      } else {
        const maxHeight = Math.min(window.innerHeight - 100, settings.panelSize.height);
        gamePanel.style.width = settings.panelSize.width + 'px';
        gamePanel.style.height = maxHeight + 'px';
      }

      // 延迟显示内容，让尺寸动画先执行
      setTimeout(() => {
        const wasShowingGame = gameContainer.dataset.wasVisible === 'true';

        if (wasShowingGame) {
          // 如果之前在玩游戏，恢复游戏界面
          panelContent.style.display = 'none';
          gameContainer.style.display = 'block';
          gameContainer.style.opacity = '1';
          gameContainer.style.transform = 'scale(1)';
        } else {
          // 如果之前在菜单，恢复菜单界面
          panelContent.style.display = 'block';
          panelContent.style.opacity = '1';
          panelContent.style.transform = 'scale(1)';
          gameContainer.style.display = 'none';
        }
      }, 200);

      minimizeBtn.textContent = '−';
      minimizeBtn.title = '最小化';
    } else {
      // 最小化：记住当前状态并折叠
      const isShowingGame = gameContainer.style.display === 'block';
      gameContainer.dataset.wasVisible = isShowingGame.toString();

      // 先淡出内容
      if (isShowingGame) {
        gameContainer.style.opacity = '0';
        gameContainer.style.transform = 'scale(0.95)';
      } else {
        panelContent.style.opacity = '0';
        panelContent.style.transform = 'scale(0.95)';
      }

      // 延迟添加最小化类和隐藏内容
      setTimeout(() => {
        gamePanel.classList.add('minimized');
        panelContent.style.display = 'none';
        gameContainer.style.display = 'none';

        // 设置最小化尺寸
        gamePanel.style.width = isMobile() ? '200px' : '250px';
        gamePanel.style.height = '50px';
      }, 150);

      minimizeBtn.textContent = '+';
      minimizeBtn.title = '展开';
    }
    return;
  }

  // 关闭按钮
  if (closeBtn) {
    hideGamePanel();
    return;
  }

  // 返回按钮
  if (backBtn) {
    gamePanel.querySelector('.panel-content').style.display = 'block';
    gamePanel.querySelector('.game-iframe-container').style.display = 'none';
    return;
  }

  // 添加游戏按钮
  if (addGameBtn) {
    const name = prompt('游戏名称:');
    const icon = prompt('游戏图标(emoji):');
    const url = prompt('游戏链接:');
    if (name && icon && url) {
      settings.customGames.push({ name, icon, file: url, description: name });
      saveSettings();
      createGamePanel();
      if (isGamePanelVisible) gamePanel.style.display = 'block';
    }
    return;
  }

  // 游戏项点击
  if (gameItem) {
    loadGame(gameItem.dataset.game, gameItem.querySelector('.game-name').textContent);
    return;
  }
}

// 加载游戏（简化但保持功能完整）
async function loadGame(url, name) {
  const iframe = gamePanel.querySelector('.game-iframe');
  const titleEl = gamePanel.querySelector('.current-game-title');

  titleEl.textContent = name;
  gamePanel.querySelector('.panel-content').style.display = 'none';
  gamePanel.querySelector('.game-iframe-container').style.display = 'block';

  // 显示加载动画
  iframe.srcdoc = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f8f9fa;">
      <div style="font-size: 48px; margin-bottom: 20px;">🎮</div>
      <h2 style="color: #667eea; margin-bottom: 10px;">正在加载游戏...</h2>
      <p style="color: #666; font-size: 14px;">${name}</p>
      <div style="margin-top: 20px;">
        <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
      <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        </div>
  `;

  try {
    const response = await fetch(url);
    const html = await response.text();

    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

    // 检测是否需要jQuery
    const needsJQuery = html.includes('$(') || html.includes('jQuery(') || html.includes('$.');

    let headContent = `<base href="${baseUrl}">`;

    // 如果需要jQuery就注入
    if (needsJQuery) {
      headContent += `<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>`;
    }

    headContent += `<style>
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
      }
      canvas {
        width: 100% !important;
        height: auto !important;
      }
    </style>`;

    let finalHtml = html;
    if (html.includes('<head>')) {
      finalHtml = html.replace('<head>', '<head>' + headContent);
    } else if (html.includes('<html>')) {
      finalHtml = html.replace('<html>', '<html><head>' + headContent + '</head>');
    } else {
      finalHtml = headContent + html;
    }

    iframe.srcdoc = finalHtml;
  } catch (error) {
    iframe.srcdoc = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5;">
        <h2 style="color: #ff4757; margin-bottom: 20px;">🚫 游戏加载失败</h2>
        <p style="color: #666; margin-bottom: 10px;">无法加载游戏: ${name}</p>
        <div style="margin-top: 20px;">
          <a href="${url}" target="_blank" style="padding: 10px 20px; background: #48dbfb; color: white; text-decoration: none; border-radius: 5px;">新窗口打开</a>
        </div>
      </div>
    `;
  }
}

// 拖拽功能
function setupDragging(panel) {
  const handle = panel.querySelector('.draggable-handle');
  const resizeHandle = panel.querySelector('.resize-handle');
  if (!handle) return;

  let isDragging = false;
  let isResizing = false;
  let startX, startY, initialX, initialY, initialWidth, initialHeight;

  // 拖拽事件
  handle.addEventListener('mousedown', startDrag);
  handle.addEventListener('touchstart', startDragTouch, { passive: false });

  // 调整大小事件（仅手机端）
  if (resizeHandle && isMobile()) {
    resizeHandle.addEventListener('touchstart', startResize, { passive: false });
  }

  // 全局事件
  document.addEventListener('mousemove', handleMove);
  document.addEventListener('mouseup', stopAll);
  document.addEventListener('touchmove', handleMoveTouch, { passive: false });
  document.addEventListener('touchend', stopAll);

  function startDrag(e) {
    // 不要在按钮上开始拖拽
    if (e.target.closest('.control-btn')) return;

    isDragging = true;
    handle.style.cursor = 'grabbing';
    panel.style.userSelect = 'none';

    startX = e.clientX;
    startY = e.clientY;
    initialX = panel.offsetLeft;
    initialY = panel.offsetTop;

    e.preventDefault();
  }

  function startDragTouch(e) {
    // 不要在按钮上开始拖拽
    if (e.target.closest('.control-btn')) return;

    isDragging = true;
    handle.style.cursor = 'grabbing';
    panel.style.userSelect = 'none';

    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    initialX = panel.offsetLeft;
    initialY = panel.offsetTop;

    e.preventDefault();
  }

  function startResize(e) {
    isResizing = true;
    panel.style.userSelect = 'none';

    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    initialWidth = panel.offsetWidth;
    initialHeight = panel.offsetHeight;

    e.preventDefault();
    e.stopPropagation();
  }

  function handleMove(e) {
    if (isDragging) {
      drag(e);
    }
  }

  function handleMoveTouch(e) {
    if (isDragging) {
      dragTouch(e);
    } else if (isResizing) {
      resize(e);
    }
  }

  function drag(e) {
    e.preventDefault();

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newX = initialX + deltaX;
    let newY = initialY + deltaY;

    // 边界检测
    const panelRect = panel.getBoundingClientRect();
    const maxX = window.innerWidth - panelRect.width;
    const maxY = window.innerHeight - panelRect.height;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    panel.style.left = newX + 'px';
    panel.style.top = newY + 'px';

    // 移动端居中变换要清除
    if (isMobile()) {
      panel.style.transform = 'none';
    }
  }

  function dragTouch(e) {
    if (!isDragging) return;

    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    let newX = initialX + deltaX;
    let newY = initialY + deltaY;

    // 边界检测
    const panelRect = panel.getBoundingClientRect();
    const maxX = window.innerWidth - panelRect.width;
    const maxY = window.innerHeight - panelRect.height;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    panel.style.left = newX + 'px';
    panel.style.top = newY + 'px';

    // 移动端居中变换要清除
    if (isMobile()) {
      panel.style.transform = 'none';
    }
  }

  function resize(e) {
    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    let newWidth = initialWidth + deltaX;
    let newHeight = initialHeight + deltaY;

    // 最小和最大尺寸限制（手机端）
    const minWidth = 300;
    const minHeight = 400;
    const maxWidth = window.innerWidth * 0.95;
    const maxHeight = window.innerHeight * 0.9;

    newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

    panel.style.width = newWidth + 'px';
    panel.style.height = newHeight + 'px';
  }

  function stopAll() {
    if (isDragging) {
      isDragging = false;
      handle.style.cursor = 'grab';
      panel.style.userSelect = '';

      // 保存新位置到设置（只在电脑端保存）
      if (!isMobile()) {
        settings.panelPosition.x = panel.offsetLeft;
        settings.panelPosition.y = panel.offsetTop;
        saveSettings();
      }
    }

    if (isResizing) {
      isResizing = false;
      panel.style.userSelect = '';
      // 手机端调整大小后不保存到设置，保持响应式
    }
  }

  // 初始样式
  handle.style.cursor = 'grab';
}

// 面板控制
function showGamePanel() {
  if (!gamePanel) {
    settings = getSettings();
    createGamePanel();
  }
  gamePanel.style.display = 'block';
  isGamePanelVisible = true;
}

function hideGamePanel() {
  if (gamePanel) gamePanel.style.display = 'none';
  isGamePanelVisible = false;
}

function toggleGamePanel() {
  isGamePanelVisible ? hideGamePanel() : showGamePanel();
}

// 创建扩展按钮（保持原有逻辑不变）
function createExtensionButton() {
  if (document.querySelector('#mini-games-button')) return;

  const button = document.createElement('div');
  Object.assign(button, {
    id: 'mini-games-button',
    className: 'menu_button menu_button_icon',
    innerHTML: '🎮',
    title: '小游戏合集',
    onclick: toggleGamePanel,
  });

  // 尝试添加到底部菜单，找不到才放到body
  const targets = ['#extensionsMenuButton', '#rm_button_panel', 'body'];
  for (const target of targets) {
    const container = document.querySelector(target);
    if (container) {
      if (target === '#extensionsMenuButton') {
        container.parentNode.insertBefore(button, container.nextSibling);
      } else {
        container.appendChild(button);
        if (target === 'body') {
          Object.assign(button.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: '9999',
            background: '#667eea',
            color: 'white',
            padding: '10px',
            borderRadius: '50%',
            cursor: 'pointer',
          });
        }
      }
      break;
    }
  }
}

// 初始化
function init() {
  settings = getSettings();
  createExtensionButton();
}

// 启动
function start() {
  if (typeof SillyTavern === 'undefined') {
    setTimeout(start, 500);
    return;
  }

  const context = SillyTavern.getContext();
  if (context?.eventSource?.on) {
    context.eventSource.on(context.event_types.APP_READY, init);
  } else {
    setTimeout(init, 1000);
  }
}

start();

// 调试接口
window.miniGamesDebug = {
  showPanel: showGamePanel,
  hidePanel: hideGamePanel,
  togglePanel: toggleGamePanel,
};































































































