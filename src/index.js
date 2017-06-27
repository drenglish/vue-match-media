// @flow
import Vue from 'vue'

export const MQ = Symbol('mq')
export const MQMAP = Symbol('mqueries')

export default (Vue: Vue, options?: Object): void => {
  Object.defineProperty(Vue.prototype, '$mq', ({
    get () {
      return this[MQ]
    }
  }: Object))

  Vue.mixin({
    beforeCreate () {
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
}
