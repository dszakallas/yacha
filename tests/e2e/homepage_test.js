module.exports = {
  'Does it work?' : function (browser) {
    browser
      .url('http://localhost:8080')
      .waitForElementVisible('body', 1000)
      .assert.containsText('body', 'It works!')
      .end();
  }
};