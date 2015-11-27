/*! React Starter Kit | MIT License | http://www.reactstarterkit.com/ */

import { Router } from 'express';

import cookieParser from 'cookie-parser';
import crypto from 'crypto';

import bodyParser from 'body-parser';
import async from 'async'

import redisClient from './redis';
import emailClient from './email';
import { prettyLog, hash, sha256Hash } from './utils';

prettyLog('                        888             ');
prettyLog('                        888             ');
prettyLog('                        888             ');
prettyLog('888  888 8888b.  .d8888b88888b.  8888b. ');
prettyLog('888  888    "88bd88P"   888 "88b    "88b');
prettyLog('888  888.d888888888     888  888.d888888');
prettyLog('Y88b 888888  888Y88b.   888  888888  888');
prettyLog(' "Y88888"Y888888 "Y8888P888  888"Y888888');
prettyLog('     888                                ');
prettyLog('Y8b d88P                                ');
prettyLog(' "Y88P"                                 ');
prettyLog('                                        ');
prettyLog('*-------* YET ANOTHER CHAT APP *-------*');
prettyLog('|                                      |');
prettyLog('|Copyright (c) 2015 David Szakallas    |');
prettyLog('|                   Gergo Gembolya     |');
prettyLog('*--------------------------------------*');


const api = new Router();
api.use(cookieParser());
api.use(bodyParser.json()); // for parsing application/json
api.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


redisClient.hmset(`room:global`, {Private: false, Name: 'global'});


function sendInternalError(res) {
  res.sendStatus(500);
}

function checkAuthentication (req, res, cb, opts){
  let options = {
    invalidate: false
  };
  Object.assign(options, opts);

  let authToken = req.cookies.AuthToken;
  redisClient.hget('authTokens', authToken, (err, user) => {
    if(err) {
      console.error(err);
      sendInternalError(res)
    } else if(!user) {
      prettyLog(`client ${req.ip} unauthorized`, 'INFO');
      res.sendStatus(401);
    } else {
      if(options.invalidate) {
        res.clearCookie('AuthToken');
        res.set('X-Yacha-AuthToken', '');
        redisClient.hdel('authTokens', authToken);
        cb(req, res, user);
      } else {
        res.cookie('AuthToken', authToken, {path: '/api/'});
        res.set('X-Yacha-AuthToken', authToken);
        cb(req, res, user);
      }
    }
  });
}



api.post('/logout',  (req,res) => {
  checkAuthentication (req, res, (req, res) => { res.sendStatus(204); }, {invalidate: true});
});

api.post('/login',  (req,res) => {
  let email = req.body.email;
  let pw1 = req.body.password;
  if (!email || !pw1) {
    prettyLog("/login: Missing fields");
    res.sendStatus(400);
    return;
  }

  const emailHash = hash(email);

  redisClient.exists(`user:${emailHash}`, (err, exists) => {
    if(exists !== 1) {
      prettyLog("/login: Bad username");
      res.sendStatus(401);
    } else {
      let pwHash = hash(pw1);
      redisClient.hgetall(`user:${emailHash}`, (err, userData) => {
        if(err) {
          console.error(err);
          sendInternalError(res);
        } else {
          if(!userData.Activated) {
            prettyLog("/login: Not activated");
            res.sendStatus(401);
          } else if(userData.Password !== pwHash) {
            prettyLog("/login: Bad password");
            res.sendStatus(401);
          } else {
            let authToken = crypto.randomBytes(64).toString('hex');
            res.cookie('AuthToken', authToken, {path: '/api/'});
            res.set('X-Yacha-AuthToken', authToken);
            redisClient.hset(`authTokens`, authToken, emailHash);
            prettyLog(`/login: ${userData.email} logged in`);
            res.status(200).send({ email: userData.Email, nickname: userData.NickName });
          }
        }
      });
    }
  });
});


