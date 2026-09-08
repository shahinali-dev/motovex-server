import { z } from "zod";
import { DeliveryStatus } from "./delivery.enum";

const createDeliveryValidationSchema = z.object({
  order: z.string().min(1, "Order is required"),
  assignedTo: z.string().optional(),
  scheduledDate: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  deliveryCost: z.number().min(0).optional(),
});

const updateDeliveryStatusValidationSchema = z.object({
  status: z.enum([
    DeliveryStatus.PENDING,
    DeliveryStatus.OUT_FOR_DELIVERY,
    DeliveryStatus.DELIVERED,
    DeliveryStatus.FAILED,
  ]),
  note: z.string().optional(),
});

const assignDeliveryValidationSchema = z.object({
  assignedTo: z.string().min(1, "assignedTo (SR/DSR/DM user id) is required"),
});

const updateDeliveryCostValidationSchema = z.object({
  deliveryCost: z.number().min(0, "deliveryCost cannot be negative"),
});

export const deliveryValidation = {
  createDeliveryValidationSchema,
  updateDeliveryStatusValidationSchema,
  assignDeliveryValidationSchema,
  updateDeliveryCostValidationSchema,
};
