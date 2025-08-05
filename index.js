/**
 * 游戏合集扩展
 */

// 扩展名称
const EXTENSION_NAME = 'game_collection';

// 默认设置
const defaultSettings = {
  games: [
    {
      name: '数独',
      icon: '🎲',
      url: 'https://cdn.jsdelivr.net/gh/Uharasakura/-/shudoku.html',
    },
    {
      name: '扫雷',
      icon: '💣',
      url: 'https://cdn.jsdelivr.net/gh/Uharasakura/-/minesweeper.html',
    },
    {
      name: '贪吃蛇',
      icon: '🐍',
      url: 'https://cdn.jsdelivr.net/gh/Uharasakura/-/Gluttonous_Snake.html',
    },
    {
      name: '飞行棋',
      icon: '🎯',
      url: 'https://cdn.jsdelivr.net/gh/Uharasakura/-/Flight_chess.html',
    },
    {
      name: '种田',
      icon: '🌾',
      url: 'https://cdn.jsdelivr.net/gh/Uharasakura/-/Farming.html',
    },
    {
      name: '彩虹猫',
      icon: '🌈',
      url: 'https://cdn.jsdelivr.net/gh/Uharasakura/-/Nyan_Cat.html',
    },
  ],
  iconPosition: { x: 20, y: 20 },
  panelPosition: { x: 100, y: 100 },
};

/**
 * 扩展类
 */
class GameCollection {
  constructor() {
    // 获取SillyTavern上下文
    const context = SillyTavern.getContext();
    this.extensionSettings = context.extensionSettings;
    this.saveSettingsDebounced = context.saveSettingsDebounced;

    // 初始化状态
    this.gameButton = null;
    this.gamePanel = null;
    this.isDragging = false;
    this.currentX = 0;
    this.currentY = 0;
    this.initialX = 0;
    this.initialY = 0;
    this.xOffset = 0;
    this.yOffset = 0;
  }

  /**
   * 获取设置
   */
  getSettings() {
    if (!this.extensionSettings[EXTENSION_NAME]) {
      this.extensionSettings[EXTENSION_NAME] = Object.assign({}, defaultSettings);
      this.saveSettingsDebounced();
    }
    return this.extensionSettings[EXTENSION_NAME];
  }

  /**
   * 保存设置
   */
  saveSettings() {
    this.saveSettingsDebounced();
  }

  /**
   * 使元素可拖拽
   */
  makeDraggable(element, onDragEnd = null) {
    const dragStart = e => {
      if (e.type === 'mousedown') {
        this.initialX = e.clientX - this.xOffset;
        this.initialY = e.clientY - this.yOffset;
      } else {
        this.initialX = e.touches[0].clientX - this.xOffset;
        this.initialY = e.touches[0].clientY - this.yOffset;
      }

      if (e.target === element) {
        this.isDragging = true;
      }
    };

    const drag = e => {
      if (this.isDragging) {
        e.preventDefault();

        if (e.type === 'mousemove') {
          this.currentX = e.clientX - this.initialX;
          this.currentY = e.clientY - this.initialY;
        } else {
          this.currentX = e.touches[0].clientX - this.initialX;
          this.currentY = e.touches[0].clientY - this.initialY;
        }

        this.xOffset = this.currentX;
        this.yOffset = this.currentY;

        this.setTranslate(this.currentX, this.currentY, element);
      }
    };

    const dragEnd = () => {
      if (this.isDragging && onDragEnd) {
        onDragEnd(this.currentX, this.currentY);
      }

      this.initialX = this.currentX;
      this.initialY = this.currentY;
      this.isDragging = false;
    };

    element.addEventListener('mousedown', dragStart);
    element.addEventListener('mousemove', drag);
    element.addEventListener('mouseup', dragEnd);
    element.addEventListener('mouseleave', dragEnd);

    element.addEventListener('touchstart', dragStart);
    element.addEventListener('touchmove', drag);
    element.addEventListener('touchend', dragEnd);

    // 设置初始位置
    if (element.dataset.type === 'icon') {
      const { iconPosition } = this.getSettings();
      this.setTranslate(iconPosition.x, iconPosition.y, element);
      this.xOffset = iconPosition.x;
      this.yOffset = iconPosition.y;
      this.initialX = iconPosition.x;
      this.initialY = iconPosition.y;
    } else if (element.dataset.type === 'panel') {
      const { panelPosition } = this.getSettings();
      this.setTranslate(panelPosition.x, panelPosition.y, element);
      this.xOffset = panelPosition.x;
      this.yOffset = panelPosition.y;
      this.initialX = panelPosition.x;
      this.initialY = panelPosition.y;
    }
  }

