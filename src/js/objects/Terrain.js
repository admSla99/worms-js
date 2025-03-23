import Phaser from 'phaser';

export class Terrain {
  constructor(scene, width, height) {
    console.log(`Konštruktor Terrain: šírka=${width}, výška=${height}`);
    
    this.scene = scene;
    this.width = width;
    this.height = height;
    
    // Kontajner pre všetky grafické prvky terénu
    this.container = scene.add.container(0, 0);
    
    // Vytvorenie grafiky pre terén
    this.terrainGraphics = scene.add.graphics();
    
    // Pridanie grafiky do kontajnera
    this.container.add(this.terrainGraphics);
    
    // Pridanie debug textúry pre kontrolu
    this.debugGraphics = scene.add.graphics();
    this.container.add(this.debugGraphics);
    
    // Vytvorenie masky pre terén na detekciu kolízií
    this.terrainMask = [];
    for (let i = 0; i < width; i++) {
      this.terrainMask[i] = [];
      for (let j = 0; j < height; j++) {
        this.terrainMask[i][j] = 0; // 0 = vzduch, 1 = zem
      }
    }
    
    // Generovanie terénu
    this.generateTerrain();
    
    // Vytvorenie fyzického objektu pre detekciu kolízií
    this.groundGroup = scene.physics.add.staticGroup();
    this.createGroundBodies();
    
    // Pridanie debug textu
    this.debugText = scene.add.text(10, 40, 'Terén vygenerovaný', {
      font: '14px Arial',
      fill: '#ffffff',
      backgroundColor: '#00aa00',
      padding: { x: 5, y: 3 }
    });
  }
  
  generateTerrain() {
    console.log('Generujem terén s najvyššou presnosťou 1px');
    
    // Vytvorenie základnej línie terénu s procedurálne generovaným povrchom
    const terrainHeight = [];
    
    // Konštanty pre procedurálnu generáciu - jemnejšie hodnoty pre 1px granularitu
    const amplitude = 80; // Trochu nižšie kopce pre príjemnejšiu hrateľnosť
    const frequency = 0.008; // Jemnejšia frekvencia pre plynulejšie kopce
    
    // Viac vrstiev šumu pre prirodzenejší vzhľad
    for (let x = 0; x < this.width; x++) {
      // Kombinácia viacerých frekvencií s rôznymi amplitúdami
      const noise1 = Math.sin(x * frequency);
      const noise2 = Math.sin(x * frequency * 2.1) * 0.5; // Trochu iná frekvencia pre lepší efekt
      const noise3 = Math.sin(x * frequency * 4.3) * 0.25;
      const noise4 = Math.sin(x * frequency * 8.7) * 0.125; // Pridaná ďalšia vrstva pre mikrodetaily
      
      // Kombinácia všetkých vrstiev šumu
      const noise = noise1 + noise2 + noise3 + noise4;
      
      // Nastavenie výšky terénu
      terrainHeight[x] = (this.height * 0.65) + (noise * amplitude);
    }
    
    // Aplikácia dodatočného mikro-šumu pre realistický vzhľad - 1px detail
    for (let x = 0; x < this.width; x++) {
      // Pridať mikrodetaily (+/- 1-2 pixely) s malou pravdepodobnosťou
      if (Math.random() < 0.2) {
        terrainHeight[x] += (Math.random() * 2 - 1);
      }
    }
    
    // Kreslenie terénu s vylepšeným vzhľadom
    this.terrainGraphics.clear();
    
    // Hlavná farba terénu - prirodzenejší odtieň zeme
    this.terrainGraphics.fillStyle(0x6B4423, 1);
    
    // Začiatok cesty
    this.terrainGraphics.beginPath();
    this.terrainGraphics.moveTo(0, terrainHeight[0]);
    
    // Vytvorenie krivky terénu - použitie interpolácie pre ešte jemnejšie prechody
    for (let x = 1; x < this.width; x++) {
      this.terrainGraphics.lineTo(x, terrainHeight[x]);
    }
    
    // Uzavretie cesty
    this.terrainGraphics.lineTo(this.width - 1, this.height);
    this.terrainGraphics.lineTo(0, this.height);
    this.terrainGraphics.closePath();
    this.terrainGraphics.fill();
    
    // Pridanie debug vizualizácie terénu - jemnejšia mriežka pre 1px granularitu
    this.debugGraphics.clear();
    this.debugGraphics.lineStyle(1, 0xff0000, 0.05); // Ešte menej viditeľná mriežka
    
    // Horizontálne čiary
    for (let y = 0; y < this.height; y += 50) { // Hustejšia mriežka
      this.debugGraphics.beginPath();
      this.debugGraphics.moveTo(0, y);
      this.debugGraphics.lineTo(this.width, y);
      this.debugGraphics.closePath();
      this.debugGraphics.strokePath();
    }
    
    // Vertikálne čiary
    for (let x = 0; x < this.width; x += 50) { // Hustejšia mriežka
      this.debugGraphics.beginPath();
      this.debugGraphics.moveTo(x, 0);
      this.debugGraphics.lineTo(x, this.height);
      this.debugGraphics.closePath();
      this.debugGraphics.strokePath();
    }
    
    // Aktualizácia masky terénu s presnosťou 1px
    for (let x = 0; x < this.width; x++) {
      const h = Math.floor(terrainHeight[x]);
      for (let y = h; y < this.height; y++) {
        this.terrainMask[x][y] = 1;
      }
    }
    
    // Vyhladenie terénu pre lepšie svahy
    this.smoothTerrain();
    
    // Pridanie textúry terénu
    this.addTerrainTexture();
    
    console.log('Terén vygenerovaný s najvyššou presnosťou 1px');
  }
  
