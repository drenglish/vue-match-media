import Vue from 'vue/dist/vue.js'
import plugin from './index.js'
import 'jasmine-expect'
import matchMediaMock from 'match-media-mock'

beforeAll(() => {
  Vue.use(plugin)
})

const MQMAP = 'VUE-MATCH-MEDIA-MQUERIES'

const rootOpts = {
  tablet: '(max-width: 1024px)',
  desktop: '(min-width: 1024px)'
}

describe('On the server the plugin', () => {
  beforeEach(() => {
    const child = Vue.component('child', {
      data () { return { name: 'child' } },
      render (h) { return h('div') }
    })
    Vue.component('childB', {
      extends: child,
      mq: {
        phone: '(max-width: 700px)',
        tablet: '(max-width: 700px)'
      }
    })
    Vue.component('childIso', {
      extends: child,
      mq: {
        phone: '(max-width: 700px)',
        tablet: '(max-width: 700px)',
        config: {
          isolated: true
        }
      }
    })
  })
  it('accepts media query options on the root Vue instance', () => {
    const vm = new Vue({
      mq: rootOpts
    })
    expect(vm.$options.mq).toHaveProperty('tablet')
    expect(vm.$options.mq).toHaveProperty('desktop')
    expect(vm[MQMAP]).toHaveProperty('tablet')
    expect(vm[MQMAP]).toHaveProperty('desktop')
  })
  it('implicitly makes inherited media query options available to child components', () => {
    const vm = new Vue({
      mq: rootOpts,
      data: {
        name: 'root'
      },
      render (h) {
        return h('child')
      }
    })
    vm.$mount()
    const vmchild = vm.$children[0]
    expect(vmchild).toHaveProperty('name', 'child')
    expect(vmchild.$options.mq).toHaveProperty('tablet')
    expect(vmchild.$options.mq).toHaveProperty('desktop')
    expect(vmchild[MQMAP]).toBeUndefined()
  })
  it('merges options provided by child components', () => {
    const vm = new Vue({
      mq: rootOpts,
      data: {
        name: 'root'
      },
      render (h) {
        return h('childB')
      }
    })
    vm.$mount()
    const vmchild = vm.$children[0]
    expect(vmchild.$options.mq).toHaveProperty('phone')
    expect(vmchild.$options.mq).toHaveProperty('tablet')
    expect(vmchild.$options.mq).toHaveProperty('desktop')

    expect(vmchild.$options.mq._tablet).toEqual(vmchild.$options.mq._phone)

    expect(vmchild[MQMAP]).toHaveProperty('phone')
    expect(vmchild[MQMAP]).toHaveProperty('tablet')
    expect(vmchild[MQMAP]).not.toHaveProperty('desktop')
  })
  it('allows a child component to declare an isolated scope', () => {
    const vm = new Vue({
      mq: rootOpts,
      data: {
        name: 'root'
      },
      render (h) {
        return h('childIso')
      }
    })
    vm.$mount()
    const vmchild = vm.$children[0]
    expect(vmchild.$options.mq).toHaveProperty('phone')
    expect(vmchild.$options.mq).toHaveProperty('tablet')
    expect(vmchild.$options.mq).not.toHaveProperty('desktop')

    expect(vmchild[MQMAP]).toHaveProperty('phone')
    expect(vmchild[MQMAP]).toHaveProperty('tablet')
    expect(vmchild[MQMAP]).not.toHaveProperty('desktop')
  })
})

