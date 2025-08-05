// 获取SillyTavern上下文
const context = SillyTavern.getContext();
const { extensionSettings, saveSettingsDebounced } = context;

// 定义扩展名称
const EXTENSION_NAME = 'game_collection';

// 获取扩展文件夹路径
const EXTENSION_DIR = new URL('.', import.meta.url).pathname;

// 检测是否为移动设备
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

// 获取默认位置
function getDefaultPositions() {
  const isMobile = isMobileDevice();
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  if (isMobile) {
    return {
      icon: {
        x: screenWidth - 60,  // 距离右边缘10px（图标宽度48px + 边距）
        y: screenHeight - 140 // 避开底部聊天框
      },
      panel: {
        x: 10,
        y: 10
      }
    };
  } else {
    return {
      icon: {
        x: screenWidth - 100,
        y: screenHeight - 100
      },
      panel: {
        x: 50,
        y: 50
      }
    };
  }
}

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
  ...getDefaultPositions()
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

// 确保位置在可视区域内
function ensureInViewport(x, y, width, height) {
  const maxX = window.innerWidth - width - 10; // 留出10px边距
  const maxY = window.innerHeight - height - 10;
  const minX = 10; // 最小距离边缘10px
  const minY = 10;

  // 移动设备时，确保不会挡住底部的聊天框
  const minBottomMargin = isMobileDevice() ? 120 : 10;
  const adjustedMaxY = window.innerHeight - height - minBottomMargin;

  return {
    x: Math.min(Math.max(minX, x), maxX),
    y: Math.min(Math.max(minY, y), adjustedMaxY),
  };
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
  const settings = getSettings();
  const defaultPos = getDefaultPositions();
  
  // 更新图标位置
  if (gameButton) {
    const pos = ensureInViewport(
      settings.icon.x,
      settings.icon.y,
      gameButton.offsetWidth,
      gameButton.offsetHeight
    );
    gameButton.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    settings.icon = { x: pos.x, y: pos.y };
  }

  // 更新面板位置
  const panel = document.querySelector('.game-panel');
  if (panel) {
    const pos = ensureInViewport(
      settings.panel.x,
      settings.panel.y,
      panel.offsetWidth,
      panel.offsetHeight
    );
    panel.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    settings.panel = { x: pos.x, y: pos.y };
  }

  saveSettings();
});