  createGroundBodies() {
    console.log('Vytváram fyzické telá pre terén');
    
    // Vytvorenie fyzických objektov pre kolízie s maximálnou presnosťou
    const blockSize = 1; // Maximálna presnosť - 1 pixel
    
    // Kvôli výkonu však nemôžeme vytvoriť teleso pre každý pixel,
    // preto zlúčime súvislé pixely do väčších blokov kde je to možné
    const optimizedBlockSize = 3; // Rozumný kompromis medzi presnosťou a výkonom
    
    // Vyčistenie existujúcich fyzických objektov
    this.groundGroup.clear(true, true);
    
    // Vytvorenie nových fyzických objektov
    let blocksCreated = 0;
    
    // Prechádzame terén po optimalizovaných blokoch a vytvárame fyzické telesá
    for (let x = 0; x < this.width; x += optimizedBlockSize) {
      for (let y = 0; y < this.height; y += optimizedBlockSize) {
        // Kontrola, či tento blok obsahuje terén
        let hasGround = false;
        let solidPixels = 0;
        const totalBlockPixels = optimizedBlockSize * optimizedBlockSize;
        
        // Spočítame počet pixelov v bloku, ktoré obsahujú terén
        for (let bx = 0; bx < optimizedBlockSize && x + bx < this.width; bx++) {
          for (let by = 0; by < optimizedBlockSize && y + by < this.height; by++) {
            if (this.terrainMask[x + bx][y + by] === 1) {
              solidPixels++;
              if (solidPixels > totalBlockPixels * 0.2) { // Stačí 20% zaplnenia
                hasGround = true;
                break;
              }
            }
          }
          if (hasGround) break;
        }
        
        // Ak blok obsahuje dostatočný počet pixelov terénu, vytvoríme fyzické teleso
        if (hasGround) {
          const block = this.scene.add.rectangle(
            x + optimizedBlockSize/2, 
            y + optimizedBlockSize/2, 
            optimizedBlockSize, 
            optimizedBlockSize
          );
          this.groundGroup.add(block);
          
          // Takmer neviditeľné bloky pre ladenie
          block.setStrokeStyle(1, 0x0066FF, 0.1);
          block.visible = true;
          
          blocksCreated++;
        }
      }
    }
    
    console.log(`Vytvorených ${blocksCreated} fyzických blokov pre terén s optimalizovanou veľkosťou ${optimizedBlockSize}px`);
  }
  
