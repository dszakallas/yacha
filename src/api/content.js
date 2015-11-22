/*! React Starter Kit | MIT License | http://www.reactstarterkit.com/ */

import { join } from 'path';
import { Router } from 'express';
import jade from 'jade';
import fm from 'front-matter';
import fs from '../utils/fs';
import redis from 'redis';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import url from 'url';
import bodyParser from 'body-parser';
import async from 'async'
import nodemailer from 'nodemailer';
import smtp from 'nodemailer-smtp-transport';

// create reusable transporter object using SMTP transport
let transporter = nodemailer.createTransport(smtp({
    port: process.env.MAILGUN_SMTP_PORT,
    host: process.env.MAILGUN_SMTP_SERVER,
    auth: {
        user: process.env.MAILGUN_SMTP_LOGIN,
        pass: process.env.MAILGUN_SMTP_PASSWORD
    },
    name: 'yacha.herokuapp.com'
}));



// A folder with Jade/Markdown/HTML content pages
const CONTENT_DIR = join(__dirname, './content');

// Extract 'front matter' metadata and generate HTML
const parseJade = (path, jadeContent) => {
  const fmContent = fm(jadeContent);
  const htmlContent = jade.render(fmContent.body);
  return Object.assign({ path, content: htmlContent }, fmContent.attributes);
};

const router = new Router();
router.use(cookieParser());
router.use(bodyParser.json()); // for parsing application/json
router.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
let redisClient;
let UserId = 'undef';

if (process.env.REDISCLOUD_URL) {
  let rtg   = url.parse(process.env.REDISCLOUD_URL);
  redisClient = redis.createClient(rtg.port, rtg.hostname, {no_ready_check: true});
  redisClient.auth(rtg.auth.split(":")[1]);
} else {
  redisClient = redis.createClient();
}

function checkAuthentication (req, res, cb, opts){
    let options = {
      invalidate: false
    };
    Object.assign(options, opts);

    let randNum = req.cookies.AuthNumber;
    UserId = '';
    console.log(randNum);
    redisClient.hkeys('users', function(err, keys) {
          async.each(keys, function(key, callback) {
            redisClient.hget('users', key, function(err, value) {
              if (err){
                console.log("Internal server error");
                res.sendStatus(500);
                return;
              }

              let userData = JSON.parse(value);
              if (userData.AuthNumber === randNum){
                if (options.invalidate){
                  userData.AuthNumber = '';
                  redisClient.hset('users',key,JSON.stringify(userData));
                }
                UserId=key;
              }
              callback(err);
              if(options.invalidate) {
                delete userData.AuthNumber;
              }
            });
          }, function() {
              if (UserId != ''){
                console.log('The user is authenticated');
                cb(req,res);
              }
              else{
                console.log('The user is not authenticated');
                res.sendStatus(401);
              }
          });
    });
    console.log('Authentication function');
}


redisClient.on('connect', () => {
    console.log('REDIS connected');
});

router.post('/logout',  (req,res) => {
  checkAuthentication (req, res, (req, res) => { res.sendStatus(204); }, {invalidate: true});
});

router.post('/login',  (req,res) => {
  let email = req.body.email;
  let pw1 = req.body.password;
  if (!email || !pw1) {
    console.log("/api/login: Missing fields");
    res.sendStatus(400);
    return;
  }


  redisClient.hexists('users', email, (err, reply) => {
    if (reply === 1) {
        let pwHash = crypto.createHash('md5').update(pw1).digest('hex');
        redisClient.hget('users', email, (err, reply) => {
          if (err){
            console.log("/api/login: Internal server error");
            res.sendStatus(500);
          }
          else{
            let userDatastring=reply;
            let userData=JSON.parse(userDatastring);

            let activated = false;
            if (userData.Activated){
              activated = userData.Activated;
            }
            if (userData.Password === pwHash && activated === true){
              let authNumber = crypto.randomBytes(64).toString('hex');
              userData.AuthNumber=authNumber;
              let userString = JSON.stringify(userData);
              redisClient.hdel('users', email);
              redisClient.hset('users',email,userString);
              res.cookie('AuthNumber', authNumber);
              let resData = {email: email, nickname : userData.NickName};
              console.log("/api/login: Authenticated");
              res.status(200).send(resData);
            }
            else {
              console.log("/api/login: Bad password");
              res.sendStatus(401);
            }
          }
        });
    }
    else {
      console.log("/api/login: Bad username");
      res.sendStatus(401);
    }
  });
});


