// Tetris Game Logic and Rendering
(function () {
  'use strict';

  // Constants
  const COLS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = 30; // 300 x 600 px main board

  // Tetromino definitions
  const TETROMINOES = {
    I: {
      shape: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      color: '#00e5ff',
      shadowColor: 'rgba(0, 229, 255, 0.45)',
      light: '#84ffff',
      dark: '#0097a7'
    },
    J: {
      shape: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
      ],
      color: '#3d5afe',
      shadowColor: 'rgba(61, 90, 254, 0.45)',
      light: '#8c9eff',
      dark: '#1a237e'
    },
    L: {
      shape: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
      ],
      color: '#ff9100',
      shadowColor: 'rgba(255, 145, 0, 0.45)',
      light: '#ffd180',
      dark: '#e65100'
    },
    O: {
      shape: [
        [1, 1],
        [1, 1]
      ],
      color: '#ffd600',
      shadowColor: 'rgba(255, 214, 0, 0.45)',
      light: '#ffff8d',
      dark: '#f57f17'
    },
    S: {
      shape: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
      ],
      color: '#00e676',
      shadowColor: 'rgba(0, 230, 118, 0.45)',
      light: '#b9f6ca',
      dark: '#1b5e20'
    },
    T: {
      shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
      ],
      color: '#d500f9',
      shadowColor: 'rgba(213, 0, 249, 0.45)',
      light: '#ea80fc',
      dark: '#4a148c'
    },
    Z: {
      shape: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
      ],
      color: '#ff1744',
      shadowColor: 'rgba(255, 23, 68, 0.45)',
      light: '#ff80ab',
      dark: '#b71c1c'
    }
  };

  // 7-Bag Randomizer
  class BagRandomizer {
    constructor() {
      this.bag = [];
    }

    next() {
      if (this.bag.length === 0) {
        this.bag = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
        for (let i = this.bag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
        }
      }
      return this.bag.pop();
    }
  }

  // Particle for Line Clears & Impacts
  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 6;
      this.vy = (Math.random() - 0.8) * 6;
      this.size = Math.random() * 4 + 2;
      this.color = color;
      this.alpha = 1;
      this.decay = Math.random() * 0.03 + 0.015;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.15; // gravity
      this.alpha -= this.decay;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(this.x, this.y, this.size, this.size);
      ctx.restore();
    }
  }

  // Floating score text
  class FloatingText {
    constructor(text, x, y, color = '#ffd700', size = 20) {
      this.text = text;
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = size;
      this.alpha = 1;
      this.vy = -1.2;
    }

    update() {
      this.y += this.vy;
      this.alpha -= 0.018;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.font = `bold ${this.size}px 'Press Start 2P', monospace, sans-serif`;
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();
    }
  }

  // Main Game Class
  class TetrisGame {
    constructor() {
      this.canvas = document.getElementById('board');
      this.ctx = this.canvas.getContext('2d');

      this.holdCanvas = document.getElementById('hold-canvas');
      this.holdCtx = this.holdCanvas.getContext('2d');

      this.nextCanvas = document.getElementById('next-canvas');
      this.nextCtx = this.nextCanvas.getContext('2d');

      // Elements
      this.scoreElem = document.getElementById('score-value');
      this.highScoreElem = document.getElementById('high-score-value');
      this.levelElem = document.getElementById('level-value');
      this.linesElem = document.getElementById('lines-value');
      this.overlay = document.getElementById('game-overlay');
      this.overlayTitle = document.getElementById('overlay-title');
      this.overlaySubtitle = document.getElementById('overlay-subtitle');
      this.startBtn = document.getElementById('btn-start');
      this.pauseBtn = document.getElementById('btn-pause');
      this.restartBtn = document.getElementById('btn-restart');
      this.soundBtn = document.getElementById('btn-sound');
      this.musicBtn = document.getElementById('btn-music');

      // State
      this.board = this.createBoard();
      this.bag = new BagRandomizer();
      this.currentPiece = null;
      this.nextQueue = [];
      this.holdPiece = null;
      this.canHold = true;

      this.score = 0;
      this.highScore = parseInt(localStorage.getItem('tetris_high_score') || '0', 10);
      this.level = 1;
      this.lines = 0;
      this.combo = 0;

      this.isGameOver = false;
      this.isPaused = false;
      this.isPlaying = false;

      // Drop Timing
      this.dropCounter = 0;
      this.dropInterval = 1000;
      this.lastTime = 0;

      // Lock delay (500ms delay before locking piece when on ground)
      this.lockDelay = 500;
      this.lockTimer = 0;
      this.isOnGround = false;
      this.lockResets = 0;
      this.maxLockResets = 12;

      // Visual effects
      this.particles = [];
      this.floatingTexts = [];
      this.shakeIntensity = 0;
      this.clearingLines = [];
      this.clearAnimTimer = 0;

      // Keyboard repeating (DAS/ARR)
      this.keysDown = {};
      this.keyTimers = {};

      this.init();
    }

    createBoard() {
      return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    init() {
      this.highScoreElem.innerText = this.highScore.toLocaleString();
      this.setupEventListeners();
      this.render();
    }

    setupEventListeners() {
      // Keyboard input
      window.addEventListener('keydown', (e) => this.handleKeyDown(e));
      window.addEventListener('keyup', (e) => this.handleKeyUp(e));

      // Buttons
      this.startBtn.addEventListener('click', () => {
        window.soundManager.init();
        this.startGame();
      });

      this.restartBtn.addEventListener('click', () => {
        window.soundManager.init();
        this.startGame();
      });

      this.pauseBtn.addEventListener('click', () => {
        this.togglePause();
      });

      this.soundBtn.addEventListener('click', () => {
        window.soundManager.sfxEnabled = !window.soundManager.sfxEnabled;
        this.soundBtn.classList.toggle('active', window.soundManager.sfxEnabled);
        this.soundBtn.innerText = window.soundManager.sfxEnabled ? '🔊 SFX: ON' : '🔇 SFX: OFF';
      });

      this.musicBtn.addEventListener('click', () => {
        const isMusicOn = window.soundManager.toggleMusic();
        this.musicBtn.classList.toggle('active', isMusicOn);
        this.musicBtn.innerText = isMusicOn ? '🎵 MÚSICA: ON' : '🔇 MÚSICA: OFF';
      });

      // Mobile Touch Controls
      this.setupTouchControls();
    }

    setupTouchControls() {
      const bindBtn = (id, action) => {
        const el = document.getElementById(id);
        if (!el) return;

        let interval = null;
        const trigger = (e) => {
          e.preventDefault();
          window.soundManager.init();
          action();
        };

        el.addEventListener('touchstart', (e) => {
          trigger(e);
          if (id === 'ctrl-left' || id === 'ctrl-right' || id === 'ctrl-down') {
            interval = setInterval(() => action(), 100);
          }
        }, { passive: false });

        el.addEventListener('touchend', (e) => {
          e.preventDefault();
          if (interval) clearInterval(interval);
        }, { passive: false });

        el.addEventListener('mousedown', (e) => {
          trigger(e);
        });
      };

      bindBtn('ctrl-left', () => this.move(-1));
      bindBtn('ctrl-right', () => this.move(1));
      bindBtn('ctrl-down', () => this.softDrop());
      bindBtn('ctrl-rotate', () => this.rotate(1));
      bindBtn('ctrl-hard-drop', () => this.hardDrop());
      bindBtn('ctrl-hold', () => this.doHold());
    }

    handleKeyDown(e) {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.repeat && ['Space', 'KeyC', 'ShiftLeft', 'ShiftRight', 'KeyP'].includes(e.code)) {
        return;
      }

      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
        return;
      }

      if (e.code === 'KeyR') {
        this.startGame();
        return;
      }

      if (!this.isPlaying || this.isPaused || this.isGameOver) return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.move(-1);
          this.startAutoRepeat('left', () => this.move(-1));
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.move(1);
          this.startAutoRepeat('right', () => this.move(1));
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.softDrop();
          this.startAutoRepeat('down', () => this.softDrop(), 60, 60);
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'KeyX':
          this.rotate(1);
          break;
        case 'KeyZ':
          this.rotate(-1);
          break;
        case 'Space':
          this.hardDrop();
          break;
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          this.doHold();
          break;
      }
    }

    handleKeyUp(e) {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.stopAutoRepeat('left');
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.stopAutoRepeat('right');
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.stopAutoRepeat('down');
    }

    startAutoRepeat(key, action, das = 170, arr = 45) {
      this.stopAutoRepeat(key);
      this.keyTimers[key] = {
        dasTimeout: setTimeout(() => {
          this.keyTimers[key].arrInterval = setInterval(action, arr);
        }, das),
        arrInterval: null
      };
    }

    stopAutoRepeat(key) {
      if (this.keyTimers[key]) {
        clearTimeout(this.keyTimers[key].dasTimeout);
        clearInterval(this.keyTimers[key].arrInterval);
        delete this.keyTimers[key];
      }
    }

    startGame() {
      this.board = this.createBoard();
      this.bag = new BagRandomizer();
      this.score = 0;
      this.lines = 0;
      this.level = 1;
      this.combo = 0;
      this.isGameOver = false;
      this.isPaused = false;
      this.isPlaying = true;
      this.holdPiece = null;
      this.canHold = true;
      this.particles = [];
      this.floatingTexts = [];
      this.clearingLines = [];
      this.calculateDropInterval();

      this.updateUI();
      this.hideOverlay();

      this.nextQueue = [];
      for (let i = 0; i < 3; i++) {
        this.nextQueue.push(this.bag.next());
      }
      this.spawnPiece();

      this.lastTime = performance.now();
      requestAnimationFrame((t) => this.gameLoop(t));
    }

    calculateDropInterval() {
      // Standard curve: drops faster as level increases
      this.dropInterval = Math.max(80, Math.pow(0.8 - (this.level - 1) * 0.007, this.level - 1) * 1000);
    }

    spawnPiece() {
      const type = this.nextQueue.shift();
      this.nextQueue.push(this.bag.next());

      const data = TETROMINOES[type];
      const shape = data.shape.map((row) => [...row]);

      // Center piece at top
      const x = Math.floor((COLS - shape[0].length) / 2);
      const y = type === 'I' ? -1 : 0;

      this.currentPiece = {
        type,
        shape,
        x,
        y,
        color: data.color,
        light: data.light,
        dark: data.dark,
        shadowColor: data.shadowColor
      };

      this.canHold = true;
      this.isOnGround = false;
      this.lockTimer = 0;
      this.lockResets = 0;

      // Check collision on spawn -> Game Over
      if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
        this.gameOver();
      }

      this.renderHold();
      this.renderNext();
    }

    doHold() {
      if (!this.canHold || this.isGameOver || this.isPaused) return;

      window.soundManager.playHold();
      const currentType = this.currentPiece.type;

      if (!this.holdPiece) {
        this.holdPiece = currentType;
        this.spawnPiece();
      } else {
        const temp = this.holdPiece;
        this.holdPiece = currentType;

        const data = TETROMINOES[temp];
        this.currentPiece = {
          type: temp,
          shape: data.shape.map((r) => [...r]),
          x: Math.floor((COLS - data.shape[0].length) / 2),
          y: temp === 'I' ? -1 : 0,
          color: data.color,
          light: data.light,
          dark: data.dark,
          shadowColor: data.shadowColor
        };
      }

      this.canHold = false;
      this.renderHold();
    }

    checkCollision(x, y, shape = this.currentPiece.shape) {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const newX = x + c;
            const newY = y + r;

            if (newX < 0 || newX >= COLS || newY >= ROWS) {
              return true;
            }
            if (newY >= 0 && this.board[newY][newX] !== 0) {
              return true;
            }
          }
        }
      }
      return false;
    }

    move(dir) {
      if (!this.currentPiece || this.isPaused || this.isGameOver) return false;

      if (!this.checkCollision(this.currentPiece.x + dir, this.currentPiece.y)) {
        this.currentPiece.x += dir;
        window.soundManager.playMove();

        if (this.isOnGround && this.lockResets < this.maxLockResets) {
          this.lockTimer = 0;
          this.lockResets++;
        }
        return true;
      }
      return false;
    }

    rotate(dir = 1) {
      if (!this.currentPiece || this.isPaused || this.isGameOver) return;
      if (this.currentPiece.type === 'O') return; // O doesn't need rotation

      const prevShape = this.currentPiece.shape;
      const N = prevShape.length;
      let newShape = Array.from({ length: N }, () => Array(N).fill(0));

      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (dir === 1) {
            newShape[c][N - 1 - r] = prevShape[r][c]; // clockwise
          } else {
            newShape[N - 1 - c][r] = prevShape[r][c]; // counter-clockwise
          }
        }
      }

      // Wall kick test offsets
      const kicks = [
        [0, 0],
        [-1, 0],
        [1, 0],
        [0, -1],
        [-1, -1],
        [1, -1],
        [-2, 0],
        [2, 0],
        [0, -2]
      ];

      for (const [kx, ky] of kicks) {
        if (!this.checkCollision(this.currentPiece.x + kx, this.currentPiece.y + ky, newShape)) {
          this.currentPiece.shape = newShape;
          this.currentPiece.x += kx;
          this.currentPiece.y += ky;
          window.soundManager.playRotate();

          if (this.isOnGround && this.lockResets < this.maxLockResets) {
            this.lockTimer = 0;
            this.lockResets++;
          }
          return;
        }
      }
    }

    softDrop() {
      if (!this.currentPiece || this.isPaused || this.isGameOver) return;

      if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1)) {
        this.currentPiece.y++;
        this.score += 1;
        this.updateUI();
        window.soundManager.playDrop();
        this.dropCounter = 0;
      } else {
        this.isOnGround = true;
      }
    }

    hardDrop() {
      if (!this.currentPiece || this.isPaused || this.isGameOver) return;

      let droppedRows = 0;
      while (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1)) {
        this.currentPiece.y++;
        droppedRows++;
      }

      this.score += droppedRows * 2;
      this.updateUI();
      this.shakeIntensity = 5;
      window.soundManager.playHardDrop();

      this.lockPiece();
    }

    getGhostY() {
      if (!this.currentPiece) return 0;
      let ghostY = this.currentPiece.y;
      while (!this.checkCollision(this.currentPiece.x, ghostY + 1)) {
        ghostY++;
      }
      return ghostY;
    }

    lockPiece() {
      const { x, y, shape, type } = this.currentPiece;

      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const by = y + r;
            const bx = x + c;
            if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
              this.board[by][bx] = type;
            }
          }
        }
      }

      this.checkLines();
      if (!this.isGameOver) {
        this.spawnPiece();
      }
    }

    checkLines() {
      const fullRows = [];
      for (let r = 0; r < ROWS; r++) {
        if (this.board[r].every((cell) => cell !== 0)) {
          fullRows.push(r);
        }
      }

      if (fullRows.length > 0) {
        this.clearingLines = fullRows;
        this.clearAnimTimer = 12; // Frames of flash effect
        window.soundManager.playLineClear(fullRows.length);

        // Spawn particles
        fullRows.forEach((row) => {
          for (let col = 0; col < COLS; col++) {
            const cellType = this.board[row][col];
            const color = TETROMINOES[cellType]?.color || '#ffffff';
            for (let p = 0; p < 4; p++) {
              this.particles.push(
                new Particle(
                  col * BLOCK_SIZE + BLOCK_SIZE / 2,
                  row * BLOCK_SIZE + BLOCK_SIZE / 2,
                  color
                )
              );
            }
          }
        });

        // Scoring
        const baseScores = [0, 100, 300, 500, 800];
        let gainedScore = baseScores[fullRows.length] * this.level;

        // Combo bonus
        this.combo++;
        if (this.combo > 1) {
          gainedScore += 50 * this.combo * this.level;
        }

        this.score += gainedScore;
        this.lines += fullRows.length;

        // Floating score text
        const textLabel =
          fullRows.length === 4
            ? `TETRIS! +${gainedScore}`
            : fullRows.length === 3
            ? `TRIPLO! +${gainedScore}`
            : fullRows.length === 2
            ? `DUPLO! +${gainedScore}`
            : `+${gainedScore}`;

        this.floatingTexts.push(
          new FloatingText(
            textLabel,
            (COLS * BLOCK_SIZE) / 2,
            fullRows[0] * BLOCK_SIZE,
            fullRows.length === 4 ? '#00e5ff' : '#ffd700',
            fullRows.length === 4 ? 22 : 18
          )
        );

        if (fullRows.length === 4) {
          this.shakeIntensity = 8;
        }

        // Level up every 10 lines
        const nextLevel = Math.floor(this.lines / 10) + 1;
        if (nextLevel > this.level) {
          this.level = nextLevel;
          this.calculateDropInterval();
          window.soundManager.playLevelUp();
          this.floatingTexts.push(
            new FloatingText(`NÍVEL ${this.level}!`, (COLS * BLOCK_SIZE) / 2, 100, '#a855f7', 24)
          );
        }

        // Clear rows from board after animation
        setTimeout(() => {
          for (const row of fullRows) {
            this.board.splice(row, 1);
            this.board.unshift(Array(COLS).fill(0));
          }
          this.clearingLines = [];
        }, 120);

        this.updateUI();
      } else {
        this.combo = 0;
      }
    }

    togglePause() {
      if (!this.isPlaying || this.isGameOver) return;

      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        this.pauseBtn.innerText = '▶ CONTINUAR';
        this.showOverlay('PAUSADO', 'Pressione P para continuar');
      } else {
        this.pauseBtn.innerText = '⏸ PAUSAR';
        this.hideOverlay();
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
      }
    }

    gameOver() {
      this.isGameOver = true;
      this.isPlaying = false;
      window.soundManager.playGameOver();

      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('tetris_high_score', this.highScore.toString());
        this.highScoreElem.innerText = this.highScore.toLocaleString();
        this.showOverlay('GAME OVER', `Novo Recorde: ${this.score.toLocaleString()}!`);
      } else {
        this.showOverlay('GAME OVER', `Pontuação Final: ${this.score.toLocaleString()}`);
      }
    }

    showOverlay(title, subtitle) {
      this.overlayTitle.innerText = title;
      this.overlaySubtitle.innerText = subtitle;
      this.startBtn.innerText = 'JOGAR NOVAMENTE';
      this.overlay.classList.remove('hidden');
    }

    hideOverlay() {
      this.overlay.classList.add('hidden');
    }

    updateUI() {
      this.scoreElem.innerText = this.score.toLocaleString();
      this.levelElem.innerText = this.level;
      this.linesElem.innerText = this.lines;

      if (this.score > this.highScore) {
        this.highScore = this.score;
        this.highScoreElem.innerText = this.highScore.toLocaleString();
      }
    }

    gameLoop(time = 0) {
      if (!this.isPlaying || this.isPaused || this.isGameOver) return;

      const deltaTime = time - this.lastTime;
      this.lastTime = time;

      this.dropCounter += deltaTime;

      // Handle locking on ground
      if (this.currentPiece && this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1)) {
        this.isOnGround = true;
        this.lockTimer += deltaTime;
        if (this.lockTimer >= this.lockDelay) {
          this.lockPiece();
        }
      } else {
        this.isOnGround = false;
        this.lockTimer = 0;

        if (this.dropCounter > this.dropInterval) {
          this.currentPiece.y++;
          this.dropCounter = 0;
        }
      }

      this.updateParticles();
      this.render();

      requestAnimationFrame((t) => this.gameLoop(t));
    }

    updateParticles() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.update();
        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }

      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.update();
        if (ft.alpha <= 0) {
          this.floatingTexts.splice(i, 1);
        }
      }

      if (this.shakeIntensity > 0) {
        this.shakeIntensity *= 0.88;
        if (this.shakeIntensity < 0.1) this.shakeIntensity = 0;
      }
    }

    drawBlock(ctx, x, y, type, alpha = 1, isGhost = false) {
      const data = TETROMINOES[type];
      if (!data) return;

      const px = x * BLOCK_SIZE;
      const py = y * BLOCK_SIZE;
      const size = BLOCK_SIZE;

      ctx.save();
      ctx.globalAlpha = alpha;

      if (isGhost) {
        ctx.strokeStyle = data.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 1.5, py + 1.5, size - 3, size - 3);
        ctx.fillStyle = data.shadowColor;
        ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
        ctx.restore();
        return;
      }

      // Outer block base
      ctx.fillStyle = data.color;
      ctx.fillRect(px, py, size, size);

      // Top/Left highlight bevel
      ctx.fillStyle = data.light;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + size, py);
      ctx.lineTo(px + size - 4, py + 4);
      ctx.lineTo(px + 4, py + 4);
      ctx.lineTo(px + 4, py + size - 4);
      ctx.lineTo(px, py + size);
      ctx.closePath();
      ctx.fill();

      // Bottom/Right shadow bevel
      ctx.fillStyle = data.dark;
      ctx.beginPath();
      ctx.moveTo(px + size, py);
      ctx.lineTo(px + size, py + size);
      ctx.lineTo(px, py + size);
      ctx.lineTo(px + 4, py + size - 4);
      ctx.lineTo(px + size - 4, py + size - 4);
      ctx.lineTo(px + size - 4, py + 4);
      ctx.closePath();
      ctx.fill();

      // Inner center glow
      ctx.fillStyle = data.color;
      ctx.fillRect(px + 4, py + 4, size - 8, size - 8);

      ctx.restore();
    }

    render() {
      this.ctx.save();

      // Screen shake
      if (this.shakeIntensity > 0) {
        const sx = (Math.random() - 0.5) * this.shakeIntensity * 2;
        const sy = (Math.random() - 0.5) * this.shakeIntensity * 2;
        this.ctx.translate(sx, sy);
      }

      // Clear main canvas with subtle dark gradient
      const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      bgGrad.addColorStop(0, '#0f141f');
      bgGrad.addColorStop(1, '#090b10');
      this.ctx.fillStyle = bgGrad;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Grid Lines
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      this.ctx.lineWidth = 1;
      for (let c = 0; c <= COLS; c++) {
        this.ctx.beginPath();
        this.ctx.moveTo(c * BLOCK_SIZE, 0);
        this.ctx.lineTo(c * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        this.ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, r * BLOCK_SIZE);
        this.ctx.lineTo(COLS * BLOCK_SIZE, r * BLOCK_SIZE);
        this.ctx.stroke();
      }

      // Board blocks
      for (let r = 0; r < ROWS; r++) {
        const isClearing = this.clearingLines.includes(r);
        for (let c = 0; c < COLS; c++) {
          const type = this.board[r][c];
          if (type) {
            if (isClearing) {
              // Flash white
              this.ctx.fillStyle = '#ffffff';
              this.ctx.shadowColor = '#ffffff';
              this.ctx.shadowBlur = 10;
              this.ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            } else {
              this.drawBlock(this.ctx, c, r, type);
            }
          }
        }
      }

      // Ghost piece
      if (this.currentPiece && !this.isGameOver) {
        const ghostY = this.getGhostY();
        const { shape, x, type } = this.currentPiece;
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
              const gy = ghostY + r;
              const gx = x + c;
              if (gy >= 0) {
                this.drawBlock(this.ctx, gx, gy, type, 0.45, true);
              }
            }
          }
        }

        // Current active piece
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
              const py = this.currentPiece.y + r;
              const px = this.currentPiece.x + c;
              if (py >= 0) {
                this.drawBlock(this.ctx, px, py, type);
              }
            }
          }
        }
      }

      // Render Particles
      for (const p of this.particles) {
        p.draw(this.ctx);
      }

      // Render Floating Texts
      for (const ft of this.floatingTexts) {
        ft.draw(this.ctx);
      }

      this.ctx.restore();
    }

    renderHold() {
      this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
      if (!this.holdPiece) return;

      const data = TETROMINOES[this.holdPiece];
      const shape = data.shape;
      const cellSize = 22;
      const offsetX = (this.holdCanvas.width - shape[0].length * cellSize) / 2;
      const offsetY = (this.holdCanvas.height - shape.length * cellSize) / 2;

      this.drawMiniPiece(this.holdCtx, shape, data, offsetX, offsetY, cellSize, this.canHold ? 1 : 0.4);
    }

    renderNext() {
      this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
      const cellSize = 20;

      this.nextQueue.forEach((type, index) => {
        const data = TETROMINOES[type];
        const shape = data.shape;
        const offsetX = (this.nextCanvas.width - shape[0].length * cellSize) / 2;
        const offsetY = index * 60 + 12;

        this.drawMiniPiece(this.nextCtx, shape, data, offsetX, offsetY, cellSize);
      });
    }

    drawMiniPiece(ctx, shape, data, offsetX, offsetY, cellSize, alpha = 1) {
      ctx.save();
      ctx.globalAlpha = alpha;

      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const x = offsetX + c * cellSize;
            const y = offsetY + r * cellSize;

            ctx.fillStyle = data.color;
            ctx.fillRect(x, y, cellSize, cellSize);

            ctx.fillStyle = data.light;
            ctx.fillRect(x, y, cellSize, 3);
            ctx.fillRect(x, y, 3, cellSize);

            ctx.fillStyle = data.dark;
            ctx.fillRect(x, y + cellSize - 3, cellSize, 3);
            ctx.fillRect(x + cellSize - 3, y, 3, cellSize);
          }
        }
      }
      ctx.restore();
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.game = new TetrisGame();
  });
})();
