import fs from 'node:fs';
import path from 'node:path';
import { writePlaywrightTestFile } from './dslToPlaywrightScript.js';

const runCli = () => {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node packages/codegen/src/cli.js <input-dsl.json> <output-spec.ts>');
    process.exit(1);
  }

  const [inputPath, outputPath] = args;

  try {
    const resolvedInputPath = path.resolve(inputPath);
    if (!fs.existsSync(resolvedInputPath)) {
      console.error(`Error: Input file not found: ${resolvedInputPath}`);
      process.exit(1);
    }

    const rawContent = fs.readFileSync(resolvedInputPath, 'utf8');
    let dsl;

    try {
      dsl = JSON.parse(rawContent);
    } catch (parseError) {
      console.error(`Error: Input file contains invalid JSON: ${parseError.message}`);
      process.exit(1);
    }

    const writtenPath = writePlaywrightTestFile(dsl, outputPath);
    const relativeWrittenPath = path.relative(process.cwd(), writtenPath) || writtenPath;

    console.log('TestForge code generation successful.');
    console.log('');
    console.log('Generated:');
    console.log(relativeWrittenPath);
  } catch (error) {
    console.error(`Code generation failed: ${error.message}`);
    process.exit(1);
  }
};

runCli();
