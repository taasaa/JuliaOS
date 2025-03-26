import { createLogger, format, transports } from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';
import { prometheus, Registry, Counter, Gauge, Histogram } from 'prom-client';
import { join } from 'path';
import { writeFileSync, readFileSync } from 'fs';

// Initialize Prometheus registry
const register = new Registry();
prometheus.collectDefaultMetrics({ register });

// Define metrics
const transactionCounter = new Counter({
  name: 'j3os_transactions_total',
  help: 'Total number of transactions',
  labelNames: ['network', 'type', 'status']
});

const balanceGauge = new Gauge({
  name: 'j3os_wallet_balance',
  help: 'Current wallet balance',
  labelNames: ['network', 'address']
});

const latencyHistogram = new Histogram({
  name: 'j3os_operation_duration_seconds',
  help: 'Duration of operations',
  labelNames: ['operation', 'network']
});

// Register metrics
register.registerMetric(transactionCounter);
register.registerMetric(balanceGauge);
register.registerMetric(latencyHistogram);

// Initialize Winston logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ 
      filename: join(process.cwd(), 'logs', 'error.log'), 
      level: 'error' 
    }),
    new transports.File({ 
      filename: join(process.cwd(), 'logs', 'combined.log') 
    })
  ]
});

// Add Elasticsearch transport if configured
if (process.env.ELASTICSEARCH_URL) {
  logger.add(new ElasticsearchTransport({
    level: 'info',
    clientOpts: { node: process.env.ELASTICSEARCH_URL },
    indexPrefix: 'j3os-logs'
  }));
}

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

// Monitoring class
export class Monitoring {
  private static instance: Monitoring;
  private metrics: Map<string, any>;
  private alerts: Map<string, any>;

  private constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
  }

  static getInstance(): Monitoring {
    if (!Monitoring.instance) {
      Monitoring.instance = new Monitoring();
    }
    return Monitoring.instance;
  }

  // Logging methods
  info(message: string, meta?: any) {
    logger.info(message, meta);
  }

  error(message: string, error?: Error, meta?: any) {
    logger.error(message, { error, ...meta });
  }

  warn(message: string, meta?: any) {
    logger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    logger.debug(message, meta);
  }

  // Metrics methods
  recordTransaction(network: string, type: string, status: string) {
    transactionCounter.inc({ network, type, status });
  }

  updateBalance(network: string, address: string, balance: number) {
    balanceGauge.set({ network, address }, balance);
  }

  recordLatency(operation: string, network: string, duration: number) {
    latencyHistogram.observe({ operation, network }, duration);
  }

  // Alert methods
  setAlert(name: string, condition: () => boolean, callback: () => void) {
    this.alerts.set(name, { condition, callback });
  }

  checkAlerts() {
    for (const [name, alert] of this.alerts) {
      if (alert.condition()) {
        alert.callback();
        this.warn(`Alert triggered: ${name}`);
      }
    }
  }

  // Backup methods
  async backupMetrics() {
    const metrics = await register.metrics();
    const backupPath = join(process.cwd(), 'backups', 'metrics.json');
    writeFileSync(backupPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics
    }));
  }

  async restoreMetrics() {
    const backupPath = join(process.cwd(), 'backups', 'metrics.json');
    try {
      const backup = JSON.parse(readFileSync(backupPath, 'utf-8'));
      // Restore metrics from backup
      // Implementation depends on specific metric types
    } catch (error) {
      this.error('Failed to restore metrics', error as Error);
    }
  }

  // Health check methods
  async checkHealth(): Promise<boolean> {
    try {
      // Check logger
      await new Promise((resolve) => logger.info('Health check'));
      
      // Check metrics
      await register.metrics();
      
      // Check alerts
      this.checkAlerts();
      
      return true;
    } catch (error) {
      this.error('Health check failed', error as Error);
      return false;
    }
  }

  // Get metrics endpoint
  async getMetrics(): Promise<string> {
    return await register.metrics();
  }
}

// Export singleton instance
export const monitoring = Monitoring.getInstance(); 