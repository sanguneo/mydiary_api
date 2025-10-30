type BunServer = {
  serve: (options: { fetch: (request: Request) => Response | Promise<Response>; port: number }) => any;
  env: any;
  spawn: any;
};
declare const Bun: BunServer;
