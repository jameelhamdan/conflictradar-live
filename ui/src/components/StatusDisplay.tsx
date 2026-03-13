import { cn } from "@/lib/utils"

interface StatusDisplayProps {
  status: "loading" | "error" | "empty"
  message: string
  className?: string
}

export default function StatusDisplay({ status, message, className }: StatusDisplayProps) {
  return (
    <div
      className={cn(
        "py-8 text-center text-[0.85rem]",
        status === "error" ? "text-app-accent-red" : "text-app-text-ghost",
        className,
      )}
    >
      {status === "error" ? `⚠ ${message}` : message}
    </div>
  )
}
