import React, { useEffect, useRef, useState } from "react";
import { useTileContext } from "../../App";
import { getOverlappingInformation, getRearrangedTiles } from "./helpers";

export type TDragstate = {
  offset: {
    x: number,
    y: number,
  },
  isDragging: boolean,
}

export const useTileDraggableCallbacks = ({ tile, color } : { 
  color: string, 
  tile: {
    identifier: string, ref: React.RefObject<HTMLDivElement>
  }
}) => {
  const { handleTileDrop, handleTileMove } = useTileContext();
  const { ref } = tile;

  const onMouseMove = (_: Event, { isDragging }: TDragstate) => {
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
  }
}

const capitalize = <T extends string>(str: T): Capitalize<T> => str.charAt(0).toUpperCase() + str.slice(1) as Capitalize<T>;

const margin = (ref: React.RefObject<HTMLDivElement>, side: 'top' | 'left' | 'right' | 'bottom') => {
  const margin = ref.current?.style[`margin${capitalize(side)}`];
  if (!margin) return 0;

  return Number(margin.substring(0, margin.length - 2))
}

export const useDraggable = (ref: React.RefObject<HTMLDivElement>, options: {
  [key in keyof HTMLElementEventMap]?: (event: Event, state: TDragstate) => void
} & {
  onDragComplete?: (state: TDragstate) => void,
}, dependencies: any[]) => {
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef({
    offset: { x: 0, y: 0 },
    isDragging: false,
  })
  const { onDragComplete, ..._options } = options;

  const handleMouseDown = (event: MouseEvent) => {
    dragState.current = {
      isDragging: true,
      offset: {
        x: event.clientX - (ref.current?.offsetLeft || 0) + margin(ref, 'left'),
        y: event.clientY - (ref.current?.offsetTop || 0) + margin(ref, 'top'),
      },
    }

    handleMouseMove(event);

    setIsDragging(dragState.current.isDragging)
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (dragState.current.isDragging) {
      //follow mouse
      const node = ref.current
      if (node) {
        node.style.left = `${event.clientX - dragState.current.offset.x}px`
        node.style.top = `${event.clientY - dragState.current.offset.y}px`
      }

      //prevent text selection
      event.preventDefault()
    }
  }

  const handleMouseUp = (event: MouseEvent) => {
    if (!dragState.current.isDragging) return;
    
    onDragComplete?.(dragState.current)

    dragState.current = {
      ...dragState.current,
      isDragging: false,
    }
    setIsDragging(dragState.current.isDragging)
  }

  useEffect(() => {
    const node = ref.current
    if (node) {
      node.addEventListener('mousedown', handleMouseDown)
      node.addEventListener('mousemove', handleMouseMove)
      node.addEventListener('mouseup', handleMouseUp)
      node.addEventListener('mouseleave', handleMouseUp)

      Object.entries(_options).forEach(([key, value]) => {
        const handler = (event: Event) => {
          value(event, dragState.current)
        }

        node.addEventListener(key, handler)
      });
    }

    return () => {
      if (node) {
        node.removeEventListener('mousedown', handleMouseDown)
        node.removeEventListener('mousemove', handleMouseMove)
        node.removeEventListener('mouseup', handleMouseUp)
        node.removeEventListener('mouseleave', handleMouseUp)

        Object.entries(_options).forEach(([key, value]) => {
          const handler = (event: Event) => {
            value(event, dragState.current)
          }

          node.removeEventListener(key, handler)
        });
      }
    }
  }, [ref.current, ...dependencies])

  return { isDragging, stopDrag: handleMouseUp }
}