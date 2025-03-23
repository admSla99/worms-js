import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    console.log('MenuScene vytvorená');
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Debug text
    this.add.text(10, 10, 'MenuScene aktívna', {
      font: '16px Arial',
      fill: '#ffffff',
      backgroundColor: '#ff0000',
      padding: { x: 5, y: 5 }
    });
    
    // Pozadie
    this.add.image(width/2, height/2, 'sky').setScale(width/800, height/600);
    
    // Názov hry
    const title = this.add.text(width/2, height/4, 'WORMS JS', {
      font: 'bold 64px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // Animácia názvu
    this.tweens.add({
      targets: title,
      y: height/4 - 10,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    // Vytvorenie obdĺžnika pod tlačidlom Hrať
    const playButtonBg = this.add.graphics();
    playButtonBg.fillStyle(0x222222, 0.8);
    playButtonBg.fillRoundedRect(
      width/2 - 100, 
      height/2 - 25, 
      200, 
      50, 
      10
    );
    
    // Tlačidlo Hrať
    const playButton = this.add.text(width/2, height/2, 'HRAŤ', {
      font: 'bold 32px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => playButton.setStyle({ fill: '#ffff00' }))
    .on('pointerout', () => playButton.setStyle({ fill: '#ffffff' }))
    .on('pointerdown', () => {
      console.log('Tlačidlo HRAŤ stlačené - prechod na GameScene');
      this.scene.start('GameScene');
    });
    
    // Presun obdĺžnika za text
    playButtonBg.setDepth(0);
    playButton.setDepth(1);
    
    // Vytvorenie obdĺžnika pod tlačidlom nastavení
    const settingsButtonBg = this.add.graphics();
    settingsButtonBg.fillStyle(0x222222, 0.8);
    settingsButtonBg.fillRoundedRect(
      width/2 - 125, 
      height/2 + 80 - 20, 
      250, 
      45, 
      10
    );
    
    // Tlačidlo Nastavenia
    const settingsButton = this.add.text(width/2, height/2 + 80, 'NASTAVENIA', {
      font: 'bold 28px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => settingsButton.setStyle({ fill: '#ffff00' }))
    .on('pointerout', () => settingsButton.setStyle({ fill: '#ffffff' }));
    
    // Presun obdĺžnika za text
    settingsButtonBg.setDepth(0);
    settingsButton.setDepth(1);
    
    // Verzia
    this.add.text(10, height - 30, 'v1.0.0', {
      font: '16px Arial',
      fill: '#ffffff'
    });
  }
}