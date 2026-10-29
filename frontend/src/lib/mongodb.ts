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
    // Give up after 8s instead of mongoose's 30s default, so a visitor
    // submitting a form (or loading the directory) isn't left waiting when the
    // database is unreachable.
    connectionPromise = mongoose.connect(uri, { dbName: databaseName, serverSelectionTimeoutMS: 8000 }).catch((error: unknown) => {
      connectionPromise = undefined;
      throw error;
    });
  }

  return connectionPromise;
}
