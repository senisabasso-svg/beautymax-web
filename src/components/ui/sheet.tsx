"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;

export function SheetContent({
  side = "right",
  className,
  children,
  title = "Panel",
  description,
  hideTitle = false,
}: {
  side?: "left" | "right" | "bottom";
  className?: string;
  children: React.ReactNode;
  title?: string;
  description?: string;
  hideTitle?: boolean;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-fadeUp" />
      <Dialog.Content
        className={cn(
          "fixed z-50 bg-cream text-ink shadow-soft focus:outline-none",
          side === "right" && "inset-y-0 right-0 h-full w-[min(100%,440px)] border-l border-gold/40",
          side === "left" && "inset-y-0 left-0 h-full w-[min(100%,360px)] border-r border-gold/40",
          side === "bottom" && "inset-x-0 bottom-0 max-h-[88vh] w-full rounded-t-2xl border-t border-gold/40",
          className,
        )}
      >
        <Dialog.Title className={hideTitle ? "sr-only" : "sr-only"}>{title}</Dialog.Title>
        {description ? (
          <Dialog.Description className="sr-only">{description}</Dialog.Description>
        ) : (
          <Dialog.Description className="sr-only">{title}</Dialog.Description>
        )}
        {children}
        <Dialog.Close className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-btn text-current hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
          <X className="h-5 w-5" strokeWidth={1.25} />
          <span className="sr-only">Cerrar</span>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
