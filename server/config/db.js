import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Database connected successfully to MongoDB Atlas.");
    });
    
    mongoose.connection.on("error", (err) => {
      console.error("Database connection error:", err);
    });

    const connUri = process.env.MONGODB_URI;
    if (!connUri) {
      throw new Error("MONGODB_URI is not defined in the environment variables.");
    }
    
    await mongoose.connect(connUri);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};
