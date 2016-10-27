const Func = module.exports;

const symbol = require('./symbol');
const Co = require('./co');

/* eslint complexity: ['error', 9] */

Func.failed = symbol('failed');

Func.then = symbol('then', function then(func) {
  if (this[Func.failed]) return this;

  try {
    return func ? func(this) : this;
  } catch (error) {
    let err = error;
    if (err[Co.isPrimitive]) err = new err[Co.type](err);
    err[Func.failed] = true;
    return err;
  }
});

Func.fail = symbol('fail', function fail(func) {
  if (!this[Func.failed]) return this;

  try {
    return func ? func(this) : this;
  } catch (error) {
    let err = error;
    if (err[Co.isPrimitive]) err = new err[Co.type](err);
    err[Func.failed] = true;
    return err;
  }
});

Func.range = symbol('range', function range(to) {
  const result = [];

  for (let i = this; i < to; i++) {
    result.push(i - 0);
  }

  return result;
});

Func.keys = symbol('keys', function keys(to) {
  const k = this [Co.type] === Co.types.array ? (0)[Func.range](this.length) : Object.keys(this);
  if (!to) return k;
  to.push(...k);
  return to;
});

Func.values = symbol('values', function values(to) {
  if (this [Co.type] === Co.types.array) {
    if (to) to.push(...this);
    return to || Array.from(this);
  }

  const result = to || [];

  for (const i in this) {
    if (this [Co.hasown](i)) {
      result.push(this[i]);
    }
  }

  return result;
});

const filledArray = function filledArray(value, to) {
  const result = to || [];

  if (this [Co.type] === Co.types.array) {
    for (let i = 0; i < this.length; i++) {
      result.push(value);
    }
  } else {
    for (const i in this) {
      if (this [Co.hasown](i)) {
        result.push(value);
      }
    }
  }

  return result;
};

const mapMap = function mapMap(object, to) {
  const result = to || [];

  if (this [Co.type] === Co.types.array) {
    for (let i = 0; i < this.length; i++) {
      result.push(object[this[i]]);
    }
  } else {
    for (const i in this) {
      if (this [Co.hasown](i)) {
        result.push(object[this[i]]);
      }
    }
  }

  return result;
};

const mapBy = function mapBy(func, to) {
  const result = to || [];

  if (this [Co.type] === Co.types.array) {
    for (let i = 0; i < this.length; i++) {
      result.push(func(this[i], i, this));
    }
  } else {
    for (const i in this) {
      if (this [Co.hasown](i)) {
        result.push(func(this[i], i, this));
      }
    }
  }

  return result;
};

Func.map = symbol('map', function map(func, to) {
  if (!func) return this [Func.values](to);
  const ctor = func[Co.type];
  if (ctor === Co.types.function) return mapBy.call(this, func, to);
  if (ctor[Co.isPrimitive]) return filledArray.call(this, func, to);
  if (ctor[Co.isObjectOrArray]) return mapMap.call(this, func, to);
  return [];
});

const mapKeysEqui = function mapKeysEqui(to) {
  const result = to || {};

  if (this [Co.type] === Co.types.array) {
    for (let i = 0; i < this.length; i++) {
      const value = this[i];
      result[value] = value;
    }
  } else {
    for (const i in this) {
      if (this [Co.hasown](i)) {
        const value = this[i];
        result[value] = value;
      }
    }
  }

  return result;
};

const mapKeysBy = function mapKeysBy(func, to) {
  const result = to || {};

  for (const i in this) {
    if (this [Co.hasown](i)) {
      const value = this[i];
      result[func(value, i, this)] = value;
    }
  }

  return result;
};

const mapKeysFirst = function mapKeysFirst(value, to) {
  const result = to || {};

  if (this [Co.type] === Co.types.array) {
    result[value] = this[0];
  } else {
    for (const i in this) {
      if (this [Co.hasown](i)) {
        result[value] = this[i];
        break;
      }
    }
  }

  return result;
};

const mapKeysMap = function mapKeysMap(map, to) {
  const result = to || {};

  if (this [Co.type] === Co.types.array) {
    for (let i = 0; i < this.length; i++) {
      result[map[i]] = this[i];
    }
  } else {
    for (const i in map) {
      if (map [Co.hasown](i)) {
        result[map[i]] = this[i];
      }
    }
  }

  return result;
};