api.post('/register',  (req,res) => {
  let nickname = req.body.username;
  let email = req.body.email;
  let pw1 = req.body.password;
  if (!(nickname && email && pw1)){
    console.log("/api/register: Missing fields");
    res.sendStatus(400);
    return;
  }

  let emailHash = hash(email);

  console.log("id is: " + emailHash);

  redisClient.exists(`user:${emailHash}`, (err, exists) => {
    if(exists) {
      console.log('api/register the user exists');
      let reasonCode = {"reason" : 0};
      res.status(400).send(reasonCode);
    } else {
      redisClient.hexists('nicknames', nickname, (err, nicknameTaken) => {
        if(nicknameTaken) {
          console.log('api/register nickname taken');
          let reasonCode = {"reason" : 1 };
          res.status(400).send(reasonCode);
        } else {
          let pwhash = hash(pw1);

          let newuser = {
            "Email" : email,
            "NickName" : nickname,
            "Password" : pwhash
          };

          redisClient.multi()
            .hmset(`user:${emailHash}`, { "Email" : email, "NickName" : nickname, "Password" : pwhash })
            .sadd(`room:global:members`, emailHash)
            .sadd(`member:${emailHash}:rooms`, 'global')
            .hset(`nicknames`, nickname, emailHash)
            .exec( (err) => {
              if(err) {
                console.error(err);
                sendInternalError(res);
              }
              else {
                res.sendStatus(204);
              }
            });
        }
      });
    }
  });
  console.log('/api/register');
});


api.get('/user',  (req,res) => {
  checkAuthentication(req, res, (req, res, emailHash) => {
    console.log("id is: " + emailHash);
    redisClient.hgetall(`user:${emailHash}`, (err, userData) => {
        if (err || !userData)
          sendInternalError(res);
        else{
          let publicParams = {"nickname" : userData.NickName, "email" : userData.Email };
          res.send(publicParams);
        }
    });
    console.log('/api/user GET');
  });
});

api.put('/user',  (req,res) => {
  checkAuthentication(req,res, (req,res, emailHash) => {

    let password = req.body.password;

    if(!password) {
      res.sendStatus(400);
    } else {
      const pwHash = hash(password);
      redisClient.hset(`users:${emailHash}`, 'Password', password, (err) => {
        res.status(200).send({ password: password });
      });
    }
    console.log('/api/user PUT');
  });
});


api.get('/user/rooms', (req,res) => {
  checkAuthentication(req, res, (req, res, emailHash) => {

    redisClient.smembers(`member:${emailHash}:rooms`, (err, rooms) => {
        async.map(rooms, (room, cb) => {
          let result = {};
          //get 0 dimensinal room Data
          redisClient.hgetall(`room:${room}`, (err, roomData) => {
            Object.assign(result, { id: room, name: roomData.Name, private: roomData.Private });

            // get admin data
            redisClient.sismember(`room:${room}:admins`, emailHash, (err, isAdmin) => {
              if(isAdmin) {
                Object.assign(result, {admin: true});
              }
              cb(err, result);
            });
          });
        }, (err, rooms) => {
          if(err)
            sendInternalError(res);
          else
            res.status(200).send(rooms);
        });
    });
    console.log('/api/user/rooms GET');
  });
});

api.get('/user/rooms/:roomid', (req,res) => {
  checkAuthentication(req,res, (req, res, emailHash) => {

    let roomid = req.params.roomid;

    redisClient.sismember(`member:${emailHash}:rooms`, roomid, (err, isMember) => {
      if(err) {
        sendInternalError(res);
      } else if(!isMember) {
        res.sendStatus(404);
      } else {
        let result = {}
        async.parallel([
          (cb) => {
            redisClient.hgetall(`room:${roomid}`, (err, roomData) => {
              if(roomData)
                Object.assign(result, { name: roomData.Name, id: roomid, private: roomData.Private });
              cb(err);
            });
          },
          (cb) => {
            redisClient.smembers(`room:${roomid}:admins`, (err, adminIds) => {
              async.map(adminIds, (adminId, cb_) => {
                redisClient.hget(`user:${adminId}`, 'NickName', (err, nickname) => {
                  cb_(err, { id: adminId, nickname: nickname });
                });
              }, (err, admins) => {
                if(admins)
                  Object.assign(result, { admins: admins });
                cb(err);
              });
            });
          },
          (cb) => {
            redisClient.smembers(`room:${roomid}:members`, (err, memberIds) => {
              async.map(memberIds, (memberId, cb_) => {
                redisClient.hget(`user:${memberId}`, 'NickName', (err, nickname) => {
                  cb_(err, { id: memberId, nickname: nickname });
                });
              }, (err, members) => {
                if(members)
                  Object.assign(result, { members: members });
                cb(err);
              });
            });
          }], (err) => {
          if(err)
            sendInternalError(res)
          else {
            res.status(200).send(result);
          }
        });
      }
    });
    console.log('/api/rooms/roomid GET');
  });
});

