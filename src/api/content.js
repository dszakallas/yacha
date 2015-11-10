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
let client = redis.createClient();
let UserId = 'undef';

if (process.env.REDISTOGO_URL) {
  let rtg   = url.parse(process.env.REDISTOGO_URL);
  let client = redis.createClient(rtg.port, rtg.hostname);
} else {
  let client = redis.createClient();
}

function checkAuthentication (req, res) {
    client.select(0);
    let randNum = req.cookies.AuthNumber;
    client.keys('*', function (err, keys) {
      if (err) return console.log(err);

      for(var i = 0, len = keys.length; i < len; i++) {
          let email = keys[i];
          client.get(email, function(err, reply) {
          if (err){
            res.sendStatus(500);
            return 1;
          }
          else{
            let userdatastring=reply;
            let userdata=JSON.parse(userdatastring);
            
            if (userdata.AuthNumber === randNum){
              this.UserId=email;
              return 0;
            }
          }
          
        });
      }
    }); 
    //proba miatt fix felh. nev.
    UserId = 'ggergo91@gmail.com';
    return 0;
}


client.on('connect', () => {
    console.log('REDIS connected');
});

router.post('/login', async (req,res) => {
  if (checkAuthentication(req,res) === 1)
    return;
  let email = req.query.email;
  let pw1 = req.query.password;
  client.select(0);

  client.exists(email, (err, reply) => {
    if (reply === 1) {
        let pwhash = crypto.createHash('md5').update(pw1).digest('hex');
        client.get(email, function(err, reply) {
          if (err){
            res.sendStatus(500);
          }
          else{
            let userdatastring=reply;
            let userdata=JSON.parse(userdatastring);
            
            if (userdata.Password === pwhash){
              console.log('Bejelentkezve');
              let authNumber = Math.random()*65536;
              userdata.AuthNumber=authNumber;
              let userstring = JSON.stringify(userdata);
              console.log(userstring);
              client.del(email);
              client.set(email,userstring);
              res.cookie('AuthNumber', authNumber).send();
            }
          }
          
        });
        
        
    } else {
        res.sendStatus(400);
    }
}); 
}); 


router.post('/register', async (req,res) => {
  let nickname = req.query.nickname;
  let email = req.query.email;
  let pw1 = req.query.password;
  client.select(0);

  client.exists(email, (err, reply) => {
    if (reply === 1) {
        console.log('exists');
        res.sendStatus(400);
    } else {
        let pwhash = crypto.createHash('md5').update(pw1).digest('hex');
        let newuser = { "Email" : Email, "NickName" : NickName, "Password" : pwhash };
        let newuserstring = JSON.stringify(newuser);
        console.log(newuserstring);
        client.set(email,newuserstring);
        res.sendStatus(200);
    }
  }); 
});

router.get('/user', async (req,res) => {
  if (checkAuthentication(req,res) === 1)
    return;

  client.select(0);

  client.get(UserId, function(err, reply) {
      if (err){
        res.sendStatus(500);
      }
      else{
        let userdata=JSON.parse(reply);
        let publicParams = {'NickName' : userdata.NickName, 'Email' : userdata.Email };
        let publicUserString = JSON.stringify(publicParams);
        res.send(publicUserString);
      }
          
  });
  console.log('User GET');
}); 

router.post('/user', async (req,res) => {
  if (checkAuthentication(req,res) === 1)
    return;

  // ne lehessen email-t valtoztani, mert akkor mindenutt modositani kell
  let email = UserId;
  let nickname = req.query.nickname;
  let pw1 = req.query.password;
  client.select(0);
  client.del(email);
  let pwhash = crypto.createHash('md5').update(pw1).digest('hex');
  let newuser = { "Email" : Email, "NickName" : NickName, "Password" : pwhash };
  let newuserstring = JSON.stringify(newuser);
  console.log(newuserstring);
  client.set(email,newuserstring);
  res.sendStatus(200);
});

router.delete('/user', async (req,res) => {
  if (checkAuthentication(req,res) === 1)
    return;

  client.select(0);
  client.del(UserId);
  console.log("User DELETE");
});

router.get('/user/rooms', async (req,res) => {
  if (checkAuthentication(req,res) === 1)
    return;
  client.select(1);

  client.keys('*', function (err, keys) {
      if (err) return console.log(err);
      let rooms =[];
      for(var i = 0, len = keys.length; i < len; i++) {
          let roomid = keys[i];
          client.get(roomid, function(err, reply) {
          if (err){
            res.sendStatus(500);
            return 1;
          }
          else{
            let roomdatastring=reply;
            let roomdata = JSON.parse(roomdatastring);
            let members = roomdata.Members;
            
            for (var i = 0; i < members.length; i++) {
              if (members[i] === UserId) {
                rooms.push(roomid);
              }
            }

          }
        });
      
    } 
    let foundrooms = { "Rooms" : rooms};
    let foundroomsstr = JSON.stringify(foundrooms);
    res.send(foundroomsstr);    
  });
  console.log('User/rooms GET');
}); 

router.get('/user/rooms/:roomid', async (req,res) => {
  if (checkAuthentication(req,res) === 1)
    return;

  client.select(1);
  var roomid=req.params.roomid;
  client.get(roomid, function(err, reply) {
          if (err){
            res.sendStatus(400);
          }
          else{
            let roomdatastring=reply;
            res.send(roomdatastring);
          }
  });
  console.log('get rooms/roomid');
}); 

router.delete('/user/rooms/:roomid', async (req,res) => {
  if (checkAuthentication(req,res) === 1)
    return;
  console.log('User/rooms/:roomid DELETE');
}); 

router.post('/user/rooms/:roomid/join', async (req,res) => {
  console.log("User/rooms/:roomid/join POST");
}); 

router.get('/user/rooms/:roomid/messages', async (req,res) => {
  console.log("User/rooms/:roomid/messages GET");
}); 

router.post('/user/rooms/:roomid/messages', async (req,res) => {
  console.log("User/rooms/:roomid/messages POST");
}); 

router.get('/user/admin/rooms', async (req,res) => {
  console.log("user/admin/rooms GET");
});

router.post('/user/admin/rooms', async (req,res) => {
  console.log("user/admin/rooms POST");
});

router.get('/user/admin/rooms/:roomid', async (req,res) => {
  console.log("user/admin/rooms/roomid GET");
});

router.put('/user/admin/rooms/:roomid', async (req,res) => {
  console.log("user/admin/rooms/roomid PUT");
});

router.put('/user/admin/rooms/:roomid/invite/:uname', async (req,res) => {
  console.log("/user/admin/rooms/:roomid/invite/:uname PUT");
});

router.delete('/user/admin/rooms/:roomid', async (req,res) => {
  console.log("user/admin/rooms/roomid DELETE");
});

router.get('/users/:userid', async (req,res) => {
  console.log("users/:userid GET");
});

router.get('/users/search/:keyword', async (req,res) => {
  console.log("users/search/:keyword GET");
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

