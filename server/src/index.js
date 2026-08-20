import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(','),
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' })); // headroom for base64 personalisation photos
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }));
app.use('/api', routes);

app.get('/', (_req, res) =>
  res.json({ success: true, message: "Upahaar API — don't just send a gift. Send a moment." })
);

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    const conn = await connectDB(process.env.MONGO_URI);
    console.log(`  MongoDB connected → ${conn.name}`);
    app.listen(PORT, () => console.log(`  Upahaar API ready on http://localhost:${PORT}\n`));
  } catch (err) {
    console.error('  Could not start the API:', err.message);
    console.error('   Is MongoDB running, and is MONGO_URI correct in server/.env?');
    process.exit(1);
  }
}

start();

export default app;
