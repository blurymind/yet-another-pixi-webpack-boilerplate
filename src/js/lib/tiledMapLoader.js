import path from 'path';
import * as tmx from 'tmx-parser';

function tileMapLoader(loader) {
  return (resource, next) => {
    if (
      !resource.data ||
      // @ts-ignore
      resource.type !== PIXI.loaders.Resource.TYPE.XML ||
      !resource.data.children[0].getElementsByTagName('tileset')
    ) {
      return next();
    }

    const route = path.dirname(resource.url.replace(loader.baseUrl, ''));

    const loadOptions = {
      crossOrigin: resource.crossOrigin,
      parentResource: resource,
    };

    tmx.parse(resource.xhr.responseText, route, (err, map) => {
      if (err) throw err;

      map.tileSets.forEach(tileset => {
        if (!(tileset.image.source in loader.resources)) {
          loader.add(
            tileset.image.source,
            `${route}/${tileset.image.source}`,
            loadOptions
          );
        }
      });

      resource.data = map;
      next();
    });
  };
}

export default tileMapLoader;
