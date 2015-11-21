/*! React Starter Kit | MIT License | http://www.reactstarterkit.com/ */

import request from 'superagent';

function apiUrl(path) {
    return `/api${path}`;
}

const ApiClient = {

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
                  register: res,
                  activate: activateRes
                });
              }
            });
        }
      });
  }),

  get: path => new Promise((resolve, reject) => {
    request
      .get(apiUrl(path))
      /*.accept('application/json')*/
      .end((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.body);
        }
      });
  }),

  post: (path, data) => new Promise((resolve, reject) => {
    request
      .post(apiUrl(path))
      /*.accept('application/json')*/
      .send(data)
      .end((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.body);
        }
      });
  }),

};

export default ApiClient;
