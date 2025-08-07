/**
 * 小游戏合集扩展 - 精简版
 */

const MODULE_NAME = 'mini-games-collection';
const extensionFolderPath = '/scripts/extensions/third-party/各种小游戏';

const defaultSettings = {
  panelPosition: { x: 20, y: 50 },
  panelSize: { width: 400, height: 500 }, // 更合理的默认大小
  isMinimized: false,
  customGames: [],
};

// 内置游戏列表 - 使用支持iframe的CDN链接
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

// 让游戏面板适应内容，不强制固定尺寸
const optimizePanelForGame = gameName => {
  if (!gamePanel) return;

  // 移动端确保面板不会太小，但让游戏自适应
  if (isMobile()) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // 给游戏充足的显示空间，但不强制具体尺寸
    const minWidth = Math.min(350, screenWidth - 20);
    const minHeight = Math.min(400, screenHeight - 80);
    const maxWidth = screenWidth - 20;
    const maxHeight = screenHeight - 60;

    Object.assign(gamePanel.style, {
      minWidth: minWidth + 'px',
      minHeight: minHeight + 'px',
      maxWidth: maxWidth + 'px',
      maxHeight: maxHeight + 'px',
      width: 'auto', // 让内容决定宽度
      height: 'auto', // 让内容决定高度
      left: '50%',
      transform: 'translateX(-50%)',
      top: '30px',
    });
  }

  console.log(`优化面板显示: ${gameName} - 让游戏自适应容器大小`);
};

