"use client";

import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom sheet (Vaul — same primitive as shadcn/ui Drawer).
 */
export function FeedbackDrawer({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[90] bg-foreground/30" />
        <Drawer.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-[95] flex max-h-[75svh] flex-col rounded-none border-t-[3px] border-foreground bg-background outline-none",
            "brutal-shadow",
          )}
        >
          <Drawer.Handle className="mx-auto mb-2 mt-3 h-1.5 w-14 shrink-0 rounded-full bg-foreground/35" />
          <Drawer.Title className="sr-only">{title}</Drawer.Title>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-6 pt-1">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
