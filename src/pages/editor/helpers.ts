import { TileHelpers } from "../../components/tile/helpers";

export const _helpers = {
  emptyFunction: () => {},
  generateRef: <T,>(initial?: T) => ({ current: initial ?? undefined } satisfies React.MutableRefObject<T | undefined>),
  generateUniqueIdentifier: () => Math.random().toString(36).substring(7),
  generateMinHeightWithinRange: (min: number, max: number) => Math.min(Math.max(Math.round(Math.random() * max), min), max),
  generateRandomColor: () => `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase()}`,
  generateXEmptyTiles: (x: number): Array<TileHelpers.TTileGroup> => {
    return Array(x).fill(null).map(() => ({
      name: 'group',
      identifier: _helpers.generateUniqueIdentifier(),
      ref: _helpers.generateRef(),
      tiles: [{
        name: 'tile',
        ref:  _helpers.generateRef(),
        identifier: _helpers.generateUniqueIdentifier(),
        style: {
          minHeight: _helpers.generateMinHeightWithinRange(60, 300) + 'px',
          backgroundColor: _helpers.generateRandomColor()
        }
      }]
    }) satisfies TileHelpers.TTileGroup); 
  }
}