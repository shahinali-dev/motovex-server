import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import nunjucks from "nunjucks";
import path from "path";
import config from "./config";
import globalErrorHandler from "./middleware/global_error_handler.middleware";
import notFound from "./middleware/not_found.middleware";
import router from "./router/router";

const app: Application = express();

nunjucks.configure(path.resolve(process.cwd(), "views"), {
  autoescape: true,
  express: app,
  // Don't watch template files for changes in production — no reason to
  // pay for an fs.watch per file on a long-running server.
  watch: config.NODE_ENV !== "production",
});
app.set("view engine", "html");

const allowedOrigins = config.CORS_ORIGIN?.split(",");
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// Serve locally-stored uploads (purchase invoices/receipts etc.).
// Swap this for a CDN/S3-R2 public URL once the storage service moves off disk.
app.use("/uploads", express.static(path.resolve(process.cwd(), config.UPLOAD_DIR)));

app.use(router);

app.get("/", (req: Request, res: Response) => {
  res.send("Motovex API is running 🚀");
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