// 创建游戏面板HTML
function createGamePanelHTML() {
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
    <div id="mini-games-panel" class="mini-games-panel ${settings.isMinimized ? 'minimized' : ''}">
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
                 src="" 
                 frameborder="0"
                 sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-orientation-lock allow-popups allow-modals allow-downloads allow-top-navigation-by-user-activation"
                 allow="accelerometer; gyroscope; gamepad; fullscreen; autoplay; keyboard-map; clipboard-read; clipboard-write"
                 loading="lazy"
                 referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </div>
  `;
}

// 创建游戏面板
function createGamePanel() {
  if (gamePanel) gamePanel.remove();

  gamePanel = document.createElement('div');
  gamePanel.innerHTML = createGamePanelHTML();
  gamePanel = gamePanel.firstElementChild;

  if (isMobile()) {
    // 移动端适中大小的面板 - 增加游戏显示空间
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const panelWidth = Math.min(screenWidth - 20, 420);
    const panelHeight = Math.min(screenHeight - 80, 700);

    Object.assign(gamePanel.style, {
      position: 'fixed',
      top: '40px',
      left: '50%',
      width: panelWidth + 'px',
      height: panelHeight + 'px',
      transform: 'translateX(-50%)',
      zIndex: '999999',
      maxWidth: '95vw',
      maxHeight: '85vh',
    });
    gamePanel.classList.add('mobile-panel');
  } else {
    // 桌面端
    Object.assign(gamePanel.style, {
      position: 'fixed',
      left: settings.panelPosition.x + 'px',
      top: settings.panelPosition.y + 'px',
      width: settings.panelSize.width + 'px',
      height: settings.panelSize.height + 'px',
      zIndex: '10000',
    });
  }

  addEventListeners();
  document.body.appendChild(gamePanel);
}

// 添加事件监听器
function addEventListeners() {
  const $ = sel => gamePanel.querySelector(sel);

  // 控制按钮
  $('.minimize-btn').onclick = () => {
    settings.isMinimized = !settings.isMinimized;
    gamePanel.classList.toggle('minimized', settings.isMinimized);
    saveSettings();
  };
  $('.close-btn').onclick = hideGamePanel;
  $('.back-btn').onclick = () => {
    $('.panel-content').style.display = 'block';
    $('.game-iframe-container').style.display = 'none';
  };

  // 游戏项点击
  gamePanel.querySelectorAll('.game-item').forEach(item => {
    item.onclick = () => {
      const gameFile = item.dataset.game;
      const gameName = item.querySelector('.game-name').textContent;

      // 直接使用gameFile，因为现在都是完整的URL
      const gameUrl = gameFile;

      const iframe = $('.game-iframe');
      $('.current-game-title').textContent = gameName;
      $('.panel-content').style.display = 'none';
      $('.game-iframe-container').style.display = 'block';

      // 优化面板显示，让游戏自适应
      optimizePanelForGame(gameName);

      // 显示加载指示器
      iframe.srcdoc = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f8f9fa;">
          <div style="font-size: 48px; margin-bottom: 20px;">🎮</div>
          <h2 style="color: #667eea; margin-bottom: 10px;">正在加载游戏...</h2>
          <p style="color: #666; font-size: 14px;">${gameName}</p>
          <div style="margin-top: 20px;">
            <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
          <style>
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </div>
      `;

      // 使用fetch获取HTML内容并通过srcdoc渲染
      console.log(`正在加载游戏: ${gameName} - ${gameUrl}`);

      const loadGameWithFetch = async (url, attempt = 0) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const htmlContent = await response.text();
          console.log(`游戏HTML获取成功: ${url}`);

          // 使用srcdoc直接渲染HTML内容，并确保游戏正确初始化
          iframe.srcdoc = htmlContent;

          // 等待iframe加载完成，然后尝试初始化游戏
          iframe.onload = () => {
            console.log(`游戏iframe加载完成: ${gameName}`);

            // 给游戏一些时间来初始化
            setTimeout(() => {
              try {
                // 尝试触发游戏的初始化（如果有的话）
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const gameCanvas = iframeDoc.querySelector('canvas');
                if (gameCanvas) {
                  console.log(`找到游戏Canvas: ${gameName}`);
                  // 触发一次resize事件，帮助游戏重新计算尺寸
                  iframe.contentWindow.dispatchEvent(new Event('resize'));
                }
              } catch (e) {
                console.log(`游戏初始化检查失败: ${e.message}`);
              }
            }, 500);
          };
        } catch (error) {
          console.log(`游戏加载失败 (尝试 ${attempt + 1}): ${url}`, error);

          if (attempt < 2) {
            // 尝试备用CDN
            const backupUrls = [
              gameUrl.replace('cdn.jsdelivr.net/gh/', 'raw.githack.com/'),
              gameUrl.replace('cdn.jsdelivr.net/gh/', 'gitcdn.xyz/repo/'),
            ];

            if (attempt < backupUrls.length) {
              setTimeout(() => loadGameWithFetch(backupUrls[attempt], attempt + 1), 1000);
              return;
            }
          }

          // 所有方法都失败，显示错误页面
          iframe.srcdoc = `
             <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5;">
               <h2 style="color: #ff4757; margin-bottom: 20px;">🚫 游戏加载失败</h2>
               <p style="color: #666; margin-bottom: 10px;">无法加载游戏: ${gameName}</p>
               <p style="color: #666; font-size: 12px;">已尝试多个CDN源，可能是网络问题</p>
               <div style="margin-top: 20px;">
                 <button onclick="location.reload()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">刷新重试</button>
                 <a href="${gameUrl}" target="_blank" style="padding: 10px 20px; background: #48dbfb; color: white; text-decoration: none; border-radius: 5px;">新窗口打开</a>
            </div>
            </div>
           `;
        }
      };

      loadGameWithFetch(gameUrl);
    };
  });

  // 添加游戏按钮
  $('.add-game-btn').onclick = () => {
    const name = prompt('游戏名称:');
    const icon = prompt('游戏图标(emoji):');
    const url = prompt('游戏链接:');
    if (name && icon && url) {
      settings.customGames.push({ name, icon, file: url, description: name });
      saveSettings();
      createGamePanel();
      if (isGamePanelVisible) gamePanel.style.display = 'block';
    }
  };
}

// 面板控制
function showGamePanel() {
  if (!gamePanel) createGamePanel();
  gamePanel.style.display = 'block';
  isGamePanelVisible = true;
}

function hideGamePanel() {
  if (gamePanel) {
    gamePanel.style.display = 'none';
  }
  isGamePanelVisible = false;
}

function toggleGamePanel() {
  isGamePanelVisible ? hideGamePanel() : showGamePanel();
}

// 创建扩展按钮
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

  // 尝试添加到合适位置
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
window.miniGamesDebug = { showPanel: showGamePanel, hidePanel: hideGamePanel, togglePanel: toggleGamePanel };
























































