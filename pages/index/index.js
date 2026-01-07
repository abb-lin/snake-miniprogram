
Page({
  data: {
    selectedSkin: 0,
    skins: [
      { id: 1, name: '经典蓝', color: '#4ecdc4' },
      { id: 2, name: '可爱粉', color: '#ff9a9e' },
      { id: 3, name: '活力橙', color: '#ff6b6b' },
      { id: 4, name: '清新绿', color: '#96ceb4' },
      { id: 5, name: '天空蓝', color: '#45b7d1' },
      { id: 6, name: '优雅紫', color: '#9b59b6' }
    ]
  },

  // 选择皮肤
  selectSkin(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({
      selectedSkin: index
    });
  },

  // 开始游戏
  startGame() {
    const selectedSkin = this.data.selectedSkin;
    const snakeColor = this.data.skins[selectedSkin].color;
    
    // 跳转到游戏页面，并传递选中的皮肤信息
    wx.navigateTo({
      url: `/pages/game/game?skin=${selectedSkin}&color=${encodeURIComponent(snakeColor)}`
    });
  }
});
