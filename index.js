/**
 * 小游戏合集扩展 - 精简版
 */

const MODULE_NAME = 'mini-games-collection';
const extensionFolderPath = '/scripts/extensions/third-party/各种小游戏';

const defaultSettings = {
  panelPosition: { x: 20, y: 50 },
  panelSize: { width: 350, height: 500 },
  isMinimized: false,
  customGames: [],
};

const builtInGames = [
  { name: '贪吃蛇', icon: '🐍', file: 'Gluttonous_Snake.html', description: '经典贪吃蛇游戏' },
  { name: '种田', icon: '🌾', file: 'Farming.html', description: '休闲种田游戏' },
  { name: '飞行棋', icon: '✈️', file: 'Flight_chess.html', description: '经典飞行棋游戏' },
  { name: 'Nyan Cat', icon: '🐱', file: 'Nyan_Cat.html', description: '彩虹猫跑酷游戏' },
  { name: '扫雷', icon: '💣', file: 'minesweeper.html', description: '经典扫雷游戏' },
  { name: '数独', icon: '🔢', file: 'shudoku.html', description: '数独益智游戏' },
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
        <iframe class="game-iframe" src="" frameborder="0"></iframe>
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
    // 移动端全屏模式
    Object.assign(gamePanel.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '999999',
      borderRadius: '0',
    });
    gamePanel.classList.add('mobile-panel', 'mobile-fullscreen');
    document.body.style.overflow = 'hidden';
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
      const gameUrl = gameFile.startsWith('http') ? gameFile : `${extensionFolderPath}/${gameFile}`;

      $('.game-iframe').src = gameUrl;
      $('.current-game-title').textContent = gameName;
      $('.panel-content').style.display = 'none';
      $('.game-iframe-container').style.display = 'block';
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
    if (isMobile()) document.body.style.overflow = '';
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











































