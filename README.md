# vue-match-media
A Vue.js plugin that offers a consistent, semantic approach to making components media query-aware.

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

The `window.matchMedia` API is ... OK I guess? A lot better than a litter of `if (el.offsetWidth >= 800)` statements in your code, but that's a low bar to clear. Calls to `matchMedia` aren't going to occur at predictable places in client code, and on top of it you're stuck with having to read and write unsemantic `(min-width: 800px)` strings that may or may not jibe with any of your current CSS-defined media breakpoints. And MediaQueryList listeners, because the change event is global, don't scope to DOM elements, another invitation to confusion.

So when I confronted the last-mile problem again recently, in a Vue project, it seemed like a good case for a small plugin.

## What's it do?
In the best case, vue-match-media (hereafter known as MQ) allows you to
  - define all your script-available media queries at the Vue root _[making them far more documentable]_
  - aliased to meaningful names such as "tablet", "desktop" and so forth _[no having to parse min-width: and max-width: statements to know what's going on]_
  - that are implicitly provided as reactive properties to descendant components _[so your code doesn't have to call `matchMedia` or attach MediaQueryList listeners]_
  - and as such act as if they're scoped to whatever component uses them.

Though we have a few more supported options if you insist on making things interesting.

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
The plugin adds a reactive `$mq` object as an own property on all components. Each key on the object (the query alias) is simply a boolean value that indicates whether the aliased query currently matches whatever's going on with the user's device. So long as an ancestor has initialized some `mq` properties, any descendant can update itself when any or all of them change.

    <template>
      <div class="needs-tablet" :class="{active: $mq.tablet}"></div>
      <div v-show="$mq.phone"></div>
    </template>

Of course, simple show/hide on breakpoint is much more correctly handled in CSS. A better use-case might be in a layout-sensitive component that checks `$mq` properties from within (e.g.) a `mounted` hook in order to decide just how its pixels need jiggering.

#### $mq.all
A special `$mq.all` convenience property dumps out an array of the aliases of all of your currently matched media queries.

    <template>
      <div :class="$mq.all"></div>
    </template>

    //Rendered: <div class="phone tablet"></div>

This could be useful in legacy codebases that use these sorts of display-mode classes instead of proper media queries to do responsive formatting, though if you're writing a Vue app are you likely to be dealing with that? Anyway, there it is.

#### Directive: v-onmedia
MQ also supplies an "onmedia" directive, from which you can invoke component methods whenever a media query registers a change.

    <template>
      <div v-onmedia="doSomething"></div>
    </template>

    <script>
    export default {
      methods: {
        doSomething (alias, matches) {
          if (alias === 'tablet' && matches)
          /* do something */
        }
      }
    }
    </script>

The callback function is given the alias of the media query that spawned the change, and its new (boolean) `matches` value. The callback will be executed on change and also on when the bound element is first inserted into its parent.

**Note that there is no guarantee** that you'll have a full DOM or a real rendering context when your callback runs, so this is not a place to do anything elaborate with display. For that, make a layout-aware component that can know when it's been mounted.

The directive accepts modifiers to limit the watcher scope, if the component only cares about reacting to a subset of the available queries.

    v-onmedia.any= //Fires from any changed media query; default
    v-onmedia= //Equivalent to v-onmedia.any
    v-onmedia.tablet= //Only watch the "tablet"-aliased media query
    v-onmedia.tablet.desktop= //Only watch these two

The directive also accepts a "not" argument, if you want to watch everything _but_ a subset of the available queries.

    v-onmedia:not.tablet= //So, yeah, not tablet

### Options
_Any_ component in the chain can declare `mq` properties, not just at the root. Overriden properties will be merged into the inherited `mq` object and passed down to descendant components.

    //Parent:
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
    //$mq.tablet now means 'other-tablet-query' for child and any descendants;
    //$mq.phone still 'phone-query'

The one instance where this would seem to be useful is if you're developing a reusable component that needs to manage its own responsive layout. In which case, you can use a `config` object to declare an isolated scope for the component, and break the inheritance chain:

    //Parent:
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
        tablet: 'other-tablet-query',
        config: {
          isolated: true
        }
      }
    })
    // Child is isolated; no $mq.phone visible to it

Now the child component (and any descendant) only knows about its own $mq definitions.

## Other stuff
### Install
From github for now; NPM publish TBD.

### Compatibility warning
MQ uses ES Symbols to obscure its internals. So it won't work in retrograde browsers (\*cough\*IE\*cough\*) without Symbol support. Just ponyfill with something like [es6-symbol](https://github.com/medikoo/es6-symbol).
