import { cn } from "@/lib/utils";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileSidebar } from "./MobileSidebar";

export interface SidebarProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}

export const Sidebar = ({ children, open, setOpen, animate }: SidebarProps) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarContent = (props: React.ComponentProps<typeof DesktopSidebar>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.HTMLAttributes<HTMLDivElement>)} />
    </>
  );
};

export const SidebarHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { open } = useSidebar();
  return (
    <div
      className={cn("flex items-center justify-between mb-4", className)}
      {...props}
    />
  );
};

export const SidebarMenu = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("space-y-2", className)} {...props} />;
};

export const SidebarMenuItem = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("", className)} {...props} />;
};

export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const SidebarMenuButton = ({
  className,
  asChild,
  ...props
}: SidebarMenuButtonProps) => {
  if (asChild) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors",
          className
        )}
        {...props}
      />
    );
  }

  return (
    <button
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors",
        className
      )}
      {...props}
    />
  );
};

export { useSidebar };