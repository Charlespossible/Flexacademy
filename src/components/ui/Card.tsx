import React from "react";
import clsx from "clsx";

interface CardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = true,
  className = "",
}) => {
  return (
    <div
      className={clsx(
        "bg-white rounded-2xl shadow p-6 transition-all",
        {
          "hover:shadow-lg hover:-translate-y-1": hoverable,
        },
        className
      )}
    >
      {children}
    </div>
  );
};

