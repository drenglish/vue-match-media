(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('vue')) :
	typeof define === 'function' && define.amd ? define(['vue'], factory) :
	(factory(global.Vue));
}(this, (function (Vue) { 'use strict';

Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

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
    beforeCreate: function beforeCreate() {
      // Merge step, isomorphic
      var isIsolated = this.$options.mq && this.$options.mq.config && this.$options.mq.config.isolated; // Optional chaining take my energy
      var isRoot = this === this.$root;

      if (this.$options.mq) {
        // Component's MQMAP saves its own-option media query strings, for reactive setup later
        this[MQMAP] = !this[MQMAP] ? _extends({}, this.$options.mq) : this[MQMAP]; // GOTCHA: beforeCreate will be called twice on globally registered components, so check if MQMAP already exists
        // While the static $options.mq object is replaced with the full merged set
        this.$options.mq = !(isIsolated || isRoot) ? _extends({}, this.$parent.$options.mq, this.$options.mq) : this.$options.mq;
      } else {
        this.$options.mq = _extends({}, this.$parent.$options.mq);
      }
    },
    beforeMount: function beforeMount() {
      var _this = this;

      // Set reactivity in client-side hook
      if (typeof window.matchMedia !== 'function') return; // Only really needed for testing

      if (this[MQMAP]) {
        var isIsolated = this.$options.mq && this.$options.mq.config && this.$options.mq.config.isolated;

        // Component is root, or has overrides
        var observed = Object.keys(this.$options.mq).filter(function (k) {
          return k !== 'config';
        }).reduce(function (memo, k) {
          var mql = void 0;
          if (!isIsolated) {
            mql = _this.$parent && _this.$parent[MQMAP] && _this.$parent[MQMAP][k];
          }

          var ownQuery = _this[MQMAP] && _this[MQMAP][k];
          if (ownQuery && ownQuery.raw) return memo; // GOTCHA: beforeMount will be called twice on globally registered components

          if (ownQuery) {
            // Warn if there's an issue with the inheritance
            if (mql && ownQuery === mql.raw) {
              Vue$$1.util.warn('Component ' + _this.name + ' appears to be overriding the ' + k + ' media query, but hasn\'t changed the actual query string. The override will have no effect.');
            } else {
              mql = window.matchMedia(ownQuery);
              Object.defineProperty(mql, 'raw', { // Seems like this really ought to be part of the spec
                value: ownQuery,
                enumerable: true,
                configurable: true,
                writable: false
              });
              _this[MQMAP][k] = mql;
            }
          }

          mql.addListener(function (e) {
            memo[k] = e.matches;
          } // Here's where we update the observed object from media-change events
          );memo[k] = mql.matches; // Initial value

          return memo;
        }, {}

        // Define the synthetic "all" property
        );Object.defineProperty(observed, 'all', {
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
        }

        // Won't someone think of the children? Inherit all active MediaQueryLists
        );this[MQMAP] = this.$parent && this.$parent[MQMAP] ? _extends({}, this.$parent[MQMAP], this[MQMAP]) : this[MQMAP];
        Vue$$1.util.defineReactive(this, MQ, observed);
      } else {
        this[MQMAP] = this.$parent[MQMAP];
        Vue$$1.util.defineReactive(this, MQ, this.$parent[MQ] // We're just proxying the parent's reactive setup
        );
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
          // Initial value
          value.call(context, k, true, true);
        }
      });
    }
  });
});

Vue.use(MQ$1);

})));
