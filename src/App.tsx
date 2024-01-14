import React, { useCallback, useEffect, useState } from 'react'
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
}>({
  tiles: [],
  handleTileMove: emptyFunction,
  handleTileDrop: emptyFunction,
});

export const useTileContext = () => React.useContext(TileContext);

export const _helpers = {
  generateUniqueIdentifier: () => Math.random().toString(36).substring(7),
  generateMinHeightWithinRange: (min: number, max: number) => Math.min(Math.max(Math.round(Math.random() * max), min), max),
  generateRandomColor: () => `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase()}`,
  generateXEmptyTiles: (x: number): Array<TileHelpers.TTileGroup> => {
    return Array(x).fill(null).map(() => ({
      name: 'group',
      identifier: _helpers.generateUniqueIdentifier(),
      ref: { current: undefined } satisfies React.MutableRefObject<HTMLDivElement | undefined>,
      tiles: [{
        name: 'tile',
        ref:  { current: undefined } satisfies React.MutableRefObject<HTMLDivElement | undefined>,
        identifier: _helpers.generateUniqueIdentifier(),
        style: {
          minHeight: _helpers.generateMinHeightWithinRange(60, 300) + 'px',
          backgroundColor: _helpers.generateRandomColor()
        } satisfies React.CSSProperties,
      }]
      
    }) satisfies TileHelpers.TTileGroup); 
  }
}

type TEstimationInformation = {
  group: TileHelpers.TTileGroup | null,
  direction: 'left' | 'right' | 'top' | 'bottom' | null,
  closestTile?: TileHelpers.TTileObject,
  placementStrategy: 'block' | 'inline' | null,
}

function App() {
  /***** STATE *****/
  const [estimationInformation, setEstimationInformation] = useState<TEstimationInformation>({
    group: null,
    direction: null,
    placementStrategy: null,
  });
  const [groups, setGroups] = useState<Array<TileHelpers.TTileGroup>>(_helpers.generateXEmptyTiles(20));

  /***** FUNCTIONS *****/
  const registerTile = useCallback<TUpdateTileInformation>((groupID, tileID) => (tile) => {
    const group = findByIdentifier(groups, groupID);

    if (!group) return;

    const tileObject = findByIdentifier(group.tiles, tileID);

    if (!tileObject || !tileObject.ref || !tile) return;

    tileObject.ref.current = tile;
  }, [groups]);

  const registerGroup = useCallback<TUpdateGroupInformation>((groupID) => (group) => {
    const groupObject = findByIdentifier(groups, groupID);

    if (!groupObject || !groupObject.ref || !group) return;

    groupObject.ref.current = group;
  }, [groups]);

  const handleTileDrop: TCompleteTileDrag = ({ identifier, offset }) => {
    const rearranged = getRearrangedTiles({ 
      tile: getEnhancedTile({ tiles: groups, identifier, offset }), 
      tiles: groups
    });

    setGroups(rearranged);
    setEstimationInformation({
      group: null,
      direction: null,
      placementStrategy: null,
    });
  }

  const handleTileMove = useCallback<handleTileMove>((tileIdentifier, offset) => {
    const tile = getEnhancedTile({
      tiles: groups,
      identifier: tileIdentifier,
      offset,
    });

    if (!tile) return;

    const tileInformation = getTileInformation({ tiles: groups, tile })

    if (!tileInformation) return;

    setEstimationInformation(tileInformation);
  }, [groups])

  /***** GENERATORS *****/
  const generateGroupInjectionProps = (id: string) => ({
    start: estimationInformation.placementStrategy === 'block' && id === estimationInformation.group?.identifier && estimationInformation.direction === 'top',
    end: estimationInformation.placementStrategy === 'block' && id === estimationInformation.group?.identifier && estimationInformation.direction === 'bottom',
    key: `${id}-InjectElementIntoJSX`,
    element: <div style={styles.horizontalLine} />
  })

  const generateTileInjectionProps = (tile: { identifier: string }) => ({
    start: estimationInformation.placementStrategy === 'inline' && tile.identifier === estimationInformation.closestTile?.identifier && estimationInformation.direction === 'left',
    end: estimationInformation.placementStrategy === 'inline' && tile.identifier === estimationInformation.closestTile?.identifier && estimationInformation.direction === 'right',
    key: `${tile.identifier}-InjectElementIntoJSX`,
    element: <div style={styles.verticalLine} />
  })

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
    tiles: groups,
    handleTileDrop,
    handleTileMove
  }

  /***** RENDER *****/
  return (
    <div style={styles.container}>
      <TileContext.Provider value={contextValues}>
        {groups.map(({ tiles, identifier: groupID }) => (
          <InjectElementIntoJSX {...generateGroupInjectionProps(groupID)}>
            <div ref={registerGroup(groupID)} key={groupID} style={styles.TileGroup}>
              {tiles.map(({ identifier, style }) => (
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
