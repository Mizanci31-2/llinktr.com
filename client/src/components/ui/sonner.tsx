import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      richColors
      closeButton
      expand
      visibleToasts={5}
      toastOptions={{
        classNames: {
          toast: "llinktr-toast",
          title: "llinktr-toast-title",
          description: "llinktr-toast-description",
          success: "llinktr-toast-success",
          error: "llinktr-toast-error",
          warning: "llinktr-toast-warning",
          info: "llinktr-toast-info",
          actionButton: "llinktr-toast-action",
          cancelButton: "llinktr-toast-cancel",
          closeButton: "llinktr-toast-close",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
