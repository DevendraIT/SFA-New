// import express from "express";
// import config from "./config/env.js";
// import {
//   requestIdMiddleware,
//   securityMiddleware,
//   compressionMiddleware,
//   cookieMiddleware,
//   rateLimitMiddleware,
//   requestLoggingMiddleware,
// } from "./middlewares/index.js";
// import router from "./routes/index.js";
// import { errorHandler } from "./middlewares/error.middleware.js";
// import { AppError } from "./shared/response.js";

// const app = express();

// // 1. Tracing ID
// app.use(requestIdMiddleware);

// // 2. Logging
// app.use(requestLoggingMiddleware);

// // 3. Security (Helmet + CORS)
// app.use(securityMiddleware);

// // 4. Rate Limiting (only active in production as per middleware config)
// app.use(rateLimitMiddleware);

// // 5. Performance (Gzip compression)
// app.use(compressionMiddleware);

// // 6. Parsing Body & Cookies
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// app.use(cookieMiddleware);
// app.use('/uploads', express.static('uploads'));

// // 7. Base API Route Registration
// app.use(`/api/${config.API_VERSION}`, router);

// // Mount health and docs directly at root as fallback convenience paths
// app.use("/health", router);


// // 8. 404 Route handler
// app.use((req, res, next) => {
//   next(AppError.notFound(`Route not found - ${req.originalUrl}`));
// });

// // 9. Global Error Handling
// app.use(errorHandler);

// export default app;



import express from "express";
import config from "./config/env.js";
import {
  requestIdMiddleware,
  securityMiddleware,
  compressionMiddleware,
  cookieMiddleware,
  rateLimitMiddleware,
  requestLoggingMiddleware,
} from "./middlewares/index.js";
import router from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { AppError } from "./shared/response.js";

const app = express();

// 1. Tracing ID
app.use(requestIdMiddleware);

// 2. Logging
app.use(requestLoggingMiddleware);

// 3. Security (Helmet + CORS)
app.use(securityMiddleware);

// 4. Rate Limiting (only active in production as per middleware config)
app.use(rateLimitMiddleware);

// 5. Performance (Gzip compression)
app.use(compressionMiddleware);

// 6. Parsing Body & Cookies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieMiddleware);
app.use('/uploads', express.static('uploads'));

// 7. Base API Route Registration
app.use(`/api/${config.API_VERSION}`, router);

// Mount health and docs directly at root as fallback convenience paths
app.use("/health", router);

// Root Route (Render Health Check)
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SFA Backend is running 🚀",
    api: `/api/${config.API_VERSION}`,
    health: "/health",
  });
});

// 8. 404 Route handler
app.use((req, res, next) => {
  next(AppError.notFound(`Route not found - ${req.originalUrl}`));
});

// 9. Global Error Handling
app.use(errorHandler);

export default app;
