import React, { Fragment, useEffect, useMemo } from "react";
import { useDraggable, useTileDraggableCallbacks } from "./hooks";
import { useScrollOffsetEffect } from "../../hooks/useScrollEffect";
import { useTileContext } from "../../pages/editor/context";
import classNames from "classnames";

import './_Tile.scss';

type TTileProps = {
  identifier: string,
  style?: React.CSSProperties,
  className?: string,
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

export const Tile = React.forwardRef<HTMLDivElement, TTileProps>(({ identifier, style, className }: TTileProps, _tileRef) => {
  /***** STATE *****/
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

  /***** RENDER *****/
  const classes = useMemo(() => ({
    tile: classNames('tile', {
      className,
      'tile--dragging': isDragging,
    }),
    staticTile: classNames('tile', 'tile__static', className),
  }), [className, isDragging]);

  return (
    <Fragment>
      <div className={classes.tile} style={style} ref={tileRef}>{identifier}</div>
      {isDragging && <div className={classes.staticTile} style={{ ...style, backgroundColor: "transparent" }} />}
    </Fragment>
  )
});