router.post('/register',  (req,res) => {
  let nickname = req.body.username;
  let email = req.body.email;
  let pw1 = req.body.password;
  if (!(nickname && email && pw1)){
    console.log("/api/register: Missing fields");
    res.sendStatus(400);
    return;
  }

  redisClient.hexists('users',email, (err, reply) => {
    if (reply === 1) {
        console.log('api/register the user exists');
        let reasonCode = {"reason" : 0};
        res.status(400).send(reasonCode);
    } else {
        let pwhash = crypto.createHash('md5').update(pw1).digest('hex');
        let validNickName=true;
        redisClient.hkeys('users', function(err, keys) {
          async.each(keys, function(key, callback) {
            redisClient.hget('users',key, function(err, value) {
              if (err){
                console.log("Internal server error");
                res.sendStatus(500);
                return;
              }
              let userData = JSON.parse(value);

              if (userData.NickName === nickname){
                validNickName=false;
                console.log("/api/register invalid nickname");
              }
              callback(err);
            });
          }, function() {
              if (validNickName === false){
                let reasonCode = {"reason" : 1};
                res.status(400).send(reasonCode);
              }
              else{
                let newuser = { "Email" : email, "NickName" : nickname, "Password" : pwhash };
                let newuserstring = JSON.stringify(newuser);
                redisClient.hset('users', email,newuserstring);
                res.sendStatus(204);
              }
          });
        });
    }
  });
  console.log('/api/register');
});

router.get('/user',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    redisClient.hget('users', UserId, (err, reply) => {
        if (err){
            console.log("Internal server error");
            res.sendStatus(500);
        }
        else{
          let userData=JSON.parse(reply);
          let publicParams = {"nickname" : userData.NickName, "email" : userData.Email };
          res.send(publicParams);
        }
    });
    console.log('/api/user GET');
  });
});

router.put('/user',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {

    // csak nicknkevet és password-ot is lehet, ahogy wikin le van írva
    let nickname = req.body.nickname;
    let password = req.body.password;
    if (!(nickname || password)){
      res.sendStatus(400);
      return;
    }
    redisClient.hget('users', UserId, (err, reply) => {
        if (err){
            console.log("Internal server error");
            res.sendStatus(500);
        }
        else{
          let userData=JSON.parse(reply);
          if (nickname)
            userData.NickName = nickname;
          if (password)
            userData.Password = crypto.createHash('md5').update(password).digest('hex');
          let newUserString = JSON.stringify(userData);
          redisClient.hset('users', UserId,newUserString);
          let publicParams = {"nickname" : nickname, "password" : password};
          res.status(200).send(publicParams);
        }

    });

  });
  console.log('/api/user PUT')
});

router.delete('/user',  (req,res) => {
 checkAuthentication(req,res, (req,res) => {
    redisClient.hdel('users', UserId);
    res.sendStatus(204);
    console.log("/api/user DELETE");
  });
});

router.get('/user/rooms',   (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    let rooms = [];
    redisClient.hkeys('rooms', function(err, keys) {
          async.each(keys, function(key, callback) {
            redisClient.hget('rooms',key, function(err, value) {
              if (err){
                console.log("Internal server error");
                res.sendStatus(500);
                return;
              }
              else{
                let roomDataString=value;
                let roomData = JSON.parse(roomDataString);
                let members = roomData.Members;

                for (var j = 0; j < members.length; j++) {
                    if (members[j] === UserId) {
                        let resData = {"id" : key, "name" : roomData.Name};

                        for (var k=0; k<roomData.Admins.length; k++){
                          if (roomData.Admins[k] === UserId)
                          {
                            resData.admin = true;
                          }

                        }
                        rooms.push(resData);
                    }
                }
              }

            callback(err);
            });
          }, function() {
              res.status(200).send(rooms);
          });
        });
    console.log('/api/user/rooms GET');
  });
});

router.get('/user/rooms/:roomid',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    var roomid=req.params.roomid;
    redisClient.hget('rooms',roomid, (err, reply) => {
            if (err){
                console.log("Internal server error");
                res.sendStatus(500);
            }
            else{

              let roomData = JSON.parse(reply);
              if (roomData === null){
                res.sendStatus(404);
                return;
              }
              let member=false;
              for (var j=0; j<roomData.Members.length; j++){
                if (roomData.Members[j] === UserId)
                  member = true;
              }
              if (member){
                let rData = {"name" : roomData.Name, "id" : roomData.Id,  "members" : roomData.Members, "admins" :roomData.Admins, "private" : roomData.Private};
                res.status(200).send(rData);
              }
              else{
                res.sendStatus(204);

              }

            }
    });
    console.log('/api/rooms/roomid GET');
  });
});

