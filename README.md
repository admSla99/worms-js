# Worms JS

Hra typu Worms implementovaná v JavaScripte pomocou knižnice Phaser.js.

## Popis

Hra umožňuje hrať klasickú hru typu Worms, kde hráči striedavo ovládajú červíky a snažia sa zničiť červíky protihráča pomocou zbraní. Hra obsahuje:

- Deštruktívny terén
- Pohyb a skákanie červíkov
- Streľbu z bazooky
- Systém ťahov
- Časovač ťahu
- Dva tímy červíkov

## Inštalácia

1. Uistite sa, že máte nainštalovaný [Node.js](https://nodejs.org/)
2. Klonujte repozitár alebo stiahnite súbory
3. Otvorte príkazový riadok v adresári projektu
4. Spustite príkaz na inštaláciu závislostí:

```
npm install
```

## Spustenie hry

Pre spustenie hry v režime vývoja:

```
npm start
```

Po spustení príkazu sa otvorí prehliadač s hrou na adrese `http://localhost:8080`.

## Kompiláciam pre produkciu

Pre vytvorenie optimalizovanej verzie pre publikovanie:

```
npm run build
```

Skompilované súbory sa nachádzajú v adresári `dist`.

## Ovládanie

- **Pohyb**: Šípky vľavo/vpravo alebo klávesy A/D
- **Skok**: Šípka hore alebo kláves W
- **Mierenie**: Stlačte medzerník pre začatie mierenia, potom šípky hore/dole na nastavenie uhla
- **Nastavenie sily**: W/S (počas mierenia)
- **Výstrel**: Medzerník (počas mierenia)
- **Koniec ťahu**: Tlačidlo "KONIEC ŤAHU" alebo automaticky po výstrele

## Pridanie vlastných assetov

Pre pridanie vlastných grafických a zvukových súborov:

1. Umiestnite obrázky do adresára `src/assets/images/`
2. Umiestnite zvuky do adresára `src/assets/sounds/`
3. Upravte súbor `src/js/scenes/PreloadScene.js` a pridajte načítanie vašich súborov

## Technológie

- [Phaser 3](https://phaser.io/) - herný framework
- [Webpack](https://webpack.js.org/) - balíčkovač
- JavaScript ES6+