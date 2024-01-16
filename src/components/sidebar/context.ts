import { createContext, useContext } from "react"

export type SidebarContextType = {
    activeOptions: string[];
    toggleOption: (option: string, state?: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
    activeOptions: [],
    toggleOption: () => {}
});
export const useSidebarContext = () => useContext(SidebarContext);