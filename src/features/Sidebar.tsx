"use client";

import Image from "next/image";
import { cn } from "@/src/lib/utils";

interface SidebarProps {
  children?: React.ReactNode;
  className?: string;
}

export default function Sidebar({ children, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "w-80 h-full bg-gradient-to-b from-background to-secondary/20 border-l border-border shadow-lg flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="دادار" width={40} height={40} />
          <div>
            <h1 className="text-xl font-bold text-primary">دادار</h1>
            <p className="text-xs text-muted-foreground">سامانه یافتن حوزه قضایی</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 bg-secondary/30">
        <p className="text-xs text-muted-foreground text-center">
          © ۱۴۰۴ دادار - تمامی حقوق محفوظ است
        </p>
      </div>
    </aside>
  );
}
