module.exports = {
  globPatterns: ["./**/*"],
  globIgnores: ["./service-worker.js"],
  swDest: "./build/service-worker.js",
  globDirectory: "./build",
  skipWaiting: true
};
