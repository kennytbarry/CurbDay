"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section role="alert" className="cw-card p-6 sm:p-8 space-y-4 text-center">
      <h1 className="text-xl font-black tracking-tight text-flip-dark">
        Something went wrong
      </h1>
      <p className="cw-body max-w-sm mx-auto">
        We couldn&apos;t load this page. Please try again.
      </p>
      <div className="pt-2">
        <button type="button" onClick={reset} className="cw-primary-button">
          Try again
        </button>
      </div>
    </section>
  );
}
