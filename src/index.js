// @flow
import Vue from 'vue'

export const MQ = Symbol('mq')
const MQMAP = Symbol('mqueries')

export default (Vue: Vue, options?: Object): void => {
  Object.defineProperty(Vue.prototype, '$mq', ({
    get (): Object {
      return this[MQ]
    }
  }: Object))

  Vue.mixin({
    beforeCreate (): void {
      const isIsolated = this.$options.mq && this.$options.mq.config && this.$options.mq.config.isolated
      const isRoot = this === this.$root
      const inherited = this.$parent && this.$parent[MQMAP]
      const inheritedKeys = isIsolated || isRoot || !inherited ? [] : Object.keys(inherited)

      if (this.$options.mq) {
        this[MQMAP] = {}

        const mergedKeys = new Set(inheritedKeys.concat(
          Object.keys(this.$options.mq)
            .filter(k => k !== 'config')
        ))

        const observed = Array.from(mergedKeys)
          .reduce((obs, k) => {
            const ownQuery = this.$options.mq[k]
            const mql = ownQuery ? window.matchMedia(ownQuery) : inherited[k]
            mql.addListener(e => { obs[k] = e.matches })

            obs[k] = mql.matches
            this[MQMAP][k] = mql
            return obs
          }, {})

        Object.defineProperty(observed, 'all', ({
          enumerable: true,
          configurable: true,
          get () {
            return Object.keys(this)
              .filter(k => k !== 'all')
              .filter(k => this[k])
          }
        }: Object))

        Vue.util.defineReactive(this, MQ, observed)
      } else if (inherited) {
        this[MQMAP] = inherited
        Vue.util.defineReactive(this, MQ, this.$parent[MQ])
      }
    }
  })

  Vue.directive('onmedia', {
    bind (el?: Node, {value, expression, arg, modifiers}, {context}): void {
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
          }, {immediate: true})
        })
    }
  })
}
