import http from "http";
import dns from "node:dns";

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // ignore
}

const origClose = http.Server.prototype.close;
http.Server.prototype.close = function(cb) {
  console.log("HTTP.SERVER.CLOSE CALLED FROM:", new Error().stack);
  return origClose.apply(this, arguments);
};

const origUnref = http.Server.prototype.unref;
http.Server.prototype.unref = function() {
  console.log("HTTP.SERVER.UNREF CALLED FROM:", new Error().stack);
  return origUnref.apply(this, arguments);
};

import app from "./app.js";
import config from "./config/env.js";
import { logger } from "./utils/index.js";
import { prisma } from "./config/database.js";
import { initFieldForce } from "./modules/field-force/index.js";
import { initNotifications } from "./modules/notifications/index.js";
import { initTargetPerformance } from "./modules/target-performance/index.js";

const PORT = config.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", async () => {
  logger.info(`🚀 Server successfully started in ${config.NODE_ENV} mode`);
  logger.info(`📡 Listening on http://localhost:${PORT}/api/${config.API_VERSION}`);
  logger.info(`📖 API Documentation available at http://localhost:${PORT}/api/${config.API_VERSION}/docs`);

  // Initialize modules after database connection is ready
  try {
        initFieldForce();
    initNotifications();
    initTargetPerformance();
  } catch (error) {
    logger.error("Error initializing modules:", error);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("💥 UNCAUGHT EXCEPTION! Shutting down gracefully...", error);
  shutdown(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason) => {
  logger.error("💥 UNHANDLED REJECTION! Shutting down gracefully...", { reason });
  shutdown(1);
});

// Graceful shutdown helper
async function shutdown(code = 0) {
  logger.info("🛑 Shutting down server...");

  if (server) {
    server.close(async () => {
      logger.info("⚡ HTTP server closed.");
      try {
        await prisma.$disconnect();
        logger.info("💾 Database connection closed.");
        process.exit(code);
      } catch (err) {
        logger.error("⚠️ Error disconnecting database:", err);
        process.exit(1);
      }
    });
  } else {
    process.exit(code);
  }
}

// OS signals
process.on("SIGTERM", () => {
  logger.info("👋 SIGTERM received.");
  shutdown(0);
});

process.on("SIGINT", () => {
  logger.info("👋 SIGINT received.");
  shutdown(0);
});

// Prevent Node.js process from exiting due to event loop drain
// Workaround for Neon Serverless driver / Edge environments
setInterval(() => {}, 1000 * 60 * 60);
