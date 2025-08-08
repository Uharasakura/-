/**
 * 小游戏合集扩展 - 精简版
 */

const MODULE_NAME = 'mini-games-collection';

const defaultSettings = {
  panelPosition: { x: 20, y: 50 },
  panelSize: { width: 400, height: 500 },
  customGames: [],
};

const builtInGames = [
  { name: '贪吃蛇', icon: '🐍', file: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/Gluttonous_Snake.html' },
  { name: '种田', icon: '🌾', file: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/Farming.html' },
  { name: '飞行棋', icon: '✈️', file: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/Flight_chess.html' },
  { name: 'Nyan Cat', icon: '🐱', file: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/Nyan_Cat.html' },
  { name: '扫雷', icon: '💣', file: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/minesweeper.html' },
  { name: '数独', icon: '🔢', file: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/shudoku.html' },
];

let gamePanel = null;
let isGamePanelVisible = false;
let settings = {};

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

// 游戏配置
const gameConfig = {
  贪吃蛇: { width: 450, height: 600, ratio: 0.75 },
  种田: { width: 600, height: 700, ratio: 0.86 },
  飞行棋: { width: 650, height: 650, ratio: 1.0 },
  'Nyan Cat': { width: 700, height: 450, ratio: 1.56 },
  扫雷: { width: 500, height: 600, ratio: 0.83 },
  数独: { width: 500, height: 600, ratio: 0.83 },
};

function adjustPanelForGame(gameName) {
  if (!gamePanel) return;

  const config = gameConfig[gameName] || { width: 500, height: 600, ratio: 0.83 };
  const maxWidth = Math.min(window.innerWidth - 100, config.width);
  const maxHeight = Math.min(window.innerHeight - 100, config.height);

  gamePanel.style.width = maxWidth + 'px';
  gamePanel.style.height = maxHeight + 'px';
}

function createPanelHTML() {
  settings = getSettings();
  const allGames = [...builtInGames, ...settings.customGames];
  const gamesHTML = allGames
    .map(
      game => `<div class="game-item" data-game="${game.file}" title="${game.description || game.name}">
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
        <iframe class="game-iframe" frameborder="0" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-orientation-lock allow-popups allow-modals allow-downloads allow-top-navigation-by-user-activation"></iframe>
      </div>
    </div>
  `;
}

function createGamePanel() {
  if (gamePanel) gamePanel.remove();

  gamePanel = document.createElement('div');
  gamePanel.innerHTML = createPanelHTML();
  gamePanel = gamePanel.firstElementChild;

  if (isMobile()) {
    Object.assign(gamePanel.style, {
      position: 'fixed',
      top: '40px',
      left: '50%',
      width: Math.min(window.innerWidth - 20, 420) + 'px',
      height: Math.min(window.innerHeight - 80, 700) + 'px',
      transform: 'translateX(-50%)',
      zIndex: '999999',
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

  gamePanel.addEventListener('click', handleClick);
  document.body.appendChild(gamePanel);
}

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

  if (minimizeBtn) {
    const panelContent = gamePanel.querySelector('.panel-content');
    const gameContainer = gamePanel.querySelector('.game-iframe-container');
    const isMinimized = panelContent.style.display === 'none' && gameContainer.style.display === 'none';

    if (isMinimized) {
      const wasShowingGame = gameContainer.dataset.wasVisible === 'true';
      if (wasShowingGame) {
        panelContent.style.display = 'none';
        gameContainer.style.display = 'block';
      } else {
        panelContent.style.display = 'block';
        gameContainer.style.display = 'none';
      }
      gamePanel.style.height = '';
      minimizeBtn.textContent = '−';
    } else {
      const isShowingGame = gameContainer.style.display === 'block';
      gameContainer.dataset.wasVisible = isShowingGame.toString();
      panelContent.style.display = 'none';
      gameContainer.style.display = 'none';
      gamePanel.style.height = '50px';
      minimizeBtn.textContent = '+';
    }
    return;
  }

  if (closeBtn) {
    hideGamePanel();
    return;
  }

  if (backBtn) {
    gamePanel.querySelector('.panel-content').style.display = 'block';
    gamePanel.querySelector('.game-iframe-container').style.display = 'none';
    return;
  }

  if (addGameBtn) {
    const name = prompt('游戏名称:');
    const icon = prompt('游戏图标(emoji):');
    const url = prompt('游戏链接:');
    if (name && icon && url) {
      settings.customGames.push({ name, icon, file: url });
      saveSettings();
      createGamePanel();
      if (isGamePanelVisible) gamePanel.style.display = 'block';
    }
    return;
  }

  if (gameItem) {
    loadGame(gameItem.dataset.game, gameItem.querySelector('.game-name').textContent);
    return;
  }
}

async function loadGame(url, name) {
  const iframe = gamePanel.querySelector('.game-iframe');
  const titleEl = gamePanel.querySelector('.current-game-title');

  titleEl.textContent = name;
  gamePanel.querySelector('.panel-content').style.display = 'none';
  gamePanel.querySelector('.game-iframe-container').style.display = 'block';

  iframe.srcdoc = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100%; font-family: Arial, sans-serif;">
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">🎮</div>
        <h2 style="color: #667eea;">正在加载游戏...</h2>
        <p>${name}</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    let html = await response.text();

    // 添加自适应样式
    const adaptCSS = `
      <style>
        html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; overflow: hidden !important; }
        .game-container, #game-container, .container, main, #main { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; }
        canvas { width: 100% !important; height: 100% !important; max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; }
        [style*="100vh"], [style*="100vw"] { width: 100% !important; height: 100% !important; }
        [style*="position: fixed"] { position: absolute !important; }
      </style>
      <script>
        (function() {
          function adapt() {
            document.querySelectorAll('canvas, .game-container, #game-container').forEach(el => {
              if (el) {
                el.style.width = '100%';
                el.style.height = '100%';
                el.style.maxWidth = '100%';
                el.style.maxHeight = '100%';
              }
            });
          }
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', adapt);
          } else {
            adapt();
          }
          setTimeout(adapt, 500);
        })();
      </script>
    `;

    if (html.includes('<head>')) {
      html = html.replace('<head>', '<head>' + adaptCSS);
    } else {
      html = adaptCSS + html;
    }

    iframe.srcdoc = html;

    setTimeout(() => adjustPanelForGame(name), 1000);
  } catch (error) {
    iframe.srcdoc = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; font-family: Arial, sans-serif;">
        <div style="text-align: center;">
          <h2 style="color: #ff4757;">🚫 游戏加载失败</h2>
          <p>无法加载游戏: ${name}</p>
          <a href="${url}" target="_blank" style="padding: 10px 20px; background: #48dbfb; color: white; text-decoration: none; border-radius: 5px;">新窗口打开</a>
        </div>
      </div>
    `;
  }
}

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

function init() {
  settings = getSettings();
  createExtensionButton();
}

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





















































































