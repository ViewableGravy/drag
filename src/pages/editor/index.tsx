import React, { useCallback, useState } from "react";
import { TileHelpers, findByIdentifier, getEnhancedTile, getRearrangedTiles, getTileInformation } from "../../components/tile/helpers";
import { N_Editor } from "./types";
import { _helpers } from "./helpers";
import { TileContext } from "./context";
import { InjectElementIntoJSX } from "../../components/InjectElementIntoJSX";
import { Tile } from "../../components/tile";
import './_Editor.scss';

export const Editor = () => {
  /***** STATE *****/
  const [estimationInformation, setEstimationInformation] = useState<N_Editor.TEstimationInformation>({
    group: null,
    direction: null,
    placementStrategy: null,
  });
  const [groups, setGroups] = useState<Array<TileHelpers.TTileGroup>>(_helpers.generateXEmptyTiles(20));

  /***** FUNCTIONS *****/
  const registerTile = useCallback<N_Editor.TUpdateTileInformation>((groupID, tileID) => (tile) => {
    const group = findByIdentifier(groups, groupID);

    if (!group) return;

    const tileObject = findByIdentifier(group.tiles, tileID);

    if (!tileObject || !tileObject.ref || !tile) return;

    tileObject.ref.current = tile;
  }, [groups]);

  const registerGroup = useCallback<N_Editor.TUpdateGroupInformation>((groupID) => (group) => {
    const groupObject = findByIdentifier(groups, groupID);

    if (!groupObject || !groupObject.ref || !group) return;

    groupObject.ref.current = group;
  }, [groups]);

  const handleTileDrop = useCallback<N_Editor.TCompleteTileDrag>(({ identifier, offset }) => {
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
  }, [groups]);

  const handleTileMove = useCallback<N_Editor.handleTileMove>((tileIdentifier, offset) => {
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
    element: <div className={classes.horizontalLine} />
  })

  const generateTileInjectionProps = (tile: { identifier: string }) => ({
    start: estimationInformation.placementStrategy === 'inline' && tile.identifier === estimationInformation.closestTile?.identifier && estimationInformation.direction === 'left',
    end: estimationInformation.placementStrategy === 'inline' && tile.identifier === estimationInformation.closestTile?.identifier && estimationInformation.direction === 'right',
    key: `${tile.identifier}-InjectElementIntoJSX`,
    element: <div className={classes.verticalLine} />
  })

  const classes = React.useMemo(() => ({
    container: 'editor__container',
    horizontalLine: 'editor__horizontalLine',
    verticalLine: 'editor__verticalLine',
    tileGroup: 'editor__tileGroup'
  }), []);

  const contextValues = {
    tiles: groups,
    handleTileDrop,
    handleTileMove
  }

  /***** RENDER *****/
  return (
    <div className={classes.container}>
      <TileContext.Provider value={contextValues}>
        {groups.map(({ tiles, identifier: groupID }) => (
          <InjectElementIntoJSX {...generateGroupInjectionProps(groupID)}>
            <div ref={registerGroup(groupID)} key={groupID} className={classes.tileGroup}>
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