router.delete('/user/rooms/:roomid',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    let roomid=req.params.roomid;
    redisClient.hget('rooms',roomid, (err, reply) => {
            if (err){
                console.log("Internal server error");
                res.sendStatus(500);
            }
            else{
              let roomDataString = reply;
              let roomData = JSON.parse(roomDataString);
              if (roomData === null){
                res.sendStatus(404);
                return;
              }
              let members = roomData.Members;
              let nmembers = [];
              let nAdmins = [];
              for (var i = 0; i < roomData.Admins.length; i++) {
                  if (roomData.Admins[i] != UserId) {
                    nAdmins.push(roomData.Admins[i]);
                  }
                  else{
                    if (roomData.Admins.length === 1){
                      let rescode = {"reason" : 10};
                      res.status(400).send(rescode);
                      return;
                    }
                  }
              }
              roomData.Admins = nAdmins;

              for (var i = 0; i < members.length; i++) {
                  if (members[i] != UserId) {
                    nmembers.push(members[i]);
                  }
              }
              roomData.Members = nmembers;
              roomDataString = JSON.stringify(roomData);
              redisClient.hset('rooms',roomid,roomDataString);
              res.sendStatus(204);
            }
    });
    console.log('/api/ser/rooms/:roomid DELETE');
  });
});

router.post('/user/rooms/:roomid/join',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    let roomid=req.params.roomid;
    redisClient.hget('rooms',roomid, (err, reply) => {
            if (err){
                console.log("Internal server error");
                res.sendStatus(500);
            }
            else{

              let roomData = JSON.parse(reply);
              if (roomData === null){
                res.sendStatus(404);
                return;
              }
              let members = roomData.Members;
              for (var i = 0; i < members.length; i++) {
                  if (members[i] === UserId) {
                    let resCode = {"reason" : 11};
                    res.status(400).send(resCode);
                    return;
                  }
              }
              members.push(UserId);
              roomData.Members = members;
              let roomDataString = JSON.stringify(roomData);
              redisClient.hset('rooms', roomid,roomDataString);
              res.sendStatus(204);
            }
    });
    console.log('/api/user/rooms/:roomid/join POST');
  });
});

router.get('/user/rooms/:roomid/messages',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    let roomid=req.params.roomid;
    redisClient.hget('rooms',roomid, (err, reply) => {
            if (err){
                console.log("Internal server error");
                res.sendStatus(500);
            }
            else{
              let roomDataString = reply;
              let roomData = JSON.parse(roomDataString);
              if (roomData === null){
                res.sendStatus(404);
                return;
              }
              let member = false;
              for (var j=0; j<roomData.Members.length; j++){
                if (roomData.Members[j] === UserId)
                  member = true;
              }
              if (member){
                let messages = [];
                for(var i=0; i<roomData.Messages.length; i++){
                  messages.push({"user" : roomData.Messages[i].User, "timestamp" : roomData.Messages[i].Timestamp, "message" : roomData.Messages[i].Message});

                }
                res.status(200).send(messages);
              }
              else{
                res.sendStatus(204);
              }
            }
    });
    console.log('/api/user/rooms/:roomid/messages GET');
  });
});

router.post('/user/rooms/:roomid/messages',  (req,res) => {

  checkAuthentication(req,res, (req,res) => {
    let roomid = req.params.roomid;
    let msg = req.body.message;
    if (!msg){
      res.sendStatus(400);
      return;
    }
    redisClient.hget('rooms',roomid, (err, reply) => {
            if (err){
                console.log("Internal server error");
                res.sendStatus(500);
            }
            else{
              let roomDataString = reply;
              let roomData = JSON.parse(roomDataString);
              if (roomData === null){
                res.sendStatus(404);
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
                let datetime = currentDate.getDate() + "/"
                    + (currentDate.getMonth()+1)  + "/"
                    + currentDate.getFullYear() + " @ "
                    + currentDate.getHours() + ":"
                    + currentDate.getMinutes() + ":"
                    + currentDate.getSeconds();
                let nmsg = {"Timestamp" : datetime, "User" : UserId, "Message" : msg};
                messages.push(nmsg);
                if (messages.length > 50)
                  messages.splice(0,1);
                roomData.Messages=messages;
                roomDataString = JSON.stringify(roomData);
                redisClient.hset('rooms', roomid,roomDataString);
                let messagesToSend = [];
                for(var i=0; i<roomData.Messages.length; i++){
                  messagesToSend.push({"user" : roomData.Messages[i].User, "timestamp" : roomData.Messages[i].Timestamp, "message" : roomData.Messages[i].Message});

                }
                res.status(200).send(messagesToSend);
              }
              else{
                res.sendStatus(204);
              }
            }
    });
    console.log('/api/user/rooms/:roomid/messages POST');
  });
});

