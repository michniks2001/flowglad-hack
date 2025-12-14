import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          {...props}
        />
        <div className={cn(
          "w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-colors flex items-center justify-center",
          className
        )}>
          <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }

