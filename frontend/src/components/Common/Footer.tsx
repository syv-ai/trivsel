import { Heart } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t py-4 px-6">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-muted-foreground text-sm flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-primary" />
          TrivselsTracker - {currentYear}
        </p>
        <p className="text-muted-foreground text-xs">
          Et digitalt trivselsværktøj til TAMU
        </p>
      </div>
    </footer>
  )
}
