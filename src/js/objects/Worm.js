import Phaser from 'phaser';

export class Worm extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, team = 0) {
    super(scene, x, y, team === 0 ? 'worm1' : 'worm2');
    console.log(`Vytváram červíka na pozícii x:${x}, y:${y}, tím: ${team}`);
    
    // Pridať sprite do scény a povoliť fyziku
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Nastavenie fyzikálnych vlastností
    this.setCollideWorldBounds(true);
    this.setBounce(0.2);
    this.setFriction(1, 0);
    
    // Nastavenie veľkosti kolízneho telesa
    this.body.setSize(this.width * 0.7, this.height * 0.8);
    this.body.setOffset(this.width * 0.15, this.height * 0.2);
    
    // Vlastnosti červíka
    this.team = team;
    this.health = 100;
    this.isActive = false;
    this.isJumping = false;
    this.facingRight = true;
    this.weaponAngle = 0;
    this.currentWeapon = 'bazooka';
    
    // Vytvorím debug grafiku
    this.debugGraphics = scene.add.graphics();
    this.debugText = scene.add.text(0, -30, `Tím: ${team}, HP: ${this.health}`, {
      font: '10px Arial',
      fill: team === 0 ? '#FF0000' : '#0000FF'
    });
    this.debugText.setOrigin(0.5, 0.5);
    
    // Vytvorím ukazovateľ zbrane (smerový indikátor)
    this.weaponIndicator = scene.add.graphics();
    
    // Ak sme vytvorili textúru červíka pomocou metódy, nastavíme farbu podľa tímu
    this.setTint(team === 0 ? 0xFF6666 : 0x6666FF);
    
    // Kontrola či má správna textúra
    if (!this.texture || !this.texture.key) {
      console.error('Chyba: Červík nemá priradenú textúru!');
      // Vytvorenie núdzovej textúry
      const graphics = scene.add.graphics();
      graphics.fillStyle(team === 0 ? 0xFF0000 : 0x0000FF);
      graphics.fillCircle(10, 10, 10);
      graphics.generateTexture(team === 0 ? 'worm1_emergency' : 'worm2_emergency', 20, 20);
      graphics.destroy();
      
      this.setTexture(team === 0 ? 'worm1_emergency' : 'worm2_emergency');
    }
    
