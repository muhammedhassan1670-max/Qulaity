import type { DynamicField } from "../../stores/configStore";

export interface FieldComponentProps {
  field: DynamicField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  isFocused?: boolean;
  onFocus?: () => void;
  onAutoAdvance?: () => void;
}