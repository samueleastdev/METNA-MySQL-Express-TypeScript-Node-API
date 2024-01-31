import { Response } from 'express';

enum LogLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
  NETWORK = 'NETWORK',
}

export default class Logger {
  private static instance: Logger;
  private logHistory: string[] = [];

  private constructor() {
    // Private constructor to prevent instantiation
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, color: string): void {
    const logEntry = `[${new Date().toISOString()}] [${level}] ${message}`;
    this.logHistory.push(logEntry);
    console.log(color, logEntry);
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  info(message: any): void {
    this.log(LogLevel.INFO, message, '\x1b[36m%s\x1b[0m');
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  error(message: any): void {
    this.log(LogLevel.ERROR, message, '\x1b[31m%s\x1b[0m');
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  debug(message: any): void {
    this.log(LogLevel.DEBUG, message, '\x1b[31m%s\x1b[0m');
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  network(message: any): void {
    this.log(LogLevel.NETWORK, message, '\x1b[32m%s\x1b[0m');
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  getLogHistory(): any[] {
    return this.logHistory;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function catchError(res: Response, error: any, message: string) {
  const logger = Logger.getInstance();
  logger.error(error);
  return res.status(500).send({
    error: message,
  });
}
