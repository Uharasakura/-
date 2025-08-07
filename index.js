/**
 * 小游戏合集扩展
 * SillyTavern Extension for Mini Games Collection
 */

// 扩展名称和设置
const MODULE_NAME = 'mini-games-collection';
const extensionName = 'mini-games-collection';
const extensionFolderPath = '/scripts/extensions/third-party/各种小游戏';

// 默认设置
const defaultSettings = {
  panelPosition: { x: 20, y: 50 },
  panelSize: { width: 350, height: 500 },
  isMinimized: false,
  customGames: [],
};

// 内置游戏列表
const builtInGames = [
  {
    name: '贪吃蛇',
    icon: '🐍',
    file: 'Gluttonous_Snake.html',
    description: '经典贪吃蛇游戏',
  },
  {
    name: '种田',
    icon: '🌾',
    file: 'Farming.html',
    description: '休闲种田游戏',
  },
  {
    name: '飞行棋',
    icon: '✈️',
    file: 'Flight_chess.html',
    description: '经典飞行棋游戏',
  },
  {
    name: 'Nyan Cat',
    icon: '🐱',
    file: 'Nyan_Cat.html',
    description: '彩虹猫跑酷游戏',
  },
  {
    name: '扫雷',
    icon: '💣',
    file: 'minesweeper.html',
    description: '经典扫雷游戏',
  },
  {
    name: '数独',
    icon: '🔢',
    file: 'shudoku.html',
    description: '数独益智游戏',
  },
];

// 全局变量
let gamePanel = null;
let isGamePanelVisible = false;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let settings = {};

// 获取SillyTavern上下文
function getContext() {
  return SillyTavern.getContext();
}

// 获取扩展设置
function getSettings() {
  const { extensionSettings } = getContext();
  if (!extensionSettings[MODULE_NAME]) {
    extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
  }

  // 确保所有默认键都存在
  for (const key of Object.keys(defaultSettings)) {
    if (!Object.hasOwn(extensionSettings[MODULE_NAME], key)) {
      extensionSettings[MODULE_NAME][key] = defaultSettings[key];
    }
  }

  return extensionSettings[MODULE_NAME];
}

// 保存设置
function saveSettings() {
  const { saveSettingsDebounced } = getContext();
  saveSettingsDebounced();
}

