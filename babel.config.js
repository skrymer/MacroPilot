module.exports = function (api) {
  // Jest sets NODE_ENV to `test`; the config differs there, so the cache is keyed on it.
  const isTest = api.cache.using(() => process.env.NODE_ENV) === 'test';
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    // The preset applies the React Compiler only when Metro asks for it (`app.json`'s
    // `experiments.reactCompiler`), so Jest would otherwise render code the phone never runs: a
    // render that reads the clock passes uncompiled and freezes compiled, its read memoised on a
    // clock that never changes. Same options as the preset, on our own code and not the tests.
    overrides: isTest
      ? [
          {
            exclude: [/node_modules/, /\.test\.tsx?$/],
            plugins: [['babel-plugin-react-compiler', { target: '19' }]],
          },
        ]
      : [],
  };
};
