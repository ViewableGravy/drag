import React, { Fragment, useCallback, useMemo, useState } from 'react'
import { Tile } from './components/tile'
import { TileHelpers, getCurrentNodeInformation, getRearrangedTiles, handleOverlap } from './components/tile/helpers';
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
  tiles: Array<{
    ref: React.RefObject<HTMLDivElement> | null,
    identifier: string
  }>,
  setTiles: (tiles: Array<{
    ref: React.RefObject<HTMLDivElement> | null,
    identifier: string
  }>) => void,
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
}>({
  tiles: [],
  setTiles: () => {},
  handleTileMove: () => {},
  handleTileDrop: () => {},
});

export const useTileContext = () => React.useContext(TileContext);

export const generateUniqueIdentifier = () => Math.random().toString(36).substring(7);

const generateXEmptyTiles = (x: number) => {
  return Array(x).fill(null).map(() => ({
    ref: null,
    identifier: generateUniqueIdentifier(),
  })); 
}

function App() {
  /***** STATE *****/
  const [estimationInformation, setEstimationInformation] = useState({
    interceptingIndex: -1,
    shouldGoBefore: true,
  });
  const [tiles, setTiles] = useState<Array<TileHelpers.TTileObject>>(generateXEmptyTiles(10));

  /***** FUNCTIONS *****/
  const registerRef = useCallback<TUpdateTileInformation>((identifier) => (tile) => {
    setTiles((tiles) => {
      tiles.find(({ identifier: _identifier }) => _identifier === identifier)!.ref = tile;
      return tiles;
    });
  }, []);

  const handleTileDrop = useCallback<TCompleteTileDrag>(({ identifier, offset }) => {
    setTiles((tiles) => getRearrangedTiles({ 
      tile: tiles.find(({ identifier: _identifier }) => _identifier === identifier)!, 
      tiles, 
      offset 
    }));

    setEstimationInformation({
      interceptingIndex: -1,
      shouldGoBefore: true,
    });
  }, []);

  const handleTileMove = useCallback<handleTileMove>((identifier, offset) => {
    const tile = tiles.find(({ identifier: _identifier }) => _identifier === identifier)!;

    //do nothing for now
    handleOverlap({ reorder: ({ interceptingIndex, shouldGoBefore }) => {
      setEstimationInformation({
        interceptingIndex,
        shouldGoBefore,
      });

      return tiles;
    }, tiles, ...getCurrentNodeInformation(tile, tiles, offset) })
  }, [tiles])

  const contextValues = {
    tiles,
    setTiles,
    handleTileDrop,
    handleTileMove
  }

  /***** RENDER *****/
  return (
    <div style={{ position: 'relative', padding: '5vw', overflow: 'hidden' }}>
      <TileContext.Provider value={contextValues}>
        {tiles.map((tile, index) => (
          <Fragment key={tile.identifier}>
            <InjectElementIntoJSX
              element={<div key={index} style={{ height: 2, width: '92vw', backgroundColor: 'lightblue', marginLeft: -20 }} />}
              start={estimationInformation.interceptingIndex === index && estimationInformation.shouldGoBefore}
              end={estimationInformation.interceptingIndex === index && !estimationInformation.shouldGoBefore}
            >
              <Tile
                key={tile.identifier}
                identifier={tile.identifier} 
                registerRef={registerRef(tile.identifier)}
              />
            </InjectElementIntoJSX>
          </Fragment>
        ))}
      </TileContext.Provider>
    </div>
  );
}

export default App
