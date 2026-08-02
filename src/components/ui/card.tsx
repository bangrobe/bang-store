"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl bg-white border border-slate-100 shadow-sm",
          hover && "hover:shadow-md hover:border-slate-200 transition-shadow duration-200",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export { Card };
