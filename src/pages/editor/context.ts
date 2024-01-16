import React from "react";
import { TileHelpers } from "../../components/tile/helpers";
import { _helpers } from "./helpers";
import { N_Editor } from "./types";

export const TileContext = React.createContext<{
  tiles: Array<TileHelpers.TTileGroup>,
  handleTileMove: (identifier: string, offset: { x: number, y: number }) => void,
  handleTileDrop: N_Editor.TCompleteTileDrag,
}>({
  tiles: [],
  handleTileMove: _helpers.emptyFunction,
  handleTileDrop: _helpers.emptyFunction,
});

export const useTileContext = () => React.useContext(TileContext);