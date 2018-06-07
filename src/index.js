/* eslint no-unused-vars:0 */
import Vue from 'vue'

const MQ = 'VUE-MATCH-MEDIA-MQ'
const MQMAP = 'VUE-MATCH-MEDIA-MQUERIES'

export default (Vue, options) => {
  Object.defineProperty(Vue.prototype, '$mq', {
    get () {
      return this[MQ]
    }
  })

  Vue.mixin({
    beforeCreate () { // Merge step, isomorphic
      const isIsolated = this.$options.mq && this.$options.mq.config && this.$options.mq.config.isolated
      const isRoot = this === this.$root

      if (this.$options.mq) {
        // Component's MQMAP saves its own-option media query strings, for reactive setup later
        this[MQMAP] = {...this.$options.mq}
        // While the static $options.mq object is replaced with the full merged set
        this.$options.mq = !(isIsolated || isRoot) ? {...this.$parent.$options.mq, ...this.$options.mq} : this.$options.mq
      } else {
        this.$options.mq = {...this.$parent.$options.mq}
      }
    },
    beforeMount () { // Set reactivity in client-side hook
      if (this[MQMAP]) {
        // Component is root, or has overrides
        const observed = {}
        Object.keys(this.$options.mq).reduce((memo, k) => {
          let mql = this.$parent && this.$parent[MQMAP][k]

          const ownQuery = this[MQMAP] && this[MQMAP][k]
          if (ownQuery) {
            // Warn if there's an issue with the inheritance
            if (this.$parent && this.$parent[MQMAP] && this.parent[MQMAP][k] && ownQuery === this.$parent[MQMAP][k].raw) { // Optional chaining take my energy
              Vue.util.warn(`Component ${this.name} appears to be overriding the ${k} media query, but hasn't changed the actual query string. The override will have no effect.`)
            } else {
              mql = window.matchMedia(ownQuery)
              Object.defineProperty(mql, 'raw', { // Seems like this really ought to be part of the spec
                value: ownQuery,
                enumerable: true,
                configurable: true,
                writable: false
              })
            }
          }

          mql.addListener(e => { memo[k] = e.matches }) // Here's where we update the observed object from media-change events
          memo[k] = mql.matches // Initial value
        }, observed)

        // Define the synthetic "all" property
        Object.defineProperty(observed, 'all', {
          enumerable: true,
          configurable: true,
          get () {
            return Object.keys(this)
              .filter(k => k !== 'all')
              .filter(k => this[k])
          }
        })

        // Won't someone think of the children? Inherit all active MediaQueryLists
        this[MQMAP] = {...this.$parent[MQMAP], ...this[MQMAP]}
        Vue.util.defineReactive(this, MQ, observed)
      } else {
        this[MQMAP] = this.$parent[MQMAP]
        Vue.util.defineReactive(this, MQ, this.$parent[MQ]) // We're just proxying the parent's reactive setup
      }
    }
  })

  Vue.directive('onmedia', {
    bind (el, {value, expression, arg, modifiers}, {context}) {
      const matchers = [...Object.keys(modifiers)]
      const ANY = !matchers.length || modifiers.any
      const NOT = arg

      if (!(value instanceof Function)) {
        Vue.util.warn(`Error binding v-onmedia: expression "${expression}" doesn't resolve to
          a component method, so there's nothing to call back on change`, context)
        return
      }
      if (NOT) {
        if (ANY) {
          Vue.util.warn(`Error binding v-onmedia: a ":not" argument was passed without any modifiers`, context)
          return
        }
        if (NOT !== 'not') {
          Vue.util.warn(`Error binding v-onmedia: unknown argument "${arg}" was passed`, context)
          return
        }
      }

      Object.keys(context[MQMAP])
        .filter(k =>
          ANY || matchers.find(m => NOT ? m !== k : m === k)
        )
        .forEach(k => {
          context.$watch(`$mq.${k}`, (newVal, oldVal) => {
            value.call(context, k, newVal)
          })
          if (context[MQ][k]) { // Initial value
            value.call(context, k, true, true)
          }
        })
    }
  })
}
