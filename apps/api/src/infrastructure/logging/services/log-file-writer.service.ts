// src/infrastructure/logging/services/log-file-writer.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { appendFile, mkdir, rename, stat } from 'fs/promises';
import { dirname } from 'path';
import { ConfigService } from 'src/config/config.service';
import type { StructuredLogEntry } from '../types/logging.types';

@Injectable()
export class LogFileWriterService implements OnModuleInit {
  private writeChain: Promise<void> = Promise.resolve();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureLogDirectory();
  }

  write(entry: StructuredLogEntry): void {
    this.writeChain = this.writeChain
      .then(() => this.writeEntry(entry))
      .catch(() => undefined);
  }

  private async writeEntry(entry: StructuredLogEntry): Promise<void> {
    const filePath = this.configService.observability.logFilePath;

    if (!filePath) {
      return;
    }

    await this.ensureLogDirectory();
    await this.rotateIfNeeded(filePath);
    await appendFile(filePath, `${JSON.stringify(entry)}\n`, 'utf8');
  }

  private async ensureLogDirectory(): Promise<void> {
    const filePath = this.configService.observability.logFilePath;

    if (!filePath) {
      return;
    }

    await mkdir(dirname(filePath), { recursive: true });
  }

  private async rotateIfNeeded(filePath: string): Promise<void> {
    const maxSizeBytes = this.configService.observability.logMaxSizeBytes;
    const maxFiles = this.configService.observability.logMaxFiles;

    if (maxSizeBytes <= 0 || maxFiles <= 0) {
      return;
    }

    const current = await this.safeStat(filePath);

    if (!current || current.size < maxSizeBytes) {
      return;
    }

    for (let index = maxFiles - 1; index >= 1; index -= 1) {
      const source = `${filePath}.${index}`;
      const target = `${filePath}.${index + 1}`;

      if (await this.exists(source)) {
        await rename(source, target).catch(() => undefined);
      }
    }

    await rename(filePath, `${filePath}.1`).catch(() => undefined);
  }

  private async exists(filePath: string): Promise<boolean> {
    return (await this.safeStat(filePath)) !== null;
  }

  private async safeStat(filePath: string): Promise<{ size: number } | null> {
    try {
      const result = await stat(filePath);
      return { size: result.size };
    } catch {
      return null;
    }
  }
}
