import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "./config/db";
import User from "./models/User";
import LostFoundItem from "./models/LostFoundItem";

const SAMPLE_ITEMS = [
  {
    title: "C2 na green sa Chez",
    description: "May C2 na green na medyo ubos",
    type: "found" as const,
  },
  {
    title: "Black Umbrella",
    description: "Black umbrella found near the library",
    type: "found" as const,
  },
];

async function seed() {
  try {
    await connectDB();

    const user = await User.findOne().select("_id");

    if (!user) {
      throw new Error(
        "No user exists yet. Register an account first, then run the seed script."
      );
    }

    for (const item of SAMPLE_ITEMS) {
      await LostFoundItem.updateOne(
        { title: item.title },
        {
          $setOnInsert: {
            ...item,
            reporterId: user._id,
          },
        },
        { upsert: true }
      );
    }

    console.log("Sample items seeded successfully.");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void seed();