router.get('/user/admin/rooms',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    let rooms = [];
    redisClient.hkeys('rooms', function(err, keys) {
          async.each(keys, function(key, callback) {
            redisClient.hget('rooms',key, function(err, value) {
              if (err){
                  console.log("Internal server error");
                  res.sendStatus(500);
                  return;
              }
              else{
                let roomDataString=value;
                let roomData = JSON.parse(roomDataString);
                if (roomData === null){
                  res.sendStatus(404);
                  return;
                }

                let admins = roomData.Admins;
                for (var j = 0; j < admins.length; j++) {
                    if (admins[j] === UserId) {
                        let resData = {"id" : key, "name" : roomData.Name, "admin" : true};
                        rooms.push(resData);
                    }
                }
              }

            callback(err);
            });
          }, function() {
              res.status(200).send(rooms);
          });
        });
    console.log('/api/user/admin/rooms GET');
  });
});

router.post('/user/admin/rooms',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    let Name = req.body.name;
    if (err){
        console.log("Internal server error");
        res.sendStatus(500);
        return;
    }
    let Admins=[UserId];
    let Messages = [];
    let Private = false;
    let Members = [UserId];
    let ID = crypto.randomBytes(64).toString('hex');
    let nroom = {"Name" : Name, "Admins" : Admins, "Messages" : Messages, "Private" : Private, "ID": ID, "Members" : Members};
    let nroomstring = JSON.stringify(nroom);
    redisClient.hset('rooms', ID,nroomstring);
    let rData = {"name" : nroom.Name, "id" : nroom.ID,  "members" : nroom.Members, "admins" :nroom.Admins, "private" : nroom.Private};
    res.status(201).send(rData);
    console.log('/apiuser/admin/rooms POST');
  });
});

router.get('/user/admin/rooms/:roomid',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    var roomid=req.params.roomid;
    redisClient.hget('rooms',roomid, (err, reply) => {
            if (err){
                console.log("Internal server error");
                res.sendStatus(500);
            }
            else{
              let roomData = JSON.parse(reply);
              if (roomData === null){
                res.sendStatus(404);
                return;
              }
              let admin=false;
              for (var j=0; j<roomData.Admins.length; j++){
                if (roomData.Admins[j] === UserId)
                  admin = true;
              }
              if (admin){
                let rData = {"name" : roomData.Name, "id" : roomData.ID,  "members" : roomData.Members, "admins" :roomData.Admins, "private" : roomData.Private};
                res.status(200).send(rData);
              }
              else{
                res.sendStatus(204);
              }

            }
    });
    console.log('/api/user/admin/rooms/:roomid GET');
  });
});

router.put('/user/admin/rooms/:roomid',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    var roomid=req.params.roomid;
    redisClient.hget('rooms',roomid, (err, reply) => {
            if (err){
                console.log("Internal server error");
                res.sendStatus(500);
            }
            else{
              let roomDataString = reply;
              let roomData = JSON.parse(roomDataString);
              if (roomData === null){
                res.sendStatus(404);
                return;
              }
              let admin = false;
              for (var j=0; j<roomData.Admins.length; j++){
                if (roomData.Admins[j] === UserId)
                  admin = true;
              }
              if (admin){
                let roomName = req.body.name;
                if (roomName)
                  roomData.Name = roomName;
                let members = req.body.members;
                if (members)
                  roomData.Members = members;
                let pv = req.body.private;
                if (pv)
                  roomData.Private = pv;
                roomDataString = JSON.stringify(roomData);
                redisClient.hset('rooms', roomid,roomDataString);
                res.status(200).send({"name" : roomName, "members" : members, "private" : pv});
              }
              else{
                res.sendStatus(204);
              }
            }
    });
    console.log('/api/user/admin/rooms/roomid PUT');
  });
});

