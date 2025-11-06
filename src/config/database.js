const mongoose = require('mongoose');

const DEFAULT_URI = 'mongodb://mongo:27017/social_media';

async function connectToDatabase(uri = process.env.MONGODB_URI || DEFAULT_URI) {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

function disconnectFromDatabase() {
  return mongoose.connection.close(false);
}

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

module.exports = {
  connectToDatabase,
  disconnectFromDatabase
};
