import React from "react"

export namespace TileHelpers {
  /**
   * A Tile object is the foundation of a tile. This is the object that is passed to the Tile component. and contains meta information
   * about the tile to be rendered. this is both for the Tile component as well as the parent and will be updated with information regarding the tile
   */
  export type TTileObject = {
    name: 'tile',
    ref: React.MutableRefObject<HTMLDivElement> | null,
    identifier: string,
    position: 'inline' | 'block',
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
    tile: Readonly<TTileObject> | undefined, 
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
  /**
   * If there is no need to perform a reorder, simply return the existing tiles array
   */
  export type TGetTileInformation = (options: { 
    tiles: Readonly<Array<TTileGroup>>, 
    tile: Readonly<TEnhancedTile> 
  }) => {
    tiles: Readonly<Array<TTileGroup>>,
    tile: TTileObject
    shouldVisuallyGoBefore: boolean,
    shouldVisuallyGoRight: boolean,
    shouldVisuallyGoLeft: boolean,
    closestTileIdentifier: string,
  };

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
  }) => string;

  export type TGetIdentifierClosestToHorizontalMiddle = (options: {
    verticleMiddleIdentifier: string,
    tiles: Readonly<Array<TTileObject>>,
    nodeMiddle: {
      x: number,
      y: number,
    },
    nodeIndex: number,
  }) => string;
}

export const findByIdentifier = <T extends Record<string, unknown> & { identifier: string }>(tiles: Readonly<Array<T>> , identifier: string) => {
  return tiles?.find(({ identifier: _identifier }) => _identifier === identifier);
};

export const findEditableByIdentifier = <T>(tiles: Array<T & { identifier: string }>, identifier: string) => {
  return tiles?.find(({ identifier: _identifier }) => _identifier === identifier);
}