  addTerrainTexture() {
    console.log('Pridávam vylepšenú textúru pre 1px granularitu');
    
    // Získanie zoznamu horizontálnych bodov, kde je povrch terénu
    const surfacePoints = [];
    for (let x = 0; x < this.width; x++) {
      // Nájdenie najvyššieho bodu terénu v každom stĺpci
      for (let y = 0; y < this.height; y++) {
        if (this.terrainMask[x][y] === 1) {
          surfacePoints.push({ x, y });
          break;
        }
      }
    }
    
    // Pridanie textúry trávy na vrch terénu - prirodzenejší vzhľad
    this.terrainGraphics.fillStyle(0x3A5F0B, 1); // Základná farba trávy
    
    // Pre každý bod povrchu terénu vytvoríme trávu s malými variáciami
    for (const point of surfacePoints) {
      const x = point.x;
      const y = point.y;
      
      // Základná vrstva trávy
      this.terrainGraphics.fillRect(x, y, 1, 3);
      
      // Pridáme tmavšiu tieňovanú vrstvu pod povrchom pre lepšiu hĺbku
      this.terrainGraphics.fillStyle(0x2A4F0B, 0.7);
      this.terrainGraphics.fillRect(x, y + 3, 1, 2);
      
      // Obnovíme farbu pre ďalšie vykresľovanie
      this.terrainGraphics.fillStyle(0x3A5F0B, 1);
      
      // S malou pravdepodobnosťou pridáme jednotlivé steblá trávy
      if (Math.random() < 0.1) {
        const grassHeight = Math.random() * 2 + 2; // 2-4 pixely
        this.terrainGraphics.fillStyle(0x4A7F0B, 0.9);
        this.terrainGraphics.fillRect(x, y - grassHeight, 1, grassHeight);
        this.terrainGraphics.fillStyle(0x3A5F0B, 1); // Obnovíme farbu
      }
    }
    
    // Pridanie textúry zeme pod povrchom pre lepší vizuálny efekt
    this.terrainGraphics.fillStyle(0x5B3413, 0.7);
    
    // Pridáme viac vrstiev farby zeme pre hlbšie časti terénu
    for (let depth = 1; depth <= 3; depth++) {
      const alpha = 0.7 - (depth * 0.1); // Postupne znižujeme intenzitu farby s hĺbkou
      this.terrainGraphics.fillStyle(0x5B3413 - (depth * 0x090909), alpha);
      
      // Pridanie vrstiev pod povrchom
      for (const point of surfacePoints) {
        const x = point.x;
        const y = point.y;
        
        // Každá vrstva má inú hĺbku
        this.terrainGraphics.fillRect(x, y + 5 + (depth * 10), 1, 10);
      }
    }
  }
  
  smoothTerrain() {
    console.log('Vyhľadzujem terén - presnosť 1px...');
    
    // Najprv nájdeme všetky body na povrchu terénu
    const surfacePoints = [];
    for (let x = 0; x < this.width; x++) {
      let foundSurface = false;
      for (let y = 0; y < this.height; y++) {
        if (this.terrainMask[x][y] === 1) {
          surfacePoints.push({ x, y });
          foundSurface = true;
          break;
        }
      }
      
      // Ak sme nenašli povrch, pridáme bod v spodnej časti mapy
      if (!foundSurface) {
        surfacePoints.push({ x, y: this.height - 1 });
      }
    }
    
    // Vyhladenie terénu - identifikácia a oprava náhlych zmien výšky
    // Iterujeme niekoľkokrát pre postupné vyhladenie
    for (let iteration = 0; iteration < 5; iteration++) {
      // Prechádzame každý bod povrchu okrem prvého a posledného
      for (let i = 2; i < surfacePoints.length - 2; i++) {
        const prev2 = surfacePoints[i - 2].y;
        const prev1 = surfacePoints[i - 1].y;
        const current = surfacePoints[i].y;
        const next1 = surfacePoints[i + 1].y;
        const next2 = surfacePoints[i + 2].y;
        
        // Vypočítame priemer okolitých bodov
        const average = (prev2 + prev1 + next1 + next2) / 4;
        
        // Ak je aktuálny bod výrazne odlišný od priemeru, upravíme ho
        if (Math.abs(current - average) > 3) {
          // Nová výška bude bližšie k priemeru (ale nie úplný priemer)
          const newHeight = Math.floor(current * 0.3 + average * 0.7);
          
          // Aktualizácia masky terénu
          if (newHeight > current) {
            // Ak posúvame terén nadol, musíme pridať pixely
            for (let y = current; y <= newHeight; y++) {
              this.terrainMask[surfacePoints[i].x][y] = 1;
            }
          } else {
            // Ak posúvame terén nahor, musíme odstrániť pixely
            for (let y = newHeight + 1; y <= current; y++) {
              this.terrainMask[surfacePoints[i].x][y] = 0;
            }
          }
          
          // Aktualizácia výšky bodu
          surfacePoints[i].y = newHeight;
        }
      }
    }
    
    // Druhý prechod - horizontálne vyplnenie malých medzier
    for (let x = 2; x < this.width - 2; x++) {
      for (let y = 0; y < this.height; y++) {
        // Hľadáme malé medzery v teréne (prázdne miesta obklopené terénom)
        if (this.terrainMask[x][y] === 0) {
          const left2 = (x - 2 >= 0) ? this.terrainMask[x - 2][y] : 0;
          const left1 = (x - 1 >= 0) ? this.terrainMask[x - 1][y] : 0;
          const right1 = (x + 1 < this.width) ? this.terrainMask[x + 1][y] : 0;
          const right2 = (x + 2 < this.width) ? this.terrainMask[x + 2][y] : 0;
          
          // Ak je aktuálny pixel prázdny, ale susedné pixely sú vyplnené, vyplníme aj tento
          if ((left1 === 1 && right1 === 1) || (left1 === 1 && right2 === 1) || (left2 === 1 && right1 === 1)) {
            this.terrainMask[x][y] = 1;
          }
        }
      }
    }
    
    console.log('Terén vyhladený');
  }
  
