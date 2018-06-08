import babel from 'rollup-plugin-babel'
import eslint from 'rollup-plugin-eslint'

export default {
  entry: './entry.js',
  dest: './dist/index.js',
  format: 'umd',
  moduleName: 'MQ',
  external: [ 'vue' ],
  globals: {
    vue: 'Vue'
  },
  plugins: [
    eslint(),
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      'presets': [
        ['env', {
          'targets': {
            'ie': 11
          },
          modules: false
        }]
      ],
      'plugins': [
        'transform-object-rest-spread'
      ]
    })
  ]
}
