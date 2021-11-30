import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default [
  {
    input: 'src/deeplinks.ts',
    output: {
      dir: 'dist/',
      format: 'es',
      sourcemap: true,
      compact: true,
      generatedCode: 'es2015',
    },
    preserveEntrySignatures: false,
    plugins: [typescript(), terser()],
  },
];
