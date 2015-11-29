import Redis from 'ioredis';
import url from 'url';
import { prettyLog } from '../utils/utils';;

export default function createRedisClient(cb) {

  let redisClient;
  if (process.env.REDISCLOUD_URL) {
    let rtg   = url.parse(process.env.REDISCLOUD_URL);
    redisClient = new Redis(rtg.port, rtg.hostname, rtg.auth.split(":")[1]);
  } else {
    redisClient = new Redis();
  }

  redisClient.on('connect', () => {
      if(cb) cb();
  });

  return redisClient;

}
