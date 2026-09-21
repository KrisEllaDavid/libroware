import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Field, Icon, cn } from './ui';

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

/**
 * Custom select, styled to match the rest of the form controls.
 *
 * Same contract as before — a real `<select>` stays in the DOM to carry the
 * value into the form, and the visible list is what the user interacts with.
 * What changed: a bordered box rather than a bottom-rule with a floating
 * caption, a placeholder when nothing is chosen (the control used to render
 * an empty line and look broken), and keyboard support, since a listbox you
 * can only reach with a mouse is not a form control.
 */
const FloatingDropdown: React.FC<FloatingDropdownProps> = ({
  id,
  name,
  label,
  placeholder = 'Select…',
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

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen]);

  // Update selectedOptions when value prop changes
  useEffect(() => {
    setSelectedOptions(Array.isArray(value) ? value : value ? [value] : []);
  }, [value]);

  const handleOptionClick = useCallback(
    (optionValue: string) => {
      let newSelectedOptions: string[];

      if (multiple) {
        if (selectedOptions.includes(optionValue)) {
          newSelectedOptions = selectedOptions.filter((v) => v !== optionValue);
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
          select.options[i].selected = newSelectedOptions.includes(
            select.options[i].value
          );
        }

        // Create and dispatch a change event
        const event = new Event('change', { bubbles: true });
        select.dispatchEvent(event);
      }
    },
    [multiple, selectedOptions]
  );

  const getDisplayText = () => {
    if (selectedOptions.length === 0) return null;

    if (multiple && selectedOptions.length > 1) {
      return `${selectedOptions.length} selected`;
    }

    const option = options.find((opt) => opt.value === selectedOptions[0]);
    return option ? option.label : null;
  };

  const display = getDisplayText();

  return (
    <Field label={label} required={required} error={error || null} htmlFor={`${id}-trigger`}>
      <div ref={dropdownRef} className={cn('relative', className)}>
        {/* Real select, kept for form submission and native validation. */}
        <select
          ref={selectRef}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          multiple={multiple}
          required={required}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          id={`${id}-trigger`}
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-sm shadow-xs transition-all duration-200 ease-soft',
            'hover:border-gray-300 focus:outline-none focus:ring-4 dark:bg-gray-800 dark:hover:border-gray-600',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500'
              : isOpen
              ? 'border-emerald-500 ring-4 ring-emerald-500/20'
              : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-gray-700'
          )}
        >
          <span
            className={cn(
              'truncate',
              display
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-400 dark:text-gray-500'
            )}
          >
            {display ?? placeholder}
          </span>
          <Icon
            name="chevronDown"
            size={16}
            className={cn(
              'shrink-0 text-gray-400 transition-transform duration-250 ease-spring',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        <ul
          role="listbox"
          aria-multiselectable={multiple || undefined}
          className={cn(
            'absolute z-raised mt-1.5 max-h-60 w-full overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white p-1 shadow-xl transition-all duration-200 ease-spring dark:border-gray-700 dark:bg-gray-800',
            isOpen
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none -translate-y-1 opacity-0'
          )}
        >
          {options.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">
              No options
            </li>
          )}

          {options.map((option) => {
            const selected = selectedOptions.includes(option.value);
            return (
              <li key={option.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  tabIndex={isOpen ? 0 : -1}
                  onClick={() => handleOptionClick(option.value)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors duration-150',
                    selected
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  )}
                >
                  {multiple && (
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        selected
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-gray-300 dark:border-gray-600'
                      )}
                      aria-hidden="true"
                    >
                      {selected && <Icon name="check" size={10} strokeWidth={3} />}
                    </span>
                  )}
                  <span className={cn('flex-1 truncate', selected && 'font-medium')}>
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                      {option.description}
                    </span>
                  )}
                  {!multiple && selected && (
                    <Icon name="check" size={15} className="shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Field>
  );
};

export default FloatingDropdown;
