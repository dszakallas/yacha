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

// create reusable transporter object using SMTP transport
let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'fds',
        pass: 'fg'
    }
});



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

if (process.env.REDISTOGO_URL) {
  let rtg   = url.parse(process.env.REDISTOGO_URL);
  redisClient = redis.createClient(rtg.port, rtg.hostname);
} else {
  redisClient = redis.createClient();
}

function checkAuthentication (req, res, cb){
    redisClient.select(0);
    let randNum = req.cookies.AuthNumber;
    UserId = 'undef';
    console.log(randNum);
    redisClient.keys('*', function(err, keys) {
          async.each(keys, function(key, callback) {
            redisClient.get(key, function(err, value) {
              let userData = JSON.parse(value);
              if (userData.AuthNumber === randNum){
                UserId=key;
                console.log("Autentikalhato");
              }
              callback(err);
            });
          }, function() {
              if (UserId != 'undef'){
                console.log('Autentikalva');
                cb(req,res);
              }
              else{
                res.sendStatus(401);
              }
          });
    });
    console.log('aut');
}


redisClient.on('connect', () => {
    console.log('REDIS connected');
});

router.post('/login', async (req,res) => {
  let email = req.body.username;
  let pw1 = req.body.password;
  if (!(email && pw1)){
    console.log("nincs");
    res.sendStatus(400);
    return;
  }

  redisClient.select(0);
  redisClient.exists(email, (err, reply) => {
    if (reply === 1) {
        let pwHash = crypto.createHash('md5').update(pw1).digest('hex');
        redisClient.get(email, (err, reply) => {
          if (err){
            res.sendStatus(401);
          }
          else{
            let userDatastring=reply;
            let userData=JSON.parse(userDatastring);

            let activated = false;
            if (userData.Activated){
              activated = userData.Activated;
            }


            
            if (userData.Password === pwHash){
              let authNumber = crypto.randomBytes(64).toString('hex');
              userData.AuthNumber=authNumber;
              let userString = JSON.stringify(userData);
              console.log(userString);
              redisClient.del(email);
              redisClient.set(email,userString);
              res.cookie('AuthNumber', authNumber);
              let resData = {"username" : email, "nickname" : userData.NickName}; 
              res.status(200).send(resData); 
         
              
            }
            else {
                  console.log("rossz jelszo");
                  res.sendStatus(401);
            }
             
          }
          
        });
    }
    else {
      res.sendStatus(404);
    }
         
  }); 
}); 


router.post('/register', async (req,res) => {

  let nickname = req.body.username;
  let email = req.body.email;
  let pw1 = req.body.password;
  if (!(nickname && email && pw1)){
    res.sendStatus(400);
    return;
  }
  redisClient.select(0);

  redisClient.exists(email, (err, reply) => {
    if (reply === 1) {
        console.log('exists');
        let reasonCode = {"reason" : 0};
        res.status(400).send(reasonCode);
    } else {
        let pwhash = crypto.createHash('md5').update(pw1).digest('hex');
        let validNickName=true;
        redisClient.keys('*', function(err, keys) {
          async.each(keys, function(key, callback) {
            redisClient.get(key, function(err, value) {
              let userData = JSON.parse(value);
              if (userData.NickName === nickname){
                validNickName=false;
                console.log("invalid");
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
                console.log(newuserstring);
                redisClient.set(email,newuserstring);
                res.sendStatus(204);
              }
          });
        });
        
    }
  }); 
});

router.get('/user', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {

    redisClient.select(0);

    redisClient.get(UserId, (err, reply) => {
        if (err){
          res.sendStatus(404);
        }
        else{
          let userData=JSON.parse(reply);
          let publicParams = {"nickname" : userData.NickName, "email" : userData.Email };
          res.send(publicParams);
        }
            
    });

    console.log('User GET');
  });
}); 

router.put('/user', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {

    // csak nicknkevet és password-ot is lehet, ahogy wikin le van írva
    let nickname = req.body.nickname;
    let password = req.body.password;
    if (!(nickname || password)){
      res.sendStatus(400);
      return;
    }
    redisClient.select(0);
    redisClient.get(UserId, (err, reply) => {
        if (err){
          res.sendStatus(404);
        }
        else{
          let userData=JSON.parse(reply);
          if (nickname)
            userData.NickName = nickname;
          if (password)
            userData.Password = crypto.createHash('md5').update(password).digest('hex');
          let newUserString = JSON.stringify(userData);
          redisClient.set(UserId,newUserString);
          let publicParams = {"nickname" : nickname, "password" : password};
          res.status(200).send(publicParams);
        }
            
    });

  });
});

