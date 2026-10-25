require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const { isJwtSecretConfigured } = require("./config/jwt");
if (!isJwtSecretConfigured()) {
  console.error("Startup configuration error: JWT_SECRET must be set to a randomly generated value of at least 32 bytes.");
  process.exit(1);
}

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
