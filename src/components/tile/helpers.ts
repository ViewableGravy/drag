import React from "react"
import { _helpers } from "../../pages/editor/helpers"

export namespace TileHelpers {
  /**
   * A Tile object is the foundation of a tile. This is the object that is passed to the Tile component. and contains meta information
   * about the tile to be rendered. this is both for the Tile component as well as the parent and will be updated with information regarding the tile
   */
  export type TTileObject = {
    name: 'tile',
    ref: React.MutableRefObject<HTMLDivElement | undefined>,
    identifier: string,
    style: React.CSSProperties
  }

  /**
   * A Tile group is the foundation of a row. This can be considered a row in most aspects except at mobile resolutions, 
   * if the children cannot be shrunk, it will be forced to wrap.
   */
  export type TTileGroup = {
    name: Readonly<'group'>,
    tiles: Array<TileHelpers.TTileObject>,
    ref: React.MutableRefObject<HTMLDivElement | undefined>,
    identifier: string,
  }

  export type TGetOverlappingInformation = (tile: Readonly<{
    ref: React.RefObject<HTMLDivElement> | null,
    identifier: string
  }>, tiles: Readonly<Array<{
    ref: React.RefObject<HTMLDivElement> | null,
    identifier: string
  }>>) => {
    isOverlapping: boolean;
    overlappingTileIndexes: number[];
  }

  export type TGetRearrangedTiles = (options: {
    tile: Readonly<TEnhancedTile> | undefined, 
    tiles: Readonly<Array<TTileGroup>>,
  }) => Array<TTileGroup>;

  export type TGetIndexClosestToMiddle = ({
    tiles,
    nodeMiddle
  }: {
    tiles: Readonly<Array<TTileObject>>,
    nodeMiddle: number,
    nodeIndex: number,
  }) => number;

  export type TGetInsertIndex = (interceptingIndex: number, isBefore: boolean, isMovingBefore: boolean) => number;

  type TEnhancedTile = {
    center: {
      x: number,
      y: number,
    },
    group: TTileGroup
  } & TTileObject;

  export type TGetEnhancedTile = ({
    tiles, 
    offset,
    identifier
  }: {
    tiles: Array<TTileGroup>,
    offset: {
      x: number,
      y: number,
    },
    identifier: string,
  }) => TEnhancedTile | undefined

  export type TReorder = (options: {
    closestTileIdentifier: string,
    tiles: Readonly<Array<TTileObject>>,
    nodeIndex: number,
    shouldVisuallyGoBefore: boolean,
    shouldVisuallyGoRight: boolean,
    shouldVisuallyGoLeft: boolean,
  }) => Array<TTileObject>;

  /**********************************************************************************************************************/

  type TBlockReturnType = {
    placementStrategy: 'block',
    direction: 'top' | 'bottom',
    group: TTileGroup,
  };

  type TInlineReturnType = {
    placementStrategy: 'inline',
    direction: 'left' | 'right',
    group: TTileGroup,
    closestTile: TTileObject,
  };

  /**
   * If there is no need to perform a reorder, simply return the existing tiles array
   */
  export type TGetTileInformation = (options: { 
    tiles: Readonly<Array<TTileGroup>>, 
    tile: Readonly<TEnhancedTile> 
  }) => TBlockReturnType | TInlineReturnType | null;

  /**********************************************************************************************************************/

  export type TGetShouldGoRight = (options: {
    identifiers: {
      vertical: string,
      horizontal: string,
    },
    tiles: Readonly<Array<TTileObject>>,
    nodeMiddle: {
      x: number,
      y: number,
    }
  }) => boolean;

  export type TGetShouldGoLeft = (options: {
    identifiers: {
      vertical: string,
      horizontal: string,
    },
    tiles: Readonly<Array<TTileObject>>,
    nodeMiddle: {
      x: number,
      y: number,
    }
  }) => boolean;

  export type TGetShouldGoBefore = (options: {
    identifiers: {
      vertical: string,
      horizontal: string,
    },
    tiles: Readonly<Array<TTileObject>>,
    nodeMiddle: {
      x: number,
      y: number,
    }
  }) => boolean;

  export type TGetClosestGroup = (options: { 
    tiles: Readonly<Array<TTileGroup>>,
    tile: Readonly<TEnhancedTile>,
    /**
     * The threshold before a tile is considered to be "inline" to the group vs "block". Measurement in pixels
     * 
     * i.e. If top and bottom are set to 20, then in order for an item to be getting dragged inline, it must be more than 20 pixels away from the top and bottom of the group
     */
    threshold: {
      top: number,
      bottom: number,
      left: number,
      right: number,
    }
  }) => {
    group: TTileGroup & { 
      middle: { 
        x: number, 
        y: number 
      } 
    } | undefined,
    placementStrategy: 'inline' | 'block',
    direction: 'top' | 'bottom',
  };

