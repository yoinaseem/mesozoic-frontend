"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="bg-base min-h-screen pt-[72px]">
      <section className="pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <p className="text-red-500 mb-6">Failed to load hotel details.</p>
              <button onClick={reset} className="btn-accent px-6 py-2">
                Try again
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
