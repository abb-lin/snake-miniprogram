Page({
  data: {
    score: 0,
    isGameOver: false
  },

  // 游戏状态
  game: null,

  onLoad: function(options) {
    // 初始化游戏状态
    this.game = {
      snake: [],
      foods: [],
      direction: 'right',
      nextDirection: 'right',
      gridSize: 20,
      rows: 30,
      cols: 40,
      ctx: null,
      canvasWidth: 0,
      canvasHeight: 0,
      cameraX: 0,
      cameraY: 0,
      snakeColor: '#4ecdc4',
      touchStartX: 0,
      touchStartY: 0,
      lastTime: Date.now(),
      skins: [
        { id: 1, name: '经典蓝', color: '#4ecdc4' },
        { id: 2, name: '可爱粉', color: '#ff9a9e' },
        { id: 3, name: '活力橙', color: '#ff6b6b' },
        { id: 4, name: '清新绿', color: '#96ceb4' },
        { id: 5, name: '天空蓝', color: '#45b7d1' },
        { id: 6, name: '优雅紫', color: '#9b59b6' }
      ]
    };
    
    // 获取从首页传递的皮肤信息
    if (options.skin && options.color) {
      const skinIndex = parseInt(options.skin);
      this.game.snakeColor = decodeURIComponent(options.color);
    }
    
    // 初始化游戏
    this.initGame();
  },


  onUnload: function() {
    // 页面卸载时的清理工作
  },

  // 初始化游戏
  initGame: function() {
    // 获取画布上下文
    const query = wx.createSelectorQuery();
    query.select('#gameCanvas').boundingClientRect();
    query.exec((res) => {
      if (res && res[0]) {
        this.game.canvasWidth = res[0].width;
        this.game.canvasHeight = res[0].height;
        this.game.ctx = wx.createCanvasContext('gameCanvas', this);
        
        // 初始化蛇
        this.game.snake = [];
        for (let i = 3; i >= 0; i--) {
          this.game.snake.push({ x: i + 10, y: 20 });
        }

        // 生成食物
        this.generateFood();

        // 初始化方向
        this.game.direction = 'right';
        this.game.nextDirection = 'right';

        // 初始化相机位置
        this.updateCamera();

        // 初始化分数
        this.setData({
          score: 0,
          isGameOver: false
        });

        // 开始游戏循环
        this.game.lastTime = Date.now();
        this.gameLoop();
      }
    });
  },

  // 生成食物
  generateFood: function() {
    this.game.foods = [];
    for (let i = 0; i < 5; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * this.game.cols);
        y = Math.floor(Math.random() * this.game.rows);
      } while (this.isSnakeAt(x, y) || this.isFoodAt(x, y));
      
      this.game.foods.push({ 
        x, 
        y,
        color: this.getRandomColor()
      });
    }
  },

  // 检查蛇是否在指定位置
  isSnakeAt: function(x, y) {
    return this.game.snake.some(segment => segment.x === x && segment.y === y);
  },

  // 检查食物是否在指定位置
  isFoodAt: function(x, y) {
    return this.game.foods.some(food => food.x === x && food.y === y);
  },

  // 获取随机颜色
  getRandomColor: function() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffcc5c', '#d96459', '#f6e58d', '#6c5ce7'];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  // 游戏主循环
  gameLoop: function() {
    const now = Date.now();
    const deltaTime = now - this.game.lastTime;
    
    // 控制游戏速度，每150ms更新一次
    if (deltaTime >= 150) {
      this.update();
      this.game.lastTime = now;
    }
    
    // 如果游戏未结束，继续下一帧
    if (!this.data.isGameOver) {
      // 使用 setTimeout 替代 requestAnimationFrame
      setTimeout(this.gameLoop.bind(this), 16); // 约60fps
    }
  },

  // 更新游戏状态
  update: function() {
    if (this.data.isGameOver) return;

    // 更新方向
    this.game.direction = this.game.nextDirection;

    // 计算新头部位置
    let head = { ...this.game.snake[0] };
    switch (this.game.direction) {
      case 'up':
        head.y--;
        break;
      case 'down':
        head.y++;
        break;
      case 'left':
        head.x--;
        break;
      case 'right':
        head.x++;
        break;
    }

    // 检查边界碰撞
    if (head.x < 0 || head.x >= this.game.cols || head.y < 0 || head.y >= this.game.rows) {
      this.endGame();
      return;
    }

    // 检查自身碰撞
    if (this.isSnakeAt(head.x, head.y)) {
      this.endGame();
      return;
    }

    // 检查食物碰撞
    let foodEaten = false;
    for (let i = 0; i < this.game.foods.length; i++) {
      const food = this.game.foods[i];
      if (head.x === food.x && head.y === food.y) {
        // 吃到食物
        const newScore = this.data.score + 10;
        this.setData({
          score: newScore
        });
        
        // 改变蛇的颜色
        this.game.snakeColor = food.color;
        
        // 移除被吃掉的食物
        this.game.foods.splice(i, 1);
        
        // 重新生成食物
        this.generateFood();
        foodEaten = true;
        break;
      }
    }

    // 移除尾部
    if (!foodEaten) {
      this.game.snake.pop();
    }

    // 添加新头部
    this.game.snake.unshift(head);

    // 更新相机位置
    this.updateCamera();

    // 绘制游戏
    this.draw();
  },

  // 更新相机位置（视角跟随）
  updateCamera: function() {
    const head = this.game.snake[0];
    
    // 计算相机中心位置
    this.game.cameraX = Math.max(0, Math.min(head.x * this.game.gridSize - this.game.canvasWidth / 2, (this.game.cols * this.game.gridSize) - this.game.canvasWidth));
    this.game.cameraY = Math.max(0, Math.min(head.y * this.game.gridSize - this.game.canvasHeight / 2, (this.game.rows * this.game.gridSize) - this.game.canvasHeight));
  },

  // 绘制游戏
  draw: function() {
    if (!this.game.ctx) return;

    const ctx = this.game.ctx;
    const { canvasWidth, canvasHeight, gridSize, cols, rows, cameraX, cameraY, snake, foods, snakeColor } = this.game;

    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 绘制网格线（边界线）
    ctx.setStrokeStyle('#e0e0e0');
    ctx.setLineWidth(1);
    for (let x = 0; x <= cols; x++) {
      const screenX = x * gridSize - cameraX;
      if (screenX >= -gridSize && screenX <= canvasWidth) {
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvasHeight);
        ctx.stroke();
      }
    }
    for (let y = 0; y <= rows; y++) {
      const screenY = y * gridSize - cameraY;
      if (screenY >= -gridSize && screenY <= canvasHeight) {
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(canvasWidth, screenY);
        ctx.stroke();
      }
    }

    // 绘制边界（增强效果）
    ctx.setStrokeStyle('#ff6b6b');
    ctx.setLineWidth(4);
    ctx.strokeRect(
      -cameraX,
      -cameraY,
      cols * gridSize,
      rows * gridSize
    );
    
    // 绘制内边界
    ctx.setStrokeStyle('#ff9a9e');
    ctx.setLineWidth(2);
    ctx.strokeRect(
      -cameraX + 2,
      -cameraY + 2,
      cols * gridSize - 4,
      rows * gridSize - 4
    );

    // 绘制蛇
    snake.forEach((segment, index) => {
      const x = segment.x * gridSize - cameraX;
      const y = segment.y * gridSize - cameraY;
      
      // 只绘制屏幕内的部分
      if (x >= -gridSize && x <= canvasWidth && y >= -gridSize && y <= canvasHeight) {
        // 蛇头
        if (index === 0) {
          ctx.setFillStyle(snakeColor);
        } else {
          ctx.setFillStyle(snakeColor);
        }
        
        ctx.fillRect(x, y, gridSize, gridSize);
        ctx.setStrokeStyle('#3a9b93');
        ctx.setLineWidth(2);
        ctx.strokeRect(x, y, gridSize, gridSize);
      }
    });

    // 绘制食物
    foods.forEach(food => {
      const foodX = food.x * gridSize - cameraX;
      const foodY = food.y * gridSize - cameraY;
      
      // 只绘制屏幕内的食物
      if (foodX >= -gridSize && foodX <= canvasWidth && foodY >= -gridSize && foodY <= canvasHeight) {
        ctx.setFillStyle(food.color);
        ctx.beginPath();
        ctx.arc(foodX + gridSize / 2, foodY + gridSize / 2, gridSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 绘制到画布
    ctx.draw();
  },

  // 结束游戏
  endGame: function() {
    this.setData({
      isGameOver: true
    });
  },

  // 重新开始游戏
  restartGame: function() {
    this.setData({
      score: 0,
      isGameOver: false
    });
    
    // 重新初始化游戏
    this.initGame();
  },

  // 返回首页
  backToHome: function() {
    // 直接返回首页
    wx.navigateBack({
      delta: 1
    });
  },

  // 处理触摸开始
  handleTouchStart: function(e) {
    const touch = e.touches[0];
    this.game.touchStartX = touch.clientX;
    this.game.touchStartY = touch.clientY;
  },

  // 处理触摸结束
  handleTouchEnd: function(e) {
    const touch = e.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;
    
    const dx = touchEndX - this.game.touchStartX;
    const dy = touchEndY - this.game.touchStartY;
    
    // 确定滑动方向
    if (Math.abs(dx) > Math.abs(dy)) {
      // 水平滑动
      if (dx > 0 && this.game.direction !== 'left') {
        this.game.nextDirection = 'right';
      } else if (dx < 0 && this.game.direction !== 'right') {
        this.game.nextDirection = 'left';
      }
    } else {
      // 垂直滑动
      if (dy > 0 && this.game.direction !== 'up') {
        this.game.nextDirection = 'down';
      } else if (dy < 0 && this.game.direction !== 'down') {
        this.game.nextDirection = 'up';
      }
    }
  }
});
