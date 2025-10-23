import React from "react";
import clsx from "clsx";

interface ButtonProps {
  label: string;
  onClick?: () => void;
  fullWidth?: boolean;
  variant?: "primary" | "secondary" | "outline";
  type?: "button" | "submit" | "reset";
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  fullWidth,
  variant = "primary",
  type = "button",
}) => {
  const baseStyles =
    "px-6 py-3 font-semibold rounded-xl transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400",
    outline:
      "border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={clsx(baseStyles, variants[variant], {
        "w-full": fullWidth,
      })}
    >
      {label}
    </button>
  );
};

