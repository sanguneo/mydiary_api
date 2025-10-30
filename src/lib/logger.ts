import { createWriteStream, existsSync, mkdirSync, WriteStream } from 'node:fs';
import { join } from 'node:path';
import { Writable } from 'node:stream';
import dayjs from 'dayjs';
import pino from 'pino';
import env from '../config/env';

const LOG_DIRECTORY = join(process.cwd(), 'log');

if (!existsSync(LOG_DIRECTORY)) {
  mkdirSync(LOG_DIRECTORY, { recursive: true });
}

class DailyRotateStream extends Writable {
  private currentDate: string | null = null;
  private stream: WriteStream | null = null;

  constructor(private readonly directory: string, private readonly prefix: string) {
    super();
  }

  private ensureStream() {
    const today = dayjs().format('YYYYMMDD');
    if (this.currentDate === today && this.stream) {
      return;
    }
    this.stream?.end();
    this.currentDate = today;
    const filePath = join(this.directory, `${this.prefix}-${today}.log`);
    this.stream = createWriteStream(filePath, { flags: 'a' });
  }

  override _write(
    chunk: Buffer | string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    try {
      this.ensureStream();
      this.stream!.write(chunk, encoding, callback);
    } catch (error) {
      callback(error as Error);
    }
  }

  override _final(callback: (error?: Error | null) => void): void {
    if (this.stream) {
      this.stream.end(callback);
      return;
    }
    callback();
  }
}

const createFileStream = (filename: string) =>
  createWriteStream(join(LOG_DIRECTORY, filename), { flags: 'a' });

const level = env.NODE_ENV === 'production' ? 'info' : 'debug';

const dailyStream = new DailyRotateStream(LOG_DIRECTORY, 'app');
const errorStream = createFileStream('error.log');
const accessStream = createFileStream('access.log');
const authStream = createFileStream('auth.log');

export const logger = pino(
  {
    level,
    base: { service: 'mydiary-api' },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.multistream([
    { stream: dailyStream, level: 'info' },
    { stream: errorStream, level: 'error' },
    { stream: process.stdout, level },
  ]),
);

export const accessLogger = pino(
  {
    level: 'info',
    base: { service: 'mydiary-api', logger: 'access' },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.multistream([
    { stream: accessStream, level: 'info' },
    { stream: process.stdout, level },
  ]),
);

export const authLogger = pino(
  {
    level: 'info',
    base: { service: 'mydiary-api', logger: 'auth' },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.multistream([
    { stream: authStream, level: 'info' },
    { stream: process.stdout, level },
  ]),
);
