export const logger = {
  info: (message: string, ...args: any[]) => {
    console.info(`\x1b[32m[INFO]\x1b[0m ${message}`, ...args);
  },
  error: (message: string | any, ...args: any[]) => {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    console.debug(`\x1b[34m[DEBUG]\x1b[0m ${message}`, ...args);
  },
};
