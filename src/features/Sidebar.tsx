"use client";

interface SidebarProps {
  children?: React.ReactNode;
  className?: string;
}

export default function Sidebar({ children, className }: SidebarProps) {
  return (
    <aside 
      className={`w-80 h-full bg-background border-l border-border p-4 overflow-y-auto ${className ?? ""}`}
    >
      {children}
    </aside>
  );
}