router.put('/user/admin/rooms/:roomid/invite/:uname',  (req,res) => {
   checkAuthentication(req,res, (req,res) => {
   let uname = req.params.uname;
   let roomid = req.params.roomid;

    redisClient.hexists('users',uname, (err, reply) => {
      if (reply === 1) {
          redisClient.hexists('rooms',roomid, (err, reply) => {
              if (reply === 1) {
                  // setup e-mail data with unicode symbols
                  redisClient.hget('rooms',roomid, (err,reply) => {
                      if (err){
                          console.log("Internal server error");
                          res.sendStatus(500);
                          return;
                      }
                      let roomData = JSON.parse(reply);
                      var mailOptions = {
                          from: 'yacha ✔ <ggergo91@gmail.com>', // sender address
                          to: uname, // list of receivers
                          subject: 'Hello ✔', // Subject line
                          text: 'Hello \n' + UserId + 'Invited you to a room ' + roomData.Name+ '\n, to join please click on this link: ' + 'http://localhost:5000/api/valafdmi' +
                          'majd ide megy a link a szoba azonosítojával a frontendre' // plaintext body

                      };

                      // send mail with defined transport object
                      transporter.sendMail(mailOptions, function(error, info){
                          if(error){
                              res.sendStatus(400);
                              return console.log(error);
                          }
                          console.log('Message sent: ' + info.response);
                          res.sendStatus(204);

                  });
                });


              }
              else{
                  res.status(400).send({"reason" : 1});
              }
            });

      }
      else{
          res.status(400).send({"reason" : 0});
      }
    });

    console.log('api//user/admin/rooms/:roomid/invite/:uname PUT');
  });
});

router.delete('/user/admin/rooms/:roomid',  (req,res) => {
  checkAuthentication(req,res, (req,res) =>{
    let roomid = req.params.roomid;
    redisClient.hget('rooms',roomid, (err, reply) => {
            if (err){
                console.log("Internal server error");
                res.sendStatus(500);
            }
            else{
              let roomData = JSON.parse(reply);
              if (roomData === null){
                res.sendStatus(404);
                return;
              }
              let admin = false;
              for (var j=0; j<roomData.Admins.length; j++){
                if (roomData.Admins[j] === UserId)
                  admin = true;
              }
              if (admin){
                redisClient.hdel('rooms',roomid);
                res.sendStatus(204);
              }
              else{
                res.sendStatus(204);
              }
            }
    });
    console.log('/api/user/admin/rooms/roomid DELETE');
  });
});

router.get('/users/:userid',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    let uid = req.params.userid;
    redisClient.hget('rooms',uid, (err, reply) => {
        if (err){
            console.log("Internal server error");
            res.sendStatus(500);
        }
        else{
          let userData=JSON.parse(reply);
          if (userData === null){
            res.sendStatus(404);
            return;
          }
          let publicParams = {"nickname" : userData.NickName, "email" : userData.Email };
          res.status(200).send(publicParams);
        }

    });

    console.log('/api/user/:userid GET');
  });
});

router.get('/users/search/:keyword',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    let kw = req.params.keyword;
    let users = [];
    redisClient.hkeys('users', function(err, keys) {
          async.each(keys, function(key, callback) {
            redisClient.hget('users',key, function(err, value) {
              if (err){
                  console.log("Internal server error");
                  res.sendStatus(500);
                  return;
              }
              else{
                let userData = JSON.parse(value);

                if (userData.NickName.search(kw) !=-1){
                  users.push({"nickname" : userData.NickName, "email" : key});
                }
              }

            callback(err);
            });
          }, function() {
              res.status(200).send(users);
          });
        });
    console.log('/api/users/search/:keyword GET');
  });
});

router.get('/user/friends',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    redisClient.hget('users',UserId, (err, reply) => {
        if (err){
              console.log("Internal server error");
              res.sendStatus(500);
        }
        else{
          let userData=JSON.parse(reply);
          if (userData === null){
            res.sendStatus(404);
            return;
          }
          if (userData.Friends)
            res.status(200).send(userData.Friends);
          else
            res.status(200).send([]);
        }

    });
    console.log('/api/user/friends GET');
  });
 });

router.get('/user/friends/invite',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    redisClient.hget('users',UserId, (err, reply) => {
        if (err){
              console.log("Internal server error");
              res.sendStatus(500);
        }
        else{
          let userData=JSON.parse(reply);
          if (userData === null){
            res.sendStatus(404);
            return;
          }
          if (userData.FriendInvites)
            res.status(200).send(userData.FriendInvites);
          else
            res.status(200).send([]);

        }
    });
    console.log('/api/user/friends/invite GET');
  });
});

