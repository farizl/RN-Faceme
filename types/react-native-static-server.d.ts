declare module 'react-native-static-server' {
  export default class StaticServer {
    constructor(
      port: number,
      root: string,
      options?: {
        localOnly?: boolean;
        keepAlive?: boolean;
        relativeTo?: string;
      }
    );

    start(): Promise<string>; // resolves to server URL (e.g. http://127.0.0.1:8080)
    stop(): Promise<void>;
    origin: string;
    port: number;
  }
}
