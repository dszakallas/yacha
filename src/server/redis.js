import redis from 'redis';
import url from 'url';
import { prettyLog } from './utils';

let redisClient;

if (process.env.REDISCLOUD_URL) {
  let rtg   = url.parse(process.env.REDISCLOUD_URL);
  redisClient = redis.createClient(rtg.port, rtg.hostname, {no_ready_check: true});
  redisClient.auth(rtg.auth.split(":")[1]);
} else {
  redisClient = redis.createClient();
}

redisClient.on('connect', () => {
    prettyLog('Redis connected');
});

export default redisClient;
