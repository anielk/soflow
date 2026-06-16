import { Controller, Get, Param } from '@nestjs/common';
import { CreatorsService } from './creators.service';

@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  @Get(':username')
  async getCreator(@Param('username') username: string) {
    return this.creatorsService.getByUsername(username);
  }
}