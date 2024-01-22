enum LogLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
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

  private log(level: LogLevel, message: string): void {
    const logEntry = `[${new Date().toISOString()}] [${level}] ${message}`;
    this.logHistory.push(logEntry);
    console.log(logEntry);
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  info(message: any): void {
    this.log(LogLevel.INFO, message);
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  error(message: any): void {
    this.log(LogLevel.ERROR, message);
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  debug(message: any): void {
    this.log(LogLevel.DEBUG, message);
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  getLogHistory(): any[] {
    return this.logHistory;
  }
}
