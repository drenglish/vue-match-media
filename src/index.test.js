import Vue from 'vue'
import plugin, {mq} from './index.js'
import 'jasmine-expect'

global.window = {}
global.window.matchMedia = jest.fn(query => ({
  matches: false,
  media: query
}))

beforeAll(() => {
  Vue.use(plugin)
})

const rootOpts = {
  tablet: 'tablet',
  desktop: 'desktop'
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
    expect(vmchild.$mq).toHaveProperty('tablet')
    expect(vmchild.$mq).toHaveProperty('desktop')
  })
  it('merges query options provided by child components', () => {
    const child = Vue.component('child', Vue.extend({
      data () { return {name: 'child'} },
      render (h) { return h() },
      mq: {
        phone: 'phone',
        tablet: 'phone'
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
    expect(vmchild.$mq).toHaveProperty('phone')
    expect(vmchild.$mq).toHaveProperty('tablet')
    expect(vmchild.$mq).toHaveProperty('desktop')

    expect(vmchild[mq]._tablet).toBe('phone')
  })
  it('allows a child component to declare an isolated scope', () => {
    const child = Vue.component('child', Vue.extend({
      data () { return {name: 'child'} },
      render (h) { return h() },
      mq: {
        phone: 'phone',
        tablet: 'phone',
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
