export default () => ({
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    name: process.env.DB_NAME ?? 'location_db',
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  app: {
    logMode: process.env.LOG_MODE ?? 'entry_only',
    entryTtlSeconds: parseInt(process.env.ENTRY_TTL_SECONDS ?? '300', 10),
    queueConcurrency: parseInt(process.env.QUEUE_CONCURRENCY ?? '5', 10),
  },
  server: {
    port: parseInt(process.env.PORT ?? '3000', 10),
  },
});
