import Phaser from 'phaser';
import { Worm } from '../objects/Worm';
import { Terrain } from '../objects/Terrain';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    
    // Herné premenné
    this.terrain = null;
    this.worms = [];
    this.currentTurnIndex = 0;
    this.gameActive = true;
    this.turnTime = 30; // Čas na ťah v sekundách
    this.turnTimeLeft = 0;
    this.turnTimer = null;
    this.turnText = null;
    this.gameEndText = null;
    
    // Teams
    this.teams = ['red', 'blue'];
    this.teamNames = {
      red: 'Červený tím',
      blue: 'Modrý tím'
    };
    this.teamWorms = {
      red: [],
      blue: []
    };
    
    // Odstránené zvuky
  }
  
  create() {
    console.log('GameScene vytvorená');
    
    // Pridanie debug textu pre lepšie sledovanie
    this.debugText = this.add.text(10, 10, 'GameScene aktívna - 1px granularita', {
      font: '12px Arial',
      fill: '#ffffff',
      backgroundColor: '#ff0000',
      padding: { x: 5, y: 3 }
    });
    
    // Sledovanie výkonu hry
    this.perfText = this.add.text(10, 30, 'FPS: -', {
      font: '12px Arial',
      fill: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 5, y: 3 }
    });
    
    try {
      console.log('Vytváram pozadie');
      this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'sky').setScale(2);
      
      console.log('Vytváram terén s 1px granularitou');
      this.terrain = new Terrain(this, this.cameras.main.width, this.cameras.main.height);
      
      // Optimalizácia fyziky pre lepší výkon s 1px granularitou
      this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
      this.physics.world.setBoundsCollision(true, true, true, true);
      
      // Nastavenie gravitácie - jemnejšie prispôsobená pre 1px granularitu
      this.physics.world.gravity.y = 400;
      
      console.log('Vytváram červíkov');
      this.createWorms();
      
      console.log('Nastavujem kolízie s terénom');
      this.setupCollisions();
      
      console.log('Vytváram UI');
      this.createUI();
      
      // Inicializácia vstupných ovládacích prvkov
      console.log('Inicializujem vstupy z klávesnice');
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      
      // Nastavenie ďalších vstupov
      this.input.keyboard.on('keydown-SPACE', () => {
        if (this.gameActive && this.worms[this.currentTurnIndex]) {
          this.worms[this.currentTurnIndex].shoot();
        }
      });
      
      // Nastavenie sledovania výkonu
      this.time.addEvent({
        delay: 1000,
        callback: this.updatePerformanceStats,
        callbackScope: this,
        loop: true
      });
      
      console.log('Začínam prvý ťah');
      this.startTurn();
    } catch (error) {
      console.error('Chyba pri vytváraní GameScene:', error);
      this.add.text(
        this.cameras.main.width / 2, 
        this.cameras.main.height / 2, 
        'Chyba: ' + error.message, 
        { font: '16px Arial', fill: '#ff0000', backgroundColor: '#000000' }
      ).setOrigin(0.5);
    }
  }
  
  update() {
    // Aktualizácia červíkov
    for (let worm of this.worms) {
      if (worm) worm.update();
    }
    
    // Spracovanie vstupu z klávesnice pre pohyb a skákanie
    if (this.gameActive && this.worms[this.currentTurnIndex]) {
      const activeWorm = this.worms[this.currentTurnIndex];
      
      // Pohyb doľava (šípka doľava alebo A)
      if (this.cursors.left.isDown || this.keyA.isDown) {
        activeWorm.move('left');
      }
      // Pohyb doprava (šípka doprava alebo D)
      else if (this.cursors.right.isDown || this.keyD.isDown) {
        activeWorm.move('right');
      }
      // Žiadny pohyb
      else {
        activeWorm.move('none');
      }
      
      // Skok (šípka hore alebo W)
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keyW)) {
        activeWorm.jump();
      }
      
      // Mierenie
      if (this.cursors.down.isDown) {
        activeWorm.aim('down');
      }
      else if (this.cursors.up.isDown) {
        activeWorm.aim('up');
      }
    }
    
    // Aktualizácia časovača ťahu
    if (this.turnTimer && this.turnTimeLeft > 0) {
      this.turnTimeLeft = Math.max(0, this.turnTimeLeft - (this.game.loop.delta / 1000));
      this.updateTimerText();
      
      // Automatický koniec ťahu po vypršaní času
      if (this.turnTimeLeft <= 0) {
        this.nextTurn();
      }
    }
  }
  
  createWorms() {
    // Vytvorenie červíkov pre oba tímy
    const wormsPerTeam = 3;
    const teamColors = ['red', 'blue'];
    const names = {
      red: ['Červík 1', 'Červík 2', 'Červík 3'],
      blue: ['Modrík 1', 'Modrík 2', 'Modrík 3']
    };
    
    let totalWorms = 0;
    
    // Vytvorenie červíkov pre každý tím
    for (let t = 0; t < teamColors.length; t++) {
      const team = teamColors[t];
      
      for (let i = 0; i < wormsPerTeam; i++) {
        // Náhodná pozícia na teréne
        let x, y;
        
        // Rozdelíme obrazovku na segmenty pre každý tím
        if (team === 'red') {
          x = Phaser.Math.Between(50, this.cameras.main.width * 0.4);
        } else {
          x = Phaser.Math.Between(this.cameras.main.width * 0.6, this.cameras.main.width - 50);
        }
        
        // Nájdenie výšky terénu na danej pozícii X
        y = this.terrain.getGroundHeight(x) - 20;
        console.log(`Vytváram červíka na pozícii [${x}, ${y}], tím: ${team === 'red' ? 0 : 1}`);
        
        // Vytvorenie červíka - opravené parametre podľa konštruktoru Worm
        const worm = new Worm(this, x, y, team === 'red' ? 0 : 1);
        
        // Pridanie vlastností čo chýbajú v konštruktore
        worm.team = team;
        worm.name = names[team][i];
        
        // Pridanie do poľa červíkov
        this.worms.push(worm);
        this.teamWorms[team].push(worm);
        
        totalWorms++;
      }
    }
    
    console.log(`Vytvorených ${totalWorms} červíkov`);
  }
  
  setupCollisions() {
    console.log('Nastavujem optimalizované kolízie pre 1px granularitu');
    
    // Nastavenie kolízií medzi červíkmi a terénom
    if (this.terrain && this.terrain.groundGroup && this.worms) {
      const collider = this.physics.add.collider(this.worms, this.terrain.groundGroup, 
        this.handleWormTerrainCollision, null, this);
      
      // Zvýšime presnosť detekcie kolízií, ale zachováme optimalizáciu
      collider.overlapOnly = false;
      
      console.log('Kolízie nastavené: worms <-> terrain');
    } else {
      console.error('Nemôžem nastaviť kolízie - chýbajú objekty!');
    }
    
    // Nastavenie kolízií medzi červíkmi navzájom
    if (this.worms && this.worms.length > 1) {
      this.physics.add.collider(this.worms, this.worms, 
        this.handleWormWormCollision, null, this);
      console.log('Kolízie nastavené: worms <-> worms');
    }
  }
  
  createUI() {
    // Vytvorenie textu pre zobrazenie aktuálneho ťahu
    this.turnText = this.add.text(10, 10, '', {
      font: '18px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    
    // Vytvorenie textu pre časovač
    this.timerText = this.add.text(this.cameras.main.width - 100, 10, '', {
      font: '18px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    
    // Tlačidlo pre ukončenie ťahu
    const endTurnButton = this.add.text(this.cameras.main.width - 120, this.cameras.main.height - 40, 'KONIEC ŤAHU', {
      font: '16px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: '#222222',
      padding: { x: 10, y: 5 }
    })
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => endTurnButton.setStyle({ fill: '#ffff00' }))
    .on('pointerout', () => endTurnButton.setStyle({ fill: '#ffffff' }))
    .on('pointerdown', () => this.nextTurn());
    
    // Tlačidlo pre návrat do menu
    const menuButton = this.add.text(10, this.cameras.main.height - 40, 'MENU', {
      font: '16px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: '#222222',
      padding: { x: 10, y: 5 }
    })
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => menuButton.setStyle({ fill: '#ffff00' }))
    .on('pointerout', () => menuButton.setStyle({ fill: '#ffffff' }))
    .on('pointerdown', () => this.scene.start('MenuScene'));
    
    // Inštrukcie
    const instructions = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 40, 
      'Pohyb: A/D alebo šipky, Skok: W, Mierenie: Medzerník, Streľba: Medzerník', {
      font: '14px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0.5);
  }
  
  startTurn() {
    // Začiatok nového ťahu
    if (!this.gameActive || this.worms.length === 0) return;
    
    // Kontrola, či existuje aktívny červík
    while (this.currentTurnIndex < this.worms.length && !this.worms[this.currentTurnIndex]) {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.worms.length;
    }
    
    // Kontrola, či ešte ostali živé červíky
    if (!this.worms[this.currentTurnIndex]) {
      this.checkGameEnd();
      return;
    }
    
    // Nastavenie aktívneho červíka
    const activeWorm = this.worms[this.currentTurnIndex];
    activeWorm.setActive(true);
    
    // Nastavenie kamery na aktívneho červíka
    this.cameras.main.startFollow(activeWorm, true, 0.1, 0.1);
    
    // Aktualizácia textu ťahu
    this.updateTurnText();
    
    // Reštartovanie časovača
    this.turnTimeLeft = this.turnTime;
    this.updateTimerText();
  }
  
  nextTurn() {
    // Koniec aktuálneho ťahu
    if (!this.gameActive) return;
    
    // Deaktivácia aktuálneho červíka
    if (this.worms[this.currentTurnIndex]) {
      this.worms[this.currentTurnIndex].setActive(false);
    }
    
    // Prepnutie na ďalšieho červíka
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.worms.length;
    
    // Kontrola, či existuje ďalší živý červík
    if (!this.worms[this.currentTurnIndex]) {
      let found = false;
      const startIndex = this.currentTurnIndex;
      
      do {
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.worms.length;
        if (this.worms[this.currentTurnIndex]) {
          found = true;
          break;
        }
      } while (this.currentTurnIndex !== startIndex);
      
      if (!found) {
        this.checkGameEnd();
        return;
      }
    }
    
    // Začatie nového ťahu
    this.startTurn();
  }
  
  updateTurnText() {
    if (!this.worms[this.currentTurnIndex]) return;
    
    const worm = this.worms[this.currentTurnIndex];
    this.turnText.setText(`Ťah: ${worm.name} (${this.teamNames[worm.team]})`);
    
    // Nastavenie farby textu podľa tímu
    if (worm.team === 'red') {
      this.turnText.setStyle({ 
        fill: '#ff0000',
        stroke: '#000000',
        strokeThickness: 3
      });
    } else if (worm.team === 'blue') {
      this.turnText.setStyle({ 
        fill: '#0000ff',
        stroke: '#000000',
        strokeThickness: 3
      });
    }
  }
  
  updateTimerText() {
    this.timerText.setText(`Čas: ${Math.ceil(this.turnTimeLeft)}s`);
    
    // Zmena farby, keď zostáva málo času
    if (this.turnTimeLeft <= 5) {
      this.timerText.setStyle({ 
        fill: '#ff0000',
        stroke: '#000000',
        strokeThickness: 3
      });
    } else {
      this.timerText.setStyle({
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      });
    }
  }
  
  checkGameEnd() {
    // Kontrola, či hra skončila (jeden tím nemá žiadne červíky)
    let redTeamAlive = this.teamWorms.red.some(worm => worm && worm.health > 0);
    let blueTeamAlive = this.teamWorms.blue.some(worm => worm && worm.health > 0);
    
    if (!redTeamAlive || !blueTeamAlive) {
      this.gameActive = false;
      this.cameras.main.stopFollow();
      
      // Zobrazenie textu o víťazovi
      let winningTeam = redTeamAlive ? 'Červený tím' : 'Modrý tím';
      
      this.gameEndText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 
        `KONIEC HRY! \n Víťaz: ${winningTeam}`, {
        font: 'bold 32px Arial',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center'
      }).setOrigin(0.5, 0.5);
      
      // Tlačidlo Hrať znova
      const playAgainButton = this.add.text(
        this.cameras.main.width / 2, 
        this.cameras.main.height / 2 + 70, 
        'HRAŤ ZNOVA', {
        font: 'bold 24px Arial',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        backgroundColor: '#222222',
        padding: { x: 20, y: 10 }
      })
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => playAgainButton.setStyle({ fill: '#ffff00' }))
      .on('pointerout', () => playAgainButton.setStyle({ fill: '#ffffff' }))
      .on('pointerdown', () => this.scene.restart());
    }
  }
  
  // Nová metóda pre sledovanie výkonu
  updatePerformanceStats() {
    // Aktualizácia FPS (približne)
    const fps = Math.round(this.game.loop.actualFps);
    this.perfText.setText(`FPS: ${fps} | Objekty: ${this.children.length} | Optimalizované pre 1px granularitu`);
    
    // Farebné zvýraznenie podľa výkonu
    if (fps < 30) {
      this.perfText.setBackgroundColor('#AA0000');
    } else if (fps < 50) {
      this.perfText.setBackgroundColor('#AAAA00');
    } else {
      this.perfText.setBackgroundColor('#00AA00');
    }
  }
  
  // Nová metóda pre optimalizovanú reakciu na kolíziu s terénom
  handleWormTerrainCollision(worm, terrainBlock) {
    // Poznačíme si, že červík stojí na zemi
    worm.onGround = true;
    
    // Jemné spomalenie horizontálneho pohybu, keď je červík na zemi
    // Toto spôsobí realistickejšie správanie na teréne s 1px granularitou
    if (Math.abs(worm.body.velocity.x) > 0 && 
        Math.abs(worm.body.velocity.x) < 20 && 
        !worm.isJumping) {
      worm.setVelocityX(worm.body.velocity.x * 0.9);
    }
  }
  
  // Optimalizovaná detekcia kolízií medzi červíkmi
  handleWormWormCollision(worm1, worm2) {
    // Jemné odtlačenie pre prirodzenejšie správanie
    const pushForce = 5;
    
    if (worm1.x < worm2.x) {
      worm1.setVelocityX(worm1.body.velocity.x - pushForce);
      worm2.setVelocityX(worm2.body.velocity.x + pushForce);
    } else {
      worm1.setVelocityX(worm1.body.velocity.x + pushForce);
      worm2.setVelocityX(worm2.body.velocity.x - pushForce);
    }
  }
}