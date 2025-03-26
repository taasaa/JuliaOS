# Monitoring and Logging Guide

This guide covers the monitoring and logging capabilities of the J3OS Framework.

## Overview

The J3OS Framework includes comprehensive monitoring and logging capabilities to help you track and manage your trading operations:

- **Metrics Collection**: Using Prometheus
- **Logging System**: Using Winston
- **Log Aggregation**: Using Elasticsearch
- **Health Checks**: Built-in health monitoring
- **Alert System**: Customizable alerts

## Metrics

### Available Metrics

1. **Transaction Metrics**
   ```prometheus
   j3os_transactions_total{network="ethereum",type="swap",status="success"}
   ```

2. **Balance Metrics**
   ```prometheus
   j3os_wallet_balance{network="ethereum",address="0x..."}
   ```

3. **Performance Metrics**
   ```prometheus
   j3os_operation_duration_seconds{operation="trade",network="ethereum"}
   ```

### Accessing Metrics

1. **Local Access**
   ```bash
   # Start metrics server
   j3os monitor start --metrics-port 9090
   
   # Access metrics
   curl http://localhost:9090/metrics
   ```

2. **Prometheus Integration**
   ```yaml
   # prometheus.yml
   scrape_configs:
     - job_name: 'j3os'
       static_configs:
         - targets: ['localhost:9090']
   ```

## Logging

### Log Levels

- `error`: Critical errors requiring immediate attention
- `warn`: Warning messages for potential issues
- `info`: General operational information
- `debug`: Detailed debugging information

### Log Storage

1. **File Storage**
   ```bash
   logs/
   ├── error.log    # Error-level logs
   └── combined.log # All logs
   ```

2. **Elasticsearch Integration**
   ```bash
   # Configure Elasticsearch
   export ELASTICSEARCH_URL="https://your-elasticsearch-url"
   ```

### Log Format

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "message": "Transaction executed",
  "network": "ethereum",
  "txHash": "0x...",
  "metadata": {
    "type": "swap",
    "amount": "1.5",
    "token": "ETH"
  }
}
```

## Health Checks

### Available Checks

1. **System Health**
   ```bash
   j3os monitor health
   ```

2. **Network Health**
   ```bash
   j3os monitor health --network ethereum
   ```

3. **Wallet Health**
   ```bash
   j3os monitor health --wallet 0x...
   ```

### Health Check Endpoints

```bash
# HTTP endpoint
curl http://localhost:9090/health

# Response
{
  "status": "healthy",
  "checks": {
    "logger": "ok",
    "metrics": "ok",
    "alerts": "ok"
  }
}
```

## Alerts

### Setting Up Alerts

1. **Balance Alerts**
   ```bash
   j3os monitor add \
     --type balance \
     --network ethereum \
     --address 0x... \
     --threshold 0.1 \
     --alert "Low balance alert"
   ```

2. **Transaction Alerts**
   ```bash
   j3os monitor add \
     --type transaction \
     --network ethereum \
     --status failed \
     --alert "Transaction failed alert"
   ```

3. **Performance Alerts**
   ```bash
   j3os monitor add \
     --type performance \
     --operation trade \
     --threshold 5 \
     --alert "Slow trade alert"
   ```

### Alert Notifications

Alerts can be configured to send notifications through:
- Email
- Discord
- Slack
- Custom webhook

## Backup and Recovery

### Metrics Backup

```bash
# Backup metrics
j3os monitor backup --output metrics-backup.json

# Restore metrics
j3os monitor restore --input metrics-backup.json
```

### Log Backup

```bash
# Backup logs
j3os monitor backup-logs --output logs-backup.tar.gz

# Restore logs
j3os monitor restore-logs --input logs-backup.tar.gz
```

## Best Practices

1. **Monitoring Setup**
   - Set up alerts for critical operations
   - Monitor system resources
   - Track performance metrics
   - Regular health checks

2. **Logging Setup**
   - Use appropriate log levels
   - Implement log rotation
   - Secure log storage
   - Regular log analysis

3. **Alert Configuration**
   - Set meaningful thresholds
   - Configure multiple notification channels
   - Regular alert testing
   - Alert documentation

4. **Backup Strategy**
   - Regular metric backups
   - Log archiving
   - Configuration backups
   - Recovery testing

## Troubleshooting

Common issues and solutions:

1. **High Memory Usage**
   - Check log rotation settings
   - Monitor metric cardinality
   - Review alert configurations
   - Optimize storage settings

2. **Missing Metrics**
   - Verify Prometheus configuration
   - Check metric endpoints
   - Review scraping intervals
   - Validate metric names

3. **Alert Issues**
   - Check notification channels
   - Verify alert conditions
   - Review alert thresholds
   - Test alert triggers

## Support

For additional support:
- Check the documentation
- Join our Discord community
- Contact support team
- Review GitHub issues 