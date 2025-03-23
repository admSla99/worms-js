import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';

console.log('Načítavanie konfigurácie hry');
console.log('Registrované scény:', [PreloadScene.name, MenuScene.name, GameScene.name]);

// Konfigurácia Phaser hry
export const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#4488aa',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: true // Zapnutie debugovania fyziky
    },
    matter: {
      gravity: { y: 1 },
      debug: false
    }
  },
  scene: [PreloadScene, MenuScene, GameScene],
  pixelArt: false,
  render: {
    antialias: true
  }
};