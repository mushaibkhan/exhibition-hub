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
app.use(cors({ origin: env.corsOrigin }));
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

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

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

  const server = app.listen(env.port, () => {
    console.log(`Backend running on port ${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    server.close(() => {
      console.log('HTTP server closed.');
    });

    try {
      // Close database connection
      const { pool } = await import('./config/db.js');
      await pool.end();
      console.log('Database pool closed.');

      // Close Redis connection
      await redis.quit();
      console.log('Redis connection closed.');

      process.exit(0);
    } catch (err) {
      console.error('Error during graceful shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