// 创建游戏面板HTML
function createGamePanelHTML() {
  const allGames = [...builtInGames, ...settings.customGames];

  const gamesHTML = allGames
    .map(
      game => `
        <div class="game-item" data-game="${game.file}" title="${game.description}">
            <div class="game-icon">${game.icon}</div>
            <div class="game-name">${game.name}</div>
        </div>
    `,
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
                <div class="games-grid">
                    ${gamesHTML}
                </div>
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
  if (gamePanel) {
    gamePanel.remove();
  }

  // 检测是否为移动设备
  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

  // 创建面板元素
  gamePanel = document.createElement('div');
  gamePanel.innerHTML = createGamePanelHTML();
  gamePanel = gamePanel.firstElementChild;

  // 移动端特殊处理
  if (isMobile) {
    // 移动端使用全屏或大部分屏幕
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    gamePanel.style.left = '10px';
    gamePanel.style.top = '10px';
    gamePanel.style.width = screenWidth - 20 + 'px';
    gamePanel.style.height = screenHeight - 100 + 'px';

    // 添加移动端特殊样式
    gamePanel.classList.add('mobile-panel');

    console.log(`移动端面板创建: ${screenWidth - 20}x${screenHeight - 100}`);
  } else {
    // 桌面端使用设置的位置和大小
    gamePanel.style.left = settings.panelPosition.x + 'px';
    gamePanel.style.top = settings.panelPosition.y + 'px';
    gamePanel.style.width = settings.panelSize.width + 'px';
    gamePanel.style.height = settings.panelSize.height + 'px';
  }

  // 添加事件监听器
  addPanelEventListeners();

  // 添加到页面
  document.body.appendChild(gamePanel);

  console.log('游戏面板已创建并添加到页面');
}

// 添加面板事件监听器
function addPanelEventListeners() {
  const header = gamePanel.querySelector('.panel-header');
  const minimizeBtn = gamePanel.querySelector('.minimize-btn');
  const closeBtn = gamePanel.querySelector('.close-btn');
  const gameItems = gamePanel.querySelectorAll('.game-item');
  const addGameBtn = gamePanel.querySelector('.add-game-btn');
  const backBtn = gamePanel.querySelector('.back-btn');
  const gamesGrid = gamePanel.querySelector('.games-grid');
  const iframeContainer = gamePanel.querySelector('.game-iframe-container');

  // 检测是否为移动设备
  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

  // 拖拽功能 - 支持触摸和鼠标
  function startDrag(e) {
    if (e.target.classList.contains('control-btn')) return;

    e.preventDefault();
    isDragging = true;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    dragOffset.x = clientX - gamePanel.offsetLeft;
    dragOffset.y = clientY - gamePanel.offsetTop;
    gamePanel.style.cursor = 'grabbing';

    console.log('开始拖拽面板');
  }

  function doDrag(e) {
    if (!isDragging) return;

    e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const newX = clientX - dragOffset.x;
    const newY = clientY - dragOffset.y;

    gamePanel.style.left = Math.max(0, Math.min(window.innerWidth - gamePanel.offsetWidth, newX)) + 'px';
    gamePanel.style.top = Math.max(0, Math.min(window.innerHeight - gamePanel.offsetHeight, newY)) + 'px';
  }

  function endDrag() {
    if (!isDragging) return;

    isDragging = false;
    gamePanel.style.cursor = '';

    // 保存新位置
    settings.panelPosition.x = parseInt(gamePanel.style.left);
    settings.panelPosition.y = parseInt(gamePanel.style.top);
    saveSettings();

    console.log('拖拽结束，位置已保存');
  }

  // 添加触摸和鼠标事件
  header.addEventListener('mousedown', startDrag);
  header.addEventListener('touchstart', startDrag, { passive: false });

  document.addEventListener('mousemove', doDrag);
  document.addEventListener('touchmove', doDrag, { passive: false });

  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);

  // 最小化按钮
  minimizeBtn.addEventListener('click', () => {
    settings.isMinimized = !settings.isMinimized;
    gamePanel.classList.toggle('minimized', settings.isMinimized);
    minimizeBtn.textContent = settings.isMinimized ? '+' : '−';
    minimizeBtn.title = settings.isMinimized ? '展开' : '最小化';
    saveSettings();
  });

  // 关闭按钮
  closeBtn.addEventListener('click', () => {
    hideGamePanel();
  });

  // 游戏项点击
  gameItems.forEach(item => {
    item.addEventListener('click', () => {
      const gameFile = item.dataset.game;
      const gameName = item.querySelector('.game-name').textContent;
      loadGame(gameFile, gameName);
    });
  });

  // 添加游戏按钮
  addGameBtn.addEventListener('click', () => {
    showAddGameDialog();
  });

  // 返回按钮
  backBtn.addEventListener('click', () => {
    gamesGrid.parentElement.style.display = 'block';
    iframeContainer.style.display = 'none';
  });
}

// 加载游戏
function loadGame(gameFile, gameName) {
  const gamesGrid = gamePanel.querySelector('.games-grid').parentElement;
  const iframeContainer = gamePanel.querySelector('.game-iframe-container');
  const iframe = gamePanel.querySelector('.game-iframe');
  const titleSpan = gamePanel.querySelector('.current-game-title');

  // 构建游戏URL
  const gameUrl = gameFile.startsWith('http') ? gameFile : `${extensionFolderPath}/${gameFile}`;

  // 设置iframe
  iframe.src = gameUrl;
  titleSpan.textContent = gameName;

  // 切换显示
  gamesGrid.style.display = 'none';
  iframeContainer.style.display = 'block';
}

