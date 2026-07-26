import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
          variant === "primary" &&
            "bg-greenMid border border-greenBright text-greenBright hover:bg-greenBright hover:text-[#04150E]",
          variant === "secondary" &&
            "bg-surface2 border border-borderStrong text-textPrimary hover:border-greenBright",
          variant === "ghost" &&
            "bg-transparent text-textSecondary hover:text-textPrimary hover:bg-surface2",
          variant === "danger" &&
            "bg-transparent border border-danger/40 text-danger hover:bg-danger/10",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export default Button;
