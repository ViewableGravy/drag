export namespace TileHelpers {
  export type TTileObject = {
    ref: React.RefObject<HTMLDivElement> | null,
    identifier: string
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
    interceptingIndex: number, 
    shouldGoBefore: boolean,
    tiles: Readonly<Array<TTileObject>>,
    nodeIndex: number,
  }) => Array<TTileObject>;

  /**
   * If there is no need to perform a reorder, simply return the existing tiles array
   */
  export type THandleOverlap = (options: {
    reorder?: (options: {
      interceptingIndex: number, 
      shouldGoBefore: boolean,
      tiles: Readonly<Array<TTileObject>>,
      nodeIndex: number,
    }) => Array<TTileObject>,
    tiles: Readonly<Array<TTileObject>>,
    nodeIndex: number,
    nodeMiddle: number,
  }) => Array<TTileObject>;
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

const getShouldGoBefore: TileHelpers.TGetShouldGoBefore = ({ index, tiles, nodeMiddle }) => {
  const node = tiles[index].ref!.current!;
  // const interceptingNodeMiddle = window.scrollY + node.getBoundingClientRect().y + node.offsetHeight / 2;
  const interceptingNodeMiddle = node.offsetTop + (node.offsetHeight / 2);

  return nodeMiddle < interceptingNodeMiddle;
}

const reorder: TileHelpers.TReorder = ({ interceptingIndex, shouldGoBefore, tiles, nodeIndex }) => {
  const newTiles = [...tiles];

  const isTileIndexBeforeInterceptingIndex = nodeIndex < interceptingIndex;

  //remove this tile from the array
  const removed = newTiles.splice(nodeIndex, 1)[0];
  const insertIndex = getInsertIndex(interceptingIndex, isTileIndexBeforeInterceptingIndex, shouldGoBefore);
  newTiles.splice(insertIndex, 0, removed);

  return newTiles;
}

export const handleOverlap: TileHelpers.THandleOverlap = ({ reorder, tiles, nodeIndex, nodeMiddle }) => {
  const interceptingIndex = getIndexClosestToMiddle({ tiles, nodeMiddle, nodeIndex });
  const shouldGoBefore = getShouldGoBefore({ index: interceptingIndex, tiles, nodeMiddle });

  return reorder?.({ interceptingIndex, shouldGoBefore, tiles, nodeIndex }) ?? [...tiles];
}

export const getRearrangedTiles: TileHelpers.TGetRearrangedTiles = ({
  tile,
  tiles,
  offset
}) => handleOverlap({ reorder, tiles, ...getCurrentNodeInformation(tile, tiles, offset) });

