import type { TileHelpers } from "../../components/tile/helpers";
import type { General } from "../../utilities/types/global";

export namespace N_Editor {
  export type TCompleteTileDrag = (props: {
    identifier: string,
    offset: {
    x: number,
    y: number,
    }
  }) => void;

  export type TUpdateTileInformation = (groupIdentifier: string, tileIdentifier: string) => (tile: HTMLDivElement | null) => void;
  export type TUpdateGroupInformation = (groupIdentifier: string) => (group: HTMLDivElement | null) => void;
  export type handleTileMove = (identifier: string, offset: { x: number, y: number }) => void;
  export type TEstimationInformation = {
    group: TileHelpers.TTileGroup | null,
    direction: General.directions,
    closestTile?: TileHelpers.TTileObject,
    placementStrategy: General.placementStrategy,
  }
}