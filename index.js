// 获取SillyTavern上下文
const context = SillyTavern.getContext();
const { extensionSettings, saveSettingsDebounced } = context;

// 定义扩展名称
const EXTENSION_NAME = 'game_collection';

// 获取扩展文件夹路径
const EXTENSION_DIR = new URL('.', import.meta.url).pathname;

// 检测是否为移动设备
function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  );
}

// 获取默认位置
function getDefaultPositions() {
  const isMobile = isMobileDevice();
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  if (isMobile) {
    return {
      icon: {
        x: screenWidth - 60,
        y: screenHeight - 180, // 增加底部边距，避免遮挡
      },
      panel: {
        x: 10,
        y: 10,
      },
    };
  } else {
    return {
      icon: {
        x: screenWidth - 100,
        y: screenHeight - 100,
      },
      panel: {
        x: 50,
        y: 50,
      },
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
  iconVisible: true,
  ...getDefaultPositions(),
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
  const maxX = window.innerWidth - width - 10;
  const maxY = window.innerHeight - height - 10;
  const minX = 10;
  const minY = 10;

  const minBottomMargin = isMobileDevice() ? 160 : 10;
  const adjustedMaxY = window.innerHeight - height - minBottomMargin;

  return {
    x: Math.min(Math.max(minX, x), maxX),
    y: Math.min(Math.max(minY, y), adjustedMaxY),
  };
}

// 创建右键菜单项
function createContextMenuItem() {
  const menuItem = document.createElement('div');
  menuItem.className = 'list-group-item flex-container flexGap5';
  menuItem.innerHTML = `
    <div class="menu_button menu_button_icon">🎮</div>
    <div class="menu_button">小游戏</div>
  `;

  menuItem.addEventListener('click', () => {
    const settings = getSettings();
    settings.iconVisible = !settings.iconVisible;
    saveSettings();
    toggleGameButton();
  });

  return menuItem;
}

// 切换游戏图标显示状态
function toggleGameButton() {
  const settings = getSettings();
  if (settings.iconVisible) {
    if (!gameButton) {
      gameButton = createGameButton();
    }
    gameButton.style.display = 'flex';
  } else if (gameButton) {
    gameButton.style.display = 'none';
  }
}

// 使元素可拖拽
function makeDraggable(element, onDragEnd = null) {
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  element.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  element.addEventListener('touchstart', dragStart);
  document.addEventListener('touchmove', drag);
  document.addEventListener('touchend', dragEnd);

  function dragStart(e) {
    if (e.type === 'mousedown') {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    } else {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    }

    if (e.target === element || e.target.parentElement === element) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      if (e.type === 'mousemove') {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      } else {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      }

      const pos = ensureInViewport(currentX, currentY, element.offsetWidth, element.offsetHeight);
      currentX = pos.x;
      currentY = pos.y;
      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, element);
    }
  }

  function dragEnd() {
    if (isDragging && onDragEnd) {
      onDragEnd(currentX, currentY);
    }

    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
  }

  // 设置初始位置
  if (element.dataset.type === 'icon') {
    const { icon } = getSettings();
    const pos = ensureInViewport(icon.x, icon.y, element.offsetWidth, element.offsetHeight);
    setTranslate(pos.x, pos.y, element);
    xOffset = pos.x;
    yOffset = pos.y;
    initialX = pos.x;
    initialY = pos.y;
  } else if (element.dataset.type === 'panel') {
    const { panel } = getSettings();
    const pos = ensureInViewport(panel.x, panel.y, element.offsetWidth, element.offsetHeight);
    setTranslate(pos.x, pos.y, element);
    xOffset = pos.x;
    yOffset = pos.y;
    initialX = pos.x;
    initialY = pos.y;
  }
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
  const settings = getSettings();
  const defaultPos = getDefaultPositions();

  if (gameButton) {
    const pos = ensureInViewport(settings.icon.x, settings.icon.y, gameButton.offsetWidth, gameButton.offsetHeight);
    gameButton.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    settings.icon = { x: pos.x, y: pos.y };
  }

  const panel = document.querySelector('.game-panel');
  if (panel) {
    const pos = ensureInViewport(settings.panel.x, settings.panel.y, panel.offsetWidth, panel.offsetHeight);
    panel.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    settings.panel = { x: pos.x, y: pos.y };
  }

  saveSettings();
});

// 创建游戏按钮
function createGameButton() {
  const button = document.createElement('button');
  button.id = 'gameButton';
  button.className = 'game-icon-button';
  button.dataset.type = 'icon';
  button.innerHTML = '🎮';
  button.title = '小游戏合集';

  button.addEventListener('click', () => {
    button.style.display = 'none';
    createGamePanel();
  });

  document.body.appendChild(button);

  makeDraggable(button, (x, y) => {
    const settings = getSettings();
    settings.icon = { x, y };
    saveSettings();
  });

  return button;
}

// 初始化
let gameButton;

// 监听APP_READY事件
context.eventSource.on(context.event_types.APP_READY, () => {
  console.log('Game Collection Extension Ready');

  // 添加右键菜单项
  const rightClickMenu = document.querySelector('#right-click-menu .list-group');
  if (rightClickMenu) {
    rightClickMenu.appendChild(createContextMenuItem());
  }

  // 初始化设置并显示图标
  getSettings();
  toggleGameButton();
});





