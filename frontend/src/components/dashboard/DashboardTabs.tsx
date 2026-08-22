"use client"

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: number
}

interface DashboardTabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}

export function DashboardTabs({ tabs, active, onChange }: DashboardTabsProps) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-tf-border mb-8 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-3 font-sans text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold focus-visible:ring-offset-2 ${
            active === tab.id
              ? "border-tf-black text-tf-black"
              : "border-transparent text-tf-text-muted hover:text-tf-text"
          }`}
        >
          {tab.icon && <span className="shrink-0">{tab.icon}</span>}
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-tf-black text-white font-bold text-[10px] flex items-center justify-center">
              {tab.badge > 99 ? "99+" : tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
