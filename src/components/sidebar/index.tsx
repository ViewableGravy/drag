import React, { useCallback, useEffect, useState } from "react";
import './_Sidebar.scss'
import classNames from "classnames";
import { useDelay } from "../../hooks/useDelay";
import { SidebarItem } from "./item";
import { SidebarContext } from "./context";

type TSidebarProps = {
    children: React.ReactNode,
}

const _Sidebar = ({ children }: TSidebarProps) => {
    /***** STATE *****/
    const [activeOptions, setActiveOptions] = useState<string[]>([]);
    const [isHovered, setIsHovered] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);
    const { initiate, clear } = useDelay(() => setIsOpen(false), 500, activeOptions.length > 0);

    const toggleOption = useCallback((identifier: string, active?: boolean) => {
        if (active && !activeOptions.includes(identifier)) {
            setActiveOptions([...activeOptions, identifier]);
        } 
        if (!active && activeOptions.includes(identifier)) {
            setActiveOptions(activeOptions.filter((option) => option !== identifier));
        }
    }, [activeOptions]);

    /***** EFFECTS *****/
    useEffect(() => {
      // close sidebar if no options are active and the sidebar is not hovered
      if (activeOptions.length === 0 && !isHovered) {
        initiate();
      }
    }, [activeOptions, initiate, isHovered])

    /***** RENDER HELPERS *****/
    const classes = {
        Sidebar: classNames('Sidebar', {
            'Sidebar--hovered': isOpen || activeOptions.length > 0,
        })
    }

    const context = {
      activeOptions,
      toggleOption,
    }
  
    /***** RENDER *****/
    return (
      <SidebarContext.Provider value={context}>
        <div 
          className={classes.Sidebar}
          onMouseEnter={() => {
            setIsHovered(true);
            setIsOpen(true);
            clear();
          }}
          onMouseLeave={() => { setIsHovered(false); initiate() }}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  }

export const Sidebar = Object.assign(_Sidebar, {
    Item: SidebarItem,
})
