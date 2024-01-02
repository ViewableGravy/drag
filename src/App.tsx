import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type TDragstate = {
  offset: {
    x: number,
    y: number,
  },
  isDragging: boolean,
}

const useDraggable = (ref: React.RefObject<HTMLDivElement>, options: {
  [key in keyof HTMLElementEventMap]?: (event: Event, state: TDragstate) => void
} & {
  onDragComplete?: (state: TDragstate) => void,
}, dependencies: any[]) => {
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef({
    offset: { x: 0, y: 0 },
    isDragging: false,
  })
  const { onDragComplete, ..._options } = options;

  const handleMouseDown = (event: MouseEvent) => {
    dragState.current = {
      isDragging: true,
      offset: {
        x: event.clientX - (ref.current?.offsetLeft || 0),
        y: event.clientY - (ref.current?.offsetTop || 0),
      },
    }
    setIsDragging(dragState.current.isDragging)
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (dragState.current.isDragging) {
      //follow mouse
      const node = ref.current
      if (node) {
        node.style.left = `${event.clientX - dragState.current.offset.x}px`
        node.style.top = `${event.clientY - dragState.current.offset.y}px`
      }

      //prevent text selection
      event.preventDefault()
    }
  }

  const handleMouseUp = (event: MouseEvent) => {
    if (!dragState.current.isDragging) return;
    
    onDragComplete?.(dragState.current)

    dragState.current = {
      ...dragState.current,
      isDragging: false,
    }
    setIsDragging(dragState.current.isDragging)
  }

  React.useEffect(() => {
    const node = ref.current
    if (node) {
      node.addEventListener('mousedown', handleMouseDown)
      node.addEventListener('mousemove', handleMouseMove)
      node.addEventListener('mouseup', handleMouseUp)
      node.addEventListener('mouseleave', handleMouseUp)

      Object.entries(_options).forEach(([key, value]) => {
        const handler = (event: Event) => {
          value(event, dragState.current)
        }

        node.addEventListener(key, handler)
      });
    }

    return () => {
      if (node) {
        node.removeEventListener('mousedown', handleMouseDown)
        node.removeEventListener('mousemove', handleMouseMove)
        node.removeEventListener('mouseup', handleMouseUp)
        node.removeEventListener('mouseleave', handleMouseUp)

        Object.entries(_options).forEach(([key, value]) => {
          const handler = (event: Event) => {
            value(event, dragState.current)
          }

          node.removeEventListener(key, handler)
        });
      }
    }
  }, [ref.current, ...dependencies])

  return { isDragging, stopDrag: handleMouseUp }
}

type TTile = React.FC<{
  registerRef: (tile: React.RefObject<HTMLDivElement>) => void,
  identifier: string,
}>

