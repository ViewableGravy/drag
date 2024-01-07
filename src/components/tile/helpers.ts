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

  export type TGetShouldGoBefore = (options: { index: number, tiles: Readonly<Array<TTileObject>>, nodeMiddle: number }) => boolean;

  export type TGetInsertIndex = (interceptingIndex: number, isBefore: boolean, isMovingBefore: boolean) => number;

  export type TGetCurrentNodeInformation = (tile: Readonly<TTileObject>, tiles: Readonly<Array<TTileObject>>, offset: {
    x: number,
    y: number,
  }) => {
    node: HTMLDivElement,
    nodeMiddle: number,
    nodeIndex: number,
  }

  export type TReorder = (options: {
    closestVerticalTileIndex: number, 
    shouldGoBefore: boolean,
    tiles: Readonly<Array<TTileObject>>,
    nodeIndex: number,
  }) => Array<TTileObject>;

  /**
   * If there is no need to perform a reorder, simply return the existing tiles array
   */
  export type THandleOverlap = (options: {
    tiles: Readonly<Array<TTileObject>>,
    nodeIndex: number,
    nodeMiddle: number,
  }, callback: (options: {
    closestVerticalTileIndex: number, 
    shouldGoBefore: boolean,
    tiles: Readonly<Array<TTileObject>>,
    nodeIndex: number,
    shouldGoRight: boolean,
    shouldGoLeft: boolean,
    closestVerticalTileIdentifier: string,
  }) => Array<TTileObject>) => Array<TTileObject>;

  export type TGetShouldGoRight = (options: { 
    index: number, 
    tiles: Readonly<Array<TTileObject>>, 
    nodeMiddle: number 
  }) => boolean;

  export type TGetShouldGoLeft = (options: { 
    index: number, 
    tiles: Readonly<Array<TTileObject>>, 
    nodeMiddle: number 
  }) => boolean;

  export type TGetIdentifierClosestToMiddle = (options: { 
    tiles: Readonly<Array<TTileObject>>, 
    nodeMiddle: number,
    nodeIndex: number,
  }) => string;
}

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
  const nodeMiddle = (node.offsetHeight / 2) + (offset.y || 0);
  const nodeIndex = tiles.findIndex(({ identifier }) => identifier === tile.identifier);
  return {
    node,
    nodeMiddle,
    nodeIndex,
  }
}

const getIndexClosestToMiddle: TileHelpers.TGetIndexClosestToMiddle = ({ tiles, nodeMiddle, nodeIndex }) => {
  const middleOfNodes = tiles.map(({ ref }, index) => ({
    middle: ref!.current!.offsetTop + (Number(ref?.current?.offsetHeight) / 2),
    index,
  }))
  .sort((a, b) => Math.abs(nodeMiddle - a.middle) - Math.abs(nodeMiddle - b.middle))
  .filter(({ index }) => index !== nodeIndex);

  return middleOfNodes[0].index;
}

const getIdentifierClosestToMiddle: TileHelpers.TGetIdentifierClosestToMiddle = ({ tiles, nodeMiddle, nodeIndex }) => {
  const middleOfNodes = tiles.map(({ ref, identifier }, index) => ({
    middle: ref!.current!.offsetTop + (Number(ref?.current?.offsetHeight) / 2),
    index,
    identifier,
  }))
  .sort((a, b) => Math.abs(nodeMiddle - a.middle) - Math.abs(nodeMiddle - b.middle))
  .filter(({ index }) => index !== nodeIndex);

  return middleOfNodes[0].identifier;
}

const getShouldGoBefore: TileHelpers.TGetShouldGoBefore = ({ index, tiles, nodeMiddle }) => {
  const node = tiles[index].ref!.current!;
  // const interceptingNodeMiddle = window.scrollY + node.getBoundingClientRect().y + node.offsetHeight / 2;
  const interceptingNodeMiddle = node.offsetTop + (node.offsetHeight / 2);

  return nodeMiddle < interceptingNodeMiddle;
}

const getShouldGoRight: TileHelpers.TGetShouldGoRight= ({ index, tiles, nodeMiddle }) => {
  const interceptingNode = tiles[index].ref!.current!;
  const interceptingNodeMiddleHorizontal = interceptingNode.offsetLeft + (interceptingNode.offsetWidth / 2);

  // if the nodeMiddle is in the right 30% then return true
  if (nodeMiddle > interceptingNodeMiddleHorizontal + (interceptingNode.offsetWidth * 0.2)) {
    return true;
  }

  return false;
};

const getShouldGoLeft: TileHelpers.TGetShouldGoRight = ({ index, tiles, nodeMiddle }) => {
  const interceptingNode = tiles[index].ref!.current!;
  const interceptingNodeMiddleHorizontal = interceptingNode.offsetLeft + (interceptingNode.offsetWidth / 2);

  // if the nodeMiddle is in the left 30% then return true
  if (nodeMiddle < interceptingNodeMiddleHorizontal - (interceptingNode.offsetWidth * 0.2)) {
    return true;
  }

  return false;
}

const reorder: TileHelpers.TReorder = ({ closestVerticalTileIndex, shouldGoBefore, tiles, nodeIndex }) => {
  const newTiles = [...tiles];

  const isTileIndexBeforeInterceptingIndex = nodeIndex < closestVerticalTileIndex;

  //for now, the reordered one is becoming block so lets do that now
  newTiles[nodeIndex].position = 'block';

  const removed = newTiles.splice(nodeIndex, 1)[0];

  const insertIndex = getInsertIndex(closestVerticalTileIndex, isTileIndexBeforeInterceptingIndex, shouldGoBefore);
  newTiles.splice(insertIndex, 0, removed);

  return newTiles;
}

export const tilePositionInformation: TileHelpers.THandleOverlap = ({ tiles, nodeIndex, nodeMiddle }, callback) => {
  const closestVerticalTileIndex = getIndexClosestToMiddle({ tiles, nodeMiddle, nodeIndex });
  const closestVerticalTileIdentifier = getIdentifierClosestToMiddle({ tiles, nodeMiddle, nodeIndex });
  const shouldGoBefore = getShouldGoBefore({ index: closestVerticalTileIndex, tiles, nodeMiddle });
  const shouldGoRight = getShouldGoRight({ index: closestVerticalTileIndex, tiles, nodeMiddle });
  const shouldGoLeft = getShouldGoLeft({ index: closestVerticalTileIndex, tiles, nodeMiddle });

  return callback?.({ 
    closestVerticalTileIndex, 
    shouldGoBefore, 
    tiles, 
    nodeIndex,
    shouldGoRight,
    shouldGoLeft,
    closestVerticalTileIdentifier
  }) ?? [...tiles];
}

export const getRearrangedTiles: TileHelpers.TGetRearrangedTiles = ({
  tile,
  tiles,
  offset
}) => tilePositionInformation({ tiles, ...getCurrentNodeInformation(tile, tiles, offset) }, reorder);

