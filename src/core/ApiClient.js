
import request from 'superagent';

function apiUrl(path) {
    return `/api${path}`;
}

const ApiClient = {

  getToken: () => {
    return localStorage.token;
  },

  getUser: () => {
    return localStorage.user;
  },

  loggedIn: () => {
    return !!localStorage.user;
  },

  onChange: () => {},

  login: (email, password) => new Promise((resolve, reject) => {

    if (localStorage.user) {
      resolve(JSON.parse(localStorage.user));
      this.onChange(null, JSON.parse(localStorage.user));
      return;
    }
    request
      .post(apiUrl('/login'))
      .send({email: email, password: password})
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(err);
          this.onChange(err, null);
        } else {
          localStorage.token = res.header['X-Yacha-AuthToken'];
          localStorage.user = JSON.stringify(res.body);
          resolve(res.body);
          this.onChange(null, res.body);
        }
      });
  }),

  logout: () => new Promise((resolve, reject) => {
    delete localStorage.token;
    delete localStorage.user;
    request
      .post(apiUrl('/logout'))
      .end((err, res) => {
        if(err)
          console.error(err);
      });
    resolve();
    this.onChange();
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
          localStorage.token = res.header['X-Yacha-AuthToken'];
          localStorage.user = JSON.stringify(res.body);
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

  invite: (roomid, emailHash) => new Promise((resolve, reject) => {
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

  messages: (roomId) => new Promise((resolve, reject) => {
    let encoded = encodeURIComponent(roomId);
    request
      .get(apiUrl(`/user/rooms/${encoded}/messages`))
      .end((err, res) => {
        if(err)
          reject(res);
        else {
          resolve(res.body);
        }
      });
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



  user: () => new Promise((resolve, reject) => {
    request
      .get(apiUrl('/user'))
      .end((err, res) => {
        if(err)
          reject(res);
        else {
          resolve(res.body);
        }
      });
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