  export type TGetClosestTile = (options: {
    group: TTileGroup & {
      middle: {
        x: number,
        y: number,
      }
    },
    tile: Readonly<TEnhancedTile>
  }) => {
    direction: 'left' | 'right',
    tile?: TTileObject & {
      middle: {
        x: number,
        y: number,
      }
    }
  };
}

export const findByIdentifier = <T extends Record<string, unknown> & { identifier: string }>(tiles: Readonly<Array<T>> , identifier: string) => {
  return tiles?.find(({ identifier: _identifier }) => _identifier === identifier);
};

export const getOverlappingInformation: TileHelpers.TGetOverlappingInformation = (tile, tiles) => {
  const node = tile.ref?.current;

  if (!node) {
    return {
      isOverlapping: false,
      overlappingTileIndexes: [] as Array<number>,
    }
  }

  const { x, y } = node.getBoundingClientRect();
  const { offsetLeft, offsetTop } = node.offsetParent as HTMLDivElement;
  const { offsetWidth, offsetHeight } = node;

  const tileIndex = tiles.findIndex(({ identifier }) => tile.identifier === identifier);

  const information = tiles.reduce((acc, { ref: _tile }, index) => {
    if (_tile && index !== tileIndex) {
      const { x: tileX, y: tileY } = _tile.current!.getBoundingClientRect();
      const { offsetLeft: tileOffsetLeft, offsetTop: tileOffsetTop } = _tile.current!.offsetParent as HTMLDivElement;
      const { offsetWidth: tileOffsetWidth, offsetHeight: tileOffsetHeight } = _tile.current!;
      const isOverlapping = (
        x + offsetLeft < tileX + tileOffsetLeft + tileOffsetWidth &&
        x + offsetLeft + offsetWidth > tileX + tileOffsetLeft &&
        y + offsetTop < tileY + tileOffsetTop + tileOffsetHeight &&
        y + offsetTop + offsetHeight > tileY + tileOffsetTop
      )
      if (isOverlapping) {
        acc.isOverlapping = true;
        acc.overlappingTileIndexes.push(index);
      }
    }
    return acc;
  }, {
    isOverlapping: false,
    overlappingTileIndexes: [] as Array<number>,
  });

  return information;
}

export const getEnhancedTile: TileHelpers.TGetEnhancedTile = ({ tiles, offset, identifier }) => {
  const { tile, group } = findTileAndGroup(tiles, identifier);
  const node = tile?.ref?.current;

  switch (true) {
    case !tile:
    case !group:
    case !node:
      return undefined;
    default: {
      return {
        ...tile,
        center: {
          y: (node.offsetHeight / 2) + (offset.y || 0),
          x: (node.offsetWidth / 2) + (offset.x || 0)
        },
        group
      }
    }
  }
}

/**
 * Done
 */
export const findTileAndGroup = (tiles: Array<TileHelpers.TTileGroup>, identifier: string) => {
  const identifierCallback = (identifier: string) => (tile: TileHelpers.TTileObject) => tile.identifier === identifier;
  const group = tiles.find(({ tiles }) => tiles.some(identifierCallback(identifier)));
  const tile = tiles.find(({ tiles }) => tiles.some(identifierCallback(identifier)))?.tiles.find(identifierCallback(identifier));

  return { group, tile };
};

/**
 * Done
 */
const getClosestGroup: TileHelpers.TGetClosestGroup = ({ tiles, tile, threshold }) => {
  const { y } = tile.center;
  const injectMiddle = (group: TileHelpers.TTileGroup) => ({
    ...group,
    middle: {
      y: Number(group.ref.current?.offsetTop) + (Number(group.ref.current?.offsetHeight) / 2),
      x: Number(group.ref.current?.offsetLeft) + (Number(group.ref.current?.offsetWidth) / 2),
    }
  });
  const sortToClosest = ({ middle: a }: ReturnType<typeof injectMiddle>, { middle: b }: ReturnType<typeof injectMiddle>) => Math.abs(y - a.y) - Math.abs(y - b.y);
  const isWithinThreshold = (closestGroup: ReturnType<typeof injectMiddle> | undefined) => 
    tile.center.y > Number(closestGroup?.ref.current?.offsetTop) + threshold.top && 
    tile.center.y < Number(closestGroup?.ref.current?.offsetTop) + Number(closestGroup?.ref.current?.offsetHeight) - threshold.bottom &&
    tile.center.x > Number(closestGroup?.ref.current?.offsetLeft) + threshold.left &&
    tile.center.x < Number(closestGroup?.ref.current?.offsetLeft) + Number(closestGroup?.ref.current?.offsetWidth) - threshold.right;

  const [closestGroup] = tiles.map(injectMiddle).sort(sortToClosest);

  return {
    group: closestGroup,
    placementStrategy: isWithinThreshold(closestGroup) ? 'inline' : 'block',
    direction: Number(closestGroup?.middle.y) > y ? 'top' : 'bottom',
  }
}

