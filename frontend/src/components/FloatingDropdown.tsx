import React, { useState, useEffect, useRef } from 'react';

interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  color?: string;
}

interface FloatingDropdownProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  options: DropdownOption[];
  value: string | string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  multiple?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

const FloatingDropdown: React.FC<FloatingDropdownProps> = ({
  id,
  name,
  label,
  placeholder = '',
  options,
  value,
  onChange,
  multiple = false,
  required = false,
  error,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    Array.isArray(value) ? value : value ? [value] : []
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update selectedOptions when value prop changes
  useEffect(() => {
    setSelectedOptions(Array.isArray(value) ? value : value ? [value] : []);
  }, [value]);

  const handleOptionClick = (optionValue: string) => {
    let newSelectedOptions: string[];

    if (multiple) {
      if (selectedOptions.includes(optionValue)) {
        newSelectedOptions = selectedOptions.filter((value) => value !== optionValue);
      } else {
        newSelectedOptions = [...selectedOptions, optionValue];
      }
    } else {
      newSelectedOptions = [optionValue];
      setIsOpen(false);
    }

    setSelectedOptions(newSelectedOptions);

    if (selectRef.current) {
      // Update the underlying select element
      const select = selectRef.current;
      for (let i = 0; i < select.options.length; i++) {
        select.options[i].selected = newSelectedOptions.includes(select.options[i].value);
      }

      // Create and dispatch a change event
      const event = new Event('change', { bubbles: true });
      select.dispatchEvent(event);
    }
  };

  const getDisplayText = () => {
    if (selectedOptions.length === 0) return '';

    if (multiple) {
      if (selectedOptions.length === 1) {
        const option = options.find(opt => opt.value === selectedOptions[0]);
        return option ? option.label : '';
      }
      return `${selectedOptions.length} items selected`;
    } else {
      const option = options.find(opt => opt.value === selectedOptions[0]);
      return option ? option.label : '';
    }
  };

  return (
    <div className="w-full mb-4">
      <div 
        ref={dropdownRef} 
        className={`relative ${className}`}
      >
        {/* Hidden native select for form submission */}
        <select
          ref={selectRef}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          multiple={multiple}
          required={required}
          className="absolute opacity-0 w-px h-px overflow-hidden"
          aria-hidden="true"
          tabIndex={-1}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom dropdown UI */}
        <div className="relative w-full mt-5">
          <div 
            onClick={() => setIsOpen(!isOpen)} 
            className={`block w-full py-3 px-3 border-0 border-b ${isOpen ? 'border-emerald-500' : 'border-gray-300 dark:border-gray-700'} 
              bg-transparent cursor-pointer text-gray-900 dark:text-white pt-6 pb-2`}
          >
            <span className="block text-base truncate">{getDisplayText()}</span>

            <span className={`absolute left-3 transition-all pointer-events-none
              ${selectedOptions.length > 0 || isOpen ? 'top-2 text-xs text-emerald-600 dark:text-emerald-400' : 'top-3 text-gray-500'}`}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </span>
            
            <span className="absolute right-3 top-4 text-gray-400">
              <svg className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`} 
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          
          <ul className={`absolute w-full z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
            rounded-b shadow-lg max-h-60 overflow-y-auto transition-all duration-200 ease-in-out 
            ${isOpen ? 'opacity-100 mt-0' : 'opacity-0 mt-1 pointer-events-none'}`}>
            {options.map((option, index) => (
              <li 
                key={option.value}
                className={`px-3 py-2.5 text-base text-gray-700 dark:text-gray-300 text-left cursor-pointer 
                  hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                  ${selectedOptions.includes(option.value) ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}
                  ${index !== options.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
                onClick={() => handleOptionClick(option.value)}
              >
                <div className="flex items-center">
                  {multiple && (
                    <span className={`inline-flex mr-2 h-4 w-4 border rounded items-center justify-center flex-shrink-0 
                      ${selectedOptions.includes(option.value) 
                        ? 'bg-emerald-500 border-emerald-500' 
                        : 'border-gray-300 dark:border-gray-600'}`}>
                      {selectedOptions.includes(option.value) && (
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </span>
                  )}
                  <span className={selectedOptions.includes(option.value) 
                    ? 'text-emerald-700 dark:text-emerald-400 font-medium' 
                    : ''
                  }>{option.label}</span>
                  {option.description && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{option.description}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Background highlight effect */}
        <div className={`absolute inset-0 bg-emerald-50/10 -z-10 scale-x-0 origin-left
          transition-transform duration-300 ease-in-out ${isOpen ? 'scale-x-100' : ''}`}>
        </div>
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-500 animate-fade-in">{error}</p>
      )}
    </div>
  );
};

export default FloatingDropdown; 