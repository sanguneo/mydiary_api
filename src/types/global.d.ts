type BunServer = {
  serve: (options: { fetch: (request: Request) => Response | Promise<Response>; port: number }) => unknown;
};
declare const Bun: undefined | BunServer;
