import { model, Schema } from "mongoose";
import { ISupplier } from "./supplier.interface";

const supplierSchema = new Schema<ISupplier>(
  {
    supplierName: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    contactInfo: {
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
      address: { type: String, trim: true },
    },
    note: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

supplierSchema.index({ supplierName: "text", contactPerson: "text" });

const SupplierModel = model<ISupplier>("Supplier", supplierSchema);

export default SupplierModel;
