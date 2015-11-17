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
    res.sendStatus(401);
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
                  res.sendStatus(401);
            }
             
          }
          
        });
    }
         
  }); 
}); 


router.post('/register', async (req,res) => {

  let nickname = req.body.nickname;
  let email = req.body.email;
  let pw1 = req.body.password;
  if (!(nickname && email && pw1)){
    res.sendStatus(500);
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
              let roomData = JSON.parse(roomDataString)
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
              res.sendStatus(400);
            }
            else{
              let roomDataString = reply;
              let roomdata = JSON.parse(roomDataString)
              let messages = {"Messages" : roomdata.Messages};
              let msgstr = JSON.stringify(messages);
              res.send(msgstr);
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
              res.sendStatus(400);
            }
            else{
              let roomDataString = reply;
              let roomdata = JSON.parse(roomDataString)
              let messages = roomdata.Messages;
              let currentdate = new Date(); 
              let datetime = currentdate.getDate() + "/"
                  + (currentdate.getMonth()+1)  + "/" 
                  + currentdate.getFullYear() + " @ "  
                  + currentdate.getHours() + ":"  
                  + currentdate.getMinutes() + ":" 
                  + currentdate.getSeconds();
              let msg = req.query.message;
              let nmsg = {"Date" : datetime, "User" : UserId, "Message" : msg};
              messages.push(nmsg);
              roomdata.Messages=messages;
              roomDataString = JSON.stringify(roomdata);
              redisClient.set(roomid,roomDataString);
            }
    });
    console.log("User/rooms/:roomid/messages POST");
  }); 
});

router.get('/user/admin/rooms', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    redisClient.select(1);

    redisClient.keys('*',  (err, keys) => {
        if (err) return console.log("Nincs ilyen szoba");
        
        for(var i = 0, len = keys.length; i < len; i++) {
            let roomid = keys[i];
            console.log(keys[i]);
            if (i===0)
              res.write('{"Rooms": [');

            let v = (i===(keys.length-1));
            redisClient.get(roomid, (err, reply, endres = v) => {
              if (err){
                res.sendStatus(500);
                return;
             }
            else{
                let roomDataString=reply;
                let roomdata = JSON.parse(roomDataString);
                let admins = roomdata.Admins;
                if (roomdata.Private===false){
                  for (var j = 0; j < admins.length; j++) {
                    if (admins[j] === UserId) {
                        res.write('"' + roomid + '"');
                        if (endres ===false)
                          res.write(' ,');
                    
                  }
                  }
                }
                if (endres===true){
                      res.write('] }');
                      res.end();
                }
              }
            });
      } 
        
    });
    console.log("user/admin/rooms GET");
  });
});

router.post('/user/admin/rooms', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {
    redisClient.select(1);
    
    redisClient.keys('*',  (err, keys) => {
        let maxkey=0;
        if (err) maxkey=0;
        else{
          for(var i = 0, len = keys.length; i < len; i++) {
            if (parseInt(keys[i])>maxkey)
              maxkey=parseInt(keys[i]);
              console.log(maxkey);
        
          }
          let Name = req.query.name;
          let Admins=[UserId];
          let Messages = [];
          let Private = false;
          let Members = [];
          let act=maxkey+1;
          console.log(act);
          let ID = act.toString();
          let nroom = {"Name" : Name, "Admins" : Admins, "Messages" : Messages, "Private" : Private, "ID": ID, "Members" : Members};
          let nroomstring = JSON.stringify(nroom);
          redisClient.set(ID,nroomstring); 
        }
    });
    
    console.log("user/admin/rooms POST");
  });
});

router.get('/user/admin/rooms/:roomid', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {

    redisClient.select(1);
    var roomid=req.params.roomid;
    redisClient.get(roomid, (err, reply) => {
            if (err){
              res.sendStatus(400);
            }
            else{
              let roomDataString=reply;
              res.send(roomDataString);
            }
    });
    console.log("user/admin/rooms/roomid GET");
});
});

router.put('/user/admin/rooms/:roomid', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {

    redisClient.select(1);
    var roomid=req.params.roomid;
    redisClient.get(roomid, (err, reply) => {
            if (err){
              res.sendStatus(400);
            }
            else{
              let roomDataString = reply;
              let roomdata = JSON.parse(roomDataString);
              let roomname = req.query.name;
              roomdata.Name = roomname;
              roomDataString = JSON.stringify(roomdata);
              redisClient.set(roomid,roomDataString);
            }
    });
    console.log("user/admin/rooms/roomid PUT");
  });
});

router.put('/user/admin/rooms/:roomid/invite/:uname', async (req,res) => {
  console.log("/user/admin/rooms/:roomid/invite/:uname PUT");
});

router.delete('/user/admin/rooms/:roomid', async (req,res) => {
  checkAuthentication(req,res, (req,res) =>{
    let roomid = req.params.roomid;
    redisClient.select(1);
    redisClient.del(roomid);
    console.log("user/admin/rooms/roomid DELETE");
  });
});

router.get('/users/:userid', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {

    redisClient.select(0);
    let uid=req.params.userid;

    redisClient.get(uid, (err, reply) => {
        if (err){
          res.sendStatus(500);
        }
        else{
          let userData=JSON.parse(reply);
          let publicParams = {"NickName" : userData.NickName, "Email" : userData.Email };
          let publicUserString = JSON.stringify(publicParams);
          res.send(publicUserString);
        }
            
    });

    console.log("users/:userid GET");
  });
});

router.get('/users/search/:keyword', async (req,res) => {
  checkAuthentication(req,res, (req,res) => {

    redisClient.select(0);

    redisClient.keys('*', function (err, keys) {

        if (err) return console.log(err);
        let kw=req.params.keyword;

        for(var i = 0, len = keys.length; i < len; i++) {
            let email = keys[i];
            if (i===0)
              res.write('{"Users": [');

            let v = (i===(keys.length-1));
            redisClient.get(email, (err, reply, endres = v) => {
              if (err){
                res.sendStatus(500);
                return;
              }
              else{
                let userDatastring=reply;
                let userData=JSON.parse(userDatastring);
                let name=userData.NickName;
                let f=name.search(kw);
                if (f!==-1){
                      res.write('"' + email + '"');
                      if (endres ===false)
                          res.write(' ,');

                }
                if (endres===true){
                      res.write('] }');
                      res.end();
                }
              
              }
            
            });
        }
      });
    console.log("users/search/:keyword GET");
  });
});

router.get('/user/friends', async (req,res) => {
  console.log("user/friends GET");
});

router.get('/user/friends/invite', async (req,res) => {
  console.log("user/friends/invite GET");
});

router.put('/user/friends/invite/:uid', async (req,res) => {
  console.log("user/friends/invite/:uid PUT");
});

router.get('/user/friends/invite/requests', async (req,res) => {
  console.log("user/friends/invite/requests GET");
});

router.put('/user/friends/invite/requests/:uid', async (req,res) => {
  console.log("user/friends/invite/requests/:uid PUT");
});

router.get('/user/pm/:uid', async (req,res) => {
  console.log("user/pm/:uid GET");
});

router.post('/user/pm/:uid', async (req,res) => {
  console.log("user/pm/:uid POST");
});


















export default router;

