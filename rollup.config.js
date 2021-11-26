import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';


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