router.put('/user/friends/invite/:uid',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    redisClient.hget('users',UserId, (err, reply) => {
          if (err){
              console.log("Internal server error");
              res.sendStatus(500);
          }
          else{
            let userData=JSON.parse(reply);
            if (userData === null){
              res.sendStatus(404);
              return;
            }

            let userToInvite = req.params.uid;
            redisClient.hget('users',userToInvite, (err, reply) => {
              if (err){
                    console.log("Internal server error");
                    res.sendStatus(500);
              }
              else{
                let userDataToInvite = JSON.parse(reply);
                if (userDataToInvite === null){
                  res.sendStatus(404)
                  return;
                }

                if(userData.FriendInvites){
                  userData.FriendInvites.push({"nickname" : userDataToInvite.NickName, "email" : userToInvite});
                }
                else{
                  userData.FriendInvites = [{"nickname" : userDataToInvite.NickName, "email" : userToInvite}];
                }

                if(userData.FriendRequests){
                  userDataToInvite.FriendRequests.push({"nickname" : userData.NickName, "email" : UserId});
                }
                else{
                  userDataToInvite.FriendRequests = [{"nickname" : userData.NickName, "email" : UserId}];
                }

                redisClient.hset('users', UserId,JSON.stringify(userData));
                redisClient.hset('users', userToInvite,JSON.stringify(userDataToInvite));
                res.sendStatus(204);

              }
            });

          }

      });
  console.log('/api/user/friends/invite/:uid PUT');
  });
});

router.get('/user/friends/invite/requests',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
        redisClient.hget('users', UserId, (err, reply) => {
            if (err){
                  console.log("Internal server error");
                  res.sendStatus(500);
            }
            else{
              let userData=JSON.parse(reply);
              if (userData === null){
                res.sendStatus(404);
                return;
              }
              if (userData.FriendRequests)
                res.status(200).send(userData.FriendRequests);
              else
                res.status(200).send([]);

            }
        });
      console.log('/api/user/friends/invite/requests GET');
    });
  });

router.put('/user/friends/invite/requests/:uid',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    redisClient.hget('users', UserId, (err, reply) => {
          if (err){
                console.log("Internal server error");
                res.sendStatus(500);
          }
          else{
            let userData=JSON.parse(reply);
            if (userData === null){
              res.sendStatus(404);
              return;
            }

            let newFriend = req.params.uid;
            let possibleFriend = false;

            if (!userData.FriendRequests){
              res.sendStatus(404);
              return;
            }

            for (var i=0; i<userData.FriendRequests.length; i++){
              if (newFriend === userData.FriendRequests[i].email){
                possibleFriend = true;
              }

            }

            if (possibleFriend === false){
              res.sendStatus(404);
              return;
            }

            redisClient.hget('users',newFriend, (err, reply) => {
              if (err){
                    console.log("Internal server error");
                    res.sendStatus(500);
              }
              else{
                let userDataFriend = JSON.parse(reply);
                if (userDataFriend === null){
                  res.sendStatus(404)
                  return;
                }

                if(userData.Friends){
                  userData.Friends.push({"nickname" : userDataFriend.NickName, "email" : newFriend});
                }
                else{
                  userData.Friends = [{"nickname" : userDataFriend.NickName, "email" : newFriend}];
                }

                if(userDataFriend.Friends){
                  userDataFriend.Friends.push({"nickname" : userData.NickName, "email" : UserId});
                }
                else{
                  userDataFriend.Friends = [{"nickname" : userData.NickName, "email" : UserId}];
                }

                let friendRequests = [];

                for (var i= 0; i<userData.FriendRequests; i++){
                  if (userData.FriendRequests[i].email !=newFriend){
                    friendRequests.push(userData.FriendRequests[i]);
                  }
                }
                userData.FriendRequests = friendRequests;

                let friendInvites = [];

                for (var i= 0; i<userData.FriendInvites; i++){
                  if (userData.FriendInvites[i].email !=newFriend){
                    friendInvites.push(userData.FriendInvites[i]);
                  }
                }
                userData.FriendInvites = friendInvites;

                friendRequests = [];

                for (var i= 0; i<userDataFriend.FriendRequests; i++){
                  if (userDataFriend.FriendRequests[i].email !=UserId){
                    friendRequests.push(userData.FriendRequests[i]);
                  }
                }
                userDataFriend.FriendRequests = friendRequests;

                friendInvites = [];

                for (var i= 0; i<userDataFriend.FriendInvites; i++){
                  if (userDataFriend.FriendInvites[i].email !=UserId){
                    friendInvites.push(userDataFriend.FriendInvites[i]);
                  }
                }
                userDataFriend.FriendInvites = friendInvites;
                redisClient.hset('users', UserId,JSON.stringify(userData));
                redisClient.hset('users', newFriend,JSON.stringify(userDataFriend));
                res.sendStatus(204);
              }
            });

          }

      });
      console.log('/api/user/friends/invite/requests/:uid PUT');
    });
});