api.delete('/user/rooms/:roomid',  (req,res) => {
  checkAuthentication(req,res, (req,res, emailHash) => {

    let roomid = req.params.roomid;

    redisClient.sismember(`member:${emailHash}:rooms`, roomid, (err, isMember) => {
      if(err)
        sendInternalError(res);
      else if(!isMember) {
        res.sendStatus(404);
      }
      else {
        redisClient.smembers(`room:${roomid}:admins`, emailHash, (err, admins) => {
          if(err)
            sendInternalError(res);
          else {
            if(admins.indexOf(emailHash) !== -1 && admins.length === 1) {
              //sole owner
              res.status(400).send({"reason" : 10});
            } else {
              //safe to delete
              redisClient.multi()
                .srem(`member:${emailHash}:rooms`, roomid)
                .srem(`admin:${emailHash}:rooms`, roomid)
                .srem(`room:${roomid}:admins`, emailHash)
                .srem(`room:${roomid}:members`, emailHash)
                .exec((err) => {
                  if(err)
                    sendInternalError(res);
                  else
                    res.sendStatus(204);
                });
            }
          }
        });
      }
    });
    console.log('/api/ser/rooms/:roomid DELETE');
  });
});

api.post('/user/rooms/:roomid/join',  (req,res) => {
  checkAuthentication(req,res, (req,res, emailHash) => {
    let roomid = req.params.roomid;

    redisClient.sismember(`member:${emailHash}:rooms`, roomid, (err, isMember) => {
      if(err)
        sendInternalError(res);
      else if(isMember)
        res.status(400).send({"reason" : 11});
      else {
        redisClient.sismember(`rooms`, roomid, (err, roomExists) => {
          if(err)
            sendInternalError(res);
          else if(!roomExists)
            res.sendStatus(404);
          else {
            redisClient.multi()
              .sadd(`member:${emailHash}:rooms`, roomid)
              .sadd(`room:${roomid}:members`, emailHash)
              .exec((err) => {
                if(err)
                  sendInternalError(res);
                else
                  res.sendStatus(204);
              });
          }
        });
      }
    });
    console.log('/api/user/rooms/:roomid/join POST');
  });
});

