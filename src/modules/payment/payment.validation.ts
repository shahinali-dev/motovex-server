import { z } from "zod";
import { PaymentMethod } from "./payment.enum";

const recordPaymentValidationSchema = z.object({
  amount: z.number().positive("amount must be greater than 0"),
  method: z.enum([
    PaymentMethod.CASH,
    PaymentMethod.BKASH,
    PaymentMethod.NAGAD,
    PaymentMethod.ROCKET,
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.CHEQUE,
    PaymentMethod.OTHER,
  ]),
  note: z.string().optional(),
  paymentDate: z.string().optional(),
});

export const paymentValidation = {
  recordPaymentValidationSchema,
};
