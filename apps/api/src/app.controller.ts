// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { APP_SUCCESS } from './app.constants';
import { AppHomeDto, AppInfoDto } from './app.dto';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ResponseMessage(APP_SUCCESS.HOME)
  getHome(): { data: AppHomeDto } {
    return {
      data: AppHomeDto.from(this.appService.getHome()),
    };
  }

  @Get('info')
  @ResponseMessage(APP_SUCCESS.INFO)
  getInfo(): { data: AppInfoDto } {
    return {
      data: AppInfoDto.from(this.appService.getInfo()),
    };
  }
}
