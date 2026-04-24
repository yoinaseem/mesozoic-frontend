export default function Loading() {
  return (
    <div className="bg-base min-h-full">
      <section className="pt-28 pb-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h1 className="text-5xl font-bold text-primary">Accommodation</h1>
        </div>
      </section>

      <section className="border-t border-base py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted">Loading room types...</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
