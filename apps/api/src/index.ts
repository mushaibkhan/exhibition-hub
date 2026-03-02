import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env.js';
import { checkDbConnection } from './config/db.js';
import { redis, checkRedisConnection } from './config/redis.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', async (_req, res) => {
  const dbOk = await checkDbConnection();
  const redisOk = await checkRedisConnection();
  const status = dbOk && redisOk ? 200 : 503;
  res.status(status).json({
    status: dbOk && redisOk ? 'healthy' : 'degraded',
    services: { database: dbOk ? 'up' : 'down', redis: redisOk ? 'up' : 'down' },
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiRouter);

app.use(errorHandler);

async function start() {
  try {
    await redis.connect();
    console.log('Redis connected');
  } catch (err) {
    console.warn('Redis connection failed, continuing without cache:', (err as Error).message);
  }

  const dbOk = await checkDbConnection();
  if (!dbOk) {
    console.error('Database connection failed. Exiting.');
    process.exit(1);
  }
  console.log('Database connected');

  app.listen(env.port, () => {
    console.log(`Backend running on port ${env.port} [${env.nodeEnv}]`);
  });
}

start();
