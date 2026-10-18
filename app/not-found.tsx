import Link from "next/link";

export default function NotFound() {
  return (
    <section className="cw-card p-6 sm:p-8 space-y-4 text-center">
      <h1 className="text-xl font-black tracking-tight text-flip-dark">
        Page not found
      </h1>
      <p className="cw-body max-w-sm mx-auto">
        This CurbDay page doesn&apos;t exist.
      </p>
      <div className="pt-2">
        <Link href="/" className="cw-primary-button">
          Back to CurbDay
        </Link>
      </div>
    </section>
  );
}
