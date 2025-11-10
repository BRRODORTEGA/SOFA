export function FormShell({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{title}</h1>
      <div className="rounded border bg-white p-4 shadow-sm">
        <div className="space-y-3">{children}</div>
        {actions && <div className="mt-4 flex items-center justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}




