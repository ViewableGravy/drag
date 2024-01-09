import React from "react"

export namespace TileHelpers {
  export type TTileObject = {
    ref: React.RefObject<HTMLDivElement> | null,
    identifier: string,
    position: 'inline' | 'block',
    style: React.CSSProperties
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

  export type TGetRearrangedTiles = ({
    tile,
    tiles,
    offset
  }: {
    tile: Readonly<TTileObject>,
    tiles: Readonly<Array<TTileObject>>,
    offset: {
      x: number,
      y: number,
    }
  }) => Array<TTileObject>;

  export type TGetIndexClosestToMiddle = ({
    tiles,
    nodeMiddle
  }: {
    tiles: Readonly<Array<TTileObject>>,
    nodeMiddle: number,
    nodeIndex: number,
  }) => number;

  export type TGetInsertIndex = (interceptingIndex: number, isBefore: boolean, isMovingBefore: boolean) => number;

  export type TGetCurrentNodeInformation = (tile: Readonly<TTileObject>, tiles: Readonly<Array<TTileObject>>, offset: {
    x: number,
    y: number,
  }) => {
    node: HTMLDivElement,
    nodeMiddle: {
      x: number,
      y: number,
    },
    nodeIndex: number,
  }

  export type TReorder = (options: {
    closestTileIdentifier: string,
    tiles: Readonly<Array<TTileObject>>,
    nodeIndex: number,
    shouldVisuallyGoBefore: boolean,
    shouldVisuallyGoRight: boolean,
    shouldVisuallyGoLeft: boolean,
  }) => Array<TTileObject>;

  /**
   * If there is no need to perform a reorder, simply return the existing tiles array
   */
  export type THandleOverlap = (options: {
    tiles: Readonly<Array<TTileObject>>,
    nodeIndex: number,
    nodeMiddle: {
      x: number,
      y: number,
    },
  }, callback: (options: {
    tiles: Readonly<Array<TTileObject>>,
    nodeIndex: number,
    shouldVisuallyGoBefore: boolean,
    shouldVisuallyGoRight: boolean,
    shouldVisuallyGoLeft: boolean,
    closestTileIdentifier: string,
  }) => Array<TTileObject>) => Array<TTileObject>;

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

  export type TGetIdentifierClosestToVerticalMiddle = (options: { 
    tiles: Readonly<Array<TTileObject>>, 
    nodeMiddle: number,
    nodeIndex: number,
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

const getTile = (tiles: Readonly<TileHelpers.TTileObject[]> , identifier: string) => {
  return tiles.find(({ identifier: _identifier }) => _identifier === identifier)!;
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

export const getCurrentNodeInformation: TileHelpers.TGetCurrentNodeInformation = (tile, tiles, offset) => {
  const node = tile.ref!.current!;
  const nodeMiddle = {
    y: (node.offsetHeight / 2) + (offset.y || 0),
    x: (node.offsetWidth / 2) + (offset.x || 0)
  };
  const nodeIndex = tiles.findIndex(({ identifier }) => identifier === tile.identifier);
  return {
    node,
    nodeMiddle,
    nodeIndex,
  }
}

const getIdentifierClosestToVerticalMiddle: TileHelpers.TGetIdentifierClosestToVerticalMiddle = ({ tiles, nodeMiddle, nodeIndex }) => {
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
  const node = getTile(tiles, identifiers.vertical).ref!.current!;
  const interceptingNodeMiddle = node.offsetTop + (node.offsetHeight / 2);

  return nodeMiddle.y < interceptingNodeMiddle;
}

const getShouldGoRight: TileHelpers.TGetShouldGoRight= ({ identifiers, tiles, nodeMiddle }) => {
  const interceptingTile = getTile(tiles, identifiers.horizontal);
  const interceptingNode = interceptingTile.ref!.current!;
  const interceptingNodeMiddleHorizontal = interceptingNode.offsetLeft + (interceptingNode.offsetWidth / 2);

  // interceptingNode.style.backgroundColor = 'red';

  // if the nodeMiddle is in the right 20% then return true
  if (nodeMiddle.x > interceptingNodeMiddleHorizontal + (interceptingNode.offsetWidth * 0.3)) {
    return true;
  }

  return false;
};

const getShouldGoLeft: TileHelpers.TGetShouldGoRight = ({ identifiers, tiles, nodeMiddle }) => {
  const interceptingTile = getTile(tiles, identifiers.horizontal);
  const interceptingNode = interceptingTile.ref!.current!;
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

export const tilePositionInformation: TileHelpers.THandleOverlap = ({ tiles, nodeIndex, nodeMiddle }, callback) => {
  const closestVerticalTileIdentifier = getIdentifierClosestToVerticalMiddle({ tiles, nodeMiddle: nodeMiddle.y, nodeIndex });
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
    nodeMiddle,
    nodeIndex
  }

  const shouldVisuallyGoBefore = getShouldGoBefore(options);
  const shouldVisuallyGoRight = getShouldGoRight(options);
  const shouldVisuallyGoLeft = getShouldGoLeft(options);

  return callback?.({ 
    ...options,
    shouldVisuallyGoBefore, 
    shouldVisuallyGoRight,
    shouldVisuallyGoLeft,
    closestTileIdentifier
  }) ?? [...tiles];
}

export const getRearrangedTiles: TileHelpers.TGetRearrangedTiles = ({
  tile,
  tiles,
  offset
}) => tilePositionInformation({ tiles, ...getCurrentNodeInformation(tile, tiles, offset) }, reorder);

