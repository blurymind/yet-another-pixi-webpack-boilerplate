const PIXI = window.PIXI;

export default class TileSet {
  constructor({
    tilewidth,
    tileheight,
    texture,
    offset,
    count,
    scaleMode,
    tileset,
    app,
  }) {
    this.app = app;
    this.tilewidth = tilewidth;
    this.tileheight = tileheight;
    this.offset = offset || 0;
    this.texture = texture;

    this.textureCache = [];
    this.tiles = {};
    this.scaleMode = scaleMode || PIXI.SCALE_MODES.NEAREST;
    this.prepareTextures(count);
    this.bakedTexture = this.bakeAnimationFramesTexture(tileset, count);
  }
  get width() {
    return this.texture.width;
  }
  get height() {
    return this.texture.height;
  }

  prepareTextures(count) {
    const size =
      count || (this.width / this.tilewidth) * (this.height / this.tileheight);

    this.textureCache = new Array(size)
      .fill(0)
      .map((_, frame) => this.prepareTexture(frame));
    this.textureCache.forEach((texture, id) => {
      this.tiles[id] = texture;
    });
  }
  prepareTexture(frame) {
    const cols = Math.floor(this.width / this.tilewidth);
    const x = ((frame - this.offset) % cols) * this.tilewidth;
    const y = Math.floor((frame - this.offset) / cols) * this.tileheight;
    const rect = new PIXI.Rectangle(x, y, this.tilewidth, this.tileheight);
    const texture = new PIXI.Texture(this.texture, rect);

    texture.baseTexture.scaleMode = this.scaleMode;
    texture.cacheAsBitmap = true;

    this.tiles[frame] = texture;
    return texture;
  }
  getFrame(frame) {
    if (!this.tiles[frame]) {
      this.prepareTexture(frame);
    }

    return this.tiles[frame];
  }
  getAnimationStrip(frames) {
    let renderer = this.app.renderer;
    var container = new PIXI.Container();
    frames.forEach((frame, frameIndex) => {
      const frameTexture = this.prepareTexture(frame.tileid + 1);
      var sprite = new PIXI.Sprite(frameTexture);
      // sprite.tint = Math.random() * 0xffffff;
      if (frameIndex > 0) sprite.position.x = frameIndex * this.tilewidth;
      container.addChild(sprite);
    });
    // const rect = new PIXI.Rectangle(0, 0, this.tilewidth, this.tileheight);

    var tex = renderer.generateTexture(container, {
      width: container.width,
      height: container.height,
      autoResize: true,
    });
    tex.baseTexture.scaleMode = this.scaleMode;
    tex.cacheAsBitmap = true;
    return tex; //new PIXI.Texture(tex, rect);
  }
  bakeAnimationFramesTexture(tileset, count) {
    const gridWidth = 5; //Math.floor(count / 8);
    let x = 0;
    let y = 0;
    var container = new PIXI.Container();
    const xModulo = this.tilewidth * gridWidth;

    // Collect animated strips
    tileset.tiles.forEach((tile, index) => {
      console.log(tile, '-----');
      if (tile.animation) {
        console.log('Anim', tile, index);
        const animTex = this.getAnimationStrip(tile.animation);
        var sprite = new PIXI.Sprite(animTex);

        const rect = new PIXI.Rectangle(0, 0, this.tilewidth, this.tileheight);
        const texture = new PIXI.Texture(animTex, rect);
        // this.tiles[tile.id + 1] = texture;

        const xPos = x * this.tilewidth;
        const yPos = y * this.tileheight;
        sprite.position.x = xPos;
        sprite.position.y = yPos;
        container.addChild(sprite);

        x += tile.animation.length;
        if (xPos + tile.animation.length * x * this.tilewidth > xModulo) {
          x = 0;
          y += 1;
        }
      }
    });
    y += 1;
    Object.values(this.textureCache).forEach(tile => {
      var sprite = new PIXI.Sprite(tile);
      sprite.tint = Math.random() * 0xffffff;

      const xPos = x * this.tilewidth;
      const yPos = y * this.tileheight;
      sprite.position.x = xPos;
      sprite.position.y = yPos;
      container.addChild(sprite);

      x += 1;
      if (xPos > xModulo) {
        x = 0;
        y += 1;
      }
    });

    var tex = this.app.renderer.generateTexture(container, {
      width: container.width,
      height: container.height,
      autoResize: true,
    });

    // const texture = new PIXI.Texture(tex);
    // texture.textureCacheIds = ['./assets/imgs/island.png'];
    // this.bakedTexture = texture;
    return tex;
  }
  getBakedTexture() {
    console.log('TILES', this.tiles);
    return this.bakedTexture;
  }
  getTextures() {
    return this.textureCache;
  }
}
