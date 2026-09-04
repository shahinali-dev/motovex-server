/**
 * Motovex tracks all stock internally in a single base unit: PIECES.
 * A "Box" is just `piecesPerBox` pieces. These helpers convert between
 * the two so every module (product, stock, order, report) stays consistent.
 */

export type QuantityUnit = "box" | "pieces";

export const toPieces = (
  quantity: number,
  unit: QuantityUnit,
  piecesPerBox: number
): number => {
  if (unit === "box") return quantity * piecesPerBox;
  return quantity;
};

export const piecesToBoxAndPieces = (
  totalPieces: number,
  piecesPerBox: number
) => {
  if (!piecesPerBox || piecesPerBox <= 0) {
    return { boxes: 0, pieces: totalPieces };
  }
  const boxes = Math.floor(totalPieces / piecesPerBox);
  const pieces = totalPieces % piecesPerBox;
  return { boxes, pieces };
};
