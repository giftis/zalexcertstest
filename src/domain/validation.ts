import { z } from 'zod';
import { isFutureDate } from './date';

/**
 * Zod schema for F02 — Request Certificate form.
 *
 * Rules (from spec §3.2):
 * - address_to: required, non-empty string
 * - purpose:    required, min 50 chars
 * - issued_on:  required, must be a future date
 * - employee_id: required, digits only
 */
export const requestCertificateSchema = z.object({
  addressTo: z.string().trim().min(1, 'Address to is required.'),
  purpose: z
    .string()
    .trim()
    .min(50, 'Purpose must be at least 50 characters.'),
  issuedOn: z
    .date({ required_error: 'Issued on date is required.' })
    .refine(isFutureDate, { message: 'Issued on must be a future date.' }),
  employeeId: z
    .string()
    .trim()
    .min(1, 'Employee ID is required.')
    .regex(/^\d+$/, 'Employee ID must be numeric.'),
});

export type RequestCertificateFormValues = z.infer<
  typeof requestCertificateSchema
>;
