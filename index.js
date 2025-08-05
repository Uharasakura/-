/**
 * 游戏合集扩展
 */

// 获取SillyTavern上下文
const context = SillyTavern.getContext();
const { extensionSettings, saveSettingsDebounced } = context;

// 定义扩展名称
const EXTENSION_NAME = 'game_collection';

// 默认设置
const defaultSettings = {
  games: [
    {
      name: '数独',
      icon: '🎲',
      url: 'https://raw.githubusercontent.com/Uharasakura/-/main/shudoku.html',
    },
    {
      name: '扫雷',
      icon: '💣',
      url: 'https://raw.githubusercontent.com/Uharasakura/-/main/minesweeper.html',
    },
    {
      name: '贪吃蛇',
      icon: '🐍',
      url: 'https://raw.githubusercontent.com/Uharasakura/-/main/Gluttonous_Snake.html',
    },
    {
      name: '飞行棋',
      icon: '🎯',
      url: 'https://raw.githubusercontent.com/Uharasakura/-/main/Flight_chess.html',
    },
    {
      name: '种田',
      icon: '🌾',
      url: 'https://raw.githubusercontent.com/Uharasakura/-/main/Farming.html',
    },
    {
      name: '彩虹猫',
      icon: '🌈',
      url: 'https://raw.githubusercontent.com/Uharasakura/-/main/Nyan_Cat.html',
    },
  ],
  iconPosition: { x: 20, y: 20 },
};

// 获取设置
function getSettings() {
  if (!extensionSettings[EXTENSION_NAME]) {
    extensionSettings[EXTENSION_NAME] = Object.assign({}, defaultSettings);
    saveSettingsDebounced();
  }
  return extensionSettings[EXTENSION_NAME];
}

// 保存设置
function saveSettings() {
  saveSettingsDebounced();
}

// 创建游戏按钮
function createGameButton() {
  const button = document.createElement('button');
  button.id = 'gameButton';
  button.style.cssText = `
    position: fixed;
    left: ${getSettings().iconPosition.x}px;
    top: ${getSettings().iconPosition.y}px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 24px;
    cursor: move;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  `;
  button.innerHTML = '🎮';
  button.title = '小游戏合集';

  // 添加拖拽功能
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;

  button.addEventListener('mousedown', e => {
    isDragging = true;
    initialX = e.clientX - getSettings().iconPosition.x;
    initialY = e.clientY - getSettings().iconPosition.y;
    button.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', e => {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      // 确保图标不会超出视口
      currentX = Math.min(Math.max(0, currentX), window.innerWidth - 48);
      currentY = Math.min(Math.max(0, currentY), window.innerHeight - 48);

      button.style.left = `${currentX}px`;
      button.style.top = `${currentY}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      button.style.cursor = 'move';

      // 保存新位置
      const settings = getSettings();
      settings.iconPosition = { x: currentX, y: currentY };
      saveSettings();
    }
  });

  // 点击事件（非拖拽）
  let clickStartTime;
  button.addEventListener('mousedown', () => {
    clickStartTime = Date.now();
  });

  button.addEventListener('mouseup', () => {
    const clickDuration = Date.now() - clickStartTime;
    if (clickDuration < 200) {
      // 小于200ms认为是点击而不是拖拽
      createGamePanel();
    }
  });

  document.body.appendChild(button);
  return button;
}

// 初始化
let gameButton;

// 监听APP_READY事件
window.addEventListener('load', () => {
  console.log('Game Collection Extension Ready');
  getSettings(); // 初始化设置
  gameButton = createGameButton();
});







