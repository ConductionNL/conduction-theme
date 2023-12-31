const stringSort = (a, b) => (a === b ? 0 : a > b ? 1 : -1);

const sortByName = (a, b) => stringSort(a.name, b.name);

const createConfig = ({ selector, source = ['src/**/*.tokens.json'] }) => ({
  format: {
    'json/list': function ({ dictionary }) {
      return JSON.stringify(dictionary.allTokens.sort(sortByName), null, '  ');
    },
  },
  source,
  platforms: {
    js: {
      transforms: ['attribute/cti', 'name/cti/camel', 'color/hsl-4'],
      buildPath: 'dist/',
      files: [
        {
          destination: 'index.js',
          format: 'javascript/es6',
        },
      ],
    },
    json: {
      transforms: ['attribute/cti', 'name/cti/camel', 'color/hsl-4'],
      buildPath: 'dist/',
      files: [
        {
          destination: 'tokens.json',
          format: 'json',
        },
        {
          destination: 'index.json',
          format: 'json/list',
        },
      ],
    },
    css: {
      transforms: ['attribute/cti', 'name/cti/kebab', 'color/hsl-4'],
      buildPath: 'dist/',
      files: [
        {
          destination: 'design-tokens.css',
          format: 'css/variables',
          options: {
            selector,
            outputReferences: true,
          },
        },
      ],
    },
    scss: {
      transforms: ['attribute/cti', 'name/cti/kebab', 'color/hsl-4'],
      buildPath: 'dist/',
      files: [
        {
          destination: 'index.scss',
          format: 'scss/variables',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
    less: {
      transforms: ['attribute/cti', 'name/cti/kebab', 'color/hsl-4'],
      buildPath: 'dist/',
      files: [
        {
          destination: 'index.less',
          format: 'less/variables',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
  },
});

module.exports = { createConfig };
