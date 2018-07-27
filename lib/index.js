'use strict';

var _bitbucket = require('./bitbucket2');

var _bitbucket2 = _interopRequireDefault(_bitbucket);

var _cache = require('./cache');

var _cache2 = _interopRequireDefault(_cache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Parses config allow option and returns result
 *
 * @param {string} allow - string to parse
 * @returns {Object}
 * @access private
 */
function parseAllow(allow) {
  var result = {};

  allow.split(/\s*,\s*/).forEach(function (team) {
    var newTeam = team.trim().match(/^(.*?)(\((.*?)\))?$/);

    result[newTeam[1]] = newTeam[3] ? newTeam[3].split('|') : [];
  });

  return result;
}

/**
 * Decodes a username to an email address.
 *
 * Since the local portion of email addresses
 * can't end with a dot or contain two consecutive
 * dots, we can replace the `@` with `..`. This
 * function converts from the above encoding to
 * a proper email address.
 *
 * @param {string} username
 * @returns {string}
 * @access private
 */
function decodeUsernameToEmail(username) {
  var pos = username.lastIndexOf('..');
  if (pos === -1) {
    return username;
  }

  return username.substr(0, pos) + '@' + username.substr(pos + 2);
}

/**
 * @class Auth
 * @classdesc Auth class implementing an Auth interface for Verdaccio
 * @param {Object} config
 * @param {Object} stuff
 * @returns {Auth}
 * @constructor
 * @access public
 */
function Auth(config, stuff) {
  if (!(this instanceof Auth)) {
    return new Auth(config, stuff);
  }

  this.allow = parseAllow(config.allow);
  this.ttl = (config.ttl || _cache2.default.CACHE_TTL) * 1000;
  this.Bitbucket2 = _bitbucket2.default;
  this.logger = stuff.logger;
}

/**
 * Logs a given error
 * This is private method running in context of Auth object
 *
 * @param {object} logger
 * @param {string} err
 * @param {string} username
 * @access private
 */
var logError = function logError(logger, err, username) {
  logger.warn(err.code + ', user: ' + username + ', Bitbucket API adaptor error: ' + err.message);
};

/**
 * Performs user authentication by a given credentials
 * On success or failure executing done(err, teams) callback
 *
 * @param {string} username - user name on bitbucket
 * @param {string} password - user password on bitbucket
 * @param {Function} done - success or error callback
 * @access public
 */
Auth.prototype.authenticate = function authenticate(username, password, done) {
  var _this = this;

  // make sure we keep memory low
  // run in background
  setTimeout(_cache2.default.cleanup);

  var user = _cache2.default.getCache(username, password);

  if (!_cache2.default.empty(user)) {
    return done(null, user.teams);
  }

  var bitbucket = new this.Bitbucket2(decodeUsernameToEmail(username), password);

  return bitbucket.getPrivileges().then(function (privileges) {
    var teams = Object.keys(privileges.teams).filter(function (team) {
      if (_this.allow[team] === undefined) {
        return false;
      }

      if (!_this.allow[team].length) {
        return true;
      }

      return _this.allow[team].includes(privileges.teams[team]);
    }, _this);

    user.teams = teams;
    user.expires = new Date(new Date().getTime() + _this.ttl);

    return done(null, teams);
  }).catch(function (err) {
    logError(_this.logger, err, username);
    return done(err, false);
  });
};

Auth.prototype.adduser = function addUser(user, password, cb) {
  cb(null, true);
};

module.exports = Auth;