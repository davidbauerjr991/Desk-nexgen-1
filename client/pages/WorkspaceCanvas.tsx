interface WorkspaceCanvasProps {
  title: string;
}

export default function WorkspaceCanvas({ title }: WorkspaceCanvasProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border px-6 py-5">
        <h1 className="text-[15px] font-semibold tracking-tight text-[#333333]">{title}</h1>
      </div>
      {/* Empty canvas — ready for content */}
      <div className="min-h-0 flex-1" />
    </div>
  );
}
