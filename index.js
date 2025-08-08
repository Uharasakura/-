/**
 * 小游戏合集扩展 - 真正简化版（保持所有功能不变）
 */

const MODULE_NAME = 'mini-games-collection';

// 配置
const defaultSettings = {
  panelPosition: { x: 20, y: 50 },
  panelSize: { width: 400, height: 500 },
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

// 根据游戏调整面板大小
function adjustPanelForGame(gameName) {
  if (!gamePanel) return;

  // 不同游戏的推荐尺寸
  const gameConfig = {
    贪吃蛇: { width: 450, height: 600, minWidth: 350, minHeight: 500 },
    种田: { width: 600, height: 700, minWidth: 500, minHeight: 600 },
    飞行棋: { width: 650, height: 650, minWidth: 500, minHeight: 500 },
    'Nyan Cat': { width: 550, height: 400, minWidth: 450, minHeight: 350 },
    扫雷: { width: 500, height: 600, minWidth: 400, minHeight: 500 },
    数独: { width: 500, height: 600, minWidth: 400, minHeight: 500 },
  };

  const config = gameConfig[gameName] || { width: 500, height: 600, minWidth: 400, minHeight: 500 };

  if (isMobile()) {
    // 移动端：适应屏幕，但确保有足够空间
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const panelWidth = Math.min(Math.max(config.minWidth, screenWidth - 40), config.width);
    const panelHeight = Math.min(Math.max(config.minHeight, screenHeight - 100), config.height);

    Object.assign(gamePanel.style, {
      width: panelWidth + 'px',
      height: panelHeight + 'px',
      maxWidth: '95vw',
      maxHeight: '90vh',
    });
  } else {
    // 桌面端：使用推荐尺寸，但不超过屏幕
    const maxWidth = Math.min(window.innerWidth - 100, config.width);
    const maxHeight = Math.min(window.innerHeight - 100, config.height);

    Object.assign(gamePanel.style, {
      width: maxWidth + 'px',
      height: maxHeight + 'px',
    });
  }

  console.log(`为游戏 ${gameName} 调整面板尺寸: ${gamePanel.style.width} x ${gamePanel.style.height}`);
}

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
      <div class="panel-header">
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
    Object.assign(gamePanel.style, {
      position: 'fixed',
      left: settings.panelPosition.x + 'px',
      top: settings.panelPosition.y + 'px',
      width: settings.panelSize.width + 'px',
      height: settings.panelSize.height + 'px',
      zIndex: '10000',
    });
  }

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
    const isMinimized = panelContent.style.display === 'none' && gameContainer.style.display === 'none';

    if (isMinimized) {
      // 展开：恢复到之前的状态
      const wasShowingGame = gameContainer.dataset.wasVisible === 'true';

      if (wasShowingGame) {
        // 如果之前在玩游戏，恢复游戏界面
        panelContent.style.display = 'none';
        gameContainer.style.display = 'block';
      } else {
        // 如果之前在菜单，恢复菜单界面
        panelContent.style.display = 'block';
        gameContainer.style.display = 'none';
      }

      gamePanel.style.height = '';
      minimizeBtn.textContent = '−';
      minimizeBtn.title = '最小化';
    } else {
      // 最小化：记住当前状态
      const isShowingGame = gameContainer.style.display === 'block';
      gameContainer.dataset.wasVisible = isShowingGame.toString();

      panelContent.style.display = 'none';
      gameContainer.style.display = 'none';
      gamePanel.style.height = '50px';
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
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    let html = await response.text();

    // jQuery检测和注入
    const usesJQuery = html.includes('$(') || html.includes('jQuery(');
    const hasJQuery = html.includes('jquery') || html.includes('jQuery');

    // 处理jQuery依赖和iframe适配
    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
    let headContent = `<base href="${baseUrl}">`;

    if (usesJQuery && !hasJQuery) {
      headContent += `<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>`;
    }

    // 添加iframe适配CSS，让游戏适应容器而不是全屏
    headContent += `
      <style>
        /* iframe适配样式 - 覆盖游戏的全屏设置 */
        html, body {
          margin: 0 !important;
          padding: 10px !important;
          min-height: auto !important;
          height: auto !important;
          overflow: auto !important;
          box-sizing: border-box !important;
        }
        
        /* 让游戏容器适应iframe */
        #game-container, .game-container, .container {
          max-width: none !important;
          width: 100% !important;
          margin: 0 auto !important;
          min-height: auto !important;
        }
        
        /* 调整使用vmin/vh单位的元素 */
        [style*="vmin"], [style*="vh"], [style*="vw"] {
          max-width: 90% !important;
          max-height: 80vh !important;
        }
        
        /* 确保canvas等游戏元素不会太大 */
        canvas {
          max-width: 100% !important;
          max-height: 70vh !important;
        }
      </style>
    `;

    // 注入到HTML
    if (html.includes('<head>')) {
      html = html.replace('<head>', '<head>' + headContent);
    } else if (html.includes('<html>')) {
      html = html.replace('<html>', '<html><head>' + headContent + '</head>');
    } else {
      html = headContent + html;
    }

    iframe.srcdoc = html;

    // 动态调整面板大小以适应游戏内容
    setTimeout(() => {
      adjustPanelForGame(name);
    }, 1000);
  } catch (error) {
    // 尝试备用CDN
    const backupUrls = [
      url.replace('cdn.jsdelivr.net/gh/', 'raw.githack.com/'),
      url.replace('cdn.jsdelivr.net/gh/', 'gitcdn.xyz/repo/'),
    ];

    let loaded = false;
    for (const backupUrl of backupUrls) {
      try {
        const response = await fetch(backupUrl);
        if (response.ok) {
          iframe.srcdoc = await response.text();
          loaded = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!loaded) {
      iframe.srcdoc = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5;">
          <h2 style="color: #ff4757; margin-bottom: 20px;">🚫 游戏加载失败</h2>
          <p style="color: #666; margin-bottom: 10px;">无法加载游戏: ${name}</p>
          <div style="margin-top: 20px;">
            <button onclick="location.reload()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">刷新重试</button>
            <a href="${url}" target="_blank" style="padding: 10px 20px; background: #48dbfb; color: white; text-decoration: none; border-radius: 5px;">新窗口打开</a>
          </div>
        </div>
      `;
    }
  }
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















































