// 显示添加游戏对话框
function showAddGameDialog() {
  const dialog = document.createElement('div');
  dialog.className = 'add-game-dialog-overlay';
  dialog.innerHTML = `
        <div class="add-game-dialog">
            <div class="dialog-header">
                <h3>添加外链游戏</h3>
                <button class="dialog-close">×</button>
            </div>
            <div class="dialog-content">
                <div class="form-group">
                    <label>游戏名称：</label>
                    <input type="text" id="game-name-input" placeholder="输入游戏名称">
                </div>
                <div class="form-group">
                    <label>游戏图标：</label>
                    <input type="text" id="game-icon-input" placeholder="输入emoji图标" maxlength="2">
                </div>
                <div class="form-group">
                    <label>游戏链接：</label>
                    <input type="url" id="game-url-input" placeholder="输入游戏网址">
                </div>
                <div class="form-group">
                    <label>游戏描述：</label>
                    <input type="text" id="game-desc-input" placeholder="输入游戏描述">
                </div>
            </div>
            <div class="dialog-footer">
                <button class="dialog-btn cancel-btn">取消</button>
                <button class="dialog-btn confirm-btn">添加</button>
            </div>
        </div>
    `;

  document.body.appendChild(dialog);

  // 事件监听器
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.remove());
  dialog.querySelector('.cancel-btn').addEventListener('click', () => dialog.remove());
  dialog.querySelector('.confirm-btn').addEventListener('click', () => {
    const name = dialog.querySelector('#game-name-input').value.trim();
    const icon = dialog.querySelector('#game-icon-input').value.trim();
    const url = dialog.querySelector('#game-url-input').value.trim();
    const description = dialog.querySelector('#game-desc-input').value.trim();

    if (name && icon && url) {
      addCustomGame({ name, icon, file: url, description });
      dialog.remove();
    } else {
      alert('请填写所有必需字段！');
    }
  });

  // 点击遮罩关闭
  dialog.addEventListener('click', e => {
    if (e.target === dialog) dialog.remove();
  });
}

// 添加自定义游戏
function addCustomGame(gameData) {
  settings.customGames.push(gameData);
  saveSettings();

  // 重新创建面板以更新游戏列表
  createGamePanel();
  if (isGamePanelVisible) {
    gamePanel.style.display = 'block';
  }
}

// 显示游戏面板
function showGamePanel() {
  console.log('尝试显示游戏面板...');

  if (!gamePanel) {
    console.log('面板不存在，正在创建...');
    createGamePanel();
  }

  if (gamePanel) {
    gamePanel.style.display = 'block';
    gamePanel.style.visibility = 'visible';
    gamePanel.style.opacity = '1';
    isGamePanelVisible = true;
    console.log('游戏面板已显示');

    // 确保面板在最顶层
    gamePanel.style.zIndex = '10000';

    // 强制重绘
    gamePanel.offsetHeight;
  } else {
    console.error('无法创建游戏面板');
  }
}

// 隐藏游戏面板
function hideGamePanel() {
  if (gamePanel) {
    gamePanel.style.display = 'none';
  }
  isGamePanelVisible = false;
}

// 切换游戏面板显示状态
function toggleGamePanel() {
  console.log('切换游戏面板状态，当前状态:', isGamePanelVisible ? '显示' : '隐藏');

  if (isGamePanelVisible) {
    console.log('隐藏面板');
    hideGamePanel();
  } else {
    console.log('显示面板');
    showGamePanel();
  }
}

