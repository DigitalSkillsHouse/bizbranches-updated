/**
 * cPanel Node.js Application entry point.
 * This file is used by Phusion Passenger (cPanel's Node.js handler)
 * to start the Next.js standalone server.
 */
const { createServer } = require("http");
const { parse } = require("url");
const path = require("path");

process.env.NODE_ENV = "production";

const nextDir = path.join(__dirname, ".next", "standalone");

let app;
try {
  app = require(path.join(nextDir, "server.js"));
} catch {
  const next = require(path.join(nextDir, "node_modules", "next", "dist", "server", "next.js")).default;
  const nextApp = next({
    dir: nextDir,
    dev: false,
    hostname: "0.0.0.0",
    port: parseInt(process.env.PORT, 10) || 3000,
  });

  const handle = nextApp.getRequestHandler();

  nextApp.prepare().then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(parseInt(process.env.PORT, 10) || 3000, () => {
      console.log(`> Ready on port ${process.env.PORT || 3000}`);
    });
  });
}
