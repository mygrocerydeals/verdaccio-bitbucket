'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Bitbucket2 = function () {
  function Bitbucket2(username, password) {
    _classCallCheck(this, Bitbucket2);

    this.apiVersion = '2.0';
    this.apiUrl = 'https://api.bitbucket.org/' + this.apiVersion;
    this.username = username;
    this.password = password;
  }

  _createClass(Bitbucket2, [{
    key: 'getUser',
    value: function getUser() {
      // currently not in use, maybe in the future it will be.
      var username = this.username,
          password = this.password,
          apiUrl = this.apiUrl;

      return (0, _axios2.default)({
        method: 'get',
        url: apiUrl + '/user',
        auth: {
          username: username,
          password: password
        }
      }).then(function (response) {
        return response.data;
      });
    }
  }, {
    key: 'getTeams',
    value: function getTeams(role) {
      var username = this.username,
          password = this.password,
          apiUrl = this.apiUrl;

      var teams = [];

      function callApi(url) {
        return (0, _axios2.default)({
          method: 'get',
          url: url,
          auth: { username: username, password: password }
        }).then(function (response) {
          teams.push.apply(teams, _toConsumableArray(response.data.values.map(function (x) {
            return x.username;
          })));
          if (response.data.next) return callApi(response.data.next);
          return { role: role, teams: teams };
        });
      }

      return callApi(apiUrl + '/teams?role=' + role + '&pagelen=100');
    }
  }, {
    key: 'getPrivileges',
    value: function getPrivileges() {
      return Promise.all([this.getTeams('member'), this.getTeams('contributor'), this.getTeams('admin')]).then(function (values) {
        var result = {};
        values.forEach(function (_ref) {
          var role = _ref.role,
              teams = _ref.teams;

          Object.assign.apply(Object, [result].concat(_toConsumableArray(teams.map(function (t) {
            return _defineProperty({}, t, role);
          }))));
        });
        return { teams: result };
      });
    }
  }]);

  return Bitbucket2;
}();

module.exports = Bitbucket2;