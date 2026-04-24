export default function Loading() {
  return (
    <div className="bg-base min-h-screen pt-[72px]">
      <section className="pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted">Loading hotel details...</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
