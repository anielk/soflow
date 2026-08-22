import { Body, Controller, Delete, Get, Param, Patch, Post as HttpPost, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @HttpPost()
  create(@Body() dto: CreatePostDto, @Req() req: any) {
    return this.postsService.create(req.user.userId, dto);
  }

  @Get()
  list(@Query() query: ListPostsQueryDto, @Req() req: any) {
    return this.postsService.list(req.user.userId, query);
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: any) {
    return this.postsService.getById(req.user.userId, id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto, @Req() req: any) {
    return this.postsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.postsService.remove(req.user.userId, id);
    return { success: true };
  }
}
