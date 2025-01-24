import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface SidebarMenuProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn("w-64 bg-background border-r", className)}
        {...(props as any)} // Type assertion to handle motion props
      />
    );
  }
);
Sidebar.displayName = "Sidebar";

export const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("border-b", className)}
        {...props}
      />
    );
  }
);
SidebarHeader.displayName = "SidebarHeader";

export const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col", className)}
        {...props}
      />
    );
  }
);
SidebarContent.displayName = "SidebarContent";

export const SidebarMenu = React.forwardRef<HTMLDivElement, SidebarMenuProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-1 p-2", className)}
        {...props}
      />
    );
  }
);
SidebarMenu.displayName = "SidebarMenu";

export const SidebarMenuItem = React.forwardRef<HTMLDivElement, SidebarMenuItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("", className)}
        {...props}
      />
    );
  }
);
SidebarMenuItem.displayName = "SidebarMenuItem";

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, asChild, ...props }, ref) => {
    const Comp = asChild ? "a" : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";