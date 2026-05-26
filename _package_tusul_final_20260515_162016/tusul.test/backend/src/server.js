const app = require("./app");
const { env } = require("./config/env");

const server = app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${env.port} is already in use. Stop the existing process or set a different PORT in backend/.env.`);
    process.exit(1);
  }

  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
