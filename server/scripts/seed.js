const mongoose = require("mongoose");
const dotenv = require("dotenv");
const PricingTier = require("../models/PricingTierModel");

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB for seeding"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Define initial pricing tiers
const pricingTiers = [
  {
    name: "Free Tier",
    description: "Basic file sharing with 2GB limit and 4-hour validity",
    fileSizeLimit: 2, // in GB
    validityInHours: 4,
    price: 0,
    isActive: true,
    isDefault: true,
    currencyCode: "INR",
  },
  {
    name: "Standard Tier",
    description: "Extended file sharing with 5GB limit and 24-hour validity",
    fileSizeLimit: 5, // in GB
    validityInHours: 24,
    price: 40,
    isActive: true,
    isDefault: false,
    currencyCode: "INR",
  },
  {
    name: "Premium Tier",
    description: "Premium file sharing with 10GB limit and 72-hour validity",
    fileSizeLimit: 10, // in GB
    validityInHours: 72,
    price: 80,
    isActive: true,
    isDefault: false,
    currencyCode: "INR",
  },
];

// Seed the pricing tiers
const seedPricingTiers = async () => {
  try {
    // Delete all existing pricing tiers
    await PricingTier.deleteMany({});
    console.log("Removed existing pricing tiers");

    // Insert new pricing tiers
    const createdTiers = await PricingTier.insertMany(pricingTiers);
    console.log(`Seeded ${createdTiers.length} pricing tiers`);

    // Log created tiers
    createdTiers.forEach((tier) => {
      console.log(
        `Created tier: ${tier.name}, ${tier.fileSizeLimit}GB, ${tier.validityInHours}h, ₹${tier.price}`
      );
    });

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // Disconnect from the database
    mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Execute the seed function
seedPricingTiers();
