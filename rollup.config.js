import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: [
    { file: './lib/cjs/index.js', format: 'cjs' },
    { file: './lib/esm/index.js', format: 'es' },
  ],
  plugins: [typescript()],
};
