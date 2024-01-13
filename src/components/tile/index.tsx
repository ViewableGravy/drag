import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {  useTileContext } from "../../App";
import { useDraggable, useTileDraggableCallbacks } from "./hooks";
import { useScrollOffsetEffect } from "../../hooks/useScrollEffect";

type TTileProps = {
  // registerRef: (tile: React.RefObject<HTMLDivElement>) => void,
  identifier: string,
  style?: React.CSSProperties,
}

const useForwardedRef = <T,>(ref: React.ForwardedRef<T>) => {
  const innerRef = React.useRef<T>(null);

  React.useEffect(() => {
      if (!ref) return;
      if (typeof ref === 'function') {
          ref(innerRef.current);
      } else {
          ref.current = innerRef.current;
      }
  });

  return innerRef;
}

export const Tile = React.forwardRef<HTMLDivElement, TTileProps>(({ identifier, style }: TTileProps, _tileRef) => {
  const tileRef = useForwardedRef(_tileRef);

  const tile = useMemo(() => ({
    ref: tileRef,
    identifier,
  }), [tileRef, identifier]);

  const { tiles } = useTileContext();
  const { onDragComplete, onMouseMove, onScroll } = useTileDraggableCallbacks({ tile, color: style?.backgroundColor ?? '' });
  const { isDragging, ref: dragRef } = useDraggable(tileRef, { onDragComplete }, [tiles]);

  useScrollOffsetEffect(onScroll(isDragging), [isDragging])

  /***** EFFECTS *****/
  // register mouse move event
  useEffect(() => {
    if (!isDragging) return;
    const callback = onMouseMove(dragRef.current);

    tileRef.current?.addEventListener('mousemove', callback);

    return () => tileRef.current?.removeEventListener('mousemove', callback);
  }, [tiles, onMouseMove, isDragging]);

  const baseStyle: React.CSSProperties = useMemo(() => ({
    width: '100%',
    marginBlock: 10,
    backgroundColor: 'white',
    color: 'black',
    userSelect: 'none',
    ...style,
    ...(isDragging && { opacity: 0.5  })
  }), [style, isDragging])

  const _style: React.CSSProperties = {
    ...baseStyle,
    position: isDragging ? 'absolute' : 'relative',
    zIndex: isDragging ? 1 : undefined,
  }

  return (
    <Fragment>
      <div style={_style} ref={tileRef}>{identifier}</div>
      {isDragging && <div style={{ ..._style, position: 'relative', zIndex: undefined, backgroundColor: undefined }}/>}
    </Fragment>
  )
});