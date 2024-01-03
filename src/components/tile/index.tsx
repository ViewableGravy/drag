import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {  useTileContext } from "../../App";
import { useDraggable, useTileDraggableCallbacks } from "./hooks";

type TTile = React.FC<{
  registerRef: (tile: React.RefObject<HTMLDivElement>) => void,
  identifier: string,
}>

export const Tile: TTile = ({ registerRef, identifier }) => {
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

  const baseStyle: React.CSSProperties = useMemo(() => ({
    height: Math.min(Math.max(Math.random() * 300, 60), 300) + 'px',
    width: '90vw',
    marginBlock: 10,
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