declare namespace NodeJS {
  interface ProcessEnv {
    DB_HOST: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_DATABASE: string;
    DB_PORT: number;
    DB_SOCKET: string;
    DB_DIALECT: string;
  }
}
