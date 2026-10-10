import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
throw new Error(
"MONGODB_URI is missing. Please check your .env file."
);
}

try {
await mongoose.connect(mongoUri);

console.log(
  `MongoDB connected successfully to database: ${mongoose.connection.name}`
);


} catch (error) {
console.error("MongoDB connection failed:", error);
throw error;
}
};

export default connectDB;
