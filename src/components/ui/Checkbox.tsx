import { forwardRef } from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string | undefined;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, description, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              type="checkbox"
              className={`
                w-4 h-4 text-blue-600 border-gray-300 rounded
                focus:ring-blue-500 focus:ring-2
                disabled:bg-gray-50 disabled:cursor-not-allowed
                ${error ? 'border-red-300 focus:ring-red-500' : ''}
                ${className}
              `}
              {...props}
            />
          </div>
          
          {(label || description) && (
            <div className="ml-3 text-sm">
              {label && (
                <label className="font-medium text-gray-700">
                  {label}
                  {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
              )}
              {description && (
                <p className="text-gray-500 mt-1">{description}</p>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);