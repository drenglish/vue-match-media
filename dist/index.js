(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('vue')) :
	typeof define === 'function' && define.amd ? define(['vue'], factory) :
	(factory(global.Vue));
}(this, (function (Vue) { 'use strict';

Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/* eslint no-unused-vars:0 */
var MQ = 'VUE-MATCH-MEDIA-MQ';
var MQMAP = 'VUE-MATCH-MEDIA-MQUERIES';

var MQ$1 = (function (Vue$$1, options) {
  Object.defineProperty(Vue$$1.prototype, '$mq', {
    get: function get() {
      return this[MQ];
    }
  });

  Vue$$1.mixin({
    beforeMount: function beforeMount() {
      var _this = this;

      var isIsolated = this.$options.mq && this.$options.mq.config && this.$options.mq.config.isolated;
      var isRoot = this === this.$root;
      var inherited = this.$parent && this.$parent[MQMAP];
      var inheritedKeys = isIsolated || isRoot || !inherited ? [] : Object.keys(inherited);

      if (this.$options.mq) {
        this[MQMAP] = {};

        var mergedKeys = new Set(inheritedKeys.concat(Object.keys(this.$options.mq).filter(function (k) {
          return k !== 'config';
        })));

        var observed = Array.from(mergedKeys).reduce(function (obs, k) {
          var ownQuery = _this.$options.mq[k];
          var mql = ownQuery ? window.matchMedia(ownQuery) : inherited[k];
          mql.addListener(function (e) {
            obs[k] = e.matches;
          });

          obs[k] = mql.matches;
          _this[MQMAP][k] = mql;
          return obs;
        }, {});

        Object.defineProperty(observed, 'all', {
          enumerable: true,
          configurable: true,
          get: function get() {
            var _this2 = this;

            return Object.keys(this).filter(function (k) {
              return k !== 'all';
            }).filter(function (k) {
              return _this2[k];
            });
          }
        });

        Vue$$1.util.defineReactive(this, MQ, observed);
      } else if (inherited) {
        this[MQMAP] = inherited;
        Vue$$1.util.defineReactive(this, MQ, this.$parent[MQ]);
      }
    }
  });

  Vue$$1.directive('onmedia', {
    bind: function bind(el, _ref, _ref2) {
      var value = _ref.value,
          expression = _ref.expression,
          arg = _ref.arg,
          modifiers = _ref.modifiers;
      var context = _ref2.context;

      var matchers = [].concat(_toConsumableArray(Object.keys(modifiers)));
      var ANY = !matchers.length || modifiers.any;
      var NOT = arg;

      if (!(value instanceof Function)) {
        Vue$$1.util.warn('Error binding v-onmedia: expression "' + expression + '" doesn\'t resolve to\n          a component method, so there\'s nothing to call back on change', context);
        return;
      }
      if (NOT) {
        if (ANY) {
          Vue$$1.util.warn('Error binding v-onmedia: a ":not" argument was passed without any modifiers', context);
          return;
        }
        if (NOT !== 'not') {
          Vue$$1.util.warn('Error binding v-onmedia: unknown argument "' + arg + '" was passed', context);
          return;
        }
      }

      Object.keys(context[MQMAP]).filter(function (k) {
        return ANY || matchers.find(function (m) {
          return NOT ? m !== k : m === k;
        });
      }).forEach(function (k) {
        context.$watch('$mq.' + k, function (newVal, oldVal) {
          value.call(context, k, newVal);
        });
        if (context[MQ][k]) {
          value.call(context, k, true, true);
        }
      });
    }
  });
});

Vue.use(MQ$1);

})));
