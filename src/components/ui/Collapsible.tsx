import { useState, useEffect } from 'react';

interface CollapsibleProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  className?: string;
}

export function Collapsible({ 
  trigger, 
  children, 
  isOpen: controlledIsOpen, 
  onToggle, 
  className = '' 
}: CollapsibleProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  const handleToggle = () => {
    const newState = !isOpen;
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(newState);
    }
    onToggle?.(newState);
  };

  // Clone trigger element to add onClick handler
  const triggerWithHandler = typeof trigger === 'string' ? (
    <button onClick={handleToggle} className="w-full text-left">
      {trigger}
    </button>
  ) : (
    <div onClick={handleToggle} className="cursor-pointer">
      {trigger}
    </div>
  );

  return (
    <div className={className}>
      {triggerWithHandler}
      
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={isOpen ? 'visible' : 'invisible'}>
          {children}
        </div>
      </div>
    </div>
  );
}