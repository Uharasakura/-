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

  // 不同游戏的推荐尺寸和特性
  const gameConfig = {
    贪吃蛇: {
      width: 450,
      height: 600,
      minWidth: 350,
      minHeight: 500,
      aspectRatio: 0.75,
      type: 'portrait',
    },
    种田: {
      width: 600,
      height: 700,
      minWidth: 500,
      minHeight: 600,
      aspectRatio: 0.86,
      type: 'portrait',
    },
    飞行棋: {
      width: 650,
      height: 650,
      minWidth: 500,
      minHeight: 500,
      aspectRatio: 1.0,
      type: 'square',
    },
    'Nyan Cat': {
      width: 700,
      height: 450,
      minWidth: 550,
      minHeight: 350,
      aspectRatio: 1.56,
      type: 'landscape',
    },
    扫雷: {
      width: 500,
      height: 600,
      minWidth: 400,
      minHeight: 500,
      aspectRatio: 0.83,
      type: 'portrait',
    },
    数独: {
      width: 500,
      height: 600,
      minWidth: 400,
      minHeight: 500,
      aspectRatio: 0.83,
      type: 'portrait',
    },
  };

  const config = gameConfig[gameName] || {
    width: 500,
    height: 600,
    minWidth: 400,
    minHeight: 500,
    aspectRatio: 0.83,
    type: 'portrait',
  };

  if (isMobile()) {
    // 移动端：适应屏幕，但保持游戏比例
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const availableWidth = screenWidth - 40;
    const availableHeight = screenHeight - 120;

    let panelWidth, panelHeight;

    if (config.type === 'landscape') {
      // 横屏游戏：优先考虑宽度
      panelWidth = Math.min(availableWidth, config.width);
      panelHeight = Math.min(panelWidth / config.aspectRatio, availableHeight);
      panelWidth = panelHeight * config.aspectRatio;
    } else {
      // 竖屏游戏：优先考虑高度
      panelHeight = Math.min(availableHeight, config.height);
      panelWidth = Math.min(panelHeight * config.aspectRatio, availableWidth);
      panelHeight = panelWidth / config.aspectRatio;
    }

    // 确保不小于最小尺寸
    panelWidth = Math.max(panelWidth, config.minWidth);
    panelHeight = Math.max(panelHeight, config.minHeight);

    Object.assign(gamePanel.style, {
      width: panelWidth + 'px',
      height: panelHeight + 'px',
      maxWidth: '95vw',
      maxHeight: '90vh',
    });
  } else {
    // 桌面端：使用推荐尺寸，但适应屏幕
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const availableWidth = screenWidth - 100;
    const availableHeight = screenHeight - 100;

    let panelWidth = Math.min(config.width, availableWidth);
    let panelHeight = Math.min(config.height, availableHeight);

    // 保持宽高比
    if (panelWidth / panelHeight > config.aspectRatio) {
      panelWidth = panelHeight * config.aspectRatio;
    } else {
      panelHeight = panelWidth / config.aspectRatio;
    }

    Object.assign(gamePanel.style, {
      width: panelWidth + 'px',
      height: panelHeight + 'px',
    });
  }
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

    // 添加iframe适配CSS和JavaScript，让游戏完全适应容器
    headContent += `
      <style>
        /* iframe适配样式 - 让游戏完全适应容器 */
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 100% !important;
          max-height: 100% !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
          position: relative !important;
        }
        
        /* 游戏容器自适应 */
        .game-container, #game-container, .container, main, #main {
          width: 100% !important;
          height: 100% !important;
          min-width: 100% !important;
          min-height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          position: relative !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
        }
        
        /* Canvas元素自适应 */
        canvas {
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain !important;
          display: block !important;
          margin: 0 auto !important;
        }
        
        /* 覆盖使用视口单位的样式 */
        [style*="100vh"], [style*="100vw"], [style*="100vmin"], [style*="100vmax"] {
          width: 100% !important;
          height: 100% !important;
        }
        
        [style*="vh"], [style*="vw"], [style*="vmin"], [style*="vmax"] {
          max-width: 100% !important;
          max-height: 100% !important;
        }
        
        /* 固定定位元素适配 */
        [style*="position: fixed"], [style*="position:fixed"] {
          position: absolute !important;
        }
        
        /* 游戏控制界面适配 */
        .controls, .control-panel, .ui, .hud, .header {
          position: relative !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        
        /* 特殊游戏适配 */
        /* 彩虹猫游戏 */
        #cat, .cat, .nyan-cat {
          max-width: 15% !important;
          max-height: 15% !important;
        }
        
        /* 扫雷游戏 */
        .minefield, #minefield, .board {
          max-width: 100% !important;
          max-height: 80% !important;
          margin: 0 auto !important;
          overflow: auto !important;
        }
        
        /* 贪吃蛇游戏 */
        .snake-game, #snake-game {
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
        }
      </style>
      
      <script>
        // 游戏自适应脚本
        (function() {
          let resizeTimeout;
          
          function adaptGameToContainer() {
            const container = document.body;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            // 查找主要游戏元素
            const gameElements = [
              document.querySelector('canvas'),
              document.querySelector('.game-container'),
              document.querySelector('#game-container'),
              document.querySelector('.container'),
              document.querySelector('main'),
              document.querySelector('#main')
            ].filter(el => el);
            
            gameElements.forEach(element => {
              if (element) {
                // 设置容器尺寸
                element.style.width = '100%';
                element.style.height = '100%';
                element.style.maxWidth = '100%';
                element.style.maxHeight = '100%';
                
                // 如果是canvas，调整其实际尺寸
                if (element.tagName === 'CANVAS') {
                  const rect = element.getBoundingClientRect();
                  const scale = Math.min(
                    containerWidth / (element.width || rect.width || 800),
                    containerHeight / (element.height || rect.height || 600)
                  );
                  
                  if (scale < 1) {
                    element.style.transform = \`scale(\${scale})\`;
                    element.style.transformOrigin = 'center center';
                  }
                }
              }
            });
            
            // 处理固定定位元素
            document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]').forEach(el => {
              el.style.position = 'absolute';
            });
            
            // 处理视口单位
            const vhElements = document.querySelectorAll('[style*="vh"], [style*="vw"]');
            vhElements.forEach(el => {
              const style = el.getAttribute('style') || '';
              if (style.includes('100vh') || style.includes('100vw')) {
                el.style.width = '100%';
                el.style.height = '100%';
              }
            });
            
            // 特殊游戏处理
            adaptSpecificGames();
          }
          
          function adaptSpecificGames() {
            // 彩虹猫游戏特殊处理
            const cat = document.querySelector('#cat, .cat, .nyan-cat');
            if (cat) {
              cat.style.maxWidth = '15%';
              cat.style.maxHeight = '15%';
            }
            
            // 扫雷游戏特殊处理
            const minefield = document.querySelector('.minefield, #minefield, .board');
            if (minefield) {
              minefield.style.maxWidth = '100%';
              minefield.style.maxHeight = '80%';
              minefield.style.overflow = 'auto';
              minefield.style.margin = '0 auto';
            }
            
            // 如果有表格布局的游戏（如扫雷）
            const tables = document.querySelectorAll('table');
            tables.forEach(table => {
              table.style.maxWidth = '100%';
              table.style.height = 'auto';
              table.style.fontSize = 'clamp(10px, 2vw, 16px)';
            });
          }
          
          // 监听窗口大小变化
          function handleResize() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(adaptGameToContainer, 100);
          }
          
          // 初始化
          function init() {
            adaptGameToContainer();
            window.addEventListener('resize', handleResize);
            
            // 监听iframe大小变化（如果支持ResizeObserver）
            if (window.ResizeObserver && document.body) {
              const resizeObserver = new ResizeObserver(handleResize);
              resizeObserver.observe(document.body);
            }
            
            // 延迟执行，确保游戏元素已加载
            setTimeout(adaptGameToContainer, 500);
            setTimeout(adaptGameToContainer, 1000);
            setTimeout(adaptGameToContainer, 2000);
          }
          
          // 监听来自父窗口的适配消息
          window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'GAME_ADAPT') {
              adaptGameToContainer();
            }
          });
          
          // 等待DOM加载完成
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
          } else {
            init();
          }
        })();
      </script>
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
      // 设置iframe大小变化监听
      setupIframeResizeListener();
      // 向iframe发送适配消息
      sendAdaptationMessage(iframe, name);
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

// 向iframe发送适配消息
function sendAdaptationMessage(iframe, gameName) {
  if (!iframe || !iframe.contentWindow) return;

  try {
    const message = {
      type: 'GAME_ADAPT',
      gameName: gameName,
      containerSize: {
        width: iframe.clientWidth,
        height: iframe.clientHeight,
      },
    };

    iframe.contentWindow.postMessage(message, '*');
  } catch (error) {
    // 静默处理错误
  }
}

// 监听iframe大小变化并重新适配
function setupIframeResizeListener() {
  if (!gamePanel) return;

  const iframe = gamePanel.querySelector('.game-iframe');
  if (!iframe) return;

  // 使用ResizeObserver监听iframe大小变化
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const currentGame = gamePanel.querySelector('.current-game-title')?.textContent;
        if (currentGame && iframe.contentWindow) {
          sendAdaptationMessage(iframe, currentGame);
        }
      }
    });

    resizeObserver.observe(iframe);
  }
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





















































































