import mongoose from "mongoose";

class Database {
  private connection: typeof mongoose | null = null;

  async connect(): Promise<typeof mongoose> {
    try {
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      // Build MongoDB URI from individual env variables
      const user = process.env.MONGODB_USER;
      const password = process.env.MONGODB_PASSWORD;
      const host = process.env.MONGODB_HOST;
      const port = process.env.MONGODB_PORT || "27017";
      const database = process.env.MONGODB_DATABASE || "calorie_tracker";

      const mongoUri = `mongodb://${user}:${password}@${host}:${port}/${database}?directConnection=true&authSource=admin`;

      this.connection = await mongoose.connect(mongoUri, options);

      console.log(`✅ MongoDB connected successfully to database: ${database}`);

      // Handle connection events
      mongoose.connection.on("error", (err) => {
        console.error("❌ MongoDB connection error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        console.log("⚠️  MongoDB disconnected");
      });

      // Graceful shutdown
      process.on("SIGINT", async () => {
        await mongoose.connection.close();
        console.log("MongoDB connection closed through app termination");
        process.exit(0);
      });

      return this.connection;
    } catch (error) {
      console.error(
        "❌ Failed to connect to MongoDB:",
        error instanceof Error ? error.message : "Unknown error",
      );
      process.exit(1);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    }
  }
}

export default new Database();
