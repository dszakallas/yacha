
import request from 'superagent';
import storage from './storage';

function apiUrl(path) {
    return `/api${path}`;
}

const ApiClient = {

  getToken: () => {
    return storage.token;
  },

  getUser: () => {
    return storage.user ? JSON.parse(storage.user) : null;
  },

  loggedIn: () => {
    return !!storage.user;
  },

  onChange: () => {},

  login: (email, password) => new Promise((resolve, reject) => {

    if (storage.user) {
      let user = JSON.parse(storage.user);
      if(user && user.email && user.nickname) {
        resolve(user);
        ApiClient.onChange(null, user);
        return;
      }
    }
    delete storage.user;
    request
      .post(apiUrl('/login'))
      .send({email: email, password: password})
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(err);
          ApiClient.onChange(err, null);
        } else {
          storage.token = res.header['X-Yacha-AuthToken'];
          storage.user = JSON.stringify(res.body);
          resolve(res.body);
          ApiClient.onChange(null, JSON.parse(storage.user));
        }
      });
  }),

  logout: () => new Promise((resolve, reject) => {
    delete storage.token;
    delete storage.user;
    request
      .post(apiUrl('/logout'))
      .end((err, res) => {
        if(err)
          console.error(err);
      });
    resolve();
    ApiClient.onChange();
  }),

  verify: (forgot, token) => new Promise((resolve, reject) => {
    const url = forgot ? apiUrl('/forgot/verify') : apiUrl('/activate/verify')
    request
      .post(url)
      .send({token: token})
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(res);
        } else {
          storage.token = res.header['X-Yacha-AuthToken'];
          storage.user = JSON.stringify(res.body);
          resolve(res.body);
        }
      });
  }),

  changePassword: (password) => new Promise((resolve, reject) => {
    request
      .put(apiUrl('/user'))
      .send({password : password})
      .end((err, res) => {
        if (err) {
          reject(res);
        } else {
          resolve(res.body);
        }
      });
  }),

  rooms: () => new Promise((resolve, reject) => {
    request
      .get(apiUrl('/user/rooms'))
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(res);
        } else {
          resolve(res.body);
        }
      });
  }),

  room: (id) => new Promise((resolve, reject) => {
    let encoded = encodeURIComponent(id);
    request
      .get(apiUrl(`/user/rooms/${encoded}`))
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(res);
        } else {
          resolve(res.body);
        }
      });
  }),

  renameRoom: (id, newName) => new Promise((resolve, reject) => {
    let encoded = encodeURIComponent(id);
    request
      .put(apiUrl(`/user/rooms/${encoded}`))
      .send({name : name})
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(res);
        } else {
          resolve(res.body);
        }
      });
  }),

  leave: (roomid) => new Promise((resolve, reject) => {
    let encoded = encodeURIComponent(roomid);
    request
      .del(apiUrl(`/user/rooms/${encoded}`))
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(res);
        } else {
          resolve(res.body);
        }
      });
  }),

  roomInvite: (roomid, emailHash) => new Promise((resolve, reject) => {
    let encodedRoomid = encodeURIComponent(roomid);
    let encodedEmail = encodeURIComponent(emailHash);
    request
      .post(apiUrl(`/user/admin/rooms/${encodedRoomid}/invite/${encodedEmail}`))
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(res);
        } else {
          resolve(res.body);
        }
      });
  }),

  renameRoom: (roomid, name) => new Promise((resolve, reject) => {
    let encodedRoomid = encodeURIComponent(roomid);
    request
      .put(apiUrl(`/user/admin/rooms/${encodedRoomid}`))
      .send({name: name})
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(res);
        } else {
          resolve(res.body);
        }
      });
  }),

  joinRoom: (token) => new Promise((resolve, reject) => {
    request
      .post(apiUrl(`/user/join`))
      .send({token: token})
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(res);
        } else {
          resolve(res.body);
        }
      });
  }),

  messages: (id, Private) => new Promise((resolve, reject) => {
    let encoded = encodeURIComponent(id);
    if(Private) {
      request
        .get(apiUrl(`/user/pm/${encoded}`))
        .end((err, res) => {
          if(err)
            reject(res);
          else {
            resolve(res.body);
          }
        });

    } else {
      request
        .get(apiUrl(`/user/rooms/${encoded}/messages`))
        .end((err, res) => {
          if(err)
            reject(res);
          else {
            resolve(res.body);
          }
        });
    }
  }),

  createRoom: (name) => new Promise((resolve, reject) => {
    request
      .post(apiUrl('/user/admin/rooms'))
      .send({name: name})
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(res);
        } else {
          resolve(res.body);
        }
      });
  }),

  deleteRoom: (id) => new Promise((resolve, reject) => {
    let encoded = encodeURIComponent(id);
    request
      .del(apiUrl(`/user/admin/rooms/${encoded}`))
      .send({name: name})
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(res);
        } else {
          resolve(res.body);
        }
      });
  }),

  friends: () => new Promise((resolve, reject) => {
    request
      .get(apiUrl('/user/friends'))
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(res);
        } else {
          resolve(res.body);
        }
      });
  }),

  invites: () => new Promise((resolve, reject) => {
    request
      .get(apiUrl('/user/invites'))
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(res);
        } else {
          resolve(res.body);
        }
      });
  }),

  requests: () => new Promise((resolve, reject) => {
    request
      .get(apiUrl('/user/requests'))
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(res);
        } else {
          resolve(res.body);
        }
      });
  }),

  invite: (userid) => new Promise((resolve, reject) => {
    let encoded = encodeURIComponent(userid);
    request
      .post(apiUrl(`/user/invite/${encoded}`))
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(res);
        } else {
          resolve(res.body);
        }
      });
  }),

  accept: (userid) => new Promise((resolve, reject) => {
    let encoded = encodeURIComponent(userid);
    request
      .post(apiUrl(`/user/accept/${encoded}`))
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(res);
        } else {
          resolve(res.body);
        }
      });
  }),

  registerAndSendActivation: (email, username, password) => new Promise((resolve, reject) => {
    request
      .post(apiUrl('/register'))
      .send({email: email, username: username, password: password})
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject({
            register: res
          });
        } else {
          request
            .post(apiUrl('/activate/send'))
            .send({email: email})
            .end((err, activateRes) => {
              if(err) {
                console.log("Failed to activate");
                reject({
                  activate: activateRes
                });
              } else {
                resolve({
                  register: res.body,
                  activate: activateRes.body
                });
              }
            });
        }
      });
  }),



  user: (userid) => new Promise((resolve, reject) => {
    if(!userid) {
      request
        .get(apiUrl('/user'))
        .end((err, res) => {
          if(err)
            reject(res);
          else {
            resolve(res.body);
          }
        });
    } else {
      let encoded = encodeURIComponent(userid);
      request
        .get(apiUrl(`/users/${encoded}`))
        .end((err, res) => {
          if(err)
            reject(res);
          else {
            resolve(res.body);
          }
        });
    }

  }),

  sendForgot: (email) => new Promise((resolve, reject) => {
    request
      .post(apiUrl('/forgot/send'))
      .send({email: email})
      .end((err, res) => {
        if(err)
          reject(res);
        else {
          resolve(res.body);
        }
      });
  })
};

export default ApiClient;
