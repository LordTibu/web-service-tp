const dotenv = require('dotenv');

dotenv.config();

const app = require('./app');
const { connectToDatabase } = require('./config/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
