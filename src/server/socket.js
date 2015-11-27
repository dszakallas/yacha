import cookieParser from 'socket.io-cookie';
import redisClient from './redis';

exports = module.exports = (io) => {

  io.use(cookieParser);

  io.use((socket, next) => {
    if (socket.request.headers.cookie) return next();
  });

  io.sockets.on('connection',  (socket) => {
    // when the client emits 'enterRoom', this listens and executes
    socket.on('enterRoom', (data) => {
      // store the room name in the socket session for this client
      socket.room = data.room;
      socket.join(room);
      // echo to client they've connected
      socket.broadcast.to(room).emit('userJoined',data);
    });

    // when the client emits 'sendchat', this listens and executes
    socket.on('sendChat', (data) => {
        let roomid = socket.room;
        let msg = data.message;
        let UserId = data.username;
        if (!msg || !roomid){
          //res.sendStatus(400);
          return;
        }
        redisClient.hget('rooms', roomid, (err, reply) => {
                if (err){
                    console.log("Internal server error");
                    //res.sendStatus(500);
                }
                else{
                  let roomDataString = reply;
                  let roomData = JSON.parse(roomDataString);
                  if (roomData === null){
                    //res.sendStatus(404);
                    return;
                  }
                  let member = false;
                  for (var j=0; j<roomData.Members.length; j++){
                    if (roomData.Members[j] === UserId)
                      member = true;
                  }
                  if (member){
                    let messages = roomData.Messages;
                    let currentDate = new Date();
                    let datetime = currentDate.toISOString();
                    let nmsg = {"Timestamp" : datetime, "User" : UserId, "Message" : msg};
                    messages.push(nmsg);
                    if (messages.length > 50)
                      messages.splice(0,1);
                    roomData.Messages=messages;
                    roomDataString = JSON.stringify(roomData);
                    redisClient.hset('rooms', roomid,roomDataString);
                    /*
                    let messagesToSend = [];
                    for(var i=0; i<roomData.Messages.length; i++){
                      messagesToSend.push({"user" : roomData.Messages[i].User, "timestamp" : roomData.Messages[i].Timestamp, "message" : roomData.Messages[i].Message});

                    }*/
                    socket.broadcast.to(socket.room).emit('updateChat', nmsg);
                  }
                  else{
                    //res.sendStatus(204);
                  }
                }
      });

    });

    socket.on('switchRoom', (data) => {
      // leave the current room (stored in session)
      socket.broadcast.to(socket.room).emit('userLeftRoom', data);
      socket.leave(socket.room);
      // join new room, received as function parameter
      socket.join(data.room);
      socket.room = data.room;
      socket.broadcast.to(room).emit('userJoined',data);
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', () => {
       // leave the current room (stored in session)
      socket.broadcast.to(socket.room).emit('userLeftRoom', data);
      socket.leave(socket.room);
    });
  });
/*||||||||||||||||||||END SOCKETS||||||||||||||||||*/
}
