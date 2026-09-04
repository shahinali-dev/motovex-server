import { Types } from "mongoose";
import { resolveDateRange } from "../../utils/query_helpers.utils";
import ProductModel from "../product/product.model";
import ShopModel from "../shop/shop.model";
import { NON_SALE_STATUSES } from "../order/order.enum";
import OrderModel from "../order/order.model";

// Orders in a non-sale status (cancelled) are excluded from every money report.
const SALE_MATCH = { status: { $nin: NON_SALE_STATUSES } };

export class ReportService {
  // ---------------------------------------------------------------------
  // 1. Sales report - totals + per-product + per-shop breakdown for a range
  // ---------------------------------------------------------------------
  async getSalesReport(query: Record<string, unknown>) {
    const { startDate, endDate } = resolveDateRange(
      query.startDate as string | undefined,
      query.endDate as string | undefined
    );

    const match: Record<string, unknown> = {
      ...SALE_MATCH,
      orderDate: { $gte: startDate, $lte: endDate },
    };
    if (query.shop) match.shop = new Types.ObjectId(query.shop as string);

    const [summary] = await OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalCost: { $sum: "$totalCost" },
          totalProfit: { $sum: "$totalProfit" },
        },
      },
      { $project: { _id: 0 } },
    ]);

    const byProduct = await OrderModel.aggregate([
      { $match: match },
      { $unwind: "$items" },
      ...(query.product
        ? [{ $match: { "items.product": new Types.ObjectId(query.product as string) } }]
        : []),
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$items.productName" },
          sku: { $first: "$items.sku" },
          totalPiecesSold: { $sum: "$items.totalPieces" },
          totalAmount: { $sum: "$items.subtotalAmount" },
          totalCost: { $sum: "$items.subtotalCost" },
          totalProfit: { $sum: "$items.profit" },
        },
      },
      { $sort: { totalAmount: -1 } },
      {
        $project: {
          _id: 0,
          product: "$_id",
          productName: 1,
          sku: 1,
          totalPiecesSold: 1,
          totalAmount: 1,
          totalCost: 1,
          totalProfit: 1,
        },
      },
    ]);

    const byShop = await OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$shop",
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalCost: { $sum: "$totalCost" },
          totalProfit: { $sum: "$totalProfit" },
        },
      },
      { $sort: { totalAmount: -1 } },
      {
        $lookup: {
          from: "shops",
          localField: "_id",
          foreignField: "_id",
          as: "shop",
        },
      },
      { $unwind: "$shop" },
      {
        $project: {
          _id: 0,
          shop: "$_id",
          shopName: "$shop.shopName",
          ownerName: "$shop.ownerName",
          totalOrders: 1,
          totalAmount: 1,
          totalCost: 1,
          totalProfit: 1,
        },
      },
    ]);

    return {
      range: { startDate, endDate },
      summary: summary || {
        totalOrders: 0,
        totalAmount: 0,
        totalCost: 0,
        totalProfit: 0,
      },
      byProduct,
      byShop,
    };
  }

  // ---------------------------------------------------------------------
  // 2. Inventory report - current stock & stock valuation, straight from Product
  // ---------------------------------------------------------------------
  async getInventoryReport(query: Record<string, unknown>) {
    const filter: Record<string, unknown> = {};
    if (query.isActive !== undefined) filter.isActive = query.isActive === "true";
    if (query.category) filter.category = query.category;

    const products = await ProductModel.find(filter).sort({ name: 1 });

    const items = products.map((p) => {
      const stockValueCost = p.stockInPieces * p.costPricePerPiece;
      const stockValueSelling = p.stockInPieces * p.sellingPricePerPiece;
      return {
        product: p._id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        piecesPerBox: p.piecesPerBox,
        stockInPieces: p.stockInPieces,
        stockInBoxes: Math.floor(p.stockInPieces / p.piecesPerBox),
        stockRemainderPieces: p.stockInPieces % p.piecesPerBox,
        lowStockThresholdPieces: p.lowStockThresholdPieces,
        isLowStock: p.stockInPieces <= p.lowStockThresholdPieces,
        stockValueCost,
        stockValueSelling,
      };
    });

    const summary = items.reduce(
      (acc, i) => {
        acc.totalProducts += 1;
        acc.totalStockPieces += i.stockInPieces;
        acc.totalStockValueCost += i.stockValueCost;
        acc.totalStockValueSelling += i.stockValueSelling;
        if (i.isLowStock) acc.lowStockCount += 1;
        return acc;
      },
      {
        totalProducts: 0,
        totalStockPieces: 0,
        totalStockValueCost: 0,
        totalStockValueSelling: 0,
        lowStockCount: 0,
      }
    );

    return { summary, items };
  }

  // ---------------------------------------------------------------------
  // 3. Low stock alert
  // ---------------------------------------------------------------------
  async getLowStockAlert() {
    const products = await ProductModel.find({
      isActive: true,
      $expr: { $lte: ["$stockInPieces", "$lowStockThresholdPieces"] },
    }).sort({ stockInPieces: 1 });

    return products.map((p) => ({
      product: p._id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      stockInPieces: p.stockInPieces,
      stockInBoxes: Math.floor(p.stockInPieces / p.piecesPerBox),
      lowStockThresholdPieces: p.lowStockThresholdPieces,
    }));
  }

  // ---------------------------------------------------------------------
  // 4. Daily sales & profit report (single day, default: today)
  // ---------------------------------------------------------------------
  async getDailyReport(dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const match = { ...SALE_MATCH, orderDate: { $gte: startDate, $lte: endDate } };

    const [summary] = await OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalCost: { $sum: "$totalCost" },
          totalProfit: { $sum: "$totalProfit" },
        },
      },
      { $project: { _id: 0 } },
    ]);

    const statusBreakdown = await OrderModel.aggregate([
      { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
    ]);

    return {
      date: startDate.toISOString().slice(0, 10),
      summary: summary || { totalOrders: 0, totalAmount: 0, totalCost: 0, totalProfit: 0 },
      statusBreakdown,
    };
  }

  // ---------------------------------------------------------------------
  // 5. Monthly report - totals + day-by-day breakdown
  // ---------------------------------------------------------------------
  async getMonthlyReport(monthStr?: string, yearStr?: string) {
    const now = new Date();
    const year = yearStr ? Number(yearStr) : now.getFullYear();
    const month = monthStr ? Number(monthStr) : now.getMonth() + 1; // 1-12

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // last day of month

    const match = { ...SALE_MATCH, orderDate: { $gte: startDate, $lte: endDate } };

    const [summary] = await OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalCost: { $sum: "$totalCost" },
          totalProfit: { $sum: "$totalProfit" },
        },
      },
      { $project: { _id: 0 } },
    ]);

    const dailyBreakdown = await OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dayOfMonth: "$orderDate" },
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalCost: { $sum: "$totalCost" },
          totalProfit: { $sum: "$totalProfit" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          day: "$_id",
          totalOrders: 1,
          totalAmount: 1,
          totalCost: 1,
          totalProfit: 1,
        },
      },
    ]);

    return {
      year,
      month,
      summary: summary || { totalOrders: 0, totalAmount: 0, totalCost: 0, totalProfit: 0 },
      dailyBreakdown,
    };
  }

  // ---------------------------------------------------------------------
  // 6. Yearly report - totals + month-by-month breakdown
  // ---------------------------------------------------------------------
  async getYearlyReport(yearStr?: string) {
    const year = yearStr ? Number(yearStr) : new Date().getFullYear();
    const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const match = { ...SALE_MATCH, orderDate: { $gte: startDate, $lte: endDate } };

    const [summary] = await OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalCost: { $sum: "$totalCost" },
          totalProfit: { $sum: "$totalProfit" },
        },
      },
      { $project: { _id: 0 } },
    ]);

    const monthlyBreakdown = await OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $month: "$orderDate" },
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalCost: { $sum: "$totalCost" },
          totalProfit: { $sum: "$totalProfit" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          month: "$_id",
          totalOrders: 1,
          totalAmount: 1,
          totalCost: 1,
          totalProfit: 1,
        },
      },
    ]);

    return {
      year,
      summary: summary || { totalOrders: 0, totalAmount: 0, totalCost: 0, totalProfit: 0 },
      monthlyBreakdown,
    };
  }

  // ---------------------------------------------------------------------
  // 7. Lifetime report - all-time totals, best sellers, top shops
  // ---------------------------------------------------------------------
  async getLifetimeReport() {
    const [summary] = await OrderModel.aggregate([
      { $match: SALE_MATCH },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalCost: { $sum: "$totalCost" },
          totalProfit: { $sum: "$totalProfit" },
          firstOrderDate: { $min: "$orderDate" },
          lastOrderDate: { $max: "$orderDate" },
        },
      },
      { $project: { _id: 0 } },
    ]);

    const bestSellingProducts = await OrderModel.aggregate([
      { $match: SALE_MATCH },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$items.productName" },
          sku: { $first: "$items.sku" },
          totalPiecesSold: { $sum: "$items.totalPieces" },
          totalAmount: { $sum: "$items.subtotalAmount" },
          totalProfit: { $sum: "$items.profit" },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          product: "$_id",
          productName: 1,
          sku: 1,
          totalPiecesSold: 1,
          totalAmount: 1,
          totalProfit: 1,
        },
      },
    ]);

    const topShops = await OrderModel.aggregate([
      { $match: SALE_MATCH },
      {
        $group: {
          _id: "$shop",
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalProfit: { $sum: "$totalProfit" },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "shops",
          localField: "_id",
          foreignField: "_id",
          as: "shop",
        },
      },
      { $unwind: "$shop" },
      {
        $project: {
          _id: 0,
          shop: "$_id",
          shopName: "$shop.shopName",
          ownerName: "$shop.ownerName",
          totalOrders: 1,
          totalAmount: 1,
          totalProfit: 1,
        },
      },
    ]);

    const [totalProducts, totalShops] = await Promise.all([
      ProductModel.countDocuments(),
      ShopModel.countDocuments(),
    ]);

    return {
      summary: summary || {
        totalOrders: 0,
        totalAmount: 0,
        totalCost: 0,
        totalProfit: 0,
        firstOrderDate: null,
        lastOrderDate: null,
      },
      bestSellingProducts,
      topShops,
      totalProducts,
      totalShops,
    };
  }
}

export const reportService = new ReportService();
