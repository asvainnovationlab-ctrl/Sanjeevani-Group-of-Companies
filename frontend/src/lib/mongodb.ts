import mongoose from "mongoose";

const databaseName =
  process.env.MONGODB_DATABASE ?? "Sanjeevani_group_of_companies";

let connectionPromise: Promise<typeof mongoose> | undefined;

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in frontend/.env.local.");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, { dbName: databaseName }).catch((error: unknown) => {
      connectionPromise = undefined;
      throw error;
    });
  }

  return connectionPromise;
}