/**
 * Done
 */
const getClosestTile: TileHelpers.TGetClosestTile = ({ group, tile }) => {
  // filter out the tile that is being moved
  const tiles = group.tiles.filter(({ identifier }) => identifier !== tile.identifier);

  // find the closest tile in group
  const { x } = tile.center;
  const injectMiddle = (tile: TileHelpers.TTileObject) => ({
    ...tile,
    middle: {
      x: Number(tile.ref.current?.offsetLeft) + (Number(tile.ref.current?.offsetWidth) / 2),
      y: Number(tile.ref.current?.offsetTop) + (Number(tile.ref.current?.offsetHeight) / 2),
    }
  });
  const sortToClosest = ({ middle: a }: ReturnType<typeof injectMiddle>, { middle: b }: ReturnType<typeof injectMiddle>) => Math.abs(x - a.x) - Math.abs(x - b.x);

  const [closestTile] = tiles.map(injectMiddle).sort(sortToClosest);

  return {
    direction: Number(closestTile?.middle.x) < x ? 'right' : 'left',
    tile: closestTile
  }
}

/**
 * Done
 */
export const getTileInformation: TileHelpers.TGetTileInformation = ({ tiles, tile }) => {
  const { group, placementStrategy, direction } = getClosestGroup({ 
    tiles, 
    tile, 
    threshold: {
      top: 20,
      bottom: 20,
      left: 0,
      right: 0
    } 
  });

  if (!group) return null;

  if (placementStrategy === 'block') {
    return {
      placementStrategy: 'block',
      direction,
      group
    }
  }

  const { direction: directionFromTile, tile: closestTile } = getClosestTile({ group, tile });

  if (!closestTile) return null;

  return {
    placementStrategy: 'inline',
    direction: directionFromTile,
    group,
    closestTile,
  }
}

export const getRearrangedTiles: TileHelpers.TGetRearrangedTiles = ({
  tile,
  tiles,
}) => {
  const originalTiles = [...tiles];
  const newTiles = [...tiles];

  if (!tile) return originalTiles;
  const tileInformation = getTileInformation({ tiles: newTiles, tile });

  if (!tileInformation) return originalTiles;

  const { group: selectedTileGroup } = findTileAndGroup(newTiles, tile.identifier);
  if (!selectedTileGroup) return originalTiles;

  const index = selectedTileGroup.tiles.findIndex(({ identifier }) => identifier === tile.identifier);
  if (index === -1) return originalTiles;

  const [removed] = selectedTileGroup.tiles.splice(index, 1);
  if (!removed) return originalTiles;

  // if it is inline, this means it needs to go into a new group below or above
  if (tileInformation?.placementStrategy === 'block') {
    const newGroupIndex = newTiles.findIndex(({ identifier }) => identifier ===  tileInformation.group.identifier);
    if (newGroupIndex === -1) return originalTiles;

    if (tileInformation.direction === 'top') {
      //insert before group
      newTiles.splice(newGroupIndex, 0, {
        identifier: _helpers.generateUniqueIdentifier(),
        name: 'group',
        ref: { current: undefined },
        tiles: [removed]
      });
    } else {
      //insert after group
      newTiles.splice(newGroupIndex + 1, 0, {
        identifier: _helpers.generateUniqueIdentifier(),
        name: 'group',
        ref: { current: undefined },
        tiles: [removed]
      });
    }

    //remove original group if empty
    if (tile.group.tiles.length === 0) {
      const groupIndex = newTiles.findIndex(({ identifier }) => identifier === tile.group.identifier);
      if (groupIndex !== -1) newTiles.splice(groupIndex, 1);
    }

    return newTiles;
  }
  
  const { closestTile, direction, group } = tileInformation;

  const closestTileIndex = group.tiles.findIndex(({ identifier }) => identifier === closestTile.identifier);
  if (closestTileIndex === -1) return originalTiles;

  if (direction === 'left') {
    group.tiles.splice(closestTileIndex, 0, removed);
  }

  if (direction === 'right') {
    group.tiles.splice(closestTileIndex + 1, 0, removed);
  }

  //remove original group if empty
  if (tile.group.tiles.length === 0) {
    const groupIndex = newTiles.findIndex(({ identifier }) => identifier === tile.group.identifier);
    if (groupIndex !== -1) newTiles.splice(groupIndex, 1);
  }

  return newTiles;
};

