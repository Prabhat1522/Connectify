import "dotenv/config";
import mongoose from "mongoose";
import Group from "./models/Group.js";
import Message from "./models/Message.js";
import { connectDB } from "./config/db.js";

const groupId = process.argv[2];

if (!groupId) {
  console.error("Please provide the Group ID: node delete_group_db.js <groupId>");
  process.exit(1);
}

async function run() {
  try {
    await connectDB();
    console.log("Connected to MongoDB.");
    
    // Delete messages
    const msgResult = await Message.deleteMany({ groupId });
    console.log(`Deleted ${msgResult.deletedCount} messages associated with group ${groupId}.`);

    // Delete group
    const groupResult = await Group.deleteOne({ _id: groupId });
    console.log(`Deleted group document:`, groupResult);

  } catch (err) {
    console.error("Error during manual deletion:", err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
