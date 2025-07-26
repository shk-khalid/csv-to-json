class JSONBuilder {
  buildNestedObject(flat) {
    const result = {};
    Object.keys(flat).forEach(key => {
      this.setNestedValue(result, key, flat[key]);
    });
    return result;
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {};
      cur = cur[k];
    }
    cur[keys[keys.length - 1]] = this.convertValue(value);
  }

  convertValue(v) {
    if (typeof v !== 'string') return v;
    const s = v.trim();
    if (s === '') return '';
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    if (/^\d*\.\d+$/.test(s)) return parseFloat(s);
    if (s.toLowerCase() === 'true') return true;
    if (s.toLowerCase() === 'false') return false;
    if (s.toLowerCase() === 'null') return null;
    if (s.toLowerCase() === 'undefined') return undefined;
    return s;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((cur, k) => {
      if (!cur || typeof cur !== 'object') return undefined;
      return cur[k];
    }, obj);
  }

  hasNestedPath(obj, path) {
    return this.getNestedValue(obj, path) !== undefined;
  }
}

module.exports = new JSONBuilder();