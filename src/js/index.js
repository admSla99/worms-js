import '../css/style.css';
import Phaser from 'phaser';
import { config } from './config';

console.log('Inicializácia hry Worms JS');
console.log('Konfigurácia:', config);

// Vytvorenie inštancie hry
try {
  console.log('Vytváram inštanciu hry...');
  const game = new Phaser.Game(config);
  console.log('Hra úspešne vytvorená!');
  
  // Pridanie udalosti pre prípad chyby
  window.onerror = function(message, source, lineno, colno, error) {
    console.error('Chyba v hre:', message, error);
    // Zobrazíme chybu priamo v hre, ak je to možné
    if (game && game.scene) {
      const activeScene = game.scene.scenes.find(s => s.scene.isActive);
      if (activeScene && activeScene.add) {
        activeScene.add.text(10, 50, 'CHYBA: ' + message, { 
          font: '16px Arial', 
          fill: '#FF0000',
          backgroundColor: '#000000' 
        });
      }
    }
    return false;
  };
  
  // Uloženie hry do window pre debugovanie
  window.game = game;
} catch (e) {
  console.error('Nastala chyba pri vytváraní hry:', e);
  // Zobrazíme chybu na obrazovke
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'absolute';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100%';
  errorDiv.style.padding = '20px';
  errorDiv.style.backgroundColor = '#FF0000';
  errorDiv.style.color = '#FFFFFF';
  errorDiv.style.fontFamily = 'Arial';
  errorDiv.style.fontSize = '16px';
  errorDiv.style.zIndex = '9999';
  errorDiv.textContent = 'Chyba pri inicializácii hry: ' + e.message;
  document.body.appendChild(errorDiv);
}

// Exportujeme inštanciu hry pre prípadné využitie inde v kóde
export default game;