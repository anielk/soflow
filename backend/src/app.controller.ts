import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      message: 'Soflow API',
      version: 'v1',
      status: 'running',
    };
  }
}