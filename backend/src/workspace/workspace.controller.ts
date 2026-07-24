import { Body, Controller, Delete, Get, Post, Patch, Param, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceService } from './workspace.service';
import {
  UpdateWorkspaceDto,
  LOCALE_OPTIONS,
  TIMEZONE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  NUMBER_FORMAT_OPTIONS,
  CURRENCY_OPTIONS,
} from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { AddCreatorDto } from './dto/add-creator.dto';
import { UpdateCreatorDto } from './dto/update-creator.dto';

@UseGuards(JwtAuthGuard)
@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  getWorkspace(@Req() req: any) {
    return this.workspaceService.getWorkspace(req.user.userId);
  }

  @Patch()
  update(@Body() dto: UpdateWorkspaceDto, @Req() req: any) {
    return this.workspaceService.update(req.user.userId, dto);
  }

  // Single source of truth for the option lists Settings > Localization
  // renders, so the frontend never hardcodes a second copy that can drift.
  @Get('locale-options')
  getLocaleOptions() {
    return {
      locales: LOCALE_OPTIONS,
      timezones: TIMEZONE_OPTIONS,
      dateFormats: DATE_FORMAT_OPTIONS,
      numberFormats: NUMBER_FORMAT_OPTIONS,
      currencies: CURRENCY_OPTIONS,
    };
  }

  @Get('onboarding')
  getOnboarding(@Req() req: any) {
    return this.workspaceService.getOnboardingStatus(req.user.userId);
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    return this.workspaceService.uploadLogo(req.user.userId, file);
  }

  @Get('logo')
  async getLogo(@Req() req: any, @Res() res: Response) {
    const stream = await this.workspaceService.getLogoStream(req.user.userId);
    res.setHeader('Content-Type', 'image/png');
    stream.on('error', () => res.destroy()).pipe(res);
  }

  @Get('members')
  listMembers(@Req() req: any) {
    return this.workspaceService.listMembers(req.user.userId);
  }

  @Post('members')
  addMember(@Body() dto: AddMemberDto, @Req() req: any) {
    return this.workspaceService.addMember(req.user.userId, dto);
  }

  @Get('creators')
  listCreators(@Req() req: any) {
    return this.workspaceService.listCreators(req.user.userId);
  }

  @Post('creators')
  addCreator(@Body() dto: AddCreatorDto, @Req() req: any) {
    return this.workspaceService.addCreator(req.user.userId, dto);
  }

  @Get('creators/:id')
  getCreator(@Param('id') id: string, @Req() req: any) {
    return this.workspaceService.getCreator(req.user.userId, id);
  }

  @Get('creators/:id/stats')
  getCreatorStats(@Param('id') id: string, @Req() req: any) {
    return this.workspaceService.getCreatorStats(req.user.userId, id);
  }

  @Patch('creators/:id')
  updateCreator(@Param('id') id: string, @Body() dto: UpdateCreatorDto, @Req() req: any) {
    return this.workspaceService.updateCreator(req.user.userId, id, dto);
  }

  @Delete('creators/:id')
  async removeCreator(@Param('id') id: string, @Req() req: any) {
    await this.workspaceService.removeCreator(req.user.userId, id);
    return { success: true };
  }
}
