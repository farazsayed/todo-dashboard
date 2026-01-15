interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  color?: string;
}

export function Breadcrumb({ items, color }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-[12px]" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          {index > 0 && (
            <svg className="w-3 h-3 text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {index === 0 && color && (
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
          )}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-dark-text-muted hover:text-dark-text-primary hover:underline transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-dark-text-secondary font-medium">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