Func.mapKeys = symbol('mapKeys', function mapKeys(func, to) {
  if (!func) return mapKeysEqui.call(this, to);
  const ctor = func[Co.type];
  if (ctor === Co.types.function) return mapKeysBy.call(this, func, to);
  if (ctor[Co.isPrimitive]) return mapKeysFirst.call(this, func, to);
  if (ctor[Co.isObjectOrArray]) return mapKeysMap.call(this, func, to);
  return {};
});

const mapValuesEqui = function mapValuesEqui(to) {
  const result = to || {};

  if (this [Co.type] === Co.types.array) {
    for (let i = 0; i < this.length; i++) {
      result[i] = i;
    }
  } else {
    for (const i in this) {
      if (this [Co.hasown](i)) {
        result[i] = i;
      }
    }
  }

  return result;
};

const mapValuesBy = function mapValuesBy(func, to) {
  const result = to || {};

  if (this [Co.type] === Co.types.array) {
    for (let i = 0; i < this.length; i++) {
      result[i] = func(this[i], i, this);
    }
  } else {
    for (const i in this) {
      if (this [Co.hasown](i)) {
        result[i] = func(this[i], i, this);
      }
    }
  }

  return result;
};

const mapValuesFill = function mapValuesFill(value, to) {
  const result = to || {};

  if (this [Co.type] === Co.types.array) {
    for (let i = 0; i < this.length; i++) {
      result[i] = value;
    }
  } else {
    for (const i in this) {
      if (this [Co.hasown](i)) {
        result[i] = value;
      }
    }
  }

  return result;
};

const mapValuesMap = function mapValuesMap(map, to) {
  const result = to || {};

  if (this [Co.type] === Co.types.array) {
    for (let i = 0; i < this.length; i++) {
      if (map [Co.hasown](i)) {
        result[i] = map[i];
      }
    }
  } else {
    for (const i in this) {
      if (this [Co.hasown](i)) {
        const key = this[i];
        if (map [Co.hasown](key)) result[i] = map[key];
      }
    }
  }

  return result;
};

const mapValuesArray = function mapValuesArray(array, to) {
  const result = to || {};

  if (this [Co.type] === Co.types.array) {
    for (let i = 0; i < this.length; i++) {
      if (array [Co.hasown](i)) {
        result[this[i]] = array[i];
      }
    }
  } else {
    for (const i in this) {
      if (this [Co.hasown](i)) {
        const key = this[i];
        if (map [Co.hasown](key)) result[i] = array[key];
      }
    }
  }

  return result;
};

Func.mapValues = symbol('mapValues', function mapValues(func, to) {
  if (!func) return mapValuesEqui.call(this, to);
  const ctor = func[Co.type];
  if (ctor === Co.types.function) return mapValuesBy.call(this, func, to);
  if (ctor[Co.isPrimitive]) return mapValuesFill.call(this, func, to);
  if (ctor === Co.types.object) return mapValuesMap.call(this, func, to);
  if (ctor === Co.types.array) return mapValuesArray.call(this, func, to);
  return {};
});

Func.fromPairs = symbol('fromPairs', function fromPairs(to) {
  const result = to || {};

  for (const pair of this) {
    if (pair [Co.type] === Co.types.array) result[pair[0]] = pair[1];
    else if (pair [Co.type] === Co.types.object) result [Func.extend](pair);
    else if (pair [Co.type] === Co.types.function) result [Func.extend](pair());
    else result[pair] = pair;
  }

  return result;
});

const pickArray = function pickArray(what, to) {
  for (const i of what) {
    if (this [Co.hasown](i)) {
      to[i] = this[i];
    }
  }
};

const pickObject = function pickObject(what, to) {
  for (const i in what) {
    if (what [Co.hasown](i) && this [Co.hasown](i)) {
      to[i] = this[i];
    }
  }
};

const pickBy = function pickBy(what, to) {
  for (const i in this) {
    if (this [Co.hasown](i) && what(this[i], i, this)) {
      to[i] = this[i];
    }
  }
};

const pickOne = function pickOne(what, to) {
  const ctor = what[Co.type];
  if (ctor[Co.isPrimitive] && this [Co.hasown](what)) to[what] = this[what];
  else if (ctor === Co.types.function) pickBy.call(this, what, to);
  else if (ctor === Co.types.array) pickArray.call(this, what, to);
  else if (ctor === Co.types.object) pickObject.call(this, what, to);
};

Func.pick = symbol('pick', function pick(...whats) {
  if (!whats.length) return {};
  let to = whats[whats.length - 1];

  if (to && to[Co.type] === Co.types.object) whats.pop();
  else to = {};

  for (const what of whats) {
    if (!what) to[what] = this[what];
    else pickOne.call(this, what, to);
  }

  return to;
});

