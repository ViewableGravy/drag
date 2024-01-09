import React, { Fragment, useCallback, useMemo, useState } from 'react'
import { Tile } from './components/tile'
import { TileHelpers, getCurrentNodeInformation, getRearrangedTiles, tilePositionInformation } from './components/tile/helpers';
import { InjectElementIntoJSX } from './components/InjectElementIntoJSX';

type TCompleteTileDrag = (props: {
  identifier: string,
  offset: {
    x: number,
    y: number,
  }
}) => void;

type TUpdateTileInformation = (identifier: string) => (tile: React.RefObject<HTMLDivElement>) => void;

type handleTileMove = (identifier: string, offset: { x: number, y: number }) => void;

export const TileContext = React.createContext<{
  tiles: Array<TileHelpers.TTileObject>,
  setTiles: (tiles: Array<TileHelpers.TTileObject>) => void,
  /**
   * Current Behaviour:
   * 
   * 1. TODO
   */
  handleTileMove: (identifier: string, offset: { x: number, y: number }) => void,
  /**
   * Current Behaviour:
   * 
   * 1. This function will reorder the tile (by id) within the tiles array based on the position that it is dropped,
   * this will essentially reorder the tile appropriately when repositioned
   */
  handleTileDrop: TCompleteTileDrag,

  registerRef: TUpdateTileInformation,
}>({
  tiles: [],
  setTiles: () => {},
  handleTileMove: () => {},
  handleTileDrop: () => {},
  registerRef: () => () => {},
});

export const useTileContext = () => React.useContext(TileContext);

export const generateUniqueIdentifier = () => Math.random().toString(36).substring(7);

const potentialPositions = ['inline', 'block'] as const;

const generateXEmptyTiles = (x: number) => {
  return Array(x).fill(null).map(() => ({
    ref: null,
    identifier: generateUniqueIdentifier(),
    // position: potentialPositions[Math.floor(Math.random() * potentialPositions.length)],
    position: 'block',
    style: {
      minHeight: Math.min(Math.max(Math.round(Math.random() * 300), 60), 300) + 'px',
      backgroundColor: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase()}`
    } as React.CSSProperties,
  }) satisfies TileHelpers.TTileObject); 
}

/**
 * Horizontally groups components based on their position attribute
 */
function useMemoizedGroupedElements(tiles: Array<TileHelpers.TTileObject>) {
  return useMemo(() => {
    let result: Array<Array<TileHelpers.TTileObject>> = [];
    let temp: TileHelpers.TTileObject[] = [];

    tiles.forEach((item) => {
      if (item.position === 'block') {
        if (temp.length > 0) {
          result.push(temp);
          temp = [];
        }
        result.push([item]);
      } else {
        temp.push(item);
      }
    });

    if (temp.length > 0) {
      result.push(temp);
    }

    return result.map((group) => ({
      groupID: group.reduce((acc, curr) => acc + curr.identifier, ''),
      group,
    }));
  }, [tiles]);
}

function App() {
  /***** STATE *****/
  const [estimationInformation, setEstimationInformation] = useState({
    closestVerticalTileIdentifier: '',
    shouldGoBefore: true,
    shouldGoLeft: false,
    shouldGoRight: false,
  });
  const [originalTiles, setOriginalTiles] = useState<Array<TileHelpers.TTileObject>>(generateXEmptyTiles(20));
  const tiles = useMemoizedGroupedElements(originalTiles);

  /***** FUNCTIONS *****/
  const registerRef = useCallback<TUpdateTileInformation>((identifier) => (tile) => {
    setOriginalTiles((tiles) => {
      tiles.find(({ identifier: _identifier }) => _identifier === identifier)!.ref = tile;
      return tiles;
    });
  }, []);

  const handleTileDrop = useCallback<TCompleteTileDrag>(({ identifier, offset }) => {
    setOriginalTiles((tiles) => getRearrangedTiles({ 
      tile: tiles.find(({ identifier: _identifier }) => _identifier === identifier)!, 
      tiles, 
      offset 
    }));

    setEstimationInformation({
      closestVerticalTileIdentifier: '',
      shouldGoBefore: true,
      shouldGoLeft: false,
      shouldGoRight: false,
    });
  }, []);

  const handleTileMove = useCallback<handleTileMove>((identifier, offset) => {
    const tile = originalTiles.find(({ identifier: _identifier }) => _identifier === identifier)!;

    const options = { tiles: originalTiles, ...getCurrentNodeInformation(tile, originalTiles, offset) };

    tilePositionInformation(options, ({ shouldVisuallyGoBefore, shouldVisuallyGoLeft, shouldVisuallyGoRight, closestTileIdentifier: closestVerticalTileIdentifier }) => {
      setEstimationInformation({
        closestVerticalTileIdentifier,
        shouldGoBefore: shouldVisuallyGoBefore,
        shouldGoLeft: shouldVisuallyGoLeft,
        shouldGoRight: shouldVisuallyGoRight,
      });

      return originalTiles;
    })
  }, [originalTiles])

  const styles = {
    container: {
      position: 'relative',
      padding: '5vw',
      overflow: 'hidden',
    } as React.CSSProperties,
    horizontalLine: {
      height: 2,
      width: '92vw',
      backgroundColor: 'lightblue',
      marginLeft: -20,
    } as React.CSSProperties,
    TileGroup: {
      width: '90vw', 
      display: 'flex', 
      gap: 20, 
      alignItems: 'stretch'
    }
  }

  const contextValues = {
    tiles: originalTiles,
    setTiles: setOriginalTiles,
    handleTileDrop,
    handleTileMove,
    registerRef
  }

  /***** RENDER *****/
  return (
    <div style={styles.container}>
      <TileContext.Provider value={contextValues}>
        {tiles.map(({ group, groupID }) => (
          <InjectElementIntoJSX
            key={`${groupID}-InjectElementIntoJSX`}
            element={<div style={styles.horizontalLine} />}
            start={group.some(tile => tile.identifier === estimationInformation.closestVerticalTileIdentifier) && estimationInformation.shouldGoBefore}
            end={group.some(tile => tile.identifier === estimationInformation.closestVerticalTileIdentifier) && !estimationInformation.shouldGoBefore}
          >
            <div key={groupID} style={styles.TileGroup}>
              {group.map((tile) => (
                <Tile
                  key={tile.identifier}
                  registerRef={registerRef(tile.identifier)}
                  identifier={tile.identifier}
                  style={tile.style}
                />
              ))}
            </div>
          </InjectElementIntoJSX>
        ))}
      </TileContext.Provider>
    </div>
  );
}

export default App
