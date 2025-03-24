import { Command } from 'commander';
import * as inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import Table from 'cli-table3';

type TableRow = any; // Define a type alias for table rows to simplify code

/**
 * Get system health
 */
async function getSystemHealth() {
  try {
    console.log(chalk.blue('Checking system health...'));
    
    // Make a request to the Julia server health endpoint
    const response = await axios.get('http://localhost:3000/health');
    
    if (response.status === 200) {
      const healthData = response.data;
      
      // Create a nice table to display the health data
      const table = new Table({
        head: [chalk.cyan('Metric'), chalk.cyan('Value'), chalk.cyan('Status')],
        colWidths: [20, 20, 12]
      });
      
      // Add rows to the table using type assertion
      table.push(
        ['Memory Usage', `${healthData.memory_usage.toFixed(2)} GB`, getStatusColor(healthData.memory_status)] as TableRow,
        ['Active Agents', healthData.active_agents.toString(), getStatusColor(healthData.agent_status)] as TableRow,
        ['Bridge Status', healthData.bridge_status, getStatusColor(healthData.bridge_status)] as TableRow,
        ['Market Data', healthData.market_data_status, getStatusColor(healthData.market_data_status)] as TableRow,
        ['Security Status', healthData.security_status, getStatusColor(healthData.security_status)] as TableRow
      );
      
      console.log(table.toString());
      console.log(chalk.blue(`Last updated: ${new Date(healthData.timestamp).toLocaleString()}`));
    } else {
      console.log(chalk.red(`Failed to get health data: ${response.statusText}`));
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('Cannot connect to Julia server. Is it running?'));
      console.log(chalk.yellow('Start the server with: j3os julia start'));
    } else {
      console.error(chalk.red('Failed to check system health:'), error);
    }
  }
}

/**
 * Get color for status
 */
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'healthy':
    case 'operational':
      return chalk.green(status);
    case 'warning':
      return chalk.yellow(status);
    case 'error':
    case 'critical':
      return chalk.red(status);
    default:
      return status;
  }
}

/**
 * List active agents
 */
async function listActiveAgents() {
  try {
    console.log(chalk.blue('Listing active agents...'));
    
    // Make a request to the Julia server agents endpoint
    const response = await axios.get('http://localhost:3000/agents');
    
    if (response.status === 200) {
      const agents = response.data;
      
      if (agents.length === 0) {
        console.log(chalk.yellow('No active agents found'));
        return;
      }
      
      // Create a nice table to display the agents
      const table = new Table({
        head: [chalk.cyan('ID'), chalk.cyan('Name'), chalk.cyan('Type'), chalk.cyan('Status'), chalk.cyan('Uptime')],
        colWidths: [10, 20, 15, 10, 15]
      });
      
      // Add rows to the table
      for (const agent of agents) {
        table.push([
          agent.id.substring(0, 8),
          agent.name,
          agent.type,
          agent.status === 'running' ? chalk.green('Running') : chalk.yellow('Paused'),
          formatUptime(agent.uptime)
        ] as TableRow);
      }
      
      console.log(table.toString());
    } else {
      console.log(chalk.red(`Failed to get agents: ${response.statusText}`));
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('Cannot connect to Julia server. Is it running?'));
      console.log(chalk.yellow('Start the server with: j3os julia start'));
    } else {
      console.error(chalk.red('Failed to list active agents:'), error);
    }
  }
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  } else if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  } else {
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
  }
}

/**
 * List active swarms
 */
async function listActiveSwarms() {
  try {
    console.log(chalk.blue('Listing active swarms...'));
    
    // Make a request to the Julia server swarms endpoint
    const response = await axios.get('http://localhost:3000/swarms');
    
    if (response.status === 200) {
      const swarms = response.data;
      
      if (swarms.length === 0) {
        console.log(chalk.yellow('No active swarms found'));
        return;
      }
      
      // Create a nice table to display the swarms
      const table = new Table({
        head: [chalk.cyan('ID'), chalk.cyan('Name'), chalk.cyan('Algorithm'), chalk.cyan('Size'), chalk.cyan('Status')],
        colWidths: [10, 20, 15, 8, 15]
      });
      
      // Add rows to the table
      for (const swarm of swarms) {
        table.push([
          swarm.id.substring(0, 8),
          swarm.name,
          swarm.algorithm,
          swarm.size.toString(),
          swarm.status === 'running' ? chalk.green('Running') : chalk.yellow('Paused')
        ] as TableRow);
      }
      
      console.log(table.toString());
    } else {
      console.log(chalk.red(`Failed to get swarms: ${response.statusText}`));
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('Cannot connect to Julia server. Is it running?'));
      console.log(chalk.yellow('Start the server with: j3os julia start'));
    } else {
      console.error(chalk.red('Failed to list active swarms:'), error);
    }
  }
}

/**
 * Monitor system in real-time (updates every few seconds)
 */