Func.pickBy = symbol('pickBy', 0 [Func.pick]);

const omitValue = function omitValue(what, to) {
  for (const i in this) {
    if (i !== what && this [Co.hasown](i)) {
      to[i] = this[i];
    }
  }

  return to;
};

const omitObject = function omitObject(what, to) {
  for (const i in this) {
    if (this [Co.hasown](i) && !what [Co.hasown](i)) {
      to[i] = this[i];
    }
  }

  return to;
};

const omitBy = function omitBy(what, to) {
  for (const i in this) {
    if (this [Co.hasown](i) && !what(this[i], i, this)) {
      to[i] = this[i];
    }
  }

  return to;
};

const omitMulti = function omitMulti(whats, to) {
  const omits = this [Func.pick](...whats);

  for (const i in this) {
    if (this[Co.hasown](i) && !omits[Co.hasown](i)) {
      to[i] = this[i];
    }
  }

  return to;
};

const omitOne = function omitOne(what, to) {
  if (what[Co.isPrimitive]) return omitValue.call(this, what, to);
  if (what[Co.type] === Co.types.function) return omitBy.call(this, what, to);
  if (what[Co.type] === Co.types.array) return omitMulti.call(this, [what], to);
  if (what[Co.type] === Co.types.object) return omitObject.call(this, what, to);
  return to;
};

Func.omit = symbol('omit', function omit(...whats) {
  if (!whats.length) return {};
  let to = whats[whats.length - 1];

  if (to && to[Co.type] === Co.types.object) whats.pop();
  else to = {};

  if (whats.length > 1) return omitMulti.call(this, whats, to);
  if (!whats[0]) return omitValue.call(this, whats[0], to);
  return omitOne.call(this, whats[0], to);
});

Func.omitBy = symbol('omitBy', 0 [Func.omit]);

const omitsBy = function omitsBy(what) {
  for (const i in this) {
    if (this [Co.hasown](i) && what(this[i], i, this)) {
      delete this[i];
    }
  }
};

const omitsArray = function omitsArray(what) {
  for (const i of what) {
    delete this[i];
  }
};

const omitsObject = function omitsObject(what) {
  for (const i in what) {
    if (what [Co.hasown](i)) {
      delete this[i];
    }
  }
};

Func.omits = symbol('omits', function omits(...whats) {
  for (const what of whats) {
    if (!what || what[Co.isPrimitive]) delete this[what];
    else if (what[Co.isFunction]) omitsBy.call(this, what);
    else if (what[Co.isArray]) omitsArray.call(this, what);
    else if (what[Co.isObject]) omitsObject.call(this, what);
  }

  return this;
});

Func.defaults = symbol('defaults', function defaults(...whats) {
  for (const what of whats) {
    for (const i in what) {
      if (Object.hasOwnProperty.call(what, i) && !this [Co.hasown](i)) {
        this[i] = what[i];
      }
    }
  }

  return this;
});

Func.extend = symbol('extend', function extend(...whats) {
  for (const what of whats) {
    for (const i in what) {
      if (what [Co.hasown](i)) {
        this[i] = what[i];
      }
    }
  }

  return this;
});

const groupOne = function groupOne(result, key, value) {
  if (!key || key[Co.isPrimitive]) {
    let at = result[key];
    if (!at) result[key] = at = [];
    at.push(value);
  } else if (key[Co.type] === Co.types.array) {
    for (const subkey of key) {
      groupOne(result, subkey, value);
    }
  } else if (key[Co.type] === Co.types.object) {
    for (const i in key) {
      if (key [Co.hasown](i)) {
        groupOne(result, i, key[i]);
      }
    }
  }
};

const groupBy = function groupBy(func, to) {
  const result = to || {};

  for (const i in this) {
    if (this [Co.hasown](i)) {
      const value = this[i];
      const key = func(value, i, this);
      if (key == null) continue; // eslint-disable-line
      groupOne(result, key, value);
    }
  }

  return result;
};

const groupKey = function groupKey(keyname, to) {
  const result = to || {};

  for (const i in this) {
    if (this [Co.hasown](i)) {
      const value = this[i];
      if (!value) continue; // eslint-disable-line
      const key = value[keyname];
      if (key == null) continue; // eslint-disable-line
      groupOne(result, key, value);
    }
  }

  return result;
};

Func.group = symbol('group', function group(func, to) {
  if (func [Co.type] === Co.types.function) return groupBy.call(this, func, to);
  return groupKey.call(this, func, to);
});

Func.groupBy = symbol('groupBy', 0 [Func.group]);
