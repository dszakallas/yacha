import task from './lib/task';
import { spawn } from 'child_process';

export let kill = task('redis-kill', async () => {
  const proc = spawn('./tools/redis-kill.sh');
  
  proc.stdout.on('data', function (data) {
    console.log('' + data);
  });

  proc.stderr.on('data', function (data) {
    console.log('' + data);
  });

  proc.on('close', function (code) {
    if (code !== 0) {
      console.log('ps process exited with code ' + code);
    }
  });
  
}); 

export let up = task('redis-up', async () => {
  
  const proc = await spawn('./tools/redis-up.sh');
  
  proc.stdout.on('data', function (data) {
    console.log('' + data);
  });

  proc.stderr.on('data', function (data) {
    console.log('' + data);
  });

  proc.on('close', function (code) {
    if (code !== 0) {
      console.log('ps process exited with code ' + code);
    }
  });
  
});
