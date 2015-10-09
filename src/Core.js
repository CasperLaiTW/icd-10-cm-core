import { Map } from 'immutable';
import _ from 'lodash';
import { load } from './autoload';

class Core
{

  /**
   * Constructor
   * @return void
   */
  constructor() {
  }

  /**
   * Initialize when user select root accident
   * @return void
   */
  _initialize() {
    return new Promise((resolve, reject) => {
      Promise.all([
        this._initializeICD(),
        this._initializeCondition(),
        this._initializeFunctions(),
        this._load()
      ])
      .then(() => {
        resolve();
      });
    });
  }

  /**
   * Initialize dynamic function
   * @return void
   */
  _initializeFunctions() {
    return new Promise((resolve, reject) => {
      _.each(this.menusList, (value, key) => {
        const func = 'set' + _.capitalize(key);
        Core.prototype[func] = (value) => {
          this._filter(key, value);
        }
      });
      resolve();
    });
  }

  /**
   * Initialize conditions
   * @return void
   */
  _initializeCondition() {
    return new Promise((resolve, reject) => {
      this.defaultCondition = {};
      _.each(_.keys(this.menusList), (value) => {
        _.assign(this.defaultCondition, {[value]: undefined});
      });
      resolve();
    });
  }


  /**
   * Initialize ICD-10 property
   * @return void
   */
  _initializeICD() {
    return new Promise((resolve, reject) => {
      const icdKey = ['data'].concat(_.keys(this.menusList));
      let icd = Map();
      _.each(icdKey, (value) => {
        icd = icd.set(value, Map());
      })
      this.defaultICD = icd;
      resolve();
    });
  }

  /**
   * Transform ICD-10-cm json to immutable-js Map
   * @return void
   */
  _load() {
    return new Promise((resolve, reject) => {
      _.each(this.rows, (icds, key) => {
        let data = Map();

        switch (key) {
          case 'data':
            _.each(icds, (value) => {
              data = data.set(value.code, value);
            });
            break;
          default:
            _.each(icds, (value, key) => {
              let tmp = {name: key === 'undefined' ? '' : key, enabled: true};
              data = data.set(value, tmp);
            });
            break;
        }
        this.defaultICD = this.defaultICD.set(key, data);
      });
      this.menus = this.defaultICD.filterNot((value, key) => key === 'data');
      this.reset();
      resolve();
    });
  }

  /**
   * Clone default ICD to ICD property
   * @return void
   */
  _clone() {
    this.ICD = this.defaultICD.get('data');
  }

  /**
   * Filter ICD-10 data
   * @param  string key
   * @param  integer value
   * @return void
   */
  _filter(key, value) {
    this.conditions[key] = value;
    this.ICD = this.ICD.filter(icd => parseInt(icd[key]) === parseInt(value));
  }

  /**
   * Concat all data
   * @param  object data
   * @return object
   */
  _concatAll(data) {
    let _concat = {};
    _.each(this.menus.toObject(), (value, key) => {
      let name = '';
      if (data[key] !== undefined) {
        value = this.defaultICD.get(key).get(data[key].toString()).name
      }
      _.assign(_concat, {[key]: value});
    });

    return _.assign({
      code: data.code,
      content: data.content,
    }, _concat);
  }

  /**
   * Set accident
   * @param {string} accident
   */
  setAccident(accident) {
    this.accident = accident;
    return new Promise((resolve, reject) => {
      load(this.root[accident])
      .then((json) => {
        this.rows = json;
        this.menusList = this.rows.menus;
        this._initialize()
        .then(() => {
          resolve();
        })
      });
    });
  }

  /**
   * Show filter condition result
   * @return Map
   */
  result() {
    return this.ICD.mapEntries(([k, v]) => [k, this._concatAll(v)]);
  }

  /**
   * Reset filter condition
   * @return void
   */
  reset() {
    this._clone();
    this.conditions = _.assign({}, this.defaultCondition);
  }

  /**
   * Undo filter condition
   * @param  string key
   * @return void
   */
  undo(key) {
    this._clone();
    this.conditions[key] = undefined;
    _.each(this.conditions, (value, key) => {
      if (value === undefined) {
        return;
      }
      this._filter(key, value);
    });
  }

  /**
   * Get menu state
   * @return Map
   */
  getConditionState() {
    const keys = this.menus.keySeq().toArray();
    let menus = this.menus;
    const icd = this.ICD.toObject();
    _.each(keys, (value) => {
      const enabled = _.uniq(_.pluck(icd, value));
      let menu = menus.get(value);
      menu.forEach((item, key) => {
        if (_.includes(enabled, key)) {
          menu = menu.set(key, _.set(item, 'enabled', true));
        } else {
          menu = menu.set(key, _.set(item, 'enabled', false));
        }
      });
      menus = menus.set(value, menu);
    });
    return menus;
  }

  /**
   * Get root async
   * @return {Promise}
   */
  getRoot() {
    return new Promise((resolve, reject) => {
      load('root.json').then((json) => {
        this.root = json;
        resolve(json);
      });
    });
  }
}

const core = new Core();

export default core;