/*! React Starter Kit | MIT License | http://www.reactstarterkit.com/ */

import request from 'superagent';

function apiUrl(path) {
    return `/api${path}`;
}

const ApiClient = {

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

  login: (email, password) => new Promise((resolve, reject) => {
    request
      .post(apiUrl('/login'))
      .send({email: email, password: password})
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.body);
        }
      });
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

  logout: () => new Promise((resolve, reject) => {
    request
      .post(apiUrl('/logout'))
      .end((err, res) => {
        if(err)
          reject(res);
        else {
          resolve(res.body);
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