router.delete('/user', async (req,res) => {
 checkAuthentication(req,res, (req,res) => {

    redisClient.select(0);
    redisClient.del(UserId);
    res.sendStatus(204);
    console.log("User DELETE");
  });
});

router.get('/user/rooms',  async (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    redisClient.select(1);
    let rooms = [];
    redisClient.keys('*', function(err, keys) {
          async.each(keys, function(key, callback) {
            redisClient.get(key, function(err, value) {
              if (err){
                res.sendStatus(404);
                return ;
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
    console.log('User/rooms GET');
  });
}); 

router.get('/user/rooms/:roomid', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {

    redisClient.select(1);
    var roomid=req.params.roomid;
    redisClient.get(roomid, (err, reply) => {
            if (err){
              res.sendStatus(404);
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
    console.log('get rooms/roomid');
  });
}); 

router.delete('/user/rooms/:roomid', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    redisClient.select(1);
    var roomid=req.params.roomid;
    redisClient.get(roomid, (err, reply) => {
            if (err){
              res.sendStatus(404);
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
                    nmembers.push(members[i]);
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
              redisClient.set(roomid,roomDataString);
              res.sendStatus(204);
            }
    });
    console.log('User/rooms/:roomid DELETE');
  }); 
});

router.post('/user/rooms/:roomid/join', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    let roomid=req.params.roomid;
    console.log(roomid);
    redisClient.select(1);
    redisClient.get(roomid, (err, reply) => {
            if (err){
              res.sendStatus(404);
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
              redisClient.set(roomid,roomDataString);
              res.sendStatus(204);
            }
    });
    console.log("User/rooms/:roomid/join POST");
  });
}); 

router.get('/user/rooms/:roomid/messages', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    redisClient.select(1);
    let roomid=req.params.roomid;
    redisClient.get(roomid, (err, reply) => {
            if (err){
              res.sendStatus(404);
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
    console.log("User/rooms/:roomid/messages GET");
  });
}); 