const getTileIndex = (tiles: Readonly<TileHelpers.TTileObject[]> , identifier: string) => {
  return tiles.findIndex(({ identifier: _identifier }) => _identifier === identifier);
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

const getInsertIndex: TileHelpers.TGetInsertIndex = (interceptingIndex, isBefore, isMovingBefore) => {
  if (isBefore) {
    return isMovingBefore ? interceptingIndex - 1 : interceptingIndex;
  } else {
    return isMovingBefore ? interceptingIndex : interceptingIndex + 1;
  }
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

export const findTileAndGroup = (tiles: Array<TileHelpers.TTileGroup>, identifier: string) => {
  const identifierCallback = (identifier: string) => (tile: TileHelpers.TTileObject) => tile.identifier === identifier;
  const group = tiles.find(({ tiles }) => tiles.some(identifierCallback(identifier)));
  const tile = tiles.find(({ tiles }) => tiles.some(identifierCallback(identifier)))?.tiles.find(identifierCallback(identifier));

  return { group, tile };
};

const getClosestGroup: TileHelpers.TGetClosestGroup = ({ tiles, tile }) => {
  const middleOfNodes = tiles.map(({ ref, identifier }, index) => ({
    middle: ref!.current!.offsetTop + (Number(ref?.current?.offsetHeight) / 2),
    index,
    identifier,
  }))
  .sort((a, b) => Math.abs(nodeMiddle - a.middle) - Math.abs(nodeMiddle - b.middle))
  .filter(({ index }) => index !== nodeIndex);

  return middleOfNodes[0].identifier;
}

const getIdentifierClosestToHorizontalMiddle: TileHelpers.TGetIdentifierClosestToHorizontalMiddle = ({ verticleMiddleIdentifier, tiles, nodeMiddle, nodeIndex }) => {
  const verticleMiddleTile = tiles.find(({ identifier }) => identifier === verticleMiddleIdentifier)!;

  //if it's block then we can do the check on just this block
  if (verticleMiddleTile.position === 'block') {
    return verticleMiddleTile.identifier;
  }

  //Inline nodes are a little more complicated, we need to find the closest horizontal middle
  const getInlineNodesToLeft = (index: number) => {
    const leftNodes = [];
    for (let i = index - 1; i >= 0; i--) {
      const node = tiles[i];
      if (node.position === 'block') {
        break;
      }
      leftNodes.push(node);
    }

    return leftNodes;
  }

  const getInlineNodesToRight = (index: number) => {
    const rightNodes = [];
    for (let i = index + 1; i < tiles.length; i++) {
      const node = tiles[i];
      if (node.position === 'block') {
        break;
      }
      rightNodes.push(node);
    }

    return rightNodes;
  }

  const inlineGroup = [...getInlineNodesToLeft(nodeIndex), verticleMiddleTile, ...getInlineNodesToRight(nodeIndex)];

  //now we can check the inlineGroup to find the closest horizontal middle
  const middleOfNodes = inlineGroup.map(({ ref, identifier }, index) => ({
    middle: ref!.current!.offsetLeft + (Number(ref?.current?.offsetWidth) / 2),
    index,
    identifier,
  }))
    .sort((a, b) => Math.abs(nodeMiddle.x - a.middle) - Math.abs(nodeMiddle.x - b.middle))
    .filter(({ index }) => index !== nodeIndex);

  return middleOfNodes[0].identifier;
}

const getShouldGoBefore: TileHelpers.TGetShouldGoBefore = ({ identifiers, tiles, nodeMiddle }) => {
  //get tile ref
  const node = findByIdentifier(tiles, identifiers.vertical)!.ref!.current!;
  const interceptingNodeMiddle = node.offsetTop + (node.offsetHeight / 2);

  return nodeMiddle.y < interceptingNodeMiddle;
}

const getShouldGoRight: TileHelpers.TGetShouldGoRight= ({ identifiers, tiles, nodeMiddle }) => {
  const interceptingTile = findByIdentifier(tiles, identifiers.horizontal);
  const interceptingNode = interceptingTile!.ref!.current!;
  const interceptingNodeMiddleHorizontal = interceptingNode.offsetLeft + (interceptingNode.offsetWidth / 2);

  // interceptingNode.style.backgroundColor = 'red';

  // if the nodeMiddle is in the right 20% then return true
  if (nodeMiddle.x > interceptingNodeMiddleHorizontal + (interceptingNode.offsetWidth * 0.3)) {
    return true;
  }

  return false;
};

const getShouldGoLeft: TileHelpers.TGetShouldGoRight = ({ identifiers, tiles, nodeMiddle }) => {
  const interceptingTile = findByIdentifier(tiles, identifiers.horizontal);
  const interceptingNode = interceptingTile!.ref!.current!;
  const interceptingNodeMiddleHorizontal = interceptingNode.offsetLeft + (interceptingNode.offsetWidth / 2);

  // interceptingNode.style.backgroundColor = 'green';

  // if the nodeMiddle is in the left 20% then return true
  if (nodeMiddle.x < interceptingNodeMiddleHorizontal - (interceptingNode.offsetWidth * 0.3)) {
    return true;
  }

  return false;
}

const reorder: TileHelpers.TReorder = ({ closestTileIdentifier, shouldVisuallyGoBefore, shouldVisuallyGoRight, shouldVisuallyGoLeft, tiles, nodeIndex }) => {
  const newTiles = [...tiles];
  const closestTileIndex = getTileIndex(newTiles, closestTileIdentifier);
  const isTileIndexBeforeInterceptingIndex = nodeIndex < closestTileIndex;
  const closestTile = newTiles[closestTileIndex];
  const removed = newTiles.splice(nodeIndex, 1)[0];

  console.log('shouldVisuallyGoRight', shouldVisuallyGoRight)
  console.log('shouldVisuallyGoRight: ', shouldVisuallyGoLeft)

  if (shouldVisuallyGoRight || shouldVisuallyGoLeft) {
    removed.position = 'inline';
    closestTile.position = 'inline';
  } else {
    removed.position = 'block';
  }

  const getIsGoingBefore = () => {
    if (shouldVisuallyGoRight) {
      return false;
    } else {
      return shouldVisuallyGoLeft || shouldVisuallyGoBefore;
    }
  }

  const insertIndex = getInsertIndex(closestTileIndex, isTileIndexBeforeInterceptingIndex, getIsGoingBefore());
  newTiles.splice(insertIndex, 0, removed);

  return newTiles;
}

export const getTileInformation: TileHelpers.TGetTileInformation = ({ tiles, tile }) => {
  const { center } = tile;


  const closestVerticalTileIdentifier = getClosestGroup({ tiles, tile });

  const closestTileIdentifier = getIdentifierClosestToHorizontalMiddle({ 
    verticleMiddleIdentifier: closestVerticalTileIdentifier, 
    tiles, 
    nodeMiddle, 
    nodeIndex 
  });

  const options = {
    identifiers: {
      vertical: closestVerticalTileIdentifier,
      horizontal: closestTileIdentifier,
    },
    tiles,
    tile
  }

  const shouldVisuallyGoBefore = getShouldGoBefore(options);
  const shouldVisuallyGoRight = getShouldGoRight(options);
  const shouldVisuallyGoLeft = getShouldGoLeft(options);

  return { 
    ...options,
    shouldVisuallyGoBefore, 
    shouldVisuallyGoRight,
    shouldVisuallyGoLeft,
    closestTileIdentifier
  }
}

export const getRearrangedTiles: TileHelpers.TGetRearrangedTiles = ({
  tile,
  tiles,
}) => {
  getTileInformation({ tiles, ...getEnhancedTile(tile, tiles, offset) });

  return tiles;
};

