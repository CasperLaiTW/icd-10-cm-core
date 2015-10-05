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
    load('root.json').then((json) => {
      this.root = json;
    });
  }

  /**
   * Initialize when user select root accident
   * @return void
   */
  _initialize() {
    this._initializeICD();
    this._initializeCondition();
    this._initializeFunctions();
    this._load();
  }

  /**
   * Initialize dynamic function
   * @return void
   */
  _initializeFunctions() {
    _.each(this.menus, (value, key) => {
      const func = 'set' + _.capitalize(key);
      Core.prototype[func] = (value) => {
        this._filter(key, value);
      }
    });
  }

  /**
   * Initialize conditions
   * @return void
   */
  _initializeCondition() {
    this.defaultCondition = _.keys(this.menus).map(value => {value: undefined});
  }


  /**
   * Initialize ICD-10 property
   * @return void
   */
  _initializeICD() {
    const icdKey = ['data'].concat(_.keys(this.menus));
    let icd = Map();
    _.each(icdKey, (value) => {
      icd = icd.set(value, Map());
    })
    this.defaultICD = icd;
  }

  /**
   * Transform ICD-10-cm json to immutable-js Map
   * @return void
   */
  _load() {
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
    this._clone();
    // this.menus = this.defaultICD.filterNot((value, key) => key === 'data');
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
    const _concat = _.map(this.menus, (value, key) => ({[key]: this.defaultICD.get(key).get(data[key]).name}));
    return {
      code: data.code,
      content: data.content,
      ..._concat
    };
  }

  setAccident(accident) {
    this.accident = accident;
    load(this.root[accident])
    .then((json) => {
      this.rows = json;
      this.menus = this.rows.menus;
      this._initialize();
    });
    return this;
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
      this.ICD = this._filter(key, value);
    });
  }

  /**
   * Get menu state
   * @return Map
   */
  getConditionState() {
    const keys = this.menus.keySeq().toArray();
    let menus = this.menus;
    _.each(keys, (value) => {
      const enabled = _.uniq(_.pluck(this.ICD.toObject(), value));
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
}

const core = new Core();

export default core;