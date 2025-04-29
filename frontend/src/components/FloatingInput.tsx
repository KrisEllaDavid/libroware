import React from "react";

interface FloatingInputProps {
  id: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  id,
  name,
  value,
  onChange,
  type = "text",
  label,
  placeholder = "",
  required = false,
  error,
}) => {
  // Convert value to string for checking if it's empty
  const valueStr = value !== undefined && value !== null ? String(value) : "";
  const hasValue = valueStr.length > 0;

  return (
    <div className="relative w-full mb-4">
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`float-input peer pt-6 pb-2 dark:text-white dark:bg-transparent dark:border-gray-700 
        ${
          error
            ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400"
            : "focus:border-emerald-500 dark:focus:border-emerald-400"
        }`}
      />
      <label
        htmlFor={id}
        className={`absolute left-3 transition-all pointer-events-none
        ${
          hasValue
            ? "text-xs top-2 text-emerald-600 dark:text-emerald-400"
            : "top-3 text-gray-500 dark:text-gray-400"
        } 
        peer-focus:text-xs peer-focus:top-2 peer-focus:text-emerald-600 dark:peer-focus:text-emerald-400
        ${error ? "text-red-500 dark:text-red-400" : ""}`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400 animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
};

export default FloatingInput;
