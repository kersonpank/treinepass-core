import React, { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// Interfaces
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface SidebarMenuProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode;
}

interface SidebarMenuButtonProps extends React.HTMLAttributes<HTMLAnchorElement | HTMLButtonElement> {
  href?: string;
  asChild?: boolean;
  children: React.ReactNode;
}

// Components
export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("w-64 h-screen bg-background border-r", className)} {...props}>
      {children}
    </div>
  )
);
Sidebar.displayName = "Sidebar";

export const SidebarContent = forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col h-full", className)} {...props}>
      {children}
    </div>
  )
);
SidebarContent.displayName = "SidebarContent";

export const SidebarHeader = forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 border-b", className)} {...props}>
      {children}
    </div>
  )
);
SidebarHeader.displayName = "SidebarHeader";

export const SidebarMenu = forwardRef<HTMLElement, SidebarMenuProps>(
  ({ className, children, ...props }, ref) => (
    <nav ref={ref} className={cn("flex-1", className)} {...props}>
      <ul className="space-y-1 p-2">
        {children}
      </ul>
    </nav>
  )
);
SidebarMenu.displayName = "SidebarMenu";

export const SidebarMenuItem = forwardRef<HTMLLIElement, SidebarMenuItemProps>(
  ({ className, children, ...props }, ref) => (
    <li ref={ref} className={cn("", className)} {...props}>
      {children}
    </li>
  )
);
SidebarMenuItem.displayName = "SidebarMenuItem";

export const SidebarMenuButton = forwardRef<HTMLAnchorElement | HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, children, asChild, href, ...props }, ref) => {
    const Comp = asChild ? 'span' : href ? 'a' : 'button';
    return (
      <Comp
        ref={ref as any}
        className={cn(
          "flex items-center w-full gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground",
          className
        )}
        {...(href ? { href } : {})}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";

// Re-export SidebarItem for backward compatibility
export { SidebarItem } from "./SidebarItem";