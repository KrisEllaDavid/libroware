import React from "react";
import { Input } from "./ui";

interface FloatingInputProps {
  id: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  type?: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

/**
 * Kept as a thin adapter over the shared `Input`.
 *
 * Six screens import this by name; rewriting the call sites would have been a
 * large diff for no behavioural gain, so the props are unchanged and only the
 * rendering moved. The label no longer floats — in a dense admin form a
 * floating label means every filled field loses its name to a 10px caption
 * wedged against the border, and the French labels routinely overran the box.
 * It now sits above the control, where it stays readable at full size.
 */
const FloatingInput: React.FC<FloatingInputProps> = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  type = "text",
  label,
  placeholder = "",
  required = false,
  error,
}) => (
  <Input
    id={id}
    name={name}
    type={type}
    value={value}
    onChange={onChange}
    onBlur={onBlur}
    placeholder={placeholder}
    required={required}
    label={label}
    error={error || null}
  />
);

export default FloatingInput;
