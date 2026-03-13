import { LucideIcon } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function Placeholder({ title, description, icon: Icon }: PlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
        {title}
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        {description}
      </p>
      <div className="p-4 bg-primary/10 rounded-lg text-primary text-sm font-medium border border-primary/20">
        You can continue prompting to build this page out next!
      </div>
    </div>
  );
}