    // Zobrazenie informácií o červíkovi
    console.log(`Červík vytvorený - tím: ${team}, pozícia: [${x},${y}], textúra: ${this.texture.key}`);
  }
  
  // Aktualizácia červíka
  update() {
    // Aktualizácia pozície debug textu a grafiky
    this.debugText.setPosition(this.x, this.y - 30);
    this.debugText.setText(`Tím: ${this.team}, HP: ${this.health}`);
    
    this.updateWeaponIndicator();
    
    // Kontrola, či stojí na zemi
    const onGround = this.body.touching.down || this.body.blocked.down;
    if (onGround && this.isJumping) {
      this.isJumping = false;
    }
    
    // Debug info
    this.debugGraphics.clear();
    this.debugGraphics.lineStyle(1, 0xffff00);
    this.debugGraphics.strokeRect(
      this.x - this.width * 0.35, 
      this.y - this.height * 0.4, 
      this.width * 0.7, 
      this.height * 0.8
    );
  }
  
  // Pohyb červíka
  move(direction) {
    if (!this.isActive) return;
    
    const moveSpeed = 80; // Znížená základná rýchlosť pohybu pre lepšiu kontrolu
    const onGround = this.body.touching.down || this.body.blocked.down;
    
    if (direction === 'left') {
      // Skúsime detekciu prekážky vľavo s novou granularitou
      if (this.canClimbOver('left')) {
        this.climbOver('left');
      } else {
        this.setVelocityX(-moveSpeed);
      }
      this.facingRight = false;
      this.setFlipX(true);
    } else if (direction === 'right') {
      // Skúsime detekciu prekážky vpravo s novou granularitou
      if (this.canClimbOver('right')) {
        this.climbOver('right');
      } else {
        this.setVelocityX(moveSpeed);
      }
      this.facingRight = true;
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }
    
    // Pridáme jemné prispôsobenie terénu pre krajšie sledovanie kontúry
    if (onGround && this.body.velocity.x !== 0) {
      // Zistíme, či sa pod červíkom nachádza šikmá plocha
      const terrainAheadX = this.x + (this.body.velocity.x > 0 ? 5 : -5);
      const currentGroundHeight = this.scene.terrain ? this.scene.terrain.getGroundHeight(this.x) : 0;
      const aheadGroundHeight = this.scene.terrain ? this.scene.terrain.getGroundHeight(terrainAheadX) : 0;
      
      // Ak je pred červíkom mierne klesanie (menej ako 3px), jemne ho posunieme nadol
      if (currentGroundHeight < aheadGroundHeight && aheadGroundHeight - currentGroundHeight < 3) {
        this.setVelocityY(20); // Jemné zatlačenie nadol
      }
    }
    
    // Debugovanie pohybu
    console.log(`Červík sa pohybuje: ${direction}, rýchlosť: ${this.body.velocity.x}`);
  }
  
  // Nová metóda - detekcia, či je možné preliezť prekážku
  canClimbOver(direction) {
    // Ak nie je na zemi, nemôže šplhať
    const onGround = this.body.touching.down || this.body.blocked.down;
    if (!onGround) return false;
    
    // Nastavenie smeru
    const directionMultiplier = direction === 'left' ? -1 : 1;
    
    // Získanie terénu
    if (!this.scene.terrain) return false;
    
    // Zistenie aktuálnej výšky terénu pod červíkom
    const currentX = this.x;
    const currentGroundHeight = this.scene.terrain.getGroundHeight(currentX);
    
    // S novou granularitou 1px môžeme prehľadávať presnejšie
    // Zistenie výšok terénu v niekoľkých bodoch pred červíkom
    const pixelsToScan = 10; // Skenovať 10 pixelov dopredu
    let foundObstacle = false;
    let minHeightDifference = 0;
    
    // Skenovanie terénu pred červíkom po pixeloch
    for (let offset = 1; offset <= pixelsToScan; offset++) {
      const aheadX = currentX + (directionMultiplier * offset);
      const aheadGroundHeight = this.scene.terrain.getGroundHeight(aheadX);
      const heightDifference = currentGroundHeight - aheadGroundHeight;
      
      // Ak je výškový rozdiel medzi 1 a 8 pixelmi, červík môže preliezť
      if (heightDifference > 0 && heightDifference <= 8) {
        foundObstacle = true;
        minHeightDifference = heightDifference;
        break;
      }
    }
    
    if (foundObstacle) {
      console.log(`Červík môže preliezť prekážku smerom ${direction}. Výškový rozdiel: ${minHeightDifference}px`);
    }
    
    return foundObstacle;
  }
  
  // Jemnejšie lezenie cez prekážky s jemnou granularitou
  climbOver(direction) {
    // Nastavenie smeru
    const directionMultiplier = direction === 'left' ? -1 : 1;
    const moveSpeed = 80; // Znížená rýchlosť pre lepšiu kontrolu
    
    // Automatické prelezenie - s veľmi presným nastavením pre 1px granularitu
    this.setVelocityX(directionMultiplier * moveSpeed);
    this.setVelocityY(-50); // Ešte jemnejší skok pre malé prekážky
    
    console.log(`Červík automaticky prelieza prekážku smerom ${direction} s minimálnym skokom (1px granularita)`);
    
    // Pridáme timer pre lepšie riadenie pohybu cez terén
    this.scene.time.delayedCall(150, () => {
      // Znížime horizontálnu rýchlosť, aby červík nepreletel príliš ďaleko
      if (this.body && this.body.velocity.x !== 0) {
        this.setVelocityX(directionMultiplier * (moveSpeed * 0.5));
      }
      
      // Pridáme ešte jeden timer pre riadené zastavenie po prekážke
      this.scene.time.delayedCall(100, () => {
        if (this.body && this.body.velocity.x !== 0) {
          this.setVelocityX(directionMultiplier * (moveSpeed * 0.3));
        }
      });
    });
  }
  
  // Skok
  jump() {
    if (!this.isActive) return;
    
    const onGround = this.body.touching.down || this.body.blocked.down;
    if (onGround && !this.isJumping) {
      this.isJumping = true;
      this.setVelocityY(-250); // Znížená hodnota z -350 na -250
      console.log('Červík skáče menším skokom!');
      
      // Zvuky vypnuté
    }
  }
  
  // Aktivácia/deaktivácia červíka
  setActive(active) {
    this.isActive = active;
    this.debugText.setFill(active ? '#FFFF00' : (this.team === 0 ? '#FF0000' : '#0000FF'));
    console.log(`Červík ${active ? 'aktivovaný' : 'deaktivovaný'}`);
    
    // Ak je aktívny, farebne ho zvýrazníme
    if (active) {
      this.setAlpha(1);
      this.weaponIndicator.setAlpha(1);
    } else {
      this.setAlpha(0.7);
      this.weaponIndicator.setAlpha(0);
    }
  }
  
  // Zamierenie zbrane
  aim(direction) {
    if (!this.isActive) return;
    
    const aimSpeed = 2;
    if (direction === 'up') {
      this.weaponAngle -= aimSpeed;
    } else if (direction === 'down') {
      this.weaponAngle += aimSpeed;
    }
    
    // Obmedzenie uhla mierenia
    this.weaponAngle = Phaser.Math.Clamp(this.weaponAngle, -80, 80);
    
    // Aktualizácia indikátora zbrane
    this.updateWeaponIndicator();
    
    console.log(`Zamierenie zbrane: uhol ${this.weaponAngle}`);
  }
  
  // Aktualizácia indikátora zbrane
  updateWeaponIndicator() {
    if (!this.isActive) return;
    
    this.weaponIndicator.clear();
    
    // Nakreslenie indikátora zbrane
    this.weaponIndicator.lineStyle(2, 0xffff00, 1);
    
    // Začiatok na pozícii červíka
    const startX = this.x;
    const startY = this.y - 5;
    
    // Koniec línie podľa uhla zbrane
    const angle = this.facingRight ? this.weaponAngle : 180 - this.weaponAngle;
    const angleRad = Phaser.Math.DegToRad(angle);
    const length = 30;
    const endX = startX + Math.cos(angleRad) * length;
    const endY = startY + Math.sin(angleRad) * length;
    
    // Nakreslenie línie
    this.weaponIndicator.beginPath();
    this.weaponIndicator.moveTo(startX, startY);
    this.weaponIndicator.lineTo(endX, endY);
    this.weaponIndicator.closePath();
    this.weaponIndicator.strokePath();
  }
  
  // Výstrel projektilu
  fire() {
    if (!this.isActive) return;
    
    // Vytvorenie projektilu
    const startX = this.x;
    const startY = this.y - 5;
    
    // Uhol výstrelu
    const angle = this.facingRight ? this.weaponAngle : 180 - this.weaponAngle;
    const angleRad = Phaser.Math.DegToRad(angle);
    
    // Počiatočná rýchlosť projektilu
    const initialSpeed = 400;
    const velocityX = Math.cos(angleRad) * initialSpeed;
    const velocityY = Math.sin(angleRad) * initialSpeed;
    
    // Vytvorenie projektilu
    const missile = this.scene.add.sprite(startX, startY, 'missile');
    this.scene.physics.add.existing(missile);
    
    // Nastavenie fyzikálnych vlastností
    missile.body.setVelocity(velocityX, velocityY);
    missile.body.setGravityY(300);
    
    // Nastavenie rotácie projektilu podľa trajektórie
    missile.rotation = angleRad;
    
    // Pridanie kolízie s terénom
    this.scene.physics.add.collider(missile, this.scene.terrain.groundGroup, () => {
      this.explode(missile.x, missile.y);
      missile.destroy();
    });
    
    // Pridanie kolízie so všetkými červíkmi
    this.scene.physics.add.overlap(missile, this.scene.worms, (missile, worm) => {
      // Nesmie poškodiť červíka, ktorý vystrelil projektil
      if (worm !== this) {
        this.explode(missile.x, missile.y);
        missile.destroy();
      }
    });
    
    // Pridanie kolízie s hranicami sveta
    missile.body.onWorldBounds = true;
    this.scene.physics.world.on('worldbounds', (body) => {
      if (body.gameObject === missile) {
        this.explode(missile.x, missile.y);
        missile.destroy();
      }
    });
    
    // Sledovanie trajektórie projektilu
    this.scene.time.addEvent({
      delay: 16,
      callback: () => {
        // Aktualizácia rotácie projektilu podľa jeho aktuálnej rýchlosti
        if (missile.body) {
          missile.rotation = Math.atan2(missile.body.velocity.y, missile.body.velocity.x);
        }
      },
      loop: true,
      paused: false
    });
    
    // Zabezpečenie, že projektil bude zničený aj keď minie všetky objekty
    this.scene.time.delayedCall(5000, () => {
      if (missile && missile.active) {
        this.explode(missile.x, missile.y);
        missile.destroy();
      }
    });
    
    // Deaktivovanie červíka po výstrele (koniec ťahu)
    this.scene.time.delayedCall(100, () => {
      this.setActive(false);
      this.scene.endTurn();
    });
    
    console.log(`Červík vystrelil projektil: uhol=${angle}, rýchlosť=${initialSpeed}`);
  }
  
  // Explózia na daných súradniciach
  explode(x, y) {
    console.log(`Explózia na súradniciach [${x}, ${y}]`);
    
    // Polomer výbuchu
    const radius = 40;
    
    // Vytvorenie animácie výbuchu
    const explosion = this.scene.add.sprite(x, y, 'explosion');
    explosion.setScale(radius / 32); // Prispôsobenie veľkosti výbuchu
    
    // Prehratie animácie výbuchu
    explosion.play('explosion_anim');
    
    // Odstránenie animácie po dokončení
    explosion.once('animationcomplete', () => {
      explosion.destroy();
    });
    
    // Zmena terénu - optimalizovaná funkcia pre 1px granularitu
    if (this.scene.terrain) {
      // Poškodenie terénu s väčšou presnosťou - jemnejšia deštrukcia
      this.scene.terrain.explode(x, y, radius);
    }
    
    // Poškodenie červíkov v dosahu výbuchu
    this.scene.worms.getChildren().forEach(worm => {
      // Výpočet vzdialenosti medzi výbuchom a červíkom
      const distance = Phaser.Math.Distance.Between(x, y, worm.x, worm.y);
      
      // Ak je červík v dosahu výbuchu
      if (distance <= radius * 1.5) { // Mierne väčší dosah poškodenia ako viditeľný výbuch
        // Výpočet poškodenia na základe vzdialenosti (bližšie = väčšie poškodenie)
        const damage = Math.floor(50 * (1 - distance / (radius * 1.5)));
        
        // Aplikácia poškodenia
        worm.takeDamage(damage);
        
        // Odhodenie červíka
        const knockbackForce = 200 * (1 - distance / (radius * 1.5));
        const angle = Phaser.Math.Angle.Between(x, y, worm.x, worm.y);
        worm.setVelocity(
          Math.cos(angle) * knockbackForce,
          Math.min(-100, Math.sin(angle) * knockbackForce) // Zabezpečenie, že červík bude vždy odhodený aspoň trochu nahor
        );
      }
    });
  }
  
  // Prijatie poškodenia
  takeDamage(amount) {
    // Zníženie zdravia
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    
    // Aktualizácia textu zdravia
    this.debugText.setText(`Tím: ${this.team}, HP: ${this.health}`);
    
    console.log(`Červík prijal ${amount} poškodenia, zostáva mu ${this.health} zdravia`);
    
    // Kontrola, či červík zomrel
    if (this.health <= 0) {
      this.die();
    }
  }
  
  // Červík zomrel
  die() {
    console.log(`Červík tímu ${this.team} zomrel`);
    
    // Animácia smrti - postupné zmiznutie
    this.scene.tweens.add({
      targets: [this, this.debugText, this.weaponIndicator],
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        // Odstránenie červíka zo scény
        this.destroy();
        this.debugText.destroy();
        this.weaponIndicator.destroy();
        this.debugGraphics.destroy();
        
        // Kontrola, či hra skončila
        this.scene.checkGameEnd();
      }
    });
  }
}