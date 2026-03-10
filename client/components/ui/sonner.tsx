import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:data-[y-position=bottom]:data-[x-position=right]:slide-in-from-right-8",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:border-0 group-[.toast]:bg-transparent group-[.toast]:text-muted-foreground group-[.toast]:shadow-none hover:group-[.toast]:bg-transparent hover:group-[.toast]:text-foreground",
          success:
            "group-[.toaster]:bg-[#EAF8EE] group-[.toaster]:text-[#166534] group-[.toaster]:border-[#86EFAC]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
