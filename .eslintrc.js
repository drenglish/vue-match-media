module.exports = {
  'extends': [
    'standard',
    'plugin:flowtype/recommended'
  ],
  'plugins': [
    'standard',
    'promise',
    'flowtype'
  ],
  'env': {
    'node': true,
    'jest': true
  },
  'rules': {
    'no-multiple-empty-lines': 'warn',
    'no-trailing-spaces': 'warn',
    'no-unused-vars': 'warn',
    'padded-blocks': 'warn',
    'yield-star-spacing': ['error', 'after']
  }
}