  // Získanie výšky terénu na danej x-ovej pozícii (používané pre detekciu prekážok)
  getGroundHeight(x) {
    // Ošetrenie prípadu, ak x je mimo rozsahu
    const safeX = Math.floor(Phaser.Math.Clamp(x, 0, this.width - 1));
    
    // Nájdenie prvého bodu terénu zhora pre danú x-ovú súradnicu
    for (let y = 0; y < this.height; y++) {
      if (this.terrainMask[safeX][y] === 1) {
        return y;
      }
    }
    
    // Ak nenájdeme terén, vrátime výšku mapy
    return this.height;
  }
  
  // Získanie skupiny statických objektov pre kolízie
  getGroundGroup() {
    return this.groundGroup;
  }
  
  // Vytváranie explózie pre ničenie terénu
  explode(centerX, centerY, radius) {
    console.log(`Explózia terénu na [${centerX}, ${centerY}] s polomerom ${radius}px`);
    
    // Konverzia súradníc na celé čísla
    centerX = Math.floor(centerX);
    centerY = Math.floor(centerY);
    
    // Optimalizácia rozsahu explózie
    const startX = Math.max(0, centerX - radius);
    const endX = Math.min(this.width - 1, centerX + radius);
    const startY = Math.max(0, centerY - radius);
    const endY = Math.min(this.height - 1, centerY + radius);
    
    // Počet zničených pixelov
    let destroyedPixels = 0;
    
    // Vytvorenie efektu explózie - s maximálnou presnosťou 1px
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        // Výpočet vzdialenosti od stredu explózie s vylepšeným vzorcom pre kruh
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        
        // Ak je bod v okruhu explózie
        if (distance <= radius) {
          // Pravdepodobnosť zničenia klesá s vzdialenosťou od stredu
          const destroyChance = 1 - (distance / radius);
          
          // S malou pravdepodobnosťou zachováme niektoré pixely pre prirodzenejší vzhľad
          if (Math.random() < destroyChance) {
            // Odstránenie terénu
            if (this.terrainMask[x][y] === 1) {
              this.terrainMask[x][y] = 0;
              destroyedPixels++;
            }
          }
        }
      }
    }
    
    // Pridanie efektu roztrieštenia - malé úlomky rozptýlené okolo miesta výbuchu
    for (let i = 0; i < radius * 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = (Math.random() * 0.5 + 0.5) * radius * 1.2; // 50-120% polomeru
      
      const debrisX = Math.floor(centerX + Math.cos(angle) * distance);
      const debrisY = Math.floor(centerY + Math.sin(angle) * distance);
      
      // Kontrola, či sú súradnice v rámci mapy
      if (debrisX >= 0 && debrisX < this.width && debrisY >= 0 && debrisY < this.height) {
        const debrisSize = Math.floor(Math.random() * 3) + 1; // 1-3 pixely
        
        // Nakreslenie úlomku
        this.terrainGraphics.fillStyle(0x555555, 0.7);
        this.terrainGraphics.fillRect(debrisX, debrisY, debrisSize, debrisSize);
      }
    }
    
    // Prekresliť terén a vytvoriť nové fyzické objekty
    this.redrawTerrain();
    this.createGroundBodies();
    
    console.log(`Explózia zničila ${destroyedPixels} pixelov terénu`);
    
    return destroyedPixels;
  }
  
  // Prekresliť terén na základe aktuálnej masky
  redrawTerrain() {
    // Vyčistenie existujúcej grafiky
    this.terrainGraphics.clear();
    
    // Základná farba terénu
    this.terrainGraphics.fillStyle(0x6B4423, 1);
    
    // Vykreslenie terénu na základe masky - pixel po pixeli pre presnosť
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.terrainMask[x][y] === 1) {
          // Efektívnejšie vykreslenie - hľadáme súvislé bloky pixelov
          let blockHeight = 1;
          while (y + blockHeight < this.height && this.terrainMask[x][y + blockHeight] === 1) {
            blockHeight++;
          }
          
          // Vykreslenie bloku
          this.terrainGraphics.fillRect(x, y, 1, blockHeight);
          
          // Preskočenie vykreslených pixelov
          y += blockHeight - 1;
        }
      }
    }
    
    // Pridanie textúry terénu
    this.addTerrainTexture();
  }
}