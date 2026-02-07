import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-transform duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-50 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-yellow-400 text-slate-900 hover:bg-yellow-300 shadow-sm border border-yellow-500/20",
        secondary: "bg-white text-slate-700 border-2 border-slate-100 hover:border-yellow-200 hover:bg-yellow-50/50 shadow-sm",
        ghost: "hover:bg-slate-100 hover:text-slate-900",
        destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90",
        outline: "border-2 border-slate-200 bg-transparent hover:bg-slate-100 text-slate-600",
      },
      size: {
        default: "h-12 px-6 rounded-[32px]", // Extreme rounded
        sm: "h-9 rounded-[24px] px-4",
        lg: "h-14 rounded-[40px] px-8 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
