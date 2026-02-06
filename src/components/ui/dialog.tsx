"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Context ── */
interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used within <Dialog>");
  return ctx;
}

/* ── Root ── */
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [internal, setInternal] = useState(false);
  const open = controlledOpen ?? internal;
  const setOpen = useCallback(
    (val: boolean) => {
      setInternal(val);
      onOpenChange?.(val);
    },
    [onOpenChange]
  );

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

/* ── Trigger ── */
function DialogTrigger({
  children,
  className,
  asChild,
}: {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}) {
  const { setOpen } = useDialog();
  return (
    <button onClick={() => setOpen(true)} className={className}>
      {children}
    </button>
  );
}

/* ── Overlay + Content ── */
function DialogContent({
  children,
  className,
  title,
  description,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) {
  const { open, setOpen } = useDialog();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300]">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      {/* Content */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          aria-describedby={description ? "dialog-desc" : undefined}
          className={cn(
            "relative w-full max-w-lg rounded-lg bg-navy-900 border border-navy-700 shadow-lg",
            "animate-slide-up p-6",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 left-4 p-1 rounded-md text-navy-400 hover:text-navy-200 hover:bg-navy-800 transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          {(title || description) && (
            <div className="mb-4 pe-8">
              {title && (
                <h2 className="text-lg font-semibold text-navy-50">{title}</h2>
              )}
              {description && (
                <p id="dialog-desc" className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Footer ── */
function DialogFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 mt-6 pt-4 border-t border-navy-700",
        className
      )}
    >
      {children}
    </div>
  );
}

function DialogClose({ children }: { children: ReactNode }) {
  const { setOpen } = useDialog();
  return (
    <span onClick={() => setOpen(false)} className="inline-flex">
      {children}
    </span>
  );
}

export { Dialog, DialogTrigger, DialogContent, DialogFooter, DialogClose };