api.get('/user/rooms/:roomid/messages', (req,res) => {
  checkAuthentication(req,res, (req,res, emailHash) => {
    let roomid = req.params.roomid;

    redisClient.exists(`room:${roomid}`, (err, roomExists) => {
      if(err)
        sendInternalError(res);
      else if(!roomExists)
        res.sendStatus(404);
      else {
        redisClient.sismember(`member:${emailHash}:rooms`, roomid, (err, isMember) => {
          if(err)
            sendInternalError(res);
          else if(!isMember)
            res.sendStatus(404);
          else {
            redisClient.exists(`room:${roomid}:messages`, (err, exists) => {
              if(!exists) {
                res.status(200).send([]);
              } else {
                //return last 50 messages
                redisClient.zrevrange(`room:${roomid}:messages`, 0, 49, (err, messages) => {
                  if(err)
                    sendInternalError(res);
                  else {
                    let parsed = messages.map(
                      (message) => { return JSON.parse(message);
                        delete result.ServerTimestamp; //client dont need this
                        return result;
                    });
                    let [...ids] = new Set(parsed.map((message) => { return message.User; }));

                    let liftedUsers = {};

                    for(let id of ids)
                      liftedUsers[id] = '';

                    async.parallel(ids,
                    (id, cb) => {
                      redis.hget(`user:${id}`, 'NickName', (err, nickname) => {
                        if(nickname)
                          liftedUsers[id] = nickname;
                        cb(null); //fail silently here
                      });
                    },
                    (err) => {
                      if(err)
                        sendInternalError(res);
                      else {
                        let results = parsed.map(
                          (message) => {
                            let userid = message.User;
                            message.User = { id: userid };
                            let nickname = liftedUsers[userid];
                            if(nickname)
                              message.User.nickname = nickname;
                        });
                        res.status(200).send(results);
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
    console.log('/api/user/rooms/:roomid/messages GET');
  });
});

api.post('/user/rooms/:roomid/messages', (req,res) => {

  checkAuthentication(req,res, (req,res, emailHash) => {
    let roomid = req.params.roomid;
    let msg = req.body.message;
    let clientTimestamp = req.body.clientTimestamp;
    if (!msg || !clientTimestamp){
      res.sendStatus(400);
      return;
    }

    redisClient.exists(`room:${roomid}`, (err, roomExists) => {
      if(err)
        sendInternalError(res);
      else if(!roomExists)
        res.sendStatus(404);
      else {
        redisClient.sismember(`member:${emailHash}:rooms`, roomid, (err, isMember) => {
          if(err)
            sendInternalError(res);
          else if(!isMember)
            res.sendStatus(404);
          else {
            let serverTimestamp = new Date();
            let nmsg = {
              ServerTimestamp : serverTimestamp,
              ClientTimestamp : clientTimestamp,
              User : emailHash,
              Message : msg
            };
            //return last 50 messages
            redisClient.zadd(`room:${roomid}:messages`,
              serverTimestamp.getTime(),
              JSON.stringify(nmsg),
              (err, messages) => {
              if(err)
                sendInternalError(res);
              else {
                res.sendStatus(204);
              }
            });
          }
        });
      }
    });
    console.log('/api/user/rooms/:roomid/messages POST');
  });
});

api.get('/user/admin/rooms', (req,res) => {
  checkAuthentication(req,res, (req,res, emailHash) => {

    redisClient.smembers(`admin:${emailHash}:rooms`, (err, rooms) => {
      async.map(rooms, (room, cb) => {
        redisClient.hgetall(`room:${room}`, (err, roomData) => {
          cb(err, { id: room, name: roomData.Name, admin: true });
        });
      }, (err, rooms) => {
        if(err)
          sendInternalError(res);
        else
          res.status(200).send(rooms);
      });

    });
    console.log('/api/user/admin/rooms GET');
  });
});

api.post('/user/admin/rooms',  (req,res) => {
  checkAuthentication(req,res, (req,res, emailHash) => {
    let Name = req.body.name;
    if (!Name){
      res.sendStatus(400);
      return;
    }
    const roomId = hash(crypto.randomBytes(64).toString('hex'));
    redisClient.multi()
      .hmset(`room:${roomId}`, {Private: false, Name: Name})
      .sadd(`room:${roomId}:admins`, emailHash)
      .sadd(`room:${roomId}:members`, emailHash)
      .sadd(`admin:${emailHash}:rooms`, roomId)
      .sadd(`member:${emailHash}:rooms`, roomId)
      .exec((err) => {
        if(err)
          sendInternalError(res);
        else {
          let rData = {
            "name" : Name,
            "id" : roomId,
            "members" : [emailHash],
            "admins" : [emailHash],
            "private" : false
          };
          res.status(201).send(rData);
        }
      });
    console.log('/apiuser/admin/rooms POST');
  });
});

api.put('/user/admin/rooms/:roomid',  (req,res) => {
  checkAuthentication(req,res, (req,res, emailHash) => {
    var roomid = req.params.roomid;
    var newName = body.name;

    if(!body.name) {
      res.sendStatus(400);
      return;
    }

    redisClient.sismember(`admin:${emailHash}:rooms`, roomid, (err, isAdmin) => {
      if(!isAdmin) {
        res.sendStatus(404);
      } else {
        redisClient.hset(`room:${roomid}`, 'Name', newName, (err) => {
          if(err)
            sendInternalError(res);
          else{
            res.status(200).send({'name' : newName} );
          }
        });
      }
    });
    console.log('/api/user/admin/rooms/roomid PUT');
  });
});

api.put('/user/admin/rooms/:roomid/invite/:userid',  (req,res) => {
  checkAuthentication(req,res, (req,res, emailHash) => {
  let userid = req.params.userid;
  let roomid = req.params.roomid;

  redisClient.sismember(`admin:${emailHash}:rooms`, roomid, (err, isAdmin) => {
    if(!isAdmin) {
      res.sendStatus(404);
    } else {
      redisClient.exists(`user:${userid}`, (err, exists) => {
        if(!exists) {
          res.status(400).send({"reason" : 0});
        } else {
          redisClient.sismember(`room:${roomid}:members`, userid, (err, isMember) => {
            if(isMember){
              res.status(400).send({"reason" : 1});
            } else {
              redisClient.hgetall(`room:${roomid}`, (err, roomData) => {
                redisClient.hgetall(`user:${userid}`, (err, userData) => {

                  let mailOptions = {
                     from: 'yacha ✔ <yacha@yachamail.com>', // sender address
                     to: userData.Email, // list of receivers
                     subject: 'Yacha chat room invitation', // Subject line
                     text: `Dear ${userData.NickName},\nYou were invited to the ${roomData.Name} room.\nThe room id is: ${roomid} .`
                  };

                  emailClient.sendMail(mailOptions, function(error, info){
                     if(error){
                         res.sendStatus(500);
                         return console.log(error);
                     }
                     console.log('Message sent: ' + info.response);
                     res.sendStatus(204);

                    });
                  });
                });
              }
            });
          }
        });
      }
    });
    console.log('api//user/admin/rooms/:roomid/invite/:uname PUT');
  });
});

api.delete('/user/admin/rooms/:roomid',  (req,res) => {
  checkAuthentication(req,res, (req,res, emailHash) => {
    let roomid = req.params.roomid;

    redisClient.sismember(`admin:${emailHash}:rooms`, roomid, (err, isAdmin) => {
      if(!isAdmin) {
        res.sendStatus(404);
      } else {
        async.parallel([
          (cb) => {
            redisClient.smembers(`room:${roomid}:members`, (err, members) => {
              async.each(members, (member, cb_) => {
                redisClient.srem(`member:${member}:rooms`, roomid, (err) => {
                  cb_(null);
                });
              }, (err) => {
                cb(null);
              });
            });
          },
          (cb) => {
            redisClient.smembers(`room:${roomid}:admins`, (err, admins) => {
              async.each(admins, (admin, cb_) => {
                redisClient.srem(`admin:${admin}:rooms`, roomid, (err) => {
                  cb_(null);
                });
              }, (err) => {
                cb(null);
              });
            });
          }
        ], (err) => {
          //user_id -> room_id assoc cleared
          redisClient.multi()
            .del(`room:${roomid}:members`)
            .del(`room:${roomid}:admins`)
            .del(`room:${roomid}:messages`)
            .del(`room:${roomid}`)
            .exec((err) => {
              if(err)
                sendInternalError(res)
              else {
                res.sendStatus(204);
              }
            });
        });
      }
    });
    console.log('/api/user/admin/rooms/roomid DELETE');
  });
});

api.get('/users/:userid',  (req,res) => {
  checkAuthentication(req,res, (req,res, emailHash) => {
    let userid = req.params.userid;
    redisClient.exists(`user:${userid}`, (err, exists) => {
      if(!exists){
        res.sendStatus(404);
      } else {
        redisClient.hgetall(`user:${userid}`, (err, userData) => {
          res.status(200).send({ nickname: userData.NickName, email: userData.Email });
        });
      }
    });
    console.log('/api/user/:userid GET');
  });
});


api.get('/users/search',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    let kw = req.query.q;
    let users = [];
    if(kw.length < 4) {
      res.sendStatus(400);
    } else {
      redisClient.hkeys('nicknames', (err, all) => {
        let matched = all.filter((nickname) => {
          return (nickname.search(kw) !== -1);
        });
        redisClient.hmget('nicknames', matched, (err, ids) => {
          async.map(ids, (id, cb) => {
            redisClient.hget(`user:${id}`, 'Email', (err, email) => {
              cb(null, email);
            });
          }, (err, emails) => {
            let results = [];
            for(let i = 0; i < emails.length; ++i) {
              results.push({ email: emails[i], nickname: matched[i] });
            }
            res.status(200).send(results);
          });
        });
      });
    }
    console.log('/api/users/search/:keyword GET');
  });
});

api.get('/user/friends',  (req,res) => {
  checkAuthentication(req,res, (req, res, emailHash) => {

    redisClient.smembers(`user:${emailHash}:friends`, (err, friends) => {
      async.map(friends, (friend, cb) => {
        redisClient.hgetall(`user:${friend}`, (err, data) => {
          cb(null, {email: data.Email, nickname: data.NickName});
        });
      }, (err, results) => {
        res.status(200).send(results);
      });
    });
    console.log('/api/user/friends GET');
  });
});

api.get('/user/friends/invite',  (req,res) => {
  checkAuthentication(req,res, (req,res, emailHash) => {

    redisClient.smembers(`user:${emailHash}:invites`, (err, invites) => {
      async.map(invites, (invited, cb) => {
        redisClient.hgetall(`user:${invited}`, (err, data) => {
          cb(null, {email: data.Email, nickname: data.NickName});
        });
      }, (err, results) => {
        res.status(200).send(results);
      });
    });
    console.log('/api/user/friends/invite GET');
  });
});

api.put('/user/friends/invite/:userid',  (req,res) => {
  checkAuthentication(req,res, (req, res, emailHash) => {

    let userid = req.params.userid;

    //funny user
    if(userid == emailHash) {
      res.sendStatus(400);
    } else {
      redisClient.exists(`user:${userid}`, (err, exists) => {
        if(!exists) {
          res.sendStatus(404);
        } else {
          redisClient.multi()
            .sadd(`user:${emailHash}:invites`, userid)
            .sadd(`user:${userid}:requests`, emailHash)
            .exec( (err) => {
              res.sendStatus(204);
            });
        }
      });
    }
    console.log('/api/user/friends/invite/:uid PUT');
  });
});

api.get('/user/friends/invite/requests',  (req,res) => {
  checkAuthentication(req,res, (req,res, emailHash) => {

    redisClient.smembers(`user:${emailHash}:requests`, (err, requests) => {
      async.map(requests, (requested, cb) => {
        redisClient.hgetall(`user:${requested}`, (err, data) => {
          cb(null, {email: data.Email, nickname: data.NickName});
        });
      }, (err, results) => {
        res.status(200).send(results);
      });
    });
    console.log('/api/user/friends/invite/requests GET');
  });
});

api.put('/user/friends/invite/requests/:userid',  (req,res) => {
  checkAuthentication(req,res, (req,res, emailHash) => {

    let userid = req.params.userid;

    redisClient.sismember(`user:${emailHash}:requests`, userid, (err, exists) => {
      if(!exists) {
        res.sendStatus(404);
      } else {
        redisClient.multi()
          .sadd(`user:${emailHash}:friends`, userid)
          .sadd(`user:${userid}:friends`, emailHash)
          .exec( (err) => {
            res.sendStatus(204);
          });
      }
    });
    console.log('/api/user/friends/invite/requests/:uid PUT');
  });
});

api.get('/user/pm/:userid',  (req,res) => {
  checkAuthentication(req,res, (req,res, emailHash) => {

    let otherUser = req.params.userid;

    // Watch out! Clever stuff
    // Im comparing the user ids lexicographically
    // to create an ordering, then concatenate and hash them in order
    // this way it doesn't matter which user posts, the same room will be
    // looked up
    let [userA, userB] = emailHash > otherUser ? [emailHash, otherUser] : [otherUser, emailHash];
    let pmId = hash(`${userA}${userB}`);

    redisClient.zrevrange(`room:${pmId}:messages`, 0, 49, (err, messages) => {
      let parsed = messages.map(
        (message) => { return JSON.parse(message);
          delete result.ServerTimestamp; //client dont need this
          return result;
      });
      res.status(200).send(parsed);
    });
    console.log('/api/user/pm/:uid GET');
  });
});

api.post('/user/pm/:userid',  (req,res) => {
  checkAuthentication(req,res, (req,res, emailHash) => {
    let otherUser = req.params.userid;

    let message = req.body.message;
    let clientTimestamp = req.body.clientTimestamp;

    if (!msg || !clientTimestamp){
      res.sendStatus(400);
      return;
    }

    let serverTimestamp = new Date();

    // Watch out! Clever stuff
    // Im comparing the user ids lexicographically
    // to create an ordering, then concatenate and hash them in order
    // this way it doesn't matter which user posts, the same room will be
    // looked up
    let [userA, userB] = emailHash > otherUser ? [emailHash, otherUser] : [otherUser, emailHash];
    let pmId = hash(`${userA}${userB}`);

    let stringified = JSON.stringify({
      ServerTimestamp : serverTimestamp,
      ClientTimestamp : clientTimestamp,
      User : emailHash,
      Message : msg
    });

    redisClient.zadd(`room:${pmId}:messages`,
      serverTimestamp.getTime(),
      stringified,
      (err) => {
        res.sendStatus(204);
      });
  console.log('/api/user/pm/:uid POST');
  });
});


api.post('/activate/send',  (req,res) => {
    let email = req.body.email;
    if (!email){
      res.sendStatus(400);
      return;
    }

    const emailHash = hash(email);

    console.log("id is: " + emailHash);

    let token = crypto.randomBytes(64).toString('hex');

    redisClient.exists(`user:${emailHash}`, (err, exists) => {
      if(exists !== 1) {
        console.log('/activate/send: cannot find email');
        res.sendStatus(400);
      } else {
        redisClient.hset('activationTokens', token, emailHash, (err, reply) => {
          if(err) {
            console.error(err);
            sendInternalError(res);
          }
          else {
            let mailOptions = {
                from: 'yacha ✔ <yacha@gmail.com>', // sender address
                to: email, // list of receivers
                subject: 'Hello ✔', // Subject line
                text: 'Activation a tokennel ' + token
            };
            // send mail with defined transport object
            emailClient.sendMail(mailOptions, function(error, info){
                  if(error){
                      res.sendStatus(400);
                      return console.log(error);
                  }
                  console.log('Message sent: ' + info.response);
                  res.sendStatus(204);

            });
          }
      });
    }
  });
  console.log('/api/activate/send post');
});

api.post('/activate/verify',  (req,res) => {
    let token = req.body.token;
    if (!token){
      res.sendStatus(400);
      return;
    }

    redisClient.hget('activationTokens', token, (err, emailHash) => {
      if(!emailHash)
        res.sendStatus(400);
      else {
        console.log("id is: " + emailHash);
        redisClient.multi()
          .hset(`user:${emailHash}`, 'Activated', 'true' )
          .hdel('activationTokens', token)
          .exec((err, reply) => {
            if(err) {
              console.error(err);
              sendInternalError(res);
            }
            else
              res.sendStatus(204);
          });
      }
    });
    console.log('/api/activate/verify post');
});


api.post('/forgot/send',  (req,res) => {
  let email = req.body.email;
  if (!email){
    res.sendStatus(400);
    return;
  }

  const emailHash = hash(email);
  let token = crypto.randomBytes(64).toString('hex');

  redisClient.exists(`user:${emailHash}`, (err, reply) => {
    if(reply !== 1) {
      res.sendStatus(404);
    } else {
      redisClient.hset('forgotTokens', token, emailHash, (err, reply) => {
        if(err)
          sendInternalError(res);
        else {
          let mailOptions = {
              from: 'yacha ✔ <yacha@gmail.com>', // sender address
              to: email, // list of receivers
              subject: 'Hello ✔', // Subject line
              text: 'Forgot a tokennel ' + token
          };
          // send mail with defined transport object
          emailClient.sendMail(mailOptions, function(error, info){
                if(error){
                    res.sendStatus(400);
                    return console.log(error);
                }
                console.log('Message sent: ' + info.response);
                res.sendStatus(204);

          });
        }
      });
    }
  });
  console.log('/api/forgot/send post');
});

api.post('/forgot/verify', (req,res) => {
  let token = req.body.token;
  if (!token){
    res.sendStatus(400);
    return;
  }

  redisClient.hget('forgotTokens', token, (err, emailHash) => {
    if(!emailHash)
      res.sendStatus(400);
    else {
      let authToken = crypto.randomBytes(64).toString('hex');
      redisClient.multi()
        .hdel('forgotTokens', token)
        .hset(`authTokens`, authToken, emailHash)
        .exec((err, reply) => {
          if(err)
            sendInternalError(res);
          else {
            res.cookie('AuthToken', authToken, { path: '/api/'});
            res.set('X-Yacha-AuthToken', authToken);
            res.sendStatus(204);
          }
        });
    }
  });
  console.log('/api/forgot/verify post');
});

export default api;
