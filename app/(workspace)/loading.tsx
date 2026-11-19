export default function WorkspaceLoading() {
  return (
    <div aria-hidden="true" className="space-y-6 p-6">
      <div className="h-7 w-56 rounded bg-hospital-surface-muted" />
      <div className="h-4 w-96 max-w-full rounded bg-hospital-surface-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-24 rounded-md border border-hospital-border bg-white" />
        <div className="h-24 rounded-md border border-hospital-border bg-white" />
        <div className="h-24 rounded-md border border-hospital-border bg-white" />
        <div className="h-24 rounded-md border border-hospital-border bg-white" />
      </div>
      <div className="h-64 rounded-md border border-hospital-border bg-white" />
    </div>
  );
}
