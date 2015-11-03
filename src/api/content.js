/*! React Starter Kit | MIT License | http://www.reactstarterkit.com/ */

import { join } from 'path';
import { Router } from 'express';
import jade from 'jade';
import fm from 'front-matter';
import fs from '../utils/fs';

// A folder with Jade/Markdown/HTML content pages
const CONTENT_DIR = join(__dirname, './content');

// Extract 'front matter' metadata and generate HTML
const parseJade = (path, jadeContent) => {
  const fmContent = fm(jadeContent);
  const htmlContent = jade.render(fmContent.body);
  return Object.assign({ path, content: htmlContent }, fmContent.attributes);
};

const router = new Router();

/*router.get('/', async (req, res, next) => {
  try {
    const path = req.query.path;

    if (!path || path === 'undefined') {
      res.status(400).send({error: `The 'path' query parameter cannot be empty.`});
      return;
    }

    let fileName = join(CONTENT_DIR, (path === '/' ? '/index' : path) + '.jade');
    if (!await fs.exists(fileName)) {
      fileName = join(CONTENT_DIR, path + '/index.jade');
    }

    if (!await fs.exists(fileName)) {
      res.status(404).send({error: `The page '${path}' is not found.`});
    } else {
      const source = await fs.readFile(fileName, { encoding: 'utf8' });
      const content = parseJade(path, source);
      res.status(200).send(content);
    }
  } catch (err) {
    next(err);
  }
});*/


router.post('/login', async (req,res) => {
  console.log("Login POSt");
}); 


router.post('/register', async (req,res) => {
  console.log("Register POST");
}); 

router.get('/user', async (req,res) => {
  console.log("User GET");
}); 

router.post('/user', async (req,res) => {
  console.log("User POST");
});

router.delete('/user', async (req,res) => {
  console.log("User DELETE");
});

router.get('/user/rooms', async (req,res) => {
  console.log("User/rooms GET");
}); 

router.get('/user/rooms/:roomid', async (req,res) => {
  var roomid=req.params.roomid;
  console.log(roomid);
}); 

router.delete('/user/rooms/:roomid', async (req,res) => {
  console.log("User/rooms/:roomid DELETE");
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

