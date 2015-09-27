import icdJson from 'icd-10-cm-parser';
import { Map } from 'immutable';
import _ from 'lodash';

class Core
{

  /**
   * Constructor
   * @return void
   */
  constructor() {
    this.defaultICD = this._initializeICD();
    this.defaultCondition = {
      pedestrian: undefined,
      pedestrianDetail: undefined,
      perpetrator: undefined,
      accidentType: undefined,
      medical: undefined,
    }
    this.conditions = _.assign({}, this.defaultCondition);
    this._load();
  }

  /**
   * Initialize ICD-10 property
   * @return Map
   */
  _initializeICD() {
    const icdKey = [
      'data',
      'pedestrian',
      'pedestrianDetail',
      'perpetrator',
      'accidentType',
      'medical',
    ];
    let icd = Map();
    _.each(icdKey, (value) => {
      icd = icd.set(value, Map());
    })
    return icd;
  }

  /**
   * Transform ICD-10-cm json to immutable-js Map
   * @return void
   */
  _load() {
    _.each(icdJson, (icds, key) => {
      let data = Map();
      switch (key) {
        case 'data':
          _.each(icds, (value) => {
            data = data.set(value.code, value);
          });
          break;
        case 'pedestrianDetail':
        case 'perpetrator':
        case 'accidentType':
        case 'medical':
        case 'pedestrian':
          _.each(icds, (value, key) => {
            let tmp = {name: key === 'undefined' ? '' : key, enabled: true};
            data = data.set(value, tmp);
          });
          break;
      }
      this.defaultICD = this.defaultICD.set(key, data);
    });
    this._clone();
    this.menus = this.defaultICD.filterNot((value, key) => key === 'data');
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
   * @return Map
   */
  _filter(key, value) {
    this.conditions[key] = value;
    return this.ICD.filter(icd => parseInt(icd[key]) === parseInt(value));
  }

  /**
   * Concat all data
   * @param  object data
   * @return object
   */
  _concatAll(data) {
    return {
      code: data.code,
      content: data.content,
      pedestrian: this.defaultICD.get('pedestrian').get(data.pedestrian).name,
      pedestrianDetail: this.defaultICD.get('pedestrianDetail').get(data.pedestrianDetail).name,
      perpetrator: this.defaultICD.get('perpetrator').get(data.perpetrator).name,
      accidentType: this.defaultICD.get('accidentType').get(data.accidentType).name,
      medical: this.defaultICD.get('medical').get(data.medical).name,
    };
  }

  /**
   * Set pedestrian condition
   * @param integer value
   */
  setPedestrian(value) {
    this.ICD = this._filter('pedestrian', value);
    return this;
  }

  /**
   * Set pedestrian detail condition
   * @param integer value
   */
  setPedestrianDetail(value) {
    this.ICD = this._filter('pedestrianDetail', value);
    return this;
  }

  /**
   * Set perpetrator condition
   * @param integer value
   */
  setPerpetrator(value) {
    this.ICD = this._filter('perpetrator', value);
    return this;
  }

  /**
   * Set accitdent type condition
   * @param integer value
   */
  setAccidentType(value) {
    this.ICD = this._filter('accidentType', value);
    return this;
  }

  /**
   * Set medical condition
   * @param integer value
   */
  setMedical(value) {
    this.ICD = this._filter('medical', value);
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