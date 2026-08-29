import { z } from "zod";
import DOMPurify from "dompurify";

export const sanitizeInput = (input: string): string => {
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(input);
  }
  // Fallback simple del lado del servidor/build time
  return input.replace(/[<>]/g, ""); 
};

export const TransaccionSecuritySchema = z.object({
  descripcion: z.string().min(1, "La descripción es requerida").max(100, "Descripción muy larga"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
});
