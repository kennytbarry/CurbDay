export default function Loading() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Loading CurbDay…</span>
      <div aria-hidden="true" className="cw-skeleton h-10 w-48" />
      <div aria-hidden="true" className="cw-skeleton h-14" />
      <div aria-hidden="true" className="cw-skeleton h-72" />
    </div>
  );
}
