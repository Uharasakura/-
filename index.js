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
  // 确保使用最新的设置
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

// 添加事件监听器 - 使用事件委托避免作用域问题
function addEventListeners() {
  // 移除之前的监听器避免重复绑定
  gamePanel.removeEventListener('click', handlePanelClick);
  gamePanel.removeEventListener('touchend', handlePanelTouch);

  // 使用事件委托处理所有点击事件
  gamePanel.addEventListener('click', handlePanelClick);

  // 移动端专用：添加触摸事件处理
  if (isMobile()) {
    gamePanel.addEventListener('touchend', handlePanelTouch);
  }
}

// 处理面板内的点击事件
function handlePanelClick(event) {
  const target = event.target;

  // 查找最近的按钮元素（防止点击到按钮内部文本节点）
  const minimizeBtn = target.closest('.minimize-btn');
  const closeBtn = target.closest('.close-btn');
  const backBtn = target.closest('.back-btn');
  const addGameBtn = target.closest('.add-game-btn');
  const gameItem = target.closest('.game-item');

  // 最小化按钮
  if (minimizeBtn) {
    event.preventDefault();
    event.stopPropagation();

    // 重新获取最新的设置对象引用
    settings = getSettings();

    settings.isMinimized = !settings.isMinimized;
    gamePanel.classList.toggle('minimized', settings.isMinimized);
    saveSettings();
    return;
  }

  // 关闭按钮
  if (closeBtn) {
    event.preventDefault();
    event.stopPropagation();
    hideGamePanel();
    return;
  }

  // 返回按钮
  if (backBtn) {
    event.preventDefault();
    event.stopPropagation();
    const $ = sel => gamePanel.querySelector(sel);
    $('.panel-content').style.display = 'block';
    $('.game-iframe-container').style.display = 'none';
    return;
  }

  // 游戏项点击 - 现在通过事件委托处理
  if (gameItem) {
    event.preventDefault();
    event.stopPropagation();
    const gameFile = gameItem.dataset.game;
    const gameName = gameItem.querySelector('.game-name').textContent;

    // 直接使用gameFile，因为现在都是完整的URL
    const gameUrl = gameFile;
    const $ = sel => gamePanel.querySelector(sel);

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

        // 处理HTML内容，修复相对路径和jQuery依赖问题
        let processedHtml = htmlContent;

        // 获取游戏的基础URL
        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

        // 检查是否使用了jQuery但没有引入
        const usesJQuery = processedHtml.includes('$(') || processedHtml.includes('jQuery(');
        const hasJQuery = processedHtml.includes('jquery') || processedHtml.includes('jQuery');

        let headContent = `<base href="${baseUrl}">`;

        // 如果游戏使用jQuery但没有引入，自动添加jQuery库
        if (usesJQuery && !hasJQuery) {
          console.log(`游戏 ${gameName} 使用jQuery但未引入，自动添加jQuery库`);
          headContent += `<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>`;
        }

        // 在head中添加必要的内容
        if (processedHtml.includes('<head>')) {
          processedHtml = processedHtml.replace('<head>', '<head>' + headContent);
        } else if (processedHtml.includes('<html>')) {
          processedHtml = processedHtml.replace('<html>', '<html><head>' + headContent + '</head>');
        } else {
          processedHtml = headContent + processedHtml;
        }

        console.log(`游戏HTML已处理: ${gameName} - jQuery:${usesJQuery && !hasJQuery ? '已添加' : '无需添加'}`);
        iframe.srcdoc = processedHtml;
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
    return; // 处理完游戏点击事件，退出函数
  }

  // 添加游戏按钮 - 现在通过事件委托处理
  if (addGameBtn) {
    event.preventDefault();
    event.stopPropagation();

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
}

// 移动端触摸事件处理（防止移动端点击问题）
function handlePanelTouch(event) {
  // 防止触摸滚动时误触发
  if (event.touches && event.touches.length > 1) return;

  const target = event.target;

  // 查找最近的按钮元素
  const minimizeBtn = target.closest('.minimize-btn');
  const closeBtn = target.closest('.close-btn');
  const backBtn = target.closest('.back-btn');
  const addGameBtn = target.closest('.add-game-btn');
  const gameItem = target.closest('.game-item');

  // 最小化按钮（移动端专用处理）
  if (minimizeBtn) {
    event.preventDefault();
    event.stopPropagation();

    // 重新获取最新的设置对象引用
    settings = getSettings();

    settings.isMinimized = !settings.isMinimized;
    gamePanel.classList.toggle('minimized', settings.isMinimized);
    saveSettings();
    return;
  }

  // 其他按钮也可以类似处理，但先试试最小化按钮
  if (closeBtn) {
    event.preventDefault();
    event.stopPropagation();
    hideGamePanel();
    return;
  }
}

// 面板控制
function showGamePanel() {
  if (!gamePanel) {
    settings = getSettings(); // 重新获取最新设置
    createGamePanel();
  }
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
window.miniGamesDebug = {
  showPanel: showGamePanel,
  hidePanel: hideGamePanel,
  togglePanel: toggleGamePanel,
  // 新增游戏调试功能
  checkGame: () => {
    const iframe = document.querySelector('.game-iframe');
    if (!iframe) {
      console.log('未找到游戏iframe');
      return;
    }

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      const canvas = iframeDoc.querySelector('canvas');
      const scripts = iframeDoc.querySelectorAll('script');
      const buttons = iframeDoc.querySelectorAll('button, input[type="button"], .button');

      console.log('=== 游戏状态检查 ===');
      console.log('Canvas元素:', canvas ? '找到' : '未找到');
      console.log('脚本数量:', scripts.length);
      console.log('按钮数量:', buttons.length);
      console.log('文档状态:', iframeDoc.readyState);
      console.log('窗口对象:', iframe.contentWindow ? '可访问' : '不可访问');

      if (canvas) {
        console.log('Canvas尺寸:', canvas.width, 'x', canvas.height);
        console.log('Canvas上下文:', canvas.getContext('2d') ? '2D可用' : '2D不可用');
      }

      // 检查常见的游戏变量
      const gameVars = ['game', 'snake', 'board', 'player', 'score'];
      gameVars.forEach(varName => {
        if (iframe.contentWindow[varName] !== undefined) {
          console.log(`游戏变量 ${varName}:`, iframe.contentWindow[varName]);
        }
      });
    } catch (e) {
      console.log('游戏检查失败:', e.message);
    }
  },
  // 强制重新初始化当前游戏
  reinitGame: () => {
    const iframe = document.querySelector('.game-iframe');
    if (!iframe || !iframe.contentWindow) {
      console.log('无法访问游戏iframe');
      return;
    }

    try {
      iframe.contentWindow.location.reload();
      console.log('游戏已重新加载');
    } catch (e) {
      console.log('游戏重新加载失败:', e.message);
    }
  },
};






































































