import Redis from 'ioredis';
import url from 'url';
import { prettyLog } from './utils';

export default function createRedisClient() {

  let redisClient;
  if (process.env.REDISCLOUD_URL) {
    let rtg   = url.parse(process.env.REDISCLOUD_URL);
    redisClient = new Redis(rtg.port, rtg.hostname);
    redisClient.auth(rtg.auth.split(":")[1]);
  } else {
    redisClient = new Redis();
  }

  redisClient.on('connect', () => {
      prettyLog('Redis connected');
  });

  return redisClient;

}
