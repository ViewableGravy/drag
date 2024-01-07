import React, { useEffect, useRef, useState } from "react";
import { useTileContext } from "../../App";
import { useScrollOffsetEffect } from "../../hooks/useScrollEffect";

export type TDragstate = {
  offset: {
    x: number,
    y: number,
  },
  scrollOffset: {
    x: number,
    y: number,
  },
  mouseOffset: {
    clientX: number,
    clientY: number,
  },
  isDragging: boolean,
  initialInformation: {
    offsetHeight: number,
    offsetWidth: number,
  },
};

export const useTileDraggableCallbacks = ({ tile, color } : { 
  color: string, 
  tile: {
    identifier: string, ref: React.RefObject<HTMLDivElement>
  }
}) => {
  const { handleTileDrop, handleTileMove } = useTileContext();
  const { ref } = tile;

  const onMouseMove = ({ isDragging }: TDragstate) => (_: Event) => {
    if (!isDragging) return;
    if (!ref.current) return;

    handleTileMove(tile.identifier, {
      x: parseInt(ref.current.style.left),
      y: parseInt(ref.current.style.top),
    });
  }

  const onScroll = (isDragging: boolean) => () => {
    if (!isDragging) return;
    if (!ref.current) return;

    handleTileMove(tile.identifier, {
      x: parseInt(ref.current.style.left),
      y: parseInt(ref.current.style.top),
    });
  }
  
  const onDragComplete = () => {
    //reorder tiles to match current position    
    handleTileDrop({
      identifier: tile.identifier,
      offset: {
        x: parseInt(ref.current!.style.left),
        y: parseInt(ref.current!.style.top),
      }
    });

    //reset element
    ref.current!.style.left = '';
    ref.current!.style.top = '';
    ref.current!.style.backgroundColor = color;
  }
   
  return {
    onMouseMove,
    onDragComplete,
    onScroll
  }
}

const capitalize = <T extends string>(str: T): Capitalize<T> => str.charAt(0).toUpperCase() + str.slice(1) as Capitalize<T>;

const margin = (ref: React.RefObject<HTMLDivElement>, side: 'top' | 'left' | 'right' | 'bottom' | 'inline' | 'block') => {
  const margin = ref.current?.style[`margin${capitalize(side)}`];
  if (!margin) return 0;

  return Number(margin.substring(0, margin.length - 2))
}



type TUseDraggable = (ref: React.RefObject<HTMLDivElement>, callbacks: {
  onDragComplete?: (state: TDragstate) => void,
}, dependencies: any[]) => {
  isDragging: boolean,
  ref: React.MutableRefObject<TDragstate>
}

export const useDraggable: TUseDraggable = (ref, { onDragComplete }, dependencies) => {
  /***** STATE *****/
  const dragState = useRef<TDragstate>({
    offset: { x: 0, y: 0 },
    scrollOffset: { x: 0, y: 0 },
    mouseOffset: { clientX: 0, clientY: 0 },
    isDragging: false,
    initialInformation: {
      offsetHeight: 0,
      offsetWidth: 0,
    },
  });
  const [isDragging, setIsDragging] = useState(dragState.current.isDragging)

  const handleUpdatePosition = () => {
    const { offset, mouseOffset, scrollOffset } = dragState.current;
    const node = ref.current;

    if (!dragState.current.isDragging) return;
    if (!node) return;

    node.style.left = `${mouseOffset.clientX - offset.x + scrollOffset.x}px`
    node.style.top = `${mouseOffset.clientY - offset.y + scrollOffset.y}px`
    node.style.height = `${dragState.current.initialInformation.offsetHeight}px`
    node.style.width = `${dragState.current.initialInformation.offsetWidth}px`
  }

  const handleMouseDown = (event: MouseEvent) => {
    if (!ref.current) return;

    dragState.current = {
      ...dragState,
      isDragging: true,
      offset: {
        x: event.clientX - (ref.current?.offsetLeft || 0) + margin(ref, 'left'),
        y: event.clientY - (ref.current?.offsetTop || 0) + margin(ref, 'block'),
      },
      mouseOffset: {
        clientX: event.clientX,
        clientY: event.clientY,
      },
      scrollOffset: {
        x: 0,
        y: 0,
      },
      initialInformation: {
        offsetHeight: ref.current?.offsetHeight,
        offsetWidth: ref.current?.offsetWidth,
      }
    }

    handleUpdatePosition();

    setIsDragging(dragState.current.isDragging)
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (!dragState.current.isDragging) return;

    dragState.current.mouseOffset = {
      clientX: event.clientX,
      clientY: event.clientY,
    }

    event.preventDefault()

    handleUpdatePosition();
  }

  const handleMouseUp = () => {
    if (!dragState.current.isDragging) return;
    if (!ref.current) return;
    
    onDragComplete?.(dragState.current)

    dragState.current = {
      ...dragState.current,
      isDragging: false,
    }
    setIsDragging(dragState.current.isDragging)
  }

  useScrollOffsetEffect(({ offset }) => {
    dragState.current.scrollOffset = offset
    handleUpdatePosition();
  }, [isDragging, ...dependencies]);

  useEffect(() => {
    const node = ref.current
    if (node) {
      node.addEventListener('mousedown', handleMouseDown)
      node.addEventListener('mousemove', handleMouseMove)
      node.addEventListener('mouseup', handleMouseUp)
      node.addEventListener('mouseleave', handleMouseUp)
    }

    return () => {
      if (node) {
        node.removeEventListener('mousedown', handleMouseDown)
        node.removeEventListener('mousemove', handleMouseMove)
        node.removeEventListener('mouseup', handleMouseUp)
        node.removeEventListener('mouseleave', handleMouseUp)
      }
    }
  }, [ref.current, ...dependencies])

  return { 
    isDragging,
    ref: dragState
  }
}