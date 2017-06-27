import Vue from 'vue/dist/vue.js'
import plugin, {MQ} from './index.js'
import 'jasmine-expect'
import matchMediaMock from 'match-media-mock'

window.matchMedia = matchMediaMock.create()
window.resizeTo = (x, y) => {
  window.matchMedia.setConfig({
    type: 'screen',
    width: x
  })
}

beforeAll(() => {
  Vue.use(plugin)
})
beforeEach(() => {
  window.resizeTo(1400, 0)
})

const rootOpts = {
  tablet: '(max-width: 1024px)',
  desktop: '(min-width: 1024px)'
}

describe('The plugin', () => {
  it('accepts media query options on the root Vue instance', () => {
    const vm = new Vue({
      mq: rootOpts
    })
    expect(vm.$mq).toHaveProperty('tablet')
    expect(vm.$mq).toHaveProperty('desktop')
  })
  it('provides an "all" property on the $mq object', () => {
    const vm = new Vue({
      mq: {
        phone: '(max-width: 728px)',
        tablet: '(min-width: 728px)',
        desktop: '(min-width: 1024px)'
      }
    })
    expect(vm.$mq).toHaveProperty('all')
    expect(vm.$mq.all).toBeArrayOfSize(2)
    expect(vm.$mq.all).not.toEqual(expect.arrayContaining(['phone']))
  })
  it('implicitly provides media query options to child components', () => {
    const child = Vue.component('child', Vue.extend({
      data () { return {name: 'child'} },
      render (h) { return h() }
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
    vm.$mount()
    const vmchild = vm.$children[0]
    expect(vmchild).toHaveProperty('name', 'child')
    expect(vmchild.$mq).toHaveProperty('tablet', false)
    expect(vmchild.$mq).toHaveProperty('desktop', true)
  })
  it('merges query options provided by child components', () => {
    const child = Vue.component('child', Vue.extend({
      data () { return {name: 'child'} },
      render (h) { return h() },
      mq: {
        phone: '(max-width: 700px)',
        tablet: '(max-width: 700px)'
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
    vm.$mount()
    const vmchild = vm.$children[0]
    expect(vmchild.$mq).toHaveProperty('phone', false)
    expect(vmchild.$mq).toHaveProperty('tablet', false)
    expect(vmchild.$mq).toHaveProperty('desktop', true)

    expect(vmchild[MQ]._tablet).toEqual(vmchild[MQ]._phone)
  })
  it('allows a child component to declare an isolated scope', () => {
    const child = Vue.component('child', Vue.extend({
      data () { return {name: 'child'} },
      render (h) { return h() },
      mq: {
        phone: '(max-width: 700px)',
        tablet: '(min-width: 700px)',
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
    vm.$mount()
    const vmchild = vm.$children[0]
    expect(vmchild.$mq).not.toHaveProperty('desktop')
  })
})

describe('In the browser context', () => {
  beforeEach(() => {
    document.body.appendChild(document.createElement('main'))
  })
  afterEach(() => {
    document.body.removeChild(document.querySelector('#test'))
  })
  test('$mq properties are reactive on the root instance', async () => {
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
  test('$mq.all is reactive', async () => {
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
  test('an inheriting child instance get reactive properties', async () => {
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
  test('and when an inheritor overrides root properties', async () => {
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
  test('or isolates itself', async () => {
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
