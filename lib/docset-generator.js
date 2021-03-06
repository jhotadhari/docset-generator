'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DocSetGenerator = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _infoPlist = require('./info-plist');

var _infoPlist2 = _interopRequireDefault(_infoPlist);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs');
var fsx = require('extended-fs');
var os = require('os');
var path = require('path');
var Sequelize = require("sequelize");

var isValidString = function isValidString(str) {
  return typeof str === 'string' && str.trim().length > 0;
};

var INFO_PLIST = 'Info.plist';
var ICON = 'icon.png';
var SQLITE_DB = 'docSet.dsidx';
var DOCSET_EXTENSION = '.docset';
var DATABASE_NAME = 'database_name';
var DATABASE_TABLE = 'searchIndex';
var DATABASE_USER = 'username';
var DATABASE_PWD = 'password';
var CONTENTS_PATH = ['Contents'];
var RESOURCES_PATH = ['Contents', 'Resources'];
var DOCUMENTS_PATH = ['Contents', 'Resources', 'Documents'];
var DOCUMENTATION_TMP_PREFIX = 'docset-generator-';

var DocSetGenerator = function () {
  /**
   * @constructor
   * @param {string} destination - Folder in which to create the docSet
   * @param {string} documentation - path to the html documentation
   * @param {string} name
   * @param {string} [identifier]
   * @param {string} [index=index.html]
   * @param {string} [enableJavascript=false]
   * @param {string} [platformFamily]
   * @param {string} [icon] - path to the icon
   * @param {Array<{ name:string, type:string, path:string }>} [entries]
   */
  function DocSetGenerator(_ref) {
    var documentation = _ref.documentation,
        _ref$destination = _ref.destination,
        destination = _ref$destination === undefined ? documentation : _ref$destination,
        _ref$enableJavascript = _ref.enableJavascript,
        enableJavascript = _ref$enableJavascript === undefined ? false : _ref$enableJavascript,
        _ref$entries = _ref.entries,
        entries = _ref$entries === undefined ? [] : _ref$entries,
        icon = _ref.icon,
        _ref$index = _ref.index,
        index = _ref$index === undefined ? 'index.html' : _ref$index,
        name = _ref.name,
        _ref$identifier = _ref.identifier,
        identifier = _ref$identifier === undefined ? name : _ref$identifier,
        _ref$platformFamily = _ref.platformFamily,
        platformFamily = _ref$platformFamily === undefined ? name : _ref$platformFamily,
        _ref$verbose = _ref.verbose,
        verbose = _ref$verbose === undefined ? false : _ref$verbose;

    _classCallCheck(this, DocSetGenerator);

    if (!fs.existsSync(documentation)) {
      throw Error("Please provide the path to the html documentation (config: documentation)");
    }

    if (!isValidString(name)) {
      throw Error("Please provide a valid name for this docSet (config: name)");
    }

    this.log = verbose && (typeof console === 'undefined' ? 'undefined' : _typeof(console)) === 'object' ? console.log : function () {};

    this.documentation = path.resolve(documentation);
    this.docSetRoot = path.resolve(destination);

    this.documentationAtDocSetRoot = this.documentation === this.docSetRoot;

    if (!this.documentationAtDocSetRoot && this.docSetRoot.indexOf(this.documentation) > -1) {
      throw Error('The docSet destination can\'t be a subfolder of the documentation folder');
    }

    this.icon = icon;
    this.entries = entries;
    // Gathering info needed by Info.plist
    this.docSetInfo = {
      enableJavascript: enableJavascript,
      index: index,
      name: name,
      identifier: identifier,
      platformFamily: platformFamily
    };

    // Normalizing and caching paths to main folders and files
    this.docSetPath = path.join(this.docSetRoot, identifier + DOCSET_EXTENSION);
    this.docSetDocumentsPath = path.join.apply(path, [this.docSetPath].concat(DOCUMENTS_PATH));
    this.docSetIconPath = path.join(this.docSetPath, ICON);
    this.docSetSqlitePath = path.join.apply(path, [this.docSetPath].concat(RESOURCES_PATH, [SQLITE_DB]));
    this.docSetInfoPlistPath = path.join.apply(path, [this.docSetPath].concat(CONTENTS_PATH, [INFO_PLIST]));
  }

  /**
   * Create the DocSet
   * @returns {Promise}
   */


  _createClass(DocSetGenerator, [{
    key: 'create',
    value: function create() {
      this._generateDocSet();
      return this._populateDatabase();
    }

    /**
     * Generate the DocSet
     * @private
     */

  }, {
    key: '_generateDocSet',
    value: function _generateDocSet() {
      // if the documentation is also the docSet destination folder, move the documentation to the tmp folder
      if (this.documentationAtDocSetRoot) {
        var tmpDestination = path.join(os.tmpdir(), DOCUMENTATION_TMP_PREFIX + Date.now());
        fsx.copyDirSync(this.documentation, tmpDestination);
        fsx.rmDirSync(this.documentation);
        this.documentation = tmpDestination;
      }

      if (!fs.existsSync(this.docSetRoot)) {
        fsx.mkdirpSync(this.docSetRoot);
      }
      if (fs.existsSync(this.docSetPath)) {
        this.log("Folder " + this.docSetPath + " already exists. Deleting it...");
        fsx.rmDirSync(this.docSetPath);
        this.log("Folder " + this.docSetPath + " successfully deleted.");
      }
      fsx.mkdirpSync(this.docSetDocumentsPath);
      this.log("Folder Structure " + this.docSetDocumentsPath + " successfully created.");
      this._copyDocumentation();
      this._copyIcon();
      this._createInfoPlist();
      this._createDatabase();
    }

    /**
     * Copy the documentation
     * @private
     */

  }, {
    key: '_copyDocumentation',
    value: function _copyDocumentation() {
      fsx.copyDirSync(this.documentation, this.docSetDocumentsPath);
      this.log("HTML Documentation successfully copied to " + this.docSetDocumentsPath + ".");
    }
  }, {
    key: '_copyIcon',


    /**
     * Copy the icon
     * @private
     */
    value: function _copyIcon() {
      if (fs.existsSync(this.icon)) {
        fs.createReadStream(this.icon).pipe(fs.createWriteStream(this.docSetIconPath));
        this.log(ICON + " successfully copied to DocSet.");
      } else {
        this.log('No icon specified.');
      }
    }

    /**
     * Create the plist file
     * @private
     */

  }, {
    key: '_createInfoPlist',
    value: function _createInfoPlist() {
      var writeStream = fs.createWriteStream(this.docSetInfoPlistPath);
      writeStream.write((0, _infoPlist2.default)(this.docSetInfo));
      this.log(INFO_PLIST + " successfully copied to DocSet.");
    }

    /**
     * Create the sqlite database
     * @private
     */

  }, {
    key: '_createDatabase',
    value: function _createDatabase() {
      this.sequelize = new Sequelize(DATABASE_NAME, DATABASE_USER, DATABASE_PWD, {
        dialect: 'sqlite',
        storage: this.docSetSqlitePath,
        logging: this.log
      });

      this.log("Database " + SQLITE_DB + " successfully created.");
    }

    /**
     * Populate the sqlite database with entries
     * @private
     * @returns {Promise}
     */

  }, {
    key: '_populateDatabase',
    value: function _populateDatabase() {
      var _this = this;

      var SearchItem = this.sequelize.define(DATABASE_TABLE, {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: Sequelize.STRING,
        type: Sequelize.STRING,
        path: Sequelize.STRING
      }, {
        freezeTableName: true, // otherwise the table is renamed searchIndexes
        timestamps: false
      });

      return this.sequelize.sync({
        force: true
      }).then(function () {
        return SearchItem.bulkCreate(_this.entries);
      });
    }
  }]);

  return DocSetGenerator;
}();

exports.default = DocSetGenerator;
exports.DocSetGenerator = DocSetGenerator;