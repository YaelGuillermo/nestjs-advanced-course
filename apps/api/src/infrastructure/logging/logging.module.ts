// src/infrastructure/logging/logging.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from 'src/config/config.module';
import { HttpLoggerMiddleware } from './middlewares/http-logger.middleware';
import { AppLogger } from './services/app-logger.service';
import { LogFileWriterService } from './services/log-file-writer.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AppLogger, LogFileWriterService, HttpLoggerMiddleware],
  exports: [AppLogger, LogFileWriterService, HttpLoggerMiddleware],
})
export class LoggingModule {}
