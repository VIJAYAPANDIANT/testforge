import path from 'node:path';
import { runPlaywrightTest } from './runner.js';

const parseArgs = () => {
  const args = process.argv.slice(2);
  let testFilePath = null;
  const options = {
    baseUrl: process.env.BASE_URL,
    headless: process.env.HEADLESS !== 'false',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--base-url' && i + 1 < args.length) {
      options.baseUrl = args[++i];
    } else if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.split('=')[1];
    } else if (arg === '--headed') {
      options.headless = false;
    } else if (!arg.startsWith('-') && !testFilePath) {
      testFilePath = arg;
    }
  }

  return { testFilePath, options };
};

const runCli = async () => {
  const { testFilePath, options } = parseArgs();

  if (!testFilePath) {
    console.error('Usage: node apps/worker/src/cli.js <test-file.spec.ts> [--base-url <url>] [--headed]');
    process.exit(1);
  }

  const result = await runPlaywrightTest(testFilePath, options);

  const relativePath = path.relative(process.cwd(), result.testFilePath) || result.testFilePath;
  const isHeadless = options.headless !== false && process.env.HEADLESS !== 'false';

  console.log('');
  console.log('TestForge Worker Execution');
  console.log('--------------------------');
  console.log(`Test:     ${relativePath || testFilePath}`);
  console.log(`Browser:  Chromium (${isHeadless ? 'Headless' : 'Headed'})`);
  console.log(`Status:   ${result.status.toUpperCase()}`);
  console.log(`Exit code: ${result.exitCode}`);
  console.log(`Duration: ${result.durationMs}ms`);

  if (result.error || (!result.success && result.stderr)) {
    console.log('');
    console.log('Error Details:');
    console.log(result.error || result.stderr);
  }

  process.exitCode = result.exitCode;
};

runCli();
