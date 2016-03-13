import crypto from 'crypto';

export function hash(value) {
  return crypto.createHash('md5').update(value).digest('base64');
}

export function sha256Hash(value) {
  return crypto.createHash('sha256').update(value).digest('base64');
}

export function prettyLog(message, lvl = 'INFO') {
  let log = console.log;

  if (lvl === 'ERROR' || lvl === 'FATAL') {
    log = console.error;
  } else if (lvl === 'WARN') {
    log = console.warn;
  }
  const ts = new Date();
  log(`[${lvl}]\t${ts}\t${message}`);
}
