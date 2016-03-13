import createRedisClient from './redis';
import { parse } from 'cookie';

import { prettyLog, hash } from './utils';

let redisClient = createRedisClient(() => prettyLog("Redis client connected: sockets"));

exports = module.exports = (io) => {

  io.sockets.use((socket, next) => {

    if(!socket.request.headers.cookie)
      next(new Error('Authentication error'));
    else {
      const cookie = parse(socket.request.headers.cookie);
      if(!cookie.AuthToken) {
        next(new Error('Authentication error'));
      } else {
        redisClient.hget('authTokens', cookie.AuthToken, (err, user) => {
          if(!user)
            next(new Error('Authentication error'));
          else {
            prettyLog(`Socket ${socket.id} authenticated`);
            redisClient.hmget(`user:${user}`, ['NickName', 'Email'], (err, userData) => {
              socket.data = {
                user: { nickname: userData[0], email: userData[1] }
              };
              next();
            });
          }
        });
      }
    }
  });

  io.on('connection',  (socket) => {

    prettyLog(`Socket ${socket.id} successfully connected`);

    let roomSubscriber = createRedisClient();



    // when the client emits 'join', this listens and executes
    socket.on('join', (room) => {

      let { id, Private } = room;

      let userid = hash(socket.data.user.email);

      let joinAndSubscribe = () => {
        socket.join(socket.data.room);
        io.sockets.in(socket.data.room).emit('userJoined',
          JSON.stringify({
            ServerTimestamp: new Date(),
            Status: 'join',
            User: socket.data.user
          }));

        roomSubscriber.subscribe(`room:${socket.data.room}:messages`, () => {
          prettyLog(`${socket.data.user.email} subscribed to room:${socket.data.room}:messages`);
        });

        roomSubscriber.on('message', (channel, message) => {
          prettyLog(`Message arrived, pushing to client...`);
          socket.emit('chatUpdated', message);
        });
      };

      if(!Private) {

        redisClient.sismember(`member:${userid}:rooms`, id, (err, isMember) => {
          if(!isMember) {
            prettyLog(`${socket.data.user.email} tried to join the bad room ${id}`, 'WARN');
          } else {
            prettyLog(`${socket.data.user.email} joined the room ${id}`);
            socket.data.room = id;
            joinAndSubscribe();
          }
        });
      } else /*Private*/ {
        let otheruser = id;
        redisClient.exists(`user:${otheruser}`, (err, exists) => {
          if(!exists) {
            prettyLog(`${socket.data.user.email} tried to join a private room with invalid user ${id}`, 'WARN');
          } else {
            let [userA, userB] = userid > otheruser ? [userid, otheruser] : [otheruser, userid];
            let roomid = hash(`${userA}${userB}`);
            socket.data.room = roomid;
            joinAndSubscribe();
          }
        });
      }
    });


    socket.on('leave', () => {
      socket.broadcast.to(socket.data.room).emit('userLeft',
        JSON.stringify({
          ServerTimestamp: new Date(),
          Status: 'leave',
          User: socket.data.user
        }));
      let room = socket.data.room;
      delete socket.data.room;
      roomSubscriber.unsubscribe();
      prettyLog(`${socket.data.user.email} left the room ${room}`);
    });

    socket.on('disconnect', () => {

      if(socket.data.room) {
        socket.broadcast.to(socket.data.room).emit('userLeft',
          JSON.stringify({
            ServerTimestamp: new Date(),
            Status: 'leave',
            User: socket.data.user
          }));
        socket.leave(socket.room);
        prettyLog(`${socket.data.user.email} left the room ${socket.data.room}`);
      }
      roomSubscriber.disconnect();
      prettyLog(`socket ${socket.id} disconnecting`);
    });

    socket.on('updateChat', (message) => {
      if(!message || !message.Message)
        return

      let emailHash = hash(socket.data.user.email);

      redisClient.hmget(`user:${emailHash}`, ['NickName', 'Email'], (err, data) => {
        let serverTimestamp = new Date();
        let nmsg = {
          ServerTimestamp : serverTimestamp,
          ClientTimestamp : message.ClientTimestamp,
          User : { nickname: data[0], email: data[1] },
          Message : message.Message
        };

        redisClient.zadd(`room:${socket.data.room}:messages`,
          serverTimestamp.getTime(),
          JSON.stringify(nmsg),
          (err) => {
            io.sockets.in(socket.data.room).emit('chatUpdated', JSON.stringify(nmsg));
        });
      });
    });
  });
}
