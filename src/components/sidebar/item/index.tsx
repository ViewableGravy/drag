import classNames from "classnames";
import { _helpers } from "../../../pages/editor/helpers";
import { useSidebarContext } from "../context";
import { useEffect } from "react";

type TSidebarItemProps = {
    Icon: React.FC<{ className?: string }>,
    onClick: () => void,
    identifier?: string,
    children?: React.ReactNode,
    active?: boolean,
}

export const SidebarItem: React.FC<TSidebarItemProps> = ({ children, Icon, onClick, active, identifier = _helpers.generateUniqueIdentifier() }) => {
    /***** STATE *****/
    const { toggleOption } = useSidebarContext();

    /***** EFFECTS *****/
    useEffect(() => {
        toggleOption(identifier, active);
    }, [active, toggleOption])

    /***** RENDER *****/
    const classes = {
        SidebarItem: classNames('Sidebar__item', {
            'Sidebar__item--active': active,
        }),
        SidebarItemIcon: 'Sidebar__itemIcon',
    }

    return (
        <button className={classes.SidebarItem} onClick={onClick}>
            <Icon className={classes.SidebarItemIcon} />
            {children}
        </button>
    )
};
