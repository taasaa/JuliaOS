import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import Conf from 'conf';

interface ConfigOptions {
  key?: string;
  value?: string;
}

const configStore = new Conf({ projectName: 'juliaos' });

export async function config(action: string, options: ConfigOptions): Promise<void> {
  try {
    const spinner = ora('Processing configuration request...').start();

    switch (action) {
      case 'list':
        await listConfig();
        break;
      case 'get':
        await getConfig(options);
        break;
      case 'set':
        await setConfig(options);
        break;
      default:
        spinner.fail(chalk.red(`Invalid action: ${action}`));
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Failed to process configuration request');
    process.exit(1);
  }
}

async function listConfig(): Promise<void> {
  const spinner = ora('Fetching configuration...').start();

  try {
    const allConfig = configStore.store;
    if (Object.keys(allConfig).length === 0) {
      spinner.succeed(chalk.green('No configuration found'));
      return;
    }

    spinner.succeed(chalk.green('Configuration fetched successfully!'));
    console.log(chalk.blue('\nCurrent configuration:'));
    Object.entries(allConfig).forEach(([key, value]) => {
      console.log(chalk.white(`${key}: ${JSON.stringify(value)}`));
    });
  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch configuration'));
    throw error;
  }
}

async function getConfig(options: ConfigOptions): Promise<void> {
  const spinner = ora('Fetching configuration value...').start();

  try {
    if (!options.key) {
      spinner.fail(chalk.red('Configuration key is required'));
      process.exit(1);
    }

    const value = configStore.get(options.key);
    if (value === undefined) {
      spinner.fail(chalk.red(`Configuration key "${options.key}" not found`));
      process.exit(1);
    }

    spinner.succeed(chalk.green('Configuration value fetched successfully!'));
    console.log(chalk.blue('\nConfiguration value:'));
    console.log(chalk.white(`${options.key}: ${JSON.stringify(value)}`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch configuration value'));
    throw error;
  }
}

async function setConfig(options: ConfigOptions): Promise<void> {
  const spinner = ora('Setting configuration value...').start();

  try {
    if (!options.key) {
      spinner.fail(chalk.red('Configuration key is required'));
      process.exit(1);
    }

    if (!options.value) {
      spinner.fail(chalk.red('Configuration value is required'));
      process.exit(1);
    }

    // Try to parse the value as JSON if it looks like JSON
    let parsedValue: any = options.value;
    if (options.value.startsWith('{') || options.value.startsWith('[')) {
      try {
        parsedValue = JSON.parse(options.value);
      } catch (error) {
        // If parsing fails, use the original string value
      }
    }

    configStore.set(options.key, parsedValue);

    spinner.succeed(chalk.green('Configuration value set successfully!'));
    console.log(chalk.blue('\nUpdated configuration:'));
    console.log(chalk.white(`${options.key}: ${JSON.stringify(parsedValue)}`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to set configuration value'));
    throw error;
  }
} 