const path = require("path");
const mongoose = require("mongoose");
const envPath = path.resolve(__dirname, ".env");
require("dotenv").config({ path: envPath });

const WalletSchema = require("./backend/api/models/Wallet");
const Wallet = mongoose.models.Wallet || mongoose.model("Wallet", WalletSchema);

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set!");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB.");

  const userId = "69aa78739474e3aafe90d06b";
  let wallet = await Wallet.findOne({ userId });
  if (wallet) {
    console.log("Wallet already exists:", wallet);
  } else {
    wallet = await Wallet.create({ userId, balance: 0 });
    console.log("Wallet created successfully:", wallet);
  }
  process.exit(0);
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
