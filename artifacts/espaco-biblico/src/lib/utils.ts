import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInYears, parseISO, format, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(birthDate: string | Date | undefined | null): number {
  if (!birthDate) return 0;
  const date = typeof birthDate === "string" ? parseISO(birthDate) : birthDate;
  if (!isValid(date)) return 0;
  return differenceInYears(new Date(), date);
}

export function formatWhatsAppLink(phone: string | undefined | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/55${digits}`;
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function getGenderColor(gender: string) {
  return gender === 'F' ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-blue-100 text-blue-700 border-blue-200';
}
