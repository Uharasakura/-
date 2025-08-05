import { extension_settings } from '../../../extensions.js';
import { registerSlashCommand } from '../../../slash-commands.js';

const extensionName = 'game_collection';
let gameExtension;

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
};

// 初始化设置
if (!extension_settings[extensionName]) {
  extension_settings[extensionName] = defaultSettings;
}

// 创建游戏面板
function createGamePanel() {
  const panel = document.createElement('div');
  panel.classList.add('game-panel');
  panel.innerHTML = `
    <div class="game-panel-header">
      <div class="game-panel-title">小游戏合集</div>
      <div class="game-panel-controls">
        <div class="game-panel-button minimize">_</div>
        <div class="game-panel-button close">×</div>
      </div>
    </div>
    <div class="game-panel-content">
      <div class="game-grid">
        ${extension_settings[extensionName].games
          .map(
            game => `
          <div class="game-item" data-url="${game.url}">
            <div class="game-icon">${game.icon}</div>
            <div class="game-name">${game.name}</div>
          </div>
        `,
          )
          .join('')}
      </div>
    </div>
  `;

  // 添加事件监听
  const closeButton = panel.querySelector('.close');
  closeButton.addEventListener('click', () => {
    panel.remove();
  });

  const minimizeButton = panel.querySelector('.minimize');
  minimizeButton.addEventListener('click', () => {
    panel.classList.toggle('minimized');
  });

  const gameItems = panel.querySelectorAll('.game-item');
  gameItems.forEach(item => {
    item.addEventListener('click', () => {
      const url = item.dataset.url;
      openGame(url);
    });
  });

  return panel;
}

// 打开游戏
function openGame(url) {
  const gameContainer = document.createElement('div');
  gameContainer.classList.add('game-container');
  gameContainer.innerHTML = `
    <div class="game-container-header">
      <div class="game-container-button back">返回</div>
    </div>
    <iframe src="${url}" frameborder="0" allowfullscreen></iframe>
  `;

  const backButton = gameContainer.querySelector('.back');
  backButton.addEventListener('click', () => {
    gameContainer.remove();
  });

  document.body.appendChild(gameContainer);
}

// 注册扩展
window.addEventListener('load', async () => {
  // 等待 SillyTavern 加载完成
  while (!window.SillyTavern) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 创建扩展容器
  const container = new SillyTavern.Extension();

  // 创建浮动图标
  const floatingIcon = container.createFloatingButton('🎮');
  floatingIcon.onclick = () => {
    const panel = createGamePanel();
    document.body.appendChild(panel);
  };

  // 注册斜杠命令
  registerSlashCommand('game', args => {
    const panel = createGamePanel();
    document.body.appendChild(panel);
    return '';
  });

  gameExtension = container;
});











