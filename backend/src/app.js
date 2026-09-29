require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorMiddleware = require('./middlewares/errorMiddleware');
const notFound = require('./middlewares/notFound');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));

// Routers
const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');
const visitorRouter = require('./routes/visitorRoutes');

app.get('/', (req, res) => res.json({ msg: 'Visitor Management API is running' }));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/visitors', visitorRouter);

// 404 + error handling (must come last)
app.use(notFound);
app.use(errorMiddleware);

const start = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing. Copy .env.example to .env and set it.');
    }
    await connectDB(process.env.MONGODB_URI);
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

start();