router.get('/user/pm/:uid',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    let otherUser = req.params.uid;
    let room = 'undef';
    redisClient.hkeys('rooms', function(err, keys) {
          async.each(keys, function(key, callback) {
            redisClient.hget('rooms',key, function(err, value) {
              if (err){
                    console.log("Internal server error");
                    res.sendStatus(500);
                    return;
              }
              else{
                let roomDataString=value;
                let roomData = JSON.parse(roomDataString);


                if (roomData.Private === false)
                {
                  callback(err);
                  return;
                }

                let members = roomData.Members;
                let userIsMember = false;
                let otherIsMember = false;

                for (var j = 0; j < members.length; j++) {
                    if (members[j] === UserId) {
                      userIsMember = true;
                    }

                    if (members[j] === otherUser) {
                      otherIsMember = true;
                    }
                }

                if (userIsMember === true && otherIsMember === true){
                  room = roomData;
                }
              }

            callback(err);
            });
          }, function() {
              if (room != 'undef'){
                let roomData = room;
                let messagesToSend = [];
                for(var i=0; i<roomData.Messages.length; i++){
                  messagesToSend.push({"user" : roomData.Messages[i].User, "timestamp" : roomData.Messages[i].Timestamp, "message" : roomData.Messages[i].Message});

                }
                res.status(200).send(messagesToSend);
              }
              else{
                res.sendStatus(204);
              }
          });
        });
  console.log('/api/user/pm/:uid GET');
  });
});

router.post('/user/pm/:uid',  (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    let otherUser = req.params.uid;
    let room = 'undef';
    redisClient.hkeys('rooms', function(err, keys) {
          async.each(keys, function(key, callback) {
            redisClient.hget('rooms', key, function(err, value) {
              if (err){
                    console.log("Internal server error");
                    res.sendStatus(500);
              }
              else{
                let roomDataString=value;
                let roomData = JSON.parse(roomDataString);


                if (roomData.Private === false)
                {
                  callback(err);
                  return;
                }

                let members = roomData.Members;
                let userIsMember = false;
                let otherIsMember = false;

                for (var j = 0; j < members.length; j++) {
                    if (members[j] === UserId) {
                      userIsMember = true;
                    }

                    if (members[j] === otherUser) {
                      otherIsMember = true;
                    }
                }

                if (userIsMember === true && otherIsMember === true){
                  room = roomData;
                }
              }

            callback(err);
            });
          }, function() {
              if (room != 'undef'){
                let roomData = room;
                let messages = roomData.Messages;
                let currentDate = new Date();
                let datetime = currentDate.getDate() + "/"
                    + (currentDate.getMonth()+1)  + "/"
                    + currentDate.getFullYear() + " @ "
                    + currentDate.getHours() + ":"
                    + currentDate.getMinutes() + ":"
                    + currentDate.getSeconds();
                let msg = req.body.message;
                let nmsg = {"Timestamp" : datetime, "User" : UserId, "Message" : msg};
                messages.push(nmsg);
                if (messages.length > 50)
                  messages.splice(0,1);
                roomData.Messages=messages;
                let roomDataString = JSON.stringify(roomData);
                redisClient.hset('rooms', roomData.ID,roomDataString);
                let messagesToSend = [];
                for(var i=0; i<roomData.Messages.length; i++){
                  messagesToSend.push({"user" : roomData.Messages[i].User, "timestamp" : roomData.Messages[i].Timestamp, "message" : roomData.Messages[i].Message});

                }
                res.status(200).send(messagesToSend);
              }
              else{
                let Name = UserId + otherUser;
                let Admins=[UserId,otherUser];
                let Messages = [];
                let Private = true;
                let Members = [UserId, otherUser];
                let ID = crypto.randomBytes(64).toString('hex');
                let roomData = {"Name" : Name, "Admins" : Admins, "Messages" : Messages, "Private" : Private, "ID": ID, "Members" : Members};
                let nroomstring = JSON.stringify(roomData);
                redisClient.hset('rooms',ID,nroomstring);
                let messages = roomData.Messages;
                let currentDate = new Date();
                let datetime = currentDate.getDate() + "/"
                    + (currentDate.getMonth()+1)  + "/"
                    + currentDate.getFullYear() + " @ "
                    + currentDate.getHours() + ":"
                    + currentDate.getMinutes() + ":"
                    + currentDate.getSeconds();
                let msg = req.body.message;
                let nmsg = {"Timestamp" : datetime, "User" : UserId, "Message" : msg};
                messages.push(nmsg);
                if (messages.length > 50)
                  messages.splice(0,1);
                roomData.Messages=messages;
                let roomDataString = JSON.stringify(roomData);
                redisClient.hset('rooms', roomData.ID,roomDataString);
                let messagesToSend = [];
                for(var i=0; i<roomData.Messages.length; i++){
                  messagesToSend.push({"user" : roomData.Messages[i].User, "timestamp" : roomData.Messages[i].Timestamp, "message" : roomData.Messages[i].Message});

                }
                res.status(200).send(messagesToSend);
              }
          });
        });
  console.log('/api/user/pm/:uid POST');
  });
});


