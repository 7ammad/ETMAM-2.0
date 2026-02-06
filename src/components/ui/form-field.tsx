import { cn } from "@/lib/utils";
import { Label } from "./label";

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

function FormField({
  label,
  name,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-confidence-low" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export { FormField };
export type { FormFieldProps };
