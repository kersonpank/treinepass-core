import React, { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarItemProps extends React.HTMLAttributes<HTMLAnchorElement | HTMLButtonElement> {
  href?: string;
  icon?: React.ReactNode;
  text: string;
  isCollapsed?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

const SidebarItem = forwardRef<HTMLAnchorElement | HTMLButtonElement, SidebarItemProps>(
  ({ href, icon, text, isCollapsed, isActive, className, onClick, ...props }, ref) => {
    const content = (
      <>
        {icon && <span className="w-6 h-6">{icon}</span>}
        {!isCollapsed && <span>{text}</span>}
      </>
    );

    const classes = cn(
      "flex items-center gap-4 px-3 py-2 rounded-lg hover:bg-accent transition-colors",
      isActive && "bg-accent",
      className
    );

    if (href) {
      return (
        <Link
          to={href}
          className={classes}
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...props}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        className={classes}
        onClick={onClick}
        ref={ref as React.Ref<HTMLButtonElement>}
        {...props}
      >
        {content}
      </button>
    );
  }
);

SidebarItem.displayName = "SidebarItem";

export { SidebarItem };