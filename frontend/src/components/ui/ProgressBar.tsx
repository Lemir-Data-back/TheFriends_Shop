interface ProgressBarProps {
  value: number
  color?: string
  trackClassName?: string
}

export function ProgressBar({ value, color = "var(--tf-gold)", trackClassName = "w-full h-1.5" }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className={`bg-tf-gray-soft rounded-full overflow-hidden ${trackClassName}`}>
      <div
        className="h-full rounded-full origin-left transition-transform duration-700 ease-out"
        style={{ transform: `scaleX(${pct / 100})`, backgroundColor: color }}
      />
    </div>
  )
}
