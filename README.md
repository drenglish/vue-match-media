# vue-match-media
A plugin for Vue.js (v. 2+) that offers a consistent, semantic approach to making components media query-aware.

- [Why?](#why)
- [What's it do?](#whats-it-do)
- [How's it work?](#hows-it-work)
	- [Use](#use)
		- [$mq](#mq)
		- [$mq.all](#mqall)
		- [Directive: v-onmedia](#directive-v-onmedia)
	- [Options](#options)
- [Other stuff](#other-stuff)
	- [Install](#install)
	- [Compatibility warning](#compatibility-warning)

## Why?
Media queries are great! Can't do responsive work without them. Try as you might, though, to keep everything you do with them inside the bounds of CSS, inevitably there's going to come a time&mdash;especially when you're working with artful/elaborate/fussy design&mdash;that last-mile pixel or DOM jiggering requires you to get dirty in client-side script. And you go ahead and do the dirty, knowing that down the road you or some other poor soul is in for a headache when some piece of layout changes and all of a sudden that last-mile formatting (long since lost to memory) gets broken.

The `window.matchMedia` API is ... OK I guess? Better than the rigamarole of listening to `resize` events, and it at least feints in the direction of CSS integration. But it makes for awkward and unsemantic code (reading and writing a bunch of `(min-width: 800px)` statements isn't a lot better than a litter of `window.scrollWidth` or whatever checks) and, like `resize`, the change event is global and doesn't scope to DOM elements, meaning it's difficult to establish good predictable patterns for where and how listeners get managed.

So when I confronted the last-mile problem again recently, in a Vue project, it seemed like a good case for a small plugin.

## What's it do?
In the best case, vue-match-media (hereafter known as MQ) allows you to

  - define all your script-available media queries at the Vue root _[making them far easier to reference against your CSS]_
  - aliased to meaningful names such as "tablet", "desktop" and so forth _[maintainers won't have to parse `min-width:` and `max-width:` statements to know what's going on]_
  - that are implicitly provided as simple boolean reactive properties to descendant components _[no more business of calling `matchMedia` or attaching MediaQueryList listeners]_
  - and as such act as if they're scoped to whatever component uses them _[adopting Vue's patterns to give some predictability to `matchMedia` use]_

The goal is to support a simpler, more repeatable process of developing well partitioned, fully layout-aware UI code. Though if you insist on making things more interesting than that, we've got at least a few edge cases covered too.

## How's it work?
### Use
Basic Vue plugin setup:

    import MQ from 'vue-match-media'
    Vue.use(MQ)

Instantiate Vue with your aliased media queries in an "mq" key:

    const vm = new Vue({
      el: '#some-element',
      render (h) { /* Stuff */ },
      mq: {
        phone: '(max-width: 768px)',
        tablet: '(max-width: 1024px)',
        desktop: '(min-width: 1024px)'
      }
    })

Because the plugin relies on `window.matchMedia` to do the actual work, any valid media query is an acceptable value here.

#### $mq
The plugin adds a reactive `$mq` object as an own property on all components. Each key on the object (the query alias) is just a boolean value that indicates whether the aliased query currently matches whatever's going on with the user's device. So long as an ancestor has initialized some `mq` properties, any descendant can update itself when any or all of them change.

    <template>
      <div class="needs-tablet" :class="{active: $mq.tablet}"></div>
      <div v-show="$mq.phone"></div>
    </template>

Of course, simple show/hide on breakpoint is much more correctly handled in CSS. A more robust use-case would involve creating layout-aware rendering paths:

    <template>
      <div v-if="$mq.phone">
      <!-- Special phone thing here -->
      </div>
      <div v-else>
      <!-- Default thing here -->
      </div>
    </template>

As it's often the case that life is a *lot* easier if you can just transparently re-flow the DOM to support that one special-snowflake breakpoint.

#### $mq.all
An `$mq.all` convenience property (also reactive) dumps out an array of the aliases of all of your currently matched media queries. You could, for instance, support a legacy CSS codebase that uses display-mode classes instead of proper media queries for responsive formatting:

    <template>
      <div :class="$mq.all"></div>
    </template>

    // Rendered: <div class="phone tablet"></div>

Though if you're writing a Vue app are you likely to be dealing with that? But this also gives you an easy and predictable way of providing layout hints to any component that needs them:

    <template>
      <my-layout-wrapper :display-mode="$mq.all"></my-layout-wrapper>
    </template>

Allowing the child component to filter on the `displayMode` prop within its own lifecycle hooks to decide just what monkeying it needs to do with what pixels.

#### Directive: v-onmedia
MQ also provides an "onmedia" directive, from which you can invoke component methods whenever one of your media queries registers a change.

    <template>
      <div v-onmedia="doSomething"></div>
    </template>

    <script>
    export default {
      methods: {
        doSomething (alias, matches, init=false) {
          if (alias === 'tablet' && matches)
          /* do something */
        }
      }
    }
    </script>

The callback function is given the alias of the media query that spawned the change, and its new (boolean) `matches` value. The callback will be executed on any change, and also when the directive is first bound (in that case, only if the media query is matched). An extra boolean "init" arg is provided on that first execution, so you can target/avoid it as necessary.

**Important caveat:** The `onmedia` directive is really just syntactic sugar for setting up a watch on one or more of MQ's reactive properties. That means you probably shouldn't use it in a component that's bound to any of those properties, because recursion. Also, **don't expect a browser rendering context** or a full DOM in your callback. The media change event doesn't fire with reference to Vue lifecycle events, so you should only use your callback to change component state (and presumably trigger re-render thereby).

The directive accepts modifiers to limit the watcher scope, if the component only cares about reacting to a subset of the available queries.

    v-onmedia.any= // Fires from any changed media query; default
    v-onmedia= // Equivalent to v-onmedia.any
    v-onmedia.tablet= // Only watch the "tablet"-aliased media query
    v-onmedia.tablet.desktop= // Only watch these two

The directive also accepts a "not" argument, if you want to watch everything _but_ a subset of the available queries.

    v-onmedia:not.tablet= //So, yeah, not tablet

Using `.any` and `:not` could be problematic if you've defined overlapping media queries; your callback will be invoked once for *each* matched query, which is probably not what you want. (Put it another way, you're gonna get some [hop-ons](http://arresteddevelopment.wikia.com/wiki/Stair_car).) Best to use explicit modifiers.

### Options
_Any_ component in the chain can declare `mq` properties, not just at the root. Overriden properties will be merged into the inherited `mq` object and passed down to descendant components.

    // Parent:
    new Vue({
      mq: {
        phone: 'phone-query',
        tablet: 'tablet-query'
      },
      components: {
        child
      }
    })

    const child = new Vue({
      mq: {
        tablet: 'other-tablet-query'
      }
    })
    // $mq.tablet now means 'other-tablet-query' for child and any descendants;
    // $mq.phone still 'phone-query'

The one instance where this would seem to be useful is if you're developing a reusable component that needs to manage its own responsive layout. In which case, you can use a `config` object to declare an isolated scope for the component, and break the inheritance chain:

    // Parent:
    new Vue({
      mq: {
        phone: 'phone-query',
        tablet: 'tablet-query'
      },
      components: {
        child
      }
    })

    const child = new Vue({
      mq: {
        phone: 'other-phone-query',
        config: {
          isolated: true
        }
      }
    })
    // Child is isolated; $mq.phone is now 'other-phone-query'
    // and no $mq.tablet is visible

Now the child component (and any descendant) only knows about its own $mq definitions.

## Other stuff
### Install
From github for now; NPM publish TBD.

### Compatibility warning
MQ uses ES-native Symbols to obscure its internals. So it won't work in retrograde browsers (\*cough\*IE\*cough\*) without Symbol support. Just ponyfill with something like [es6-symbol](https://github.com/medikoo/es6-symbol).
