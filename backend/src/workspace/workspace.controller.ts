import { Body, Controller, Get, Post, Patch, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
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
    return this.workspaceService.update(req.user.userId, req.user.role, dto);
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
    return this.workspaceService.uploadLogo(req.user.userId, req.user.role, file);
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
    return this.workspaceService.addMember(req.user.userId, req.user.role, dto);
  }

  @Get('creators')
  listCreators(@Req() req: any) {
    return this.workspaceService.listCreators(req.user.userId);
  }

  @Post('creators')
  addCreator(@Body() dto: AddCreatorDto, @Req() req: any) {
    return this.workspaceService.addCreator(req.user.userId, dto);
  }
}
