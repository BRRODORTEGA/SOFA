export function FormShell({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">{title}</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">{children}</div>
        {actions && <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-6">{actions}</div>}
      </div>
    </div>
  );
}