  /**
   * 设置元素位置
   */
  setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
  }

  /**
   * 创建游戏面板
   */
  createGamePanel() {
    // 移除现有面板
    if (this.gamePanel) {
      this.gamePanel.remove();
    }

    const panel = document.createElement('div');
    panel.className = 'game-panel';
    panel.dataset.type = 'panel';
    panel.innerHTML = `
      <div class="game-panel-header">
        <h2 class="game-panel-title">小游戏合集</h2>
        <div class="game-panel-controls">
          <button class="game-panel-button minimize-button" title="最小化">➖</button>
          <button class="game-panel-button close-button" title="关闭">✖</button>
        </div>
      </div>
      <div class="game-grid">
        ${this.getSettings()
          .games.map(
            game => `
            <div class="game-item" data-url="${game.url}">
              <div class="game-icon">${game.icon}</div>
              <p class="game-name">${game.name}</p>
            </div>
          `,
          )
          .join('')}
        <div class="add-game-button">
          <span class="add-game-icon">➕</span>
          <p class="add-game-text">添加游戏</p>
        </div>
      </div>
      <div class="game-container" style="display: none;"></div>
    `;

    // 添加事件监听器
    const minimizeButton = panel.querySelector('.minimize-button');
    const closeButton = panel.querySelector('.close-button');
    const gameItems = panel.querySelectorAll('.game-item');
    const addGameButton = panel.querySelector('.add-game-button');
    const gameContainer = panel.querySelector('.game-container');

    minimizeButton.addEventListener('click', () => {
      panel.classList.toggle('minimized');
      minimizeButton.textContent = panel.classList.contains('minimized') ? '➕' : '➖';
    });

    closeButton.addEventListener('click', () => {
      panel.remove();
      this.gamePanel = null;
      if (this.gameButton) {
        this.gameButton.style.display = 'flex';
      }
    });

    gameItems.forEach(item => {
      item.addEventListener('click', () => {
        const url = item.dataset.url;
        const gameFrame = document.createElement('iframe');
        gameFrame.src = url;
        gameFrame.className = 'game-container';
        gameFrame.allow = 'fullscreen';
        gameFrame.sandbox = 'allow-scripts allow-same-origin allow-popups allow-forms';

        gameContainer.innerHTML = '';
        gameContainer.appendChild(gameFrame);
        gameContainer.style.display = 'block';

        panel.querySelector('.game-grid').style.display = 'none';

        // 添加返回按钮
        const backButton = document.createElement('button');
        backButton.className = 'game-panel-button';
        backButton.textContent = '返回';
        backButton.style.marginBottom = '10px';
        backButton.addEventListener('click', () => {
          gameContainer.style.display = 'none';
          panel.querySelector('.game-grid').style.display = 'grid';
        });

        gameContainer.insertBefore(backButton, gameFrame);
      });
    });

    addGameButton.addEventListener('click', () => this.showAddGameDialog());

    document.body.appendChild(panel);
    this.gamePanel = panel;

    // 使面板可拖拽
    this.makeDraggable(panel, (x, y) => {
      const settings = this.getSettings();
      settings.panelPosition = { x, y };
      this.saveSettings();
    });
  }

  /**
   * 创建添加游戏对话框
   */
  showAddGameDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'add-game-dialog';
    dialog.innerHTML = `
      <form class="add-game-form">
        <div class="form-group">
          <label class="form-label">游戏名称</label>
          <input type="text" class="form-input" name="name" required>
        </div>
        <div class="form-group">
          <label class="form-label">图标 (emoji)</label>
          <input type="text" class="form-input" name="icon" required>
        </div>
        <div class="form-group">
          <label class="form-label">游戏URL</label>
          <input type="url" class="form-input" name="url" required>
        </div>
        <div class="form-buttons">
          <button type="button" class="form-button cancel">取消</button>
          <button type="submit" class="form-button submit">添加</button>
        </div>
      </form>
    `;

    const overlay = document.createElement('div');
    overlay.className = 'overlay active';

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);

    const form = dialog.querySelector('form');
    const cancelButton = dialog.querySelector('.cancel');

    form.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(form);
      const newGame = {
        name: formData.get('name'),
        icon: formData.get('icon'),
        url: formData.get('url'),
      };

      const settings = this.getSettings();
      settings.games.push(newGame);
      this.saveSettings();

      // 重新创建游戏面板
      this.createGamePanel();

      dialog.remove();
      overlay.remove();
    });

    cancelButton.addEventListener('click', () => {
      dialog.remove();
      overlay.remove();
    });
  }

  /**
   * 创建游戏按钮
   */
  createGameButton() {
    if (this.gameButton) {
      return;
    }

    const button = document.createElement('button');
    button.id = 'gameButton';
    button.className = 'game-icon-button';
    button.dataset.type = 'icon';
    button.innerHTML = '🎮';

    button.addEventListener('click', () => {
      button.style.display = 'none';
      this.createGamePanel();
    });

    document.body.appendChild(button);
    this.gameButton = button;

    // 使图标可拖拽
    this.makeDraggable(button, (x, y) => {
      const settings = this.getSettings();
      settings.iconPosition = { x, y };
      this.saveSettings();
    });
  }

  /**
   * 初始化扩展
   */
  init() {
    // 初始化设置
    this.getSettings();
    // 创建游戏按钮
    this.createGameButton();
  }
}

// 创建扩展实例
const gameCollection = new GameCollection();

// 监听APP_READY事件
SillyTavern.getContext().eventSource.on(SillyTavern.getContext().event_types.APP_READY, () => {
  console.log('Game Collection Extension Ready');
  gameCollection.init();
});



