router.post('/user/rooms/:roomid/messages', async (req,res) => {
  
  checkAuthentication(req,res, (req,res) => {
    redisClient.select(1);
    let roomid = req.params.roomid;
    redisClient.get(roomid, (err, reply) => {
            if (err){
              res.sendStatus(404);
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
                let msg = req.body.message;
                let nmsg = {"Timestamp" : datetime, "User" : UserId, "Message" : msg};
                messages.push(nmsg);
                if (messages.length > 50)
                  messages.splice(0,1);
                roomData.Messages=messages;
                roomDataString = JSON.stringify(roomData);
                redisClient.set(roomid,roomDataString);

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
    console.log("User/rooms/:roomid/messages POST");
  }); 
});

router.get('/user/admin/rooms', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    redisClient.select(1);
    let rooms = [];
    redisClient.keys('*', function(err, keys) {
          async.each(keys, function(key, callback) {
            redisClient.get(key, function(err, value) {
              if (err){
                res.sendStatus(404);
                return ;
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
    console.log('User/admin/rooms GET');
  });
});

router.post('/user/admin/rooms', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    redisClient.select(1);
    let Name = req.body.name;
    let Admins=[UserId];
    let Messages = [];
    let Private = false;
    let Members = [UserId];
    let ID = crypto.randomBytes(64).toString('hex');
    let nroom = {"Name" : Name, "Admins" : Admins, "Messages" : Messages, "Private" : Private, "ID": ID, "Members" : Members};
    let nroomstring = JSON.stringify(nroom);
    redisClient.set(ID,nroomstring); 
    let rData = {"name" : nroom.Name, "id" : nroom.ID,  "members" : nroom.Members, "admins" :nroom.Admins, "private" : nroom.Private};
    res.status(201).send(rData);
    console.log("user/admin/rooms POST");
  });
});

router.get('/user/admin/rooms/:roomid', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    redisClient.select(1);
    var roomid=req.params.roomid;
    redisClient.get(roomid, (err, reply) => {
            if (err){
              res.sendStatus(404);
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
    console.log('get user/admin/rooms/roomid');
});
});

router.put('/user/admin/rooms/:roomid', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {

    redisClient.select(1);
    var roomid=req.params.roomid;
    redisClient.get(roomid, (err, reply) => {
            if (err){
              res.sendStatus(404);
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
                redisClient.set(roomid,roomDataString);
                res.status(200).send({"name" : roomName, "members" : members, "private" : pv});
              }
              else{
                res.sendStatus(204);
              }
              
            }
    });
    console.log("user/admin/rooms/roomid PUT");
  });
});

router.put('/user/admin/rooms/:roomid/invite/:uname', async (req,res) => {
   checkAuthentication(req,res, (req,res) => {
   redisClient.select(0);
   let uname = req.params.uname;
   let roomid = req.params.roomid;

    redisClient.exists(uname, (err, reply) => {
      if (reply === 1) {
          redisClient.select(1);
          redisClient.exists(roomid, (err, reply) => {
              if (reply === 1) {
                  redisClient.select(1);
                  // setup e-mail data with unicode symbols
                  redisClient.get(roomid, (err,reply) => {
                      if (err){
                        res.sendStatus(404);
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
                          res.sendStatus(200);

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
    
    console.log('/user/admin/rooms/:roomid/invite/:uname');
});
});

router.delete('/user/admin/rooms/:roomid', async (req,res) => {
  checkAuthentication(req,res, (req,res) =>{
    let roomid = req.params.roomid;
    redisClient.select(1);
    redisClient.get(roomid, (err, reply) => {
            if (err){
              res.sendStatus(404);
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
                redisClient.del(roomid);
                res.sendStatus(204);
              }
              else{
                res.sendStatus(204);
              }
              
            }
    });
    console.log("user/admin/rooms/roomid DELETE");
  });
});

router.get('/users/:userid', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {

    redisClient.select(0);
    let uid = req.params.userid;

    redisClient.get(uid, (err, reply) => {
        if (err){
          res.sendStatus(404);
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

    console.log('User/:userid GET');
  });
});

router.get('/users/search/:keyword', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    let kw = req.params.keyword;
    redisClient.select(0);
    let users = [];
    redisClient.keys('*', function(err, keys) {
          async.each(keys, function(key, callback) {
            redisClient.get(key, function(err, value) {
              if (err){
                res.sendStatus(404);
                return ;
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
    console.log('search');
  });
});

router.get('/user/friends', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {

    redisClient.select(0);

    redisClient.get(UserId, (err, reply) => {
        if (err){
          res.sendStatus(404);
        }
        else{
          let userData=JSON.parse(reply);
          if (userData === null){
            res.sendStatus(404);
            return;
          }
          
          res.send(userData.Friends);
        }
            
    });
    console.log("user/friends GET");
  });
 });

router.get('/user/friends/invite', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {

    redisClient.select(0);

    redisClient.get(UserId, (err, reply) => {
        if (err){
          res.sendStatus(404);
        }
        else{
          let userData=JSON.parse(reply);
          if (userData === null){
            res.sendStatus(404);
            return;
          }
          
          res.send(userData.FriendInvites);
        }
            
    });
    console.log("user/friends/invite GET");
  });
});

router.put('/user/friends/invite/:uid', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    redisClient.select(0);
    redisClient.get(UserId, (err, reply) => {
          if (err){
            res.sendStatus(404);
          }
          else{
            let userData=JSON.parse(reply);
            if (userData === null){
              res.sendStatus(404);
              return;
            }
            
            let userToInvite = req.params.uid;
            redisClient.get(userToInvite, (err, reply) => {
              if (err){
                res.sendStatus(404);
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

                redisClient.set(UserId,JSON.stringify(userData));
                redisClient.set(userToInvite,JSON.stringify(userDataToInvite));
                res.sendStatus(204);

              }
            });

          }
              
      });
  console.log("user/friends/invite/:uid PUT");
  });
});

router.get('/user/friends/invite/requests', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {

        redisClient.select(0);

        redisClient.get(UserId, (err, reply) => {
            if (err){
              res.sendStatus(404);
            }
            else{
              let userData=JSON.parse(reply);
              if (userData === null){
                res.sendStatus(404);
                return;
              }
              
              res.send(userData.FriendRequests);
            }
                
        });
      console.log("user/friends/invite/requests GET");
    });
  });

router.put('/user/friends/invite/requests/:uid', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    redisClient.select(0);
    redisClient.get(UserId, (err, reply) => {
          if (err){
            res.sendStatus(404);
          }
          else{
            let userData=JSON.parse(reply);
            if (userData === null){
              console.log('a');
              res.sendStatus(404);
              return;
            }
            
            let newFriend = req.params.uid;
            let possibleFriend = false;

            if (userData.FriendRequests === null){
              console.log('b');
              res.sendStatus(404);
              return;
            }

            for (var i=0; i<userData.FriendRequests.length; i++){
              if (newFriend === userData.FriendRequests[i].email){
                possibleFriend = true;
              }

            }

            if (possibleFriend === false){
              console.log('c');
              res.sendStatus(404);
              return;
            }

            redisClient.get(newFriend, (err, reply) => {
              if (err){
                res.sendStatus(404);
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
                redisClient.set(UserId,JSON.stringify(userData));
                redisClient.set(newFriend,JSON.stringify(userDataFriend));
                res.sendStatus(204);

              }
            });

          }
              
      });
      console.log("user/friends/invite/requests/:uid PUT");
    });   
});

router.get('/user/pm/:uid', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    let otherUser = req.params.uid;
    redisClient.select(1);
    let room = 'undef';
    redisClient.keys('*', function(err, keys) {
          async.each(keys, function(key, callback) {
            redisClient.get(key, function(err, value) {
              if (err){
                res.sendStatus(404);
                callback(err);
                return ;
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
  console.log("user/pm/:uid GET");
  });
});

router.post('/user/pm/:uid', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    let otherUser = req.params.uid;
    redisClient.select(1);
    let room = 'undef';
    redisClient.keys('*', function(err, keys) {
          async.each(keys, function(key, callback) {
            redisClient.get(key, function(err, value) {
              if (err){
                res.sendStatus(404);
                callback(err);
                return ;
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
                redisClient.set(roomData.ID,roomDataString);
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
                redisClient.set(ID,nroomstring);
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
                redisClient.set(roomData.ID,roomDataString);
                let messagesToSend = [];
                for(var i=0; i<roomData.Messages.length; i++){
                  messagesToSend.push({"user" : roomData.Messages[i].User, "timestamp" : roomData.Messages[i].Timestamp, "message" : roomData.Messages[i].Message});

                }
                res.status(200).send(messagesToSend);
              }
          });
        });
  console.log("user/pm/:uid POST");
  });
});


router.post('/activate/send', async (req,res) => {
      let email = req.body.email;

      redisClient.select(0);
       redisClient.get(email, (err, reply) => {
        if (err){
          res.sendStatus(404);
        }
        else{
          let userData = JSON.parse(reply);
          if (userData === null){
            res.sendStatus(404);
            return;
          }

          let token = crypto.randomBytes(64).toString('hex');
          userData.ActivationToken = token;
          redisClient.set(email,JSON.stringify(userData));

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
      console.log("activate/send post");
});

router.post('/activate/verify', async (req,res) => {
      let token = req.body.token;
      redisClient.select(0);
      let valid = false;
       redisClient.keys('*', function(err, keys) {
            async.each(keys, function(key, callback) {
              redisClient.get(key, function(err, value) {
                let userData = JSON.parse(value);
                if (userData.ActivationToken === token){
                  userData.Activated = true;
                  console.log('siker');
                  redisClient.set(key,JSON.stringify(userData));
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
      console.log("activate/verify post");
});


router.post('/forgot/send', async (req,res) => {
      let email = req.body.email;

      redisClient.select(0);
       redisClient.get(email, (err, reply) => {
        if (err){
          res.sendStatus(404);
        }
        else{
          let userData = JSON.parse(reply);
          if (userData === null){
            res.sendStatus(404);
            return;
          }

          let token = crypto.randomBytes(64).toString('hex');
          userData.ForgotPasswordToken = token;
          redisClient.set(email,JSON.stringify(userData));

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
      console.log("forgot/send post");
});

router.post('/forgot/verify', async (req,res) => {
      let token = req.body.token;
      redisClient.select(0);
      let valid = false;
       redisClient.keys('*', function(err, keys) {
            async.each(keys, function(key, callback) {
              redisClient.get(key, function(err, value) {
                let userData = JSON.parse(value);
                if (userData.ForgotPasswordToken === token){
                  let email = key;
                  let authNumber = crypto.randomBytes(64).toString('hex');
                  userData.AuthNumber=authNumber;
                  let userString = JSON.stringify(userData);
                  console.log(userString);
                  redisClient.del(email);
                  redisClient.set(email,userString);
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
              console.log("forgot/verify post");
            });
      });
      console.log("forgot/verify post");
});

export default router;