// 创建扩展按钮
function createExtensionButton() {
  // 检查按钮是否已存在，避免重复创建
  if (document.querySelector('#mini-games-button')) {
    console.log('小游戏按钮已存在，跳过创建');
    return;
  }

  const button = document.createElement('div');
  button.id = 'mini-games-button';
  button.className = 'menu_button menu_button_icon';
  button.innerHTML = '🎮';
  button.title = '小游戏合集';

  button.addEventListener('click', toggleGamePanel);

  // 尝试多种方式添加按钮
  let buttonAdded = false;

  // 方法1: 添加到扩展菜单按钮旁边
  const extensionsMenuButton = document.querySelector('#extensionsMenuButton');
  if (extensionsMenuButton && extensionsMenuButton.parentNode) {
    extensionsMenuButton.parentNode.insertBefore(button, extensionsMenuButton.nextSibling);
    buttonAdded = true;
    console.log('小游戏按钮已添加到扩展菜单旁边');
  }

  // 方法2: 添加到右侧菜单面板
  if (!buttonAdded) {
    const rightMenuPanel = document.querySelector('#rm_button_panel');
    if (rightMenuPanel) {
      rightMenuPanel.appendChild(button);
      buttonAdded = true;
      console.log('小游戏按钮已添加到右侧菜单');
    }
  }

  // 方法3: 添加到顶部菜单栏
  if (!buttonAdded) {
    const topMenuBar = document.querySelector('#top-bar, .menu_buttons, #rm_extensions_block');
    if (topMenuBar) {
      topMenuBar.appendChild(button);
      buttonAdded = true;
      console.log('小游戏按钮已添加到顶部菜单');
    }
  }

  // 方法4: 作为最后手段，添加到body
  if (!buttonAdded) {
    document.body.appendChild(button);
    // 给按钮添加固定定位样式
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.zIndex = '9999';
    button.style.background = '#667eea';
    button.style.color = 'white';
    button.style.padding = '10px';
    button.style.borderRadius = '50%';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    console.log('小游戏按钮已添加为浮动按钮');
  }
}

// 初始化扩展
function init() {
  console.log('开始初始化小游戏合集扩展...');

  try {
    // 获取设置
    settings = getSettings();
    console.log('扩展设置已加载:', settings);

    // 延迟创建按钮，确保DOM完全加载
    setTimeout(() => {
      createExtensionButton();
    }, 1000);

    console.log('小游戏合集扩展初始化完成');
  } catch (error) {
    console.error('小游戏合集扩展初始化失败:', error);
  }
}

// 安全的初始化函数
function safeInit() {
  console.log('尝试安全初始化小游戏合集扩展...');

  // 检查SillyTavern是否已加载
  if (typeof SillyTavern === 'undefined') {
    console.log('SillyTavern未加载，等待中...');
    setTimeout(safeInit, 500);
    return;
  }

  try {
    const context = SillyTavern.getContext();
    if (!context) {
      console.log('SillyTavern上下文未准备好，等待中...');
      setTimeout(safeInit, 500);
      return;
    }

    const { eventSource, event_types } = context;
    if (!eventSource || !event_types) {
      console.log('事件系统未准备好，等待中...');
      setTimeout(safeInit, 500);
      return;
    }

    // 监听应用就绪事件
    eventSource.on(event_types.APP_READY, init);

    // 如果应用已经就绪，直接初始化
    if (document.readyState === 'complete') {
      setTimeout(init, 100);
    }

    console.log('事件监听器已设置');
  } catch (error) {
    console.error('设置事件监听器失败:', error);
    // 如果事件系统失败，直接尝试初始化
    setTimeout(init, 2000);
  }
}

// 开始安全初始化
safeInit();

// 添加全局调试函数
window.miniGamesDebug = {
  init: init,
  createButton: createExtensionButton,
  showPanel: showGamePanel,
  hidePanel: hideGamePanel,
  togglePanel: toggleGamePanel,
  getSettings: () => settings,
  forceInit: () => {
    console.log('强制初始化小游戏扩展...');
    init();
  },
};

console.log('小游戏合集扩展已加载，可使用 window.miniGamesDebug 进行调试');

// 导出模块（可选）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    init,
    toggleGamePanel,
    showGamePanel,
    hideGamePanel,
  };
}









































