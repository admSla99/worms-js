import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
    console.log('PreloadScene konštruktor zavolaný');
  }

  preload() {
    console.log('PreloadScene preload metóda začala');
    
    // Vytvorenie loadingu
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(this.cameras.main.width / 4, this.cameras.main.height / 2 - 30, this.cameras.main.width / 2, 50);
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Načítavam...',
      style: {
        font: '20px monospace',
        fill: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
    
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: {
        font: '18px monospace',
        fill: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);
    
    const assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: '',
      style: {
        font: '18px monospace',
        fill: '#ffffff'
      }
    });
    assetText.setOrigin(0.5, 0.5);
    
    // Ukazovanie progressu načítavania
    this.load.on('progress', (value) => {
      percentText.setText(parseInt(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(this.cameras.main.width / 4 + 10, this.cameras.main.height / 2 - 20, (this.cameras.main.width / 2 - 20) * value, 30);
    });
    
    this.load.on('fileprogress', (file) => {
      assetText.setText('Načítavam asset: ' + file.key);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
      // Pridanie odkladu pre bezpečnosť
      this.time.delayedCall(100, () => {
        this.scene.start('MenuScene');
      });
    });
    
    console.log('Generujem textúry...');
    
    // Pre dočasné účely vytvoríme vlastné textúry
    this.createSkyTexture();
    this.createWormTexture();
    this.createGroundTexture();
    this.createBazookaTexture();
    this.createMissileTexture();
    this.createExplosionTexture();
    
    console.log('Všetky textúry vygenerované');
    
    // Odstraňujeme zvuky kvôli chybám
    console.log('Audio súbory boli odstránené z projektu');
  }

  create() {
    console.log('PreloadScene create metóda začala');
    
    // Skontrolujeme, či máme všetky potrebné textúry
    const requiredTextures = ['sky', 'worm1', 'worm2', 'ground', 'bazooka', 'missile', 'explosion'];
    const missingTextures = [];
    
    requiredTextures.forEach(textureName => {
      if (!this.textures.exists(textureName)) {
        console.error(`Chýba textúra: ${textureName}`);
        missingTextures.push(textureName);
      }
    });
    
    if (missingTextures.length > 0) {
      console.error('Chýbajúce textúry:', missingTextures);
      // Pokúsime sa znovu vytvoriť textúry
      if (missingTextures.includes('worm1') || missingTextures.includes('worm2')) {
        this.createWormTextures();
      }
      if (missingTextures.includes('explosion')) {
        this.createExplosionTexture();
      }
    }
    
    // Pridáme debug text, aby sme videli, že táto scéna sa spustila
    const debugText = this.add.text(
      this.cameras.main.width / 2, 
      this.cameras.main.height / 2, 
      'PreloadScene dokončená - prechod do MenuScene...',
      { font: '16px Arial', fill: '#ffffff', backgroundColor: '#000000' }
    ).setOrigin(0.5);
    
    // Vytvoríme animáciu pre výbuch
    this.createExplosionAnimation();
    
    // Manuálny prechod do menu scény s krátkym oneskorením
    this.time.delayedCall(2000, () => {
      console.log('Prechod do MenuScene...');
      debugText.destroy();
      this.scene.start('MenuScene');
    });
  }
  
  // Metódy pre vytváranie dočasných textúr
  createSkyTexture() {
    console.log('Vytváram textúru oblohy...');
    
    // Vytvorenie textúry pre oblohu
    const skyGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    
    // Gradient oblohy
    const gradientWidth = 256;
    const gradientHeight = 256;
    
    for(let y = 0; y < gradientHeight; y++) {
      const color1 = Phaser.Display.Color.ValueToColor(0x4488aa);
      const color2 = Phaser.Display.Color.ValueToColor(0xaaddff);
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        color1, color2, gradientHeight, y
      );
      
      skyGraphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      skyGraphics.fillRect(0, y, gradientWidth, 1);
    }
    
    // Pridanie niekoľkých oblakov
    skyGraphics.fillStyle(0xffffff, 0.8);
    
    for(let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(20, gradientWidth - 40);
      const y = Phaser.Math.Between(20, gradientHeight/2);
      const cloudWidth = Phaser.Math.Between(30, 70);
      const cloudHeight = Phaser.Math.Between(15, 25);
      
      skyGraphics.fillRoundedRect(x, y, cloudWidth, cloudHeight, 8);
    }
    
    // Vytvorenie textúry z grafiky
    skyGraphics.generateTexture('sky', gradientWidth, gradientHeight);
    console.log('Textúra oblohy vytvorená');
  }
  
  createWormTexture() {
    console.log('Vytváram textúry červíkov...');
    this.createWormTextures();
  }
  
  createWormTextures() {
    // Vytvorenie textúry pre červíka tím 1 (červený)
    const worm1Graphics = this.make.graphics({ x: 0, y: 0, add: false });
    
    // Telo červíka
    worm1Graphics.fillStyle(0xffccaa, 1);
    worm1Graphics.fillCircle(16, 16, 12);
    
    // Červená farba tímu
    worm1Graphics.fillStyle(0xff0000, 0.5);
    worm1Graphics.fillCircle(16, 16, 12);
    
    // Oči
    worm1Graphics.fillStyle(0xffffff, 1);
    worm1Graphics.fillCircle(20, 12, 4);
    
    // Zreničky
    worm1Graphics.fillStyle(0x000000, 1);
    worm1Graphics.fillCircle(21, 12, 2);
    
    // Úsmev
    worm1Graphics.lineStyle(2, 0x000000, 1);
    worm1Graphics.beginPath();
    worm1Graphics.arc(16, 18, 6, 0, Math.PI, false);
    worm1Graphics.strokePath();
    
    // Vytvorenie textúry z grafiky
    worm1Graphics.generateTexture('worm1', 32, 32);
    
    // Vytvorenie textúry pre červíka tím 2 (modrý)
    const worm2Graphics = this.make.graphics({ x: 0, y: 0, add: false });
    
    // Telo červíka
    worm2Graphics.fillStyle(0xffccaa, 1);
    worm2Graphics.fillCircle(16, 16, 12);
    
    // Modrá farba tímu
    worm2Graphics.fillStyle(0x0000ff, 0.5);
    worm2Graphics.fillCircle(16, 16, 12);
    
    // Oči
    worm2Graphics.fillStyle(0xffffff, 1);
    worm2Graphics.fillCircle(20, 12, 4);
    
    // Zreničky
    worm2Graphics.fillStyle(0x000000, 1);
    worm2Graphics.fillCircle(21, 12, 2);
    
    // Úsmev
    worm2Graphics.lineStyle(2, 0x000000, 1);
    worm2Graphics.beginPath();
    worm2Graphics.arc(16, 18, 6, 0, Math.PI, false);
    worm2Graphics.strokePath();
    
    // Vytvorenie textúry z grafiky
    worm2Graphics.generateTexture('worm2', 32, 32);
    
    // Vytvoríme aj generickú textúru "worm" pre všeobecné použitie
    worm1Graphics.generateTexture('worm', 32, 32);
    
    console.log('Textúry červíkov vytvorené - worm1, worm2, worm');
  }
  
  createGroundTexture() {
    console.log('Vytváram textúru zeme...');
    
    // Vytvorenie textúry pre zem
    const groundGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    
    // Hlavná farba zeme
    groundGraphics.fillStyle(0x6B4423, 1);
    groundGraphics.fillRect(0, 0, 64, 64);
    
    // Pridanie textúry pre lepší vzhľad
    for(let i = 0; i < 150; i++) {
      const x = Phaser.Math.Between(0, 63);
      const y = Phaser.Math.Between(0, 63);
      const size = Phaser.Math.Between(1, 3);
      
      // Náhodná farba - tmavšia alebo svetlejšia než základná
      if(Math.random() > 0.5) {
        groundGraphics.fillStyle(0x7B5433, 0.6);
      } else {
        groundGraphics.fillStyle(0x5B3413, 0.6);
      }
      
      groundGraphics.fillRect(x, y, size, size);
    }
    
    // Vytvorenie textúry z grafiky
    groundGraphics.generateTexture('ground', 64, 64);
    console.log('Textúra zeme vytvorená');
  }
  
  createBazookaTexture() {
    console.log('Vytváram textúru bazuky...');
    
    // Vytvorenie textúry pre bazuku
    const bazookaGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    
    // Telo bazuky
    bazookaGraphics.fillStyle(0x333333, 1);
    bazookaGraphics.fillRect(0, 4, 24, 8);
    
    // Hlaveň
    bazookaGraphics.fillStyle(0x555555, 1);
    bazookaGraphics.fillRect(24, 6, 8, 4);
    
    // Vytvorenie textúry z grafiky
    bazookaGraphics.generateTexture('bazooka', 32, 16);
    console.log('Textúra bazuky vytvorená');
  }
  
  createMissileTexture() {
    console.log('Vytváram textúru strely...');
    
    // Vytvorenie textúry pre strelu
    const missileGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    
    // Telo strely
    missileGraphics.fillStyle(0xDDDDDD, 1);
    missileGraphics.fillRect(4, 0, 12, 6);
    
    // Špička strely
    missileGraphics.fillStyle(0xFF0000, 1);
    missileGraphics.fillTriangle(
      16, 0,     // Horný pravý bod
      16, 6,     // Dolný pravý bod
      20, 3      // Špička
    );
    
    // Zadná časť s plameňom
    missileGraphics.fillStyle(0xFF6600, 1);
    missileGraphics.fillTriangle(
      4, 0,     // Horný ľavý bod
      4, 6,     // Dolný ľavý bod
      0, 3      // Špička plameňa
    );
    
    // Vytvorenie textúry z grafiky
    missileGraphics.generateTexture('missile', 24, 8);
    console.log('Textúra strely vytvorená');
  }
  
  createExplosionTexture() {
    console.log('Vytváram textúru výbuchu...');
    
    // Vytvorenie frejmov pre animáciu výbuchu
    const numFrames = 8;
    const frameSize = 64;
    
    // Vytvorenie textúry výbuchu
    const explosionSheet = this.make.graphics({ x: 0, y: 0, add: false });
    
    // Kreslenie frameov pre animáciu
    for(let i = 0; i < numFrames; i++) {
      const x = (i % 4) * frameSize;
      const y = Math.floor(i / 4) * frameSize;
      
      // Veľkosť výbuchu sa mení s framami
      const progress = i / (numFrames - 1);
      const radius = frameSize/2 * (progress < 0.5 ? progress * 2 : 1 - (progress - 0.5) * 2);
      
      // Gradient pre ohnivý efekt
      const innerColor = Phaser.Display.Color.ValueToColor(0xffff00);
      const midColor = Phaser.Display.Color.ValueToColor(0xff6600);
      const outerColor = Phaser.Display.Color.ValueToColor(0xff0000);
      
      // Kreslenie výbuchu v troch vrstvách
      for(let j = 0; j < 3; j++) {
        const layerRadius = radius * (1 - j * 0.25);
        let color;
        
        if(j === 0) color = outerColor;
        else if(j === 1) color = midColor;
        else color = innerColor;
        
        // Nastavenie farby
        explosionSheet.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
        
        // Mierne posunutie stredu pre lepší efekt
        const cx = x + frameSize/2 + Phaser.Math.Between(-2, 2);
        const cy = y + frameSize/2 + Phaser.Math.Between(-2, 2);
        
        // Nakreslenie kruhu
        explosionSheet.fillCircle(cx, cy, layerRadius);
      }
      
      // Pridanie malých fragmentov okolo výbuchu
      if(i > 0 && i < numFrames - 2) {
        explosionSheet.fillStyle(0xffff00, 0.8);
        
        for(let f = 0; f < 10; f++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = radius * 0.8 + Math.random() * radius * 0.4;
          const fx = x + frameSize/2 + Math.cos(angle) * distance;
          const fy = y + frameSize/2 + Math.sin(angle) * distance;
          const fsize = Phaser.Math.Between(1, 4);
          
          explosionSheet.fillCircle(fx, fy, fsize);
        }
      }
    }
    
    // Vytvorenie spritesheet textúry
    explosionSheet.generateTexture('explosion', numFrames * frameSize, frameSize);
    console.log('Textúra výbuchu vytvorená');
  }
  
  createExplosionAnimation() {
    console.log('Vytváram animáciu výbuchu...');
    
    // Kontrola, či už existuje animácia
    if (this.anims.exists('explosion_anim')) {
      console.log('Animácia výbuchu už existuje');
      return;
    }
    
    // Vytvorenie konfigurácie frejmov
    const frameNames = [];
    const numFrames = 8;
    
    for (let i = 0; i < numFrames; i++) {
      frameNames.push({ key: 'explosion', frame: i });
    }
    
    // Vytvorenie animácie
    this.anims.create({
      key: 'explosion_anim',
      frames: frameNames,
      frameRate: 15,
      repeat: 0
    });
    
    console.log('Animácia výbuchu vytvorená');
  }
}