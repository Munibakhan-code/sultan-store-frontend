import { Toaster as SonnerToaster, toast } from "sonner";

/** App-wide notification host. Rendered once in the root route. */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "glass-panel !rounded-lg !text-foreground !shadow-panel font-sans !bg-surface-elevated",
          title: "!text-foreground !font-semibold",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
        },
      }}
    />
  );
}

/** Thin wrapper so components don't depend on sonner directly. */
export const notify = {
  success: (message: string, description?: string) => toast.success(message, { description }),
  error: (message: string, description?: string) => toast.error(message, { description }),
  info: (message: string, description?: string) => toast(message, { description }),
};
