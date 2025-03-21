import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

interface TestOptions {
  watch: boolean;
}

export async function test(name: string, options: TestOptions): Promise<void> {
  try {
    const spinner = ora('Running tests...').start();

    // Validate component exists
    const componentPath = path.join(process.cwd(), 'src', name);
    if (!fs.existsSync(componentPath)) {
      spinner.fail(chalk.red(`Component "${name}" not found`));
      process.exit(1);
    }

    // Validate test file exists
    const testPath = path.join(componentPath, '__tests__', 'index.test.ts');
    if (!fs.existsSync(testPath)) {
      spinner.fail(chalk.red(`Test file not found for component "${name}"`));
      process.exit(1);
    }

    // Run tests
    try {
      if (options.watch) {
        // Run tests in watch mode
        execSync('jest --watch', { stdio: 'inherit' });
      } else {
        // Run tests once
        execSync('jest', { stdio: 'inherit' });
      }
    } catch (error) {
      spinner.fail(chalk.red('Tests failed'));
      process.exit(1);
    }

    spinner.succeed(chalk.green('Tests completed successfully!'));
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Failed to run tests');
    process.exit(1);
  }
} 