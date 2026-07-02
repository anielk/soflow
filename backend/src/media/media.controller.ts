import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MediaService } from './media.service';
import { ListMediaQueryDto } from './dto/list-media-query.dto';
import { RenameMediaDto } from './dto/rename-media.dto';

@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    return this.mediaService.upload(file, req.user.userId);
  }

  @Get()
  list(@Query() query: ListMediaQueryDto, @Req() req: any) {
    return this.mediaService.list(req.user.userId, query);
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: any) {
    return this.mediaService.getById(req.user.userId, id);
  }

  @Get(':id/file')
  async getFile(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const { stream, media } = await this.mediaService.getFileStream(req.user.userId, id);
    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(media.originalFilename)}"`);
    stream.on('error', () => res.destroy()).pipe(res);
  }

  @Get(':id/thumbnail')
  async getThumbnail(
    @Param('id') id: string,
    @Query('size') size: string | undefined,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const normalizedSize = size === 'medium' ? 'medium' : 'small';
    const { stream } = await this.mediaService.getThumbnailStream(req.user.userId, id, normalizedSize);
    res.setHeader('Content-Type', 'image/jpeg');
    stream.on('error', () => res.destroy()).pipe(res);
  }

  @Patch(':id')
  rename(@Param('id') id: string, @Body() dto: RenameMediaDto, @Req() req: any) {
    return this.mediaService.rename(req.user.userId, req.user.role, id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.mediaService.remove(req.user.userId, req.user.role, id);
    return { success: true };
  }
}
