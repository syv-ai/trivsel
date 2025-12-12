import { Link } from "@tanstack/react-router"
import { Heart } from "lucide-react"

import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "full" | "icon" | "responsive"
  className?: string
  asLink?: boolean
}

export function Logo({
  variant = "full",
  className,
  asLink = true,
}: LogoProps) {
  const iconContent = (
    <div className={cn("flex items-center justify-center p-1 rounded-lg bg-primary/10", className)}>
      <Heart className="h-5 w-5 text-primary fill-primary/20" />
    </div>
  )

  const fullContent = (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center justify-center p-1.5 rounded-lg bg-primary/10">
        <Heart className="h-5 w-5 text-primary fill-primary/20" />
      </div>
      <span className="font-semibold text-lg tracking-tight">TrivselsTracker</span>
    </div>
  )

  const content =
    variant === "responsive" ? (
      <>
        <div className="group-data-[collapsible=icon]:hidden">{fullContent}</div>
        <div className="hidden group-data-[collapsible=icon]:block">{iconContent}</div>
      </>
    ) : variant === "full" ? (
      fullContent
    ) : (
      iconContent
    )

  if (!asLink) {
    return content
  }

  return <Link to="/">{content}</Link>
}
