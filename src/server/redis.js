import Redis from 'ioredis';

export default function createRedisClient(cb) {
  let redisClient;
  if (process.env.REDISCLOUD_URL) {
    redisClient = new Redis(process.env.REDISCLOUD_URL);
  } else {
    redisClient = new Redis();
  }

  redisClient.on('connect', () => {
    if (cb) {
      cb();
    }
  });

  return redisClient;
}
