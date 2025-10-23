import React from "react";
import clsx from "clsx";

interface BadgeProps {
  label: string;
  color?: "blue" | "green" | "gray" | "yellow" | "red";
}

export const Badge: React.FC<BadgeProps> = ({ label, color = "blue" }) => {
  const colorStyles = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    gray: "bg-gray-100 text-gray-700",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={clsx(
        "px-3 py-1 text-xs font-semibold rounded-full",
        colorStyles[color]
      )}
    >
      {label}
    </span>
  );
};

