import { Badge } from './Badge';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  showCount?: boolean;
  className?: string;
}

export function Tabs({ 
  tabs, 
  activeTab, 
  onChange, 
  showCount = false,
  className = '' 
}: TabsProps) {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="flex items-center space-x-2">
              <span>{tab.label}</span>
              {showCount && tab.count !== undefined && (
                <Badge
                  variant="outline"
                  size="sm"
                  color={activeTab === tab.id ? 'blue' : 'gray'}
                >
                  {tab.count}
                </Badge>
              )}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}