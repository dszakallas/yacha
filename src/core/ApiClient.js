import storage from './storage';


const ApiClient = {

  getUser() {
    return storage.user ? JSON.parse(storage.user) : null;
  },

  loggedIn() {
    return !!storage.user;
  },

  async login(email, password) {
    if (storage.user) {
      return JSON.parse(storage.user);
    }
    const user = await Promise.resolve({ nickname: 'mock_user', email: 'mock_user@neverland.io'});
    storage.user = JSON.stringify(user);
    return user;
  },

  async logout() {
    delete storage.user;
  },

  async verify(forgot, token) {
    return await Promise.reject(new Error('not implemented'));
  },

  async changePassword(password) {
    return await Promise.reject(new Error('not implemented'));
  },

  async rooms() {
    return await Promise.resolve([
      { id: 'roomid0', name: 'fancyRoom0', private: false },
      { id: 'roomid1', name: 'fancyRoom1', admin: true, private: false },
    ]);
  },

  async room(id) {
    return await Promise.resolve({
      id: 'roomid0',
      name: 'fancyRoom0',
      admins: [ { nickname: 'someone', email: 'someone@akarmi.com' } ],
      members: [ { nickname: 'else', email: 'else@akarmi.com' } ],
      private: false,
    });
  },

  async renameRoom(id, newName) {
    return await Promise.reject(new Error('not implemented'));
  },

  async leave(roomid) {
    return await Promise.reject(new Error('not implemented'));
  },

  async roomInvite(roomid, emailHash) {
    return await Promise.reject(new Error('not implemented'));
  },

  async joinRoom(token) {
    return await Promise.reject(new Error('not implemented'));
  },

  async messages(id, Private) {
    return Promise.resolve(
      [{
        User: {
          id: 'userid0',
          nickname: 'someone'
        },
        ServerTimestamp: 'fadsfasdf',
        Message: 'blablsaldflsadlf'
      }, {
        User: {
          id: 'userid1',
          nickname: 'else'
        },
        ServerTimestamp: '543523464326',
        Message: 'i dont get it'
      }]
    );
  },

  async createRoom(name) {
    return await Promise.reject(new Error('not implemented'));
  },

  async deleteRoom(id) {
    return await Promise.reject(new Error('not implemented'));
  },

  async friends() {
    return await Promise.resolve([
      { nickname: 'danny', email: 'danny@rad.io' },
      { nickname: 'lisa', email: 'lisa@rad.io' },
    ]);
  },

  async invites() {
    return await Promise.resolve([
      { nickname: 'someone u invited', email: 'cat@rad.io' },
    ]);
  },

  async requests() {
    return await Promise.resolve([
      { nickname: 'someone invited u', email: 'cat@rad.io' },
    ]);
  },

  async invite(userid) {
    return await Promise.reject(new Error('not implemented'));
  },

  async accept(userid) {
    return await Promise.reject(new Error('not implemented'));
  },

  async registerAndSendActivation(email, username, password) {
    return await Promise.reject(new Error('not implemented'));
  },

  async user(userid) {
    return await Promise.resolve({ nickname: 'mock_user', email: 'mock_user@neverland.io'})
  },

  async sendForgot(email) {
    return await Promise.reject(new Error('not implemented'));
  },
};

export default ApiClient;
