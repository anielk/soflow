import { Body, Controller, Delete, Get, Post, Patch, Param, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import {
  UpdateWorkspaceDto,
  LOCALE_OPTIONS,
  TIMEZONE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  NUMBER_FORMAT_OPTIONS,
  CURRENCY_OPTIONS,
} from './dto/update-workspace.dto';
import { UpdateWorkspaceStatusDto } from './dto/update-workspace-status.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { AddCreatorDto } from './dto/add-creator.dto';
import { UpdateCreatorDto } from './dto/update-creator.dto';
import { SwitchActiveWorkspaceDto } from './dto/switch-active-workspace.dto';

@UseGuards(JwtAuthGuard)
@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  getWorkspace(@Req() req: any) {
    return this.workspaceService.getWorkspace(req.user.userId);
  }

  // Every workspace the caller belongs to, with which one is currently
  // active — powers the frontend workspace switcher. Static 'mine' segment,
  // same reasoning as 'admin'/'locale-options'/etc below: never collides
  // with the dynamic creator routes.
  @Get('mine')
  listMine(@Req() req: any) {
    return this.workspaceService.listMine(req.user.userId);
  }

  // Switches the caller's active workspace. workspaceId always comes from
  // the request body, but WorkspaceService.switchActiveWorkspace is the
  // real boundary: it 403s unless a WorkspaceMember row for (workspaceId,
  // userId) actually exists, so this can never activate a workspace the
  // caller doesn't belong to no matter what ID is sent.
  @Post('active')
  switchActive(@Body() dto: SwitchActiveWorkspaceDto, @Req() req: any) {
    return this.workspaceService.switchActiveWorkspace(req.user.userId, dto.workspaceId);
  }

  // Any authenticated user may create an additional workspace, becoming its
  // OWNER — see WorkspaceService.create for why this doesn't require
  // SUPER_ADMIN. Declared before the plain `@Patch()`/creators routes but
  // after `@Get()` purely for readability; Nest matches by method+path, not
  // declaration order, so this is safe regardless.
  @Post()
  create(@Body() dto: CreateWorkspaceDto, @Req() req: any) {
    return this.workspaceService.create(req.user.userId, dto);
  }

  @Patch()
  update(@Body() dto: UpdateWorkspaceDto, @Req() req: any) {
    return this.workspaceService.update(req.user.userId, dto);
  }

  // ─── Platform admin (SUPER_ADMIN only) ──────────────────────────────────
  // Static 'admin' segment never collides with the dynamic creator routes
  // below (:id there is always a Creator id, never reached via this path).

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('admin')
  listAllForAdmin() {
    return this.workspaceService.listAllForAdmin();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch('admin/:id')
  setWorkspaceStatus(@Param('id') id: string, @Body() dto: UpdateWorkspaceStatusDto, @Req() req: any) {
    return this.workspaceService.setActiveStatus(req.user.userId, id, dto);
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
