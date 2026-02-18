export default function LoadingAdd() {
  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="h-8 w-40 bg-muted animate-pulse rounded mb-6" />
        <div className="text-center mb-8">
          <div className="h-8 w-64 bg-muted animate-pulse rounded mx-auto mb-2" />
          <div className="h-4 w-80 bg-muted animate-pulse rounded mx-auto" />
        </div>
        <div className="bg-white border rounded-2xl shadow-sm p-6">
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <section key={i} className="p-6 rounded-xl border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                  <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, j) => (
                    <div key={j}>
                      <div className="h-4 w-40 bg-muted animate-pulse rounded mb-2" />
                      <div className="h-12 w-full bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              </section>
            ))}
            <div className="flex justify-end">
              <div className="h-10 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