const getOverlappingInformation = (tile: Readonly<{
  ref: React.RefObject<HTMLDivElement> | null,
  identifier: string
}>, tiles: Readonly<Array<{
  ref: React.RefObject<HTMLDivElement> | null,
  identifier: string
}>>) => {
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

const getRearrangedTiles = ({
  tile,
  tiles,
  offset,
}: {
  tile: Readonly<{
    ref: React.RefObject<HTMLDivElement> | null,
    identifier: string
  }>,
  tiles: Readonly<Array<{
    ref: React.RefObject<HTMLDivElement> | null,
    identifier: string
  }>>,
  offset: Readonly<{
    x: number,
    y: number,
  }>
}) => {
  const { overlappingTileIndexes, isOverlapping } = getOverlappingInformation(tile, tiles);
  const newTiles = [...tiles];

  const node = tile.ref!.current!;
  const nodeMiddle = window.scrollY + node.offsetHeight / 2 + (offset.y || 0);
  const nodeIndex = tiles.findIndex(({ identifier }) => identifier === tile.identifier);

  const getInsertIndex = (interceptingIndex: number, isBefore: boolean, isMovingBefore: boolean) => {
    if (isBefore) {
      return isMovingBefore ? interceptingIndex - 1 : interceptingIndex;
    } else {
      return isMovingBefore ? interceptingIndex : interceptingIndex + 1;
    }
  }

  const getIndexClosestToMiddle = (indexes: number[]) => {
    const middleOfNodes = indexes.map((index) => {
      const node = tiles[index].ref!.current!;
      return {
        middle: node.getBoundingClientRect().y + node.offsetHeight / 2,
        index,
      }
    })
    // find one where middle is closest to this middle
    .sort((a, b) => Math.abs(nodeMiddle - a.middle) - Math.abs(nodeMiddle - b.middle))[0];

    return middleOfNodes.index;
  }

  const getShouldGoBefore = (index: number) => {
    const node = tiles[index].ref!.current!;
    const interceptingNodeMiddle = window.scrollY + node.getBoundingClientRect().y + node.offsetHeight / 2;

    return nodeMiddle < interceptingNodeMiddle;
  }

  const handleNoOverlap = () => {
    const firstNode = tiles[0].ref!.current!;
      const firstNodeMiddle = firstNode.getBoundingClientRect().y + firstNode.offsetHeight / 2;
      const lastNode = tiles[tiles.length - 1].ref!.current!;
      const lastNodeMiddle = lastNode.getBoundingClientRect().y + lastNode.offsetHeight / 2;
      const isNodeFirstNode = tiles.findIndex(({ identifier }) => identifier === tile.identifier) === 0;
      const isNodeLastNode = tiles.findIndex(({ identifier }) => identifier === tile.identifier) === tiles.length - 1;

      if (nodeMiddle < firstNodeMiddle && !isNodeFirstNode) {
          //check if this is first node
          if (tiles.findIndex(({ identifier }) => identifier === tile.identifier) === 0) return;

          //remove this tile from the array
          const tileIndex = newTiles.findIndex(({ identifier }) => identifier === tile.identifier);
          const removed = newTiles.splice(tileIndex, 1)[0];

          //insert before first tile
          newTiles.unshift(removed);
      }

      if (nodeMiddle > lastNodeMiddle && !isNodeLastNode) {
        //check if this is last node
        if (tiles.findIndex(({ identifier }) => identifier === tile.identifier) === tiles.length - 1) return;

        //remove this tile from the array
        const tileIndex = newTiles.findIndex(({ identifier }) => identifier === tile.identifier);
        const removed = newTiles.splice(tileIndex, 1)[0];

        //insert after last tile
        newTiles.push(removed);
      }
  }

  const reorder = (interceptingIndex: number, shouldGoBefore: boolean) => {
    const isTileIndexBeforeInterceptingIndex = nodeIndex < interceptingIndex;

    //remove this tile from the array
    const removed = newTiles.splice(nodeIndex, 1)[0];
    const insertIndex = getInsertIndex(interceptingIndex, isTileIndexBeforeInterceptingIndex, shouldGoBefore);
    newTiles.splice(insertIndex, 0, removed);
  }

  const handleOverlap = () => {
    const interceptingIndex = getIndexClosestToMiddle(overlappingTileIndexes);
    const shouldGoBefore = getShouldGoBefore(interceptingIndex);
    reorder(interceptingIndex, shouldGoBefore);
  }

  switch (true) {
    case !isOverlapping: handleNoOverlap(); break;
    default: handleOverlap(); break;
  }

  return newTiles;
}

const useTileDraggableCallbacks = ({ tile, color } : { 
  color: string, 
  tile: {
    identifier: string, ref: React.RefObject<HTMLDivElement>
  } 
}) => {
  const { tiles, setTiles } = useTileContext();
  const { ref } = tile;

  const onMouseMove = (_: Event, { isDragging }: TDragstate) => {
    if (!isDragging) return;
    if (!ref.current) return;

    const { isOverlapping } = getOverlappingInformation(tile, tiles);

    if (isOverlapping) {
      ref.current.style.backgroundColor = 'red';
    } else {
      ref.current.style.backgroundColor = color;
    }
  }
  
  const onDragComplete = () => {
    //reorder tiles to match current position    
    const newTiles = getRearrangedTiles({
      tile,
      tiles,
      offset: {
        y: parseInt(ref.current!.style.top),
        x: parseInt(ref.current!.style.left),
      }
    })

    setTiles(newTiles);

    //reset element
    ref.current!.style.left = '';
    ref.current!.style.top = '';
    ref.current!.style.backgroundColor = color;
  }
   
  return {
    onMouseMove,
    onDragComplete,
  }
}

const Tile: TTile = ({ registerRef, identifier }) => {
  const ref = useRef<HTMLDivElement>(null)

  const tile = useMemo(() => ({
    ref,
    identifier,
  }), [ref, identifier]);

  const { tiles } = useTileContext();
  const [ color ] = useState(() => `#${Math.floor(Math.random()*16777215).toString(16)}`)
  const { onDragComplete, onMouseMove } = useTileDraggableCallbacks({ tile, color })
  const { isDragging } = useDraggable(ref, {
    mousemove: onMouseMove,
    onDragComplete: onDragComplete
  }, [tiles])

  /***** EFFECTS *****/
  useEffect(() => registerRef(ref), [])

  const baseStyle: React.CSSProperties = React.useMemo(() => ({
    height: Math.min(Math.max(Math.random() * 300, 40), 300) + 'px',
    width: '90vw',
    margin: 10,
    backgroundColor: color,
    color: 'black',
    userSelect: 'none',
  }), [])

  const style: React.CSSProperties = {
    ...baseStyle,
    position: isDragging ? 'absolute' : 'relative',
    zIndex: isDragging ? 1 : undefined,
  }

  return (
    <Fragment>
      <div style={style} ref={ref}>{identifier}</div>
      {isDragging && <div style={{ ...style, position: 'relative', zIndex: undefined, backgroundColor: undefined }}/>}
    </Fragment>
  )
}

const TileContext = React.createContext<{
  tiles: Array<{
    ref: React.RefObject<HTMLDivElement> | null,
    identifier: string
  }>,
  setTiles: (tiles: Array<{
    ref: React.RefObject<HTMLDivElement> | null,
    identifier: string
  }>) => void
}>({
  tiles: [],
  setTiles: () => {},
});

const useTileContext = () => React.useContext(TileContext);

const generateUniqueIdentifier = () => Math.random().toString(36).substring(7);

const generateXEmptyTiles = (x: number) => {
  return Array(x).fill(null).map(() => ({
    ref: null,
    identifier: generateUniqueIdentifier(),
  })); 
}

function App() {
  const [tiles, setTiles] = useState<Array<{
    ref: React.RefObject<HTMLDivElement> | null,
    identifier: string
  }>>(generateXEmptyTiles(5));

  const updateTileInformation = useCallback((identifier: string) => (tile: React.RefObject<HTMLDivElement>) => {
    setTiles((tiles) => {
      tiles.find(({ identifier: _identifier }) => _identifier === identifier)!.ref = tile;
      return tiles;
    });
  }, []);

  const contextValues = {
    tiles,
    setTiles,
  }

  return (
    <div style={{ position: 'relative', padding: 50 }}>
      <TileContext.Provider value={contextValues}>
        {tiles.map((tile) => (
          <Tile 
            key={tile.identifier} 
            identifier={tile.identifier} 
            registerRef={updateTileInformation(tile.identifier)} 
          />
        ))}
      </TileContext.Provider>
    </div>
  );
}

export default App
