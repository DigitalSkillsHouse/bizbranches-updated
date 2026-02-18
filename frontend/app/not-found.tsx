import { Suspense } from "react"
import NotFoundContent from "./NotFoundContent"

export default function NotFoundPage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-muted-foreground">Loading...</p>}>
      <NotFoundContent />
    </Suspense>
  )
}
