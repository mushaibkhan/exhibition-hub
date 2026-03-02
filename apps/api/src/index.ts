import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env.js';
import { checkDbConnection } from './config/db.js';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { redis, checkRedisConnection } from './config/redis.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

app.use(pinoHttp({ logger }));

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
    logger.info('Redis connected');
  } catch (err) {
    logger.warn('Redis connection failed, continuing without cache: %s', (err as Error).message);
  }

  const dbOk = await checkDbConnection();
  if (!dbOk) {
    logger.error('Database connection failed. Exiting.');
    process.exit(1);
  }
  logger.info('Database connected');

  const server = app.listen(env.port, () => {
    logger.info(`Backend running on port ${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`\n${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      logger.info('HTTP server closed.');

      try {
        // Close database connection
        const { pool } = await import('./config/db.js');
        await pool.end();
        logger.info('Database pool closed.');

        // Close Redis connection
        await redis.quit();
        logger.info('Redis connection closed.');

        process.exit(0);
      } catch (err) {
        logger.error(err as any, 'Error during graceful shutdown');
        process.exit(1);
      }
    });

    // Fallback timer
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
