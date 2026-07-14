"use client";

import type { ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "primary"
  | "action-blue"
  | "action-emerald"
  | "outline-danger"
  | "outline-neutral"
  | "dark-compact"
  | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const base = "tracking-wide transition-all disabled:cursor-not-allowed";

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "rounded-xl border border-zinc-800 bg-zinc-800 py-4 px-4 text-sm font-semibold text-white shadow-lg shadow-zinc-300/50 duration-500 hover:-translate-y-0.5 hover:bg-zinc-700 disabled:translate-y-0 disabled:border-zinc-300 disabled:bg-zinc-300",
  "action-blue":
    "rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md duration-300 hover:bg-blue-700 disabled:bg-gray-400",
  "action-emerald":
    "rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md duration-300 hover:bg-emerald-700 disabled:bg-gray-400",
  "outline-danger":
    "rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 duration-300 hover:border-red-300 hover:bg-red-100 disabled:opacity-50",
  "outline-neutral":
    "rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-600 duration-300 hover:bg-zinc-50",
  "dark-compact":
    "rounded-xl bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-white duration-300 hover:bg-zinc-700",
  ghost:
    "text-sm font-medium text-zinc-500 duration-300 hover:text-zinc-700",
};

export default function Button({
  variant = "action-blue",
  fullWidth = false,
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variantClass[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}
