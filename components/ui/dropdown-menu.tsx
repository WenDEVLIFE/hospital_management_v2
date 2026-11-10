"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}

interface DropdownMenuContextValue {
  closeMenu: () => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  closeMenu: () => {},
});

type TriggerProps = {
  onClick?: (event: React.MouseEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  "aria-haspopup"?: string;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
};

export function DropdownMenu({
  trigger,
  children,
  align = "start",
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  const focusTrigger = React.useCallback(() => {
    containerRef.current
      ?.querySelector<HTMLElement>('[aria-haspopup="menu"]')
      ?.focus();
  }, []);

  const closeMenu = React.useCallback(
    (returnFocus = false) => {
      setOpen(false);
      if (returnFocus) focusTrigger();
    },
    [focusTrigger]
  );

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      const firstItem = menuRef.current?.querySelector<HTMLElement>(
        '[role="menuitem"]'
      );
      firstItem?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.key === "Tab") {
      closeMenu(false);
      return;
    }

    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([disabled])'
      ) ?? []
    );

    if (items.length === 0) return;

    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(currentIndex + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  let renderedTrigger: React.ReactNode;

  if (React.isValidElement(trigger)) {
    const element = trigger as React.ReactElement<TriggerProps>;
    const originalProps = element.props;

    renderedTrigger = React.cloneElement(element, {
      onClick: (event: React.MouseEvent) => {
        originalProps.onClick?.(event);
        if (!event.defaultPrevented) {
          setOpen((value) => !value);
        }
      },
      onKeyDown: (event: React.KeyboardEvent) => {
        originalProps.onKeyDown?.(event);
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setOpen(true);
        }
      },
      "aria-haspopup": "menu",
      "aria-expanded": open,
      "aria-controls": open ? menuId : undefined,
    });
  } else {
    renderedTrigger = (
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center justify-center gap-1.5 rounded-md text-sm text-hospital-text transition-colors hover:bg-hospital-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1 cursor-pointer"
      >
        {trigger}
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {renderedTrigger}
      {open && (
        <DropdownMenuContext.Provider
          value={{ closeMenu: () => closeMenu(true) }}
        >
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-orientation="vertical"
            onKeyDown={handleMenuKeyDown}
            className={cn(
              "absolute z-50 mt-1 min-w-[180px] rounded-md border border-hospital-border bg-white p-1 shadow-lg",
              align === "end" ? "right-0" : "left-0",
              className
            )}
          >
            {children}
          </div>
        </DropdownMenuContext.Provider>
      )}
    </div>
  );
}

export interface DropdownMenuItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  onSelect?: () => void;
  destructive?: boolean;
  icon?: React.ReactNode;
}

export function DropdownMenuItem({
  onSelect,
  destructive = false,
  icon,
  className,
  children,
  onClick,
  disabled,
  type = "button",
  ...props
}: DropdownMenuItemProps) {
  const { closeMenu } = React.useContext(DropdownMenuContext);

  return (
    <button
      type={type}
      role="menuitem"
      tabIndex={-1}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || disabled) return;
        onSelect?.();
        closeMenu();
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors cursor-pointer select-none",
        "focus:outline-none focus:bg-hospital-surface-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-hospital-green",
        "disabled:cursor-not-allowed disabled:opacity-50",
        destructive
          ? "text-red-600 focus:bg-red-50 focus-visible:ring-red-500"
          : "text-hospital-text",
        className
      )}
      {...props}
    >
      {icon && (
        <span className="shrink-0 [&>svg]:size-4" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}

export function DropdownMenuSeparator({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      role="separator"
      className={cn("my-1 h-px bg-hospital-border", className)}
    />
  );
}

export function DropdownMenuLabel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-xs font-semibold text-hospital-text-muted",
        className
      )}
    >
      {children}
    </div>
  );
}
