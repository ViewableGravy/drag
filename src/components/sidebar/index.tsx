import React, { useCallback, useState } from "react";
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
    const { initiate, clear } = useDelay(() => setIsHovered(false), 500, activeOptions.length > 0);

    const toggleOption = useCallback((identifier: string, active?: boolean) => {
        if (active && !activeOptions.includes(identifier)) {
            setActiveOptions([...activeOptions, identifier]);
        } 
        if (!active && activeOptions.includes(identifier)) {
            setActiveOptions(activeOptions.filter((option) => option !== identifier));
        }
    }, [activeOptions]);

    /***** RENDER HELPERS *****/
    const classes = {
        Sidebar: classNames('Sidebar', {
            'Sidebar--hovered': isHovered || activeOptions.length > 0,
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
            clear();
          }}
          onMouseLeave={initiate}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  }

export const Sidebar = Object.assign(_Sidebar, {
    Item: SidebarItem,
})
