'use strict';
var expect = require('chai').expect;

var homepage = require('../../lib/home_page');

describe("Home page", function() {
  it("contains a text field with the value 'It works!'", function() {
    expect(homepage.text).to.equal('It works!');
  });
});