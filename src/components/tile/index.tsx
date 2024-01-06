import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {  useTileContext } from "../../App";
import { useDraggable, useTileDraggableCallbacks } from "./hooks";
import { useScrollOffsetEffect } from "../../hooks/useScrollEffect";

type TTile = React.FC<{
  registerRef: (tile: React.RefObject<HTMLDivElement>) => void,
  identifier: string,
}>

export const Tile: TTile = ({ registerRef, identifier }) => {
  const tileRef = useRef<HTMLDivElement>(null);

  const tile = useMemo(() => ({
    ref: tileRef,
    identifier,
  }), [tileRef, identifier]);

  const { tiles } = useTileContext();
  const [ color ] = useState(() => `#${Math.floor(Math.random()*16777215).toString(16)}`);
  const { onDragComplete, onMouseMove, onScroll } = useTileDraggableCallbacks({ tile, color });
  const { isDragging, ref: dragRef } = useDraggable(tileRef, { onDragComplete }, [tiles]);

  useScrollOffsetEffect(onScroll(isDragging), [isDragging])

  /***** EFFECTS *****/
  useEffect(() => registerRef(tileRef), [])

  // register mouse move event
  useEffect(() => {
    if (!isDragging) return;
    const callback = onMouseMove(dragRef.current);

    tileRef.current?.addEventListener('mousemove', callback);

    return () => tileRef.current?.removeEventListener('mousemove', callback);
  }, [tiles, onMouseMove, isDragging]);

  const baseStyle: React.CSSProperties = useMemo(() => ({
    height: Math.min(Math.max(Math.round(Math.random() * 300), 60), 300) + 'px',
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
      <div style={style} ref={tileRef}>{identifier}</div>
      {isDragging && <div style={{ ...style, position: 'relative', zIndex: undefined, backgroundColor: undefined }}/>}
    </Fragment>
  )
}