import Vue from 'vue'
import plugin, {mq} from './index.js'
import 'jasmine-expect'
import matchMediaMock from 'match-media-mock'

global.window = {}
global.window.matchMedia = matchMediaMock.create()
global.window.resizeTo = (x, y) => {
  global.window.matchMedia.setConfig({
    type: 'screen',
    width: x
  })
}

beforeAll(() => {
  Vue.use(plugin)
})
beforeEach(() => {
  global.window.resizeTo(1400, 0)
})

const rootOpts = {
  tablet: '(max-width: 1024px)',
  desktop: '(min-width: 1024px)'
}

describe('The plugin', () => {
  it('makes an $mq getter available in the Vue instance', () => {
    const vm = new Vue()
    expect(vm.$mq).toBeInstanceOf(Object)
  })
  it('accepts media query options on the root Vue instance', () => {
    const vm = new Vue({
      mq: rootOpts
    })
    expect(vm.$mq).toHaveProperty('tablet')
    expect(vm.$mq).toHaveProperty('desktop')
  })
  it('provides an "all" property on the $mq object', () => {
    global.window.resizeTo(700, 0)
    const vm = new Vue({
      mq: {
        phone: '(max-width: 768px)',
        tablet: '(max-width: 1024px)'
      },
      render (h) {
        return h()
      }
    })
    vm.$mount()
    expect(vm.$mq).toHaveProperty('all')
    expect(vm.$mq.all.join(' ')).toEqual('phone tablet')
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

    expect(vmchild[mq]._tablet).toEqual(vmchild[mq]._phone)
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