describe('The client-mounted plugin', () => {
  beforeAll(() => {
    window.matchMedia = matchMediaMock.create()
    window.resizeTo = (x, y) => {
      window.matchMedia.setConfig({
        type: 'screen',
        width: x
      })
    }
  })
  beforeEach(() => {
    window.resizeTo(1400, 0)
  })
  describe('handles property inheritance and overrides by', () => {
    beforeEach(() => {
      const child = Vue.component('child', {
        data () { return { name: 'child' } },
        render (h) { return h('div') }
      })
      Vue.component('childB', {
        extends: child,
        mq: {
          phone: '(max-width: 700px)',
          tablet: '(max-width: 700px)'
        }
      })
      Vue.component('childIso', {
        extends: child,
        mq: {
          phone: '(max-width: 700px)',
          tablet: '(max-width: 700px)',
          config: {
            isolated: true
          }
        }
      })
    })
    it('accepting media query options on the root Vue instance', () => {
      const vm = new Vue({
        mq: rootOpts,
        render (h) {
          return h('div')
        }
      })
      vm.$mount()
      expect(vm.$mq).toHaveProperty('tablet')
      expect(vm.$mq).toHaveProperty('desktop')
    })
    it('implicitly providing media query options to child components', () => {
      const vm = new Vue({
        mq: rootOpts,
        data: {
          name: 'root'
        },
        render (h) {
          return h('child')
        }
      })
      vm.$mount()
      const vmchild = vm.$children[0]
      expect(vmchild).toHaveProperty('name', 'child')
      expect(vmchild.$mq).toHaveProperty('tablet')
      expect(vmchild.$mq).toHaveProperty('desktop', true)
    })
    it('merging options provided by child components', () => {
      const vm = new Vue({
        mq: rootOpts,
        data: {
          name: 'root'
        },
        render (h) {
          return h('childB')
        }
      })
      vm.$mount()
      const vmchild = vm.$children[0]
      expect(vmchild.$mq).toHaveProperty('phone')
      expect(vmchild.$mq).toHaveProperty('tablet')
      expect(vmchild.$mq).toHaveProperty('desktop', true)

      expect(vmchild.$mq._tablet).toEqual(vmchild.$mq._phone)
    })
    it('allowing a child component to declare an isolated scope', () => {
      const vm = new Vue({
        mq: rootOpts,
        data: {
          name: 'root'
        },
        render (h) {
          return h('childIso')
        }
      })
      vm.$mount()
      const vmchild = vm.$children[0]
      expect(vmchild.$mq).not.toHaveProperty('desktop')
    })
    it('warning if a child re-declares an existing query in an override', () => {
      const warnChild = Vue.extend({
        data () { return { name: 'child' } },
        render (h) { return h('div') },
        mq: {
          tablet: '(max-width: 1024px)'
        }
      })
      const vm = new Vue({
        mq: rootOpts,
        data: {
          name: 'root'
        },
        components: { warnChild },
        render (h) {
          return h(warnChild)
        }
      })

      let testError = ''
      console.error = msg => { testError = msg }
      vm.$mount()
      expect(testError).toEqual(expect.stringContaining('override will have no effect'))
    })
  })
  describe('handles reactivity by', () => {
    beforeEach(() => {
      document.body.appendChild(document.createElement('main'))
    })
    afterEach(() => {
      document.body.removeChild(document.querySelector('#test'))
    })
    it('making $mq properties reactive on the root instance', async () => {
      const vm = new Vue({
        mq: rootOpts,
        template: '<div id="test" :class="{tablet: $mq.tablet}"></div>'
      })
      vm.$mount('main')
      expect(document.getElementById('test').classList.contains('tablet')).toBe(false)
      window.resizeTo(1000, 0)
      await vm.$nextTick()
      expect(document.getElementById('test').classList.contains('tablet')).toBe(true)
    })
    it('making $mq.all reactive', async () => {
      const vm = new Vue({
        mq: {
          phone: '(max-width: 728px)',
          tablet: '(min-width: 700px)',
          desktop: '(min-width: 1024px)'
        },
        template: '<div id="test" :class="$mq.all"></div>'
      })
      vm.$mount('main')
      const classList = document.getElementById('test').classList
      expect(classList.contains('phone')).toBe(false)
      expect(classList.contains('tablet')).toBe(true)
      expect(classList.contains('desktop')).toBe(true)
      window.resizeTo(710, 0)
      await vm.$nextTick()
      expect(classList.contains('phone')).toBe(true)
      expect(classList.contains('tablet')).toBe(true)
      expect(classList.contains('desktop')).toBe(false)
    })
    it('giving reactive properties to an inheriting child instance', async () => {
      const child = Vue.component('child', Vue.extend({
        template: '<div id="test" :class="{tablet: $mq.tablet}"></div>'
      }))
      const vm = new Vue({
        mq: rootOpts,
        components: {
          child
        },
        render (h) {
          return h(child)
        }
      })
      vm.$mount('main')
      expect(document.getElementById('test').classList.contains('tablet')).toBe(false)
      window.resizeTo(1000, 0)
      await vm.$nextTick()
      expect(document.getElementById('test').classList.contains('tablet')).toBe(true)
    })
    it('and to an inheritor overriding root properties', async () => {
      const child = Vue.component('child', Vue.extend({
        template: '<div id="test" :class="$mq.all"></div>',
        mq: {
          phone: '(max-width: 760px)',
          tablet: '(max-width: 760px)'
        }
      }))
      const vm = new Vue({
        mq: rootOpts,
        components: {
          child
        },
        data: {
          name: 'root'
        },
        render (h) {
          return h(child)
        }
      })
      vm.$mount('main')
      const classList = document.getElementById('test').classList
      expect(classList.contains('phone')).toBe(false)
      expect(classList.contains('tablet')).toBe(false)
      expect(classList.contains('desktop')).toBe(true)
      window.resizeTo(710, 0)
      await vm.$nextTick()
      expect(classList.contains('phone')).toBe(true)
      expect(classList.contains('tablet')).toBe(true)
      expect(classList.contains('desktop')).toBe(false)
    })
    it('or isolating itself', async () => {
      const child = Vue.component('child', Vue.extend({
        template: '<div id="test" :class="$mq.all"></div>',
        mq: {
          phone: '(max-width: 760px)',
          tablet: '(max-width: 760px)',
          config: {
            isolated: true
          }
        }
      }))
      const vm = new Vue({
        mq: rootOpts,
        components: {
          child
        },
        data: {
          name: 'root'
        },
        render (h) {
          return h(child)
        }
      })
      vm.$mount('main')
      const classList = document.getElementById('test').classList
      expect(classList.length).toBe(0) // "desktop" would have been hit if this weren't isolated
      window.resizeTo(710, 0)
      await vm.$nextTick()
      expect(classList.contains('phone')).toBe(true)
      expect(classList.contains('tablet')).toBe(true)
    })
  })
  describe('provides an onmedia directive that', () => {
    beforeEach(() => {
      document.body.appendChild(document.createElement('main'))
    })
    afterEach(() => {
      document.body.removeChild(document.querySelector('#test'))
    })
    it('warns on invalid binding expression', async () => {
      let testError = ''
      console.error = msg => { testError = msg }

      const vm = new Vue({
        mq: rootOpts,
        template: '<div id="test" v-onmedia="tablet++"></div>',
        data: {
          tablet: 0,
          desktop: 0
        }
      })
      vm.$mount('main')
      expect(testError).toEqual(expect.stringContaining('Error binding v-onmedia'))
    })
    it('executes for any matched mq watchers', async () => {
      const vm = new Vue({
        mq: rootOpts,
        template: '<div id="test" v-onmedia.any="test"></div>',
        data: {
          tablet: 0,
          desktop: 0
        },
        methods: {
          test (alias, matched) {
            if (matched) this[alias]++
          }
        }
      })
      vm.$mount('main')
      expect(vm).toHaveProperty('desktop', 1) // Hit on init
      expect(vm).toHaveProperty('tablet', 0)
      window.resizeTo(1000, 0)
      await vm.$nextTick()
      expect(vm).toHaveProperty('desktop', 1)
      expect(vm).toHaveProperty('tablet', 1) // Hit on resize
    })
    it('sends an init signal when executed on setup', async () => {
      const vm = new Vue({
        mq: rootOpts,
        template: '<div id="test" v-onmedia.any="test"></div>',
        data: {
          desktop: 0
        },
        methods: {
          test (alias, matched, init = false) {
            if (init && alias === 'desktop') {
              this.desktop = 'init'
            }
          }
        }
      })
      vm.$mount('main')
      expect(vm).toHaveProperty('desktop', 'init')
    })
    it('defaults to .any if no modifiers', async () => {
      const vm = new Vue({
        mq: rootOpts,
        template: '<div id="test" v-onmedia="test"></div>',
        data: {
          tablet: 0,
          desktop: 0
        },
        methods: {
          test (alias, matched) {
            if (matched) this[alias]++
          }
        }
      })
      vm.$mount('main')
      expect(vm).toHaveProperty('desktop', 1) // Hit on init
      expect(vm).toHaveProperty('tablet', 0)
      window.resizeTo(1000, 0)
      await vm.$nextTick()
      expect(vm).toHaveProperty('desktop', 1)
      expect(vm).toHaveProperty('tablet', 1) // Hit on resize
    })
    it('matches only the query alias specified in a modifier', async () => {
      const vm = new Vue({
        mq: rootOpts,
        template: '<div id="test" v-onmedia.tablet="test"></div>',
        data: {
          tablet: 0,
          desktop: 0
        },
        methods: {
          test (alias, matched) {
            if (matched) this[alias]++
          }
        }
      })
      vm.$mount('main')
      expect(vm).toHaveProperty('desktop', 0) // Not specified, so not hit on init
      expect(vm).toHaveProperty('tablet', 0)
      window.resizeTo(1000, 0)
      await vm.$nextTick()
      expect(vm).toHaveProperty('desktop', 0)
      expect(vm).toHaveProperty('tablet', 1) // Hit on resize
    })
    it('allows multiple alias modifiers', async () => {
      const vm = new Vue({
        mq: {...rootOpts, phone: '(max-width: 728px)'},
        template: '<div id="test" v-onmedia.tablet.phone="test"></div>',
        data: {
          phone: 0,
          tablet: 0,
          desktop: 0
        },
        methods: {
          test (alias, matched) {
            if (matched) this[alias]++
          }
        }
      })
      vm.$mount('main')
      expect(vm).toHaveProperty('desktop', 0)
      expect(vm).toHaveProperty('tablet', 0)
      expect(vm).toHaveProperty('phone', 0)
      window.resizeTo(1000, 0)
      await vm.$nextTick()
      expect(vm).toHaveProperty('desktop', 0)
      expect(vm).toHaveProperty('tablet', 1)
      expect(vm).toHaveProperty('phone', 0)
      window.resizeTo(700, 0)
      await vm.$nextTick()
      expect(vm).toHaveProperty('desktop', 0)
      expect(vm).toHaveProperty('tablet', 1)
      expect(vm).toHaveProperty('phone', 1)
    })
    it('accepts a :not argument', async () => {
      const vm = new Vue({
        mq: {
          tablet: '(min-width: 768px)',
          desktop: '(min-width: 1024px)'
        },
        template: '<div id="test" v-onmedia:not.tablet="test"></div>',
        data: {
          tablet: 0,
          desktop: 0
        },
        methods: {
          test (alias, matched) {
            if (matched) this[alias]++
          }
        }
      })
      vm.$mount('main')
      expect(vm).toHaveProperty('desktop', 1) // Hit on init
      expect(vm).toHaveProperty('tablet', 0) // Tablet hit ignored
    })
    it('warns on invalid :not argument', async () => {
      let testError = ''
      console.error = msg => { testError = msg }

      const vm = new Vue({
        mq: rootOpts,
        template: '<div id="test" v-onmedia:not="test"></div>',
        methods: {
          test () {}
        }
      })
      vm.$mount('main')
      expect(testError).toEqual(expect.stringContaining('without any modifiers'))
    })
  })
})
