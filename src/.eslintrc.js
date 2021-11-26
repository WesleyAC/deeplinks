module.exports = {
  extends: [
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['../tsconfig.json'],
  },
};
