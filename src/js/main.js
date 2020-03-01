import 'babel-polyfill';
import * as PIXI from 'pixi.js';
import 'pixi-sound';
// import { tmx } from 'tmx-tiledmap';
// import tmx from 'tmx-parser';
// import 'pixi-tiledmap';
import 'pixi-tiled-utils'; //test2
import TileSet from './lib/TileSet'; // test1
import './lib/pixi-tilemap/dist/pixi-tilemap'; //test 1
import TileMapToPixi from './lib/tiled-to-pixi/src/TiledMap'; //test 3
// import tmxFile from './tiled/desert.tmx';
import tiledMapLoader from './lib/tiledMapLoader';
import island from './tiled/json/island.json';

document.addEventListener(
  'DOMContentLoaded',
  () => {
    console.log(TileMapToPixi);
    const TRY_LIB = 1;
    // 0 - pixi-tiledmap, 1- pixi-tilemap + custom parser, 2 - pixi-tiled-utils, 3 - tilemap-to-pixi
    PIXI.tilemap.Constant.boundSize = 2048;
    PIXI.tilemap.Constant.bufferSize = 4096;
    var assetsFolder = './assets/';
    var TIME = 0;
    var imagePath = assetsFolder + 'imgs/imgGround.png';
    imagePath = assetsFolder + 'imgs/island.png';
    var tmxFile = assetsFolder + 'tiled/island.tmx';

    const { tileheight, tilewidth, width, height, tilecount } = island;

    var resolutionX = tilewidth * width;
    console.log(TileSet);
    var resolutionY = tileheight * height;

    var app = new PIXI.Application(resolutionX, resolutionY * 8);
    document.body.appendChild(app.view);
    console.log('ISLAND', island);

    if (TRY_LIB === 0) {
      // PIXI-TILEDMAP approach with native pixi objects
      // PIXI.loader.add([imagePath]).load(setup);
      PIXI.loader.add([tmxFile, imagePath]).load(loader => {
        /**
         *   PIXI.extras.TiledMap() is an extended PIXI.Container()
         *   so you can render it right away
         */
        const map = new PIXI.extras.TiledMap(tmxFile);
        app.stage.addChild(map);
        // app.renderer.render(map);

        // objects re not supported, so we must do this manually for objects
        const txmData = loader.resources[tmxFile].data;
        console.log(txmData, PIXI.utils.TextureCache[imagePath]);

        let tileset = txmData.tileSets[0];
        console.log(tileset);
        const { tileHeight, tileWidth, tileCount, tiles } = tileset;
        const TILESET = new TileSet({
          tileWidth,
          tileHeight,
          texture: PIXI.utils.TextureCache[imagePath],
          offset: 1,
          count: tiles.length,
          // scaleMode: PIXI.SCALE_MODES.NEAREST,
        });

        console.log(TILESET, txmData.layers);
        const tmxObjects = txmData.layers
          .filter(layer => layer.type === 'object')
          .forEach(objectLayer => {
            console.log(objectLayer);
            // if (visible === false) return;

            objectLayer.objects.forEach(object => {
              console.log('put together objects manually, yuck');
              if (!object.gid) return;
              const { x, y, gid } = object;
              var pixiClip = new PIXI.Sprite(TILESET.getFrame(gid + 1));
              console.log(TILESET.getFrame(gid + 1));
              pixiClip.position.x = x;
              pixiClip.position.y = y;

              app.stage.addChild(pixiClip);
            });
          });
      });
      app.start();
    } else if (TRY_LIB === 1) {
      // PIXI-TILEMAP shader approach
      PIXI.loader.add([imagePath]).load(setup);
      function setup() {
        let tileset = island.tilesets[0];
        const { tileheight, tilewidth, tilecount } = tileset;

        const TILESET = new TileSet({
          tilewidth,
          tileheight,
          texture: PIXI.utils.TextureCache[imagePath],
          offset: 1,
          count: tilecount,
          tileset,
          app,
          // scaleMode: PIXI.SCALE_MODES.NEAREST,
        });

        console.log(
          PIXI.utils.TextureCache[imagePath],
          TILESET.getBakedTexture()
        );
        var TILEMAP = new PIXI.tilemap.CompositeRectTileLayer(
          0,
          [TILESET.getBakedTexture().baseTexture] // doesnt do anything :( pixi-tilemap ignores it
        );
        app.stage.addChild(TILEMAP);
        // console.log(TILEMAP);

        // console.log('base', TILESET.getBakedTexture().baseTexture);
        const testSprite = (id, x, y) => {
          if (!id) {
            const tex = TILESET.getBakedTexture();
            console.log('TEXTURE', tex);
            const test = new PIXI.Sprite(tex);
            app.stage.addChild(test);
            return;
          }
          const test = new PIXI.Sprite(TILESET.getFrame(id));
          test.position.x = x;
          test.position.y = y;
          app.stage.addChild(test);
        };
        // testSprite(); //uncomment to see tilemap
        // return;
        island.layers.forEach(layer => {
          if (!layer.visible) return;
          console.log('LAYER>>', layer);
          if (layer.type === 'objectgroup') {
            layer.objects.forEach(object => {
              const { gid, id, width, height, x, y, visible } = object;
              if (visible === false) return;
              if (TILESET.getFrame(gid)) {
                TILEMAP.addFrame(TILESET.getFrame(gid), x, y - tileheight);
              }
            });
          } else if (layer.type === 'tilelayer') {
            let ind = 0;
            for (var i = 0; i < layer.height; i++) {
              for (var j = 0; j < layer.width; j++) {
                const xPos = tilewidth * j;
                const yPos = tileheight * i;

                const tileUid = layer.data[ind];
                if (tileUid !== 0) {
                  const tileData = tileset.tiles.find(
                    tile => tile.id === tileUid - 1
                  );

                  if (
                    tileData &&
                    tileData.animation &&
                    TILESET.getFrame(tileUid)
                  ) {
                    // console.log('>>>>', tileUid, TILESET.getFrame(tileUid));
                    TILEMAP.addFrame(
                      TILESET.getFrame(tileUid),
                      xPos,
                      yPos,
                      1,
                      0,
                      tileData.animation.length * tilewidth
                    );
                  } else {
                    TILEMAP.addFrame(TILESET.getFrame(tileUid), xPos, yPos);
                  }
                }

                ind += 1;
              }
            }
            app.start();
          }
        });
        console.log(app.renderer.plugins.tilemap);
        setInterval(() => {
          TIME += 42;
          app.renderer.plugins.tilemap.tileAnim[0] = TIME;
          // console.log(TIME);

          app.renderer.render(app.stage);
        }, 200);
      }
    } else if (TRY_LIB === 2) {
      const json = assetsFolder + 'tiled/island.json';
      let tileset = island.tilesets[0];
      const { tileheight, tilewidth, tilecount } = tileset;
      PIXI.loader.add(imagePath).load(loader => {
        app.world = new PIXI.Tiled.World({
          tilewidth,
          tileheight,
          texture: PIXI.utils.TextureCache[imagePath],
          offset: 1,
          count: tilecount,
        });
        const group = ['Domek', 'Kibel', 'Bees', 'Thor', 'Meat'];
        const clear = ['Spawn'];
        app.world.create(json, imagePath, 42, group, clear).then(world => {
          app.stage.addChild(world);
          console.log(
            `world has ${app.stage.children[0].children.length} children`
          );
          app.start();
        });
      });
    } else if (TRY_LIB === 3) {
      // TileMapToPixi
      let tileset = island.tilesets[0];
      const { tileheight, tilewidth, tilecount } = tileset;

      PIXI.loader
        .add('TestMap1', tmxFile)
        .use(TileMapToPixi.middleware)
        .load((loader, resources) => {
          let map1 = new TileMapToPixi('TestMap1');
          app.stage.addChild(map1);
          app.start();
          // Again requires us to manage animated tiles and objects :/
        });
    }

    app.start();
  },
  false
);