async function monitorSystem(interval: number = 5) {
  console.log(chalk.blue(`Starting system monitor (updates every ${interval} seconds)...`));
  console.log(chalk.yellow('Press Ctrl+C to stop monitoring'));
  
  // Initial fetch
  await getSystemHealth();
  
  // Set up interval to fetch updates
  const intervalId = setInterval(async () => {
    console.clear();
    console.log(chalk.blue(`System Monitor (updates every ${interval} seconds)`));
    console.log(chalk.yellow('Press Ctrl+C to stop monitoring'));
    
    await getSystemHealth();
  }, interval * 1000);
  
  // Handle Ctrl+C to stop monitoring
  process.on('SIGINT', () => {
    clearInterval(intervalId);
    console.log(chalk.green('\nStopped monitoring'));
    process.exit(0);
  });
}

/**
 * Show detailed agent information
 */
async function showAgentDetails(agentId: string) {
  try {
    console.log(chalk.blue(`Fetching details for agent ${agentId}...`));
    
    // Make a request to the Julia server agent details endpoint
    const response = await axios.get(`http://localhost:3000/agents/${agentId}`);
    
    if (response.status === 200) {
      const agent = response.data;
      
      console.log(chalk.cyan('=== Agent Details ==='));
      console.log(chalk.cyan('ID: ') + agent.id);
      console.log(chalk.cyan('Name: ') + agent.name);
      console.log(chalk.cyan('Type: ') + agent.type);
      console.log(chalk.cyan('Status: ') + (agent.status === 'running' ? chalk.green('Running') : chalk.yellow('Paused')));
      console.log(chalk.cyan('Uptime: ') + formatUptime(agent.uptime));
      
      if (agent.skills && agent.skills.length > 0) {
        console.log(chalk.cyan('\nSkills:'));
        agent.skills.forEach((skill: any) => {
          console.log(`  - ${skill.name} (${skill.type}): ${skill.status}`);
        });
      }
      
      if (agent.platforms && agent.platforms.length > 0) {
        console.log(chalk.cyan('\nPlatforms:'));
        agent.platforms.forEach((platform: any) => {
          console.log(`  - ${platform.name}: ${platform.status}`);
        });
      }
      
      if (agent.performance) {
        console.log(chalk.cyan('\nPerformance Metrics:'));
        Object.entries(agent.performance).forEach(([key, value]) => {
          console.log(`  - ${key}: ${value}`);
        });
      }
    } else {
      console.log(chalk.red(`Failed to get agent details: ${response.statusText}`));
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('Cannot connect to Julia server. Is it running?'));
      console.log(chalk.yellow('Start the server with: j3os julia start'));
    } else {
      console.error(chalk.red('Failed to show agent details:'), error);
    }
  }
}

/**
 * Show security incidents
 */
async function showSecurityIncidents() {
  try {
    console.log(chalk.blue('Fetching security incidents...'));
    
    // Make a request to the Julia server security incidents endpoint
    const response = await axios.get('http://localhost:3000/security/incidents');
    
    if (response.status === 200) {
      const incidents = response.data;
      
      if (incidents.length === 0) {
        console.log(chalk.green('No security incidents found'));
        return;
      }
      
      // Create a nice table to display the incidents
      const table = new Table({
        head: [chalk.cyan('ID'), chalk.cyan('Type'), chalk.cyan('Severity'), chalk.cyan('Status'), chalk.cyan('Time')],
        colWidths: [10, 25, 10, 15, 25]
      });
      
      // Add rows to the table
      for (const incident of incidents) {
        table.push([
          incident.id.substring(0, 8),
          incident.type,
          getSeverityColor(incident.severity),
          getStatusColor(incident.status),
          new Date(incident.timestamp).toLocaleString()
        ] as TableRow);
      }
      
      console.log(table.toString());
    } else {
      console.log(chalk.red(`Failed to get security incidents: ${response.statusText}`));
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('Cannot connect to Julia server. Is it running?'));
      console.log(chalk.yellow('Start the server with: j3os julia start'));
    } else {
      console.error(chalk.red('Failed to show security incidents:'), error);
    }
  }
}

/**
 * Get color for severity
 */
function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'low':
      return chalk.green(severity);
    case 'medium':
      return chalk.yellow(severity);
    case 'high':
    case 'critical':
      return chalk.red(severity);
    default:
      return severity;
  }
}

/**
 * Register the monitor command
 */
export function registerMonitorCommand(program: Command): void {
  const monitorCommand = program
    .command('monitor')
    .description('Monitor system status and agents');

  monitorCommand
    .command('health')
    .description('Check system health')
    .action(() => {
      getSystemHealth();
    });

  monitorCommand
    .command('agents')
    .description('List active agents')
    .action(() => {
      listActiveAgents();
    });

  monitorCommand
    .command('swarms')
    .description('List active swarms')
    .action(() => {
      listActiveSwarms();
    });

  monitorCommand
    .command('agent <id>')
    .description('Show detailed agent information')
    .action((id) => {
      showAgentDetails(id);
    });

  monitorCommand
    .command('security')
    .description('Show security incidents')
    .action(() => {
      showSecurityIncidents();
    });

  monitorCommand
    .command('live')
    .description('Monitor system in real-time')
    .option('-i, --interval <seconds>', 'Update interval in seconds', '5')
    .action((options) => {
      monitorSystem(parseInt(options.interval));
    });
} 