router.post('/activate/send',  (req,res) => {
      let email = req.body.email;
      if (!email){
        res.sendStatus(400);
        return;
      }

      redisClient.hget('users', email, (err, reply) => {
        if (err){
              console.log("Internal server error");
              res.sendStatus(500);
        }
        else{
          let userData = JSON.parse(reply);
          if (userData === null){
            res.sendStatus(404);
            return;
          }
          let token = crypto.randomBytes(64).toString('hex');
          userData.ActivationToken = token;
          redisClient.hset('users', email,JSON.stringify(userData));

          var mailOptions = {
              from: 'yacha ✔ <yacha@gmail.com>', // sender address
              to: email, // list of receivers
              subject: 'Hello ✔', // Subject line
              text: 'Activation a tokennel ' + token
          };

          // send mail with defined transport object
          transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    res.sendStatus(400);
                    return console.log(error);
                }
                console.log('Message sent: ' + info.response);
                res.sendStatus(204);

          });

         }
      });
      console.log('/api/activate/send post');
});

router.post('/activate/verify',  (req,res) => {
      let token = req.body.token;
      if (!token){
        res.sendStatus(400);
        return;
      }

      let valid = false;
       redisClient.hkeys('users', function(err, keys) {
            async.each(keys, function(key, callback) {
              redisClient.hget('users', key, function(err, value) {
                let userData = JSON.parse(value);

                if (userData.ActivationToken === token){
                  userData.Activated = true;
                  console.log('Activated');
                  redisClient.hset('users', key,JSON.stringify(userData));
                  valid = true;
                  res.sendStatus(204);
                }
                callback(err);
              });
            }, function() {
              if (valid === false)
                res.sendStatus(400);
            });
      });
      console.log('/api/activate/verify post');
});


router.post('/forgot/send',  (req,res) => {
      let email = req.body.email;
      if (!email){
        res.sendStatus(400);
        return;
      }

       redisClient.hget('users', email, (err, reply) => {
       if (err){
              console.log("Internal server error");
              res.sendStatus(500);
        }
        else{
          let userData = JSON.parse(reply);
          if (userData === null){
            res.sendStatus(404);
            return;
          }

          let token = crypto.randomBytes(64).toString('hex');
          userData.ForgotPasswordToken = token;
          redisClient.hset('users', email,JSON.stringify(userData));

          var mailOptions = {
              from: 'yacha ✔ <yacha@gmail.com>', // sender address
              to: email, // list of receivers
              subject: 'Hello ✔', // Subject line
              text: 'Forgot a tokennel ' + token
          };

          // send mail with defined transport object
          transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    res.sendStatus(400);
                    return console.log(error);
                }
                console.log('Message sent: ' + info.response);
                res.sendStatus(204);

          });

         }
      });
      console.log('/api/forgot/send post');
});

router.post('/forgot/verify',  (req,res) => {
      let token = req.body.token;
      if (!token){
        res.sendStatus(400);
        return;
      }
      let valid = false;
       redisClient.hkeys('users', function(err, keys) {
            async.each(keys, function(key, callback) {
              redisClient.hget('users', key, function(err, value) {
                let userData = JSON.parse(value);

                if (userData.ForgotPasswordToken === token){
                  let email = key;
                  let authNumber = crypto.randomBytes(64).toString('hex');
                  userData.AuthNumber=authNumber;
                  let userString = JSON.stringify(userData);
                  redisClient.hdel('users',email);
                  redisClient.hset('users', email,userString);
                  res.cookie('AuthNumber', authNumber);
                  let resData = {"username" : email, "nickname" : userData.NickName};
                  res.status(200).send(resData);
                  valid = true;
                }
                callback(err);
              });
            }, function() {
              if (valid === false)
                res.sendStatus(400);
            });
      });
      console.log('/api/forgot/verify post');
});

export default router;
