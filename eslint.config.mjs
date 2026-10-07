import eslintPluginAstro from 'eslint-plugin-astro';

export default [
  { ignores: ['dist/', '.astro/', 'node_modules/', 'cdk/cdk.out/'] },
  ...eslintPluginAstro.configs.recommended,
];