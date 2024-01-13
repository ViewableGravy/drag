import React, { useCallback, useState } from 'react'
import { Tile } from './components/tile'
import { TileHelpers, findByIdentifier, getEnhancedTile, getRearrangedTiles, getTileInformation } from './components/tile/helpers';
import { InjectElementIntoJSX } from './components/InjectElementIntoJSX';

type TCompleteTileDrag = (props: {
  identifier: string,
  offset: {
    x: number,
    y: number,
  }
}) => void;

type TUpdateTileInformation = (groupIdentifier: string, tileIdentifier: string) => (tile: HTMLDivElement | null) => void;
type TUpdateGroupInformation = (groupIdentifier: string) => (group: HTMLDivElement | null) => void;
type handleTileMove = (identifier: string, offset: { x: number, y: number }) => void;

const emptyFunction = () => {};
const emptyHOF = () => emptyFunction;

const TileContext = React.createContext<{
  tiles: Array<TileHelpers.TTileGroup>,
  handleTileMove: (identifier: string, offset: { x: number, y: number }) => void,
  handleTileDrop: TCompleteTileDrag,
  registerRef: TUpdateTileInformation,
}>({
  tiles: [],
  handleTileMove: emptyFunction,
  handleTileDrop: emptyFunction,
  registerRef: emptyHOF,
});

export const useTileContext = () => React.useContext(TileContext);

const _helpers = {
  generateUniqueIdentifier: () => Math.random().toString(36).substring(7),
  generateMinHeightWithinRange: (min: number, max: number) => Math.min(Math.max(Math.round(Math.random() * max), min), max),
  generateRandomColor: () => `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase()}`,
  generateXEmptyTiles: (x: number): Array<TileHelpers.TTileGroup> => {
    return Array(x).fill(null).map(() => ({
      name: 'group',
      identifier: _helpers.generateUniqueIdentifier(),
      ref: { current: undefined } as React.MutableRefObject<HTMLDivElement | undefined>,
      tiles: [{
        name: 'tile',
        ref: null,
        identifier: _helpers.generateUniqueIdentifier(),
        position: 'block',
        style: {
          minHeight: _helpers.generateMinHeightWithinRange(60, 300) + 'px',
          backgroundColor: _helpers.generateRandomColor()
        } satisfies React.CSSProperties,
      }]
      
    }) satisfies TileHelpers.TTileGroup); 
  }
}

function App() {
  /***** STATE *****/
  const [estimationInformation, setEstimationInformation] = useState({
    closestTileIdentifier: '',
    shouldGoBefore: true,
    shouldGoLeft: false,
    shouldGoRight: false,
  });
  const [tiles, setTiles] = useState<Array<TileHelpers.TTileGroup>>(_helpers.generateXEmptyTiles(20));

  /***** FUNCTIONS *****/
  const registerTile = useCallback<TUpdateTileInformation>((groupID, tileID) => (tile) => {
    const group = findByIdentifier(tiles, groupID);

    if (!group) return;

    const tileObject = findByIdentifier(group.tiles, tileID);

    if (!tileObject || !tileObject.ref || !tile) return;

    tileObject.ref.current = tile;
  }, [tiles]);

  const registerGroup = useCallback<TUpdateGroupInformation>((groupID) => (group) => {
    const groupObject = findByIdentifier(tiles, groupID);

    if (!groupObject || !groupObject.ref || !group) return;

    groupObject.ref.current = group;
  }, [tiles]);

  const handleTileDrop = useCallback<TCompleteTileDrag>(({ identifier, offset }) => {
    const tile = getEnhancedTile({
      tiles: tiles,
      identifier: identifier,
      offset,
    });

    setTiles((tiles) => getRearrangedTiles({ tile, tiles }));
    setEstimationInformation({
      closestTileIdentifier: '',
      shouldGoBefore: true,
      shouldGoLeft: false,
      shouldGoRight: false,
    });
  }, []);

  const handleTileMove = useCallback<handleTileMove>((tileIdentifier, offset) => {
    const tile = getEnhancedTile({
      tiles: tiles,
      identifier: tileIdentifier,
      offset,
    });

    if (!tile) return;

    const { 
      shouldVisuallyGoBefore, 
      shouldVisuallyGoLeft, 
      shouldVisuallyGoRight, 
      closestTileIdentifier 
    } = getTileInformation({ tiles, tile })

    setEstimationInformation({
      closestTileIdentifier,
      shouldGoBefore: shouldVisuallyGoBefore,
      shouldGoLeft: shouldVisuallyGoLeft,
      shouldGoRight: shouldVisuallyGoRight,
    });
  }, [tiles])

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
    verticalLine: {
      width: 2,
      backgroundColor: 'lightblue',
    } as React.CSSProperties,
    TileGroup: {
      width: '90vw', 
      display: 'flex', 
      gap: 20, 
      alignItems: 'stretch'
    }
  }

  const contextValues = {
    tiles: tiles,
    setTiles: setTiles,
    handleTileDrop,
    handleTileMove,
    registerRef: registerTile
  }

  const generateGroupInjectionProps = (group: TileHelpers.TTileObject[], id: string) => ({
    start: group.some(tile => tile.identifier === estimationInformation.closestTileIdentifier) && estimationInformation.shouldGoBefore && !estimationInformation.shouldGoLeft && !estimationInformation.shouldGoRight,
    end: group.some(tile => tile.identifier === estimationInformation.closestTileIdentifier) && !estimationInformation.shouldGoBefore && !estimationInformation.shouldGoLeft && !estimationInformation.shouldGoRight,
    key: `${id}-InjectElementIntoJSX`,
    element: <div style={styles.horizontalLine} />
  })

  const generateTileInjectionProps = (tile: { identifier: string }) => ({
    start: tile.identifier === estimationInformation.closestTileIdentifier && estimationInformation.shouldGoLeft,
    end: tile.identifier === estimationInformation.closestTileIdentifier && estimationInformation.shouldGoRight,
    key: `${tile.identifier}-InjectElementIntoJSX`,
    element: <div style={styles.verticalLine} />
  })

  /***** RENDER *****/
  return (
    <div style={styles.container}>
      <TileContext.Provider value={contextValues}>
        {tiles.map(({ tiles: group, identifier: groupID }) => (
          <InjectElementIntoJSX {...generateGroupInjectionProps(group, groupID)}>
            <div ref={registerGroup(groupID)} key={groupID} style={styles.TileGroup}>
              {group.map(({ identifier, style }) => (
                <InjectElementIntoJSX {...generateTileInjectionProps({ identifier })}>
                  <Tile
                    key={identifier}
                    identifier={identifier}
                    ref={registerTile(groupID, identifier)}
                    style={style}
                  />
                </InjectElementIntoJSX>
              ))}
            </div>
          </InjectElementIntoJSX>
        ))}
      </TileContext.Provider>
    </div>
  );
}

export default App
