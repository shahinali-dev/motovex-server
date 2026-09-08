import ProductModel from "../modules/product/product.model";

/**
 * Builds a short uppercase prefix from a name, e.g. "Engine Oil" -> "ENO",
 * "Chain Lube" -> "CHL". Falls back to "GEN" when no usable letters exist.
 */
const buildPrefix = (value: string, length = 3) => {
  const letters = value.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (!letters) return "GEN";
  return letters.slice(0, length).padEnd(Math.min(length, letters.length), "");
};

/**
 * Auto-generates a unique SKU from category + brand, e.g. "ENO-CAS-0001".
 * Used whenever the UI leaves the SKU field blank on product creation.
 * Retries with an incremented sequence if a collision is somehow found
 * (e.g. a manually created product already used that code).
 */
export const generateSku = async (
  category?: string,
  brand?: string
): Promise<string> => {
  const categoryPart = buildPrefix(category || "GEN");
  const brandPart = brand ? `-${buildPrefix(brand)}` : "";
  const prefix = `${categoryPart}${brandPart}`;

  // Count existing products sharing this prefix to pick the next sequence
  // number, then verify it's actually free (defensive against races/gaps).
  const existingCount = await ProductModel.countDocuments({
    sku: { $regex: `^${prefix}-`, $options: "i" },
  });

  let sequence = existingCount + 1;
  let sku = `${prefix}-${String(sequence).padStart(4, "0")}`;

  // eslint-disable-next-line no-await-in-loop
  while (await ProductModel.findOne({ sku })) {
    sequence += 1;
    sku = `${prefix}-${String(sequence).padStart(4, "0")}`;
  }

  return sku;
};
