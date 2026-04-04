import { clsx } from "clsx";

export function cn(...classes: Array<string | undefined | null | false>) {
  return clsx(classes);
}

export function toStatusLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
