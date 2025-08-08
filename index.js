/**
 * 小游戏合集扩展 - 超级简化版
 */

const MODULE_NAME = 'mini-games-collection';

// 内置游戏列表
const builtInGames = [
  { name: '贪吃蛇', icon: '🐍', url: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/Gluttonous_Snake.html' },
  { name: '种田', icon: '🌾', url: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/Farming.html' },
  { name: '飞行棋', icon: '✈️', url: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/Flight_chess.html' },
  { name: 'Nyan Cat', icon: '🐱', url: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/Nyan_Cat.html' },
  { name: '扫雷', icon: '💣', url: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/minesweeper.html' },
  { name: '数独', icon: '🔢', url: 'https://cdn.jsdelivr.net/gh/Uharasakura/-@main/shudoku.html' },
];

let gamePanel = null;

// 创建游戏面板
function createGamePanel() {
  if (gamePanel) gamePanel.remove();

  const gamesHTML = builtInGames.map(game => 
    `<div class="game-item" onclick="loadGame('${game.url}', '${game.name}')">
       <div class="game-icon">${game.icon}</div>
       <div class="game-name">${game.name}</div>
     </div>`
  ).join('');

  gamePanel = document.createElement('div');
  gamePanel.innerHTML = `
    <div class="mini-games-panel">
      <div class="panel-header">
        <span>🎮 小游戏合集</span>
        <div>
          <button onclick="toggleMinimize()" class="minimize-btn">−</button>
          <button onclick="hidePanel()" class="close-btn">×</button>
        </div>
      </div>
      <div class="panel-content">
        <div class="games-grid">${gamesHTML}</div>
      </div>
      <div class="game-view" style="display:none">
        <button onclick="backToList()" class="back-btn">← 返回</button>
        <iframe class="game-iframe" frameborder="0"></iframe>
      </div>
    </div>
  `;
  
  gamePanel = gamePanel.firstElementChild;
  gamePanel.style.cssText = `
    position: fixed; top: 50px; left: 50px; width: 400px; height: 500px;
    background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3); z-index: 10000; color: white;
    font-family: -apple-system, sans-serif; transition: height 0.3s ease;
  `;
  
  document.body.appendChild(gamePanel);
}

// 最小化切换
function toggleMinimize() {
  const content = gamePanel.querySelector('.panel-content');
  const gameView = gamePanel.querySelector('.game-view');
  const btn = gamePanel.querySelector('.minimize-btn');
  
  if (content.style.display === 'none') {
    // 展开
    content.style.display = gameView.style.display !== 'none' ? 'none' : '';
    gameView.style.display = gameView.style.display !== 'none' ? 'block' : 'none';
    gamePanel.style.height = '';
    btn.textContent = '−';
  } else {
    // 最小化
    content.style.display = 'none';
    gameView.style.display = 'none';
    gamePanel.style.height = '50px';
    btn.textContent = '+';
  }
}

// 加载游戏
async function loadGame(url, name) {
  const content = gamePanel.querySelector('.panel-content');
  const gameView = gamePanel.querySelector('.game-view');
  const iframe = gamePanel.querySelector('.game-iframe');
  
  content.style.display = 'none';
  gameView.style.display = 'block';
  
  try {
    const response = await fetch(url);
    let html = await response.text();
    
    // 简单的jQuery检测和注入
    if ((html.includes('$(') || html.includes('jQuery(')) && !html.includes('jquery')) {
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      const head = `<base href="${baseUrl}"><script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>`;
      html = html.replace('<head>', '<head>' + head) || head + html;
    }
    
    iframe.srcdoc = html;
  } catch (error) {
    iframe.srcdoc = `<div style="text-align:center;padding:50px;color:#666;">
      <h3>加载失败: ${name}</h3>
      <a href="${url}" target="_blank">新窗口打开</a>
    </div>`;
  }
}

// 返回游戏列表
function backToList() {
  gamePanel.querySelector('.panel-content').style.display = '';
  gamePanel.querySelector('.game-view').style.display = 'none';
}

// 显示/隐藏面板
function showPanel() {
  if (!gamePanel) createGamePanel();
  gamePanel.style.display = 'block';
}

function hidePanel() {
  if (gamePanel) gamePanel.style.display = 'none';
}

// 创建扩展按钮
function createButton() {
  if (document.querySelector('#mini-games-btn')) return;
  
  const btn = document.createElement('div');
  btn.id = 'mini-games-btn';
  btn.innerHTML = '🎮';
  btn.onclick = () => gamePanel?.style.display === 'none' ? showPanel() : hidePanel();
  btn.style.cssText = `
    position: fixed; top: 10px; right: 10px; width: 50px; height: 50px;
    background: #667eea; border-radius: 50%; color: white; font-size: 24px;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  
  document.body.appendChild(btn);
}

// 初始化
function init() {
  createButton();
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










































































