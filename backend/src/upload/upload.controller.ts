import {
  Controller,
  Post,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { multerConfig } from './multer.config';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('avatar')
  @ApiOperation({ summary: 'Upload de avatar do usuário' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  uploadAvatar(
    @UploadedFile(new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
        new FileTypeValidator({ fileType: /(jpeg|jpg|png|webp)/ }),
      ],
    })) file: Express.Multer.File,
    @Query('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadService.uploadAvatar(file, userId ?? user.userId, user);
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover avatar do usuário' })
  removeAvatar(
    @Query('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadService.removeAvatar(userId ?? user.userId, user);
  }

  @Post('projects/:id/logo')
  @ApiOperation({ summary: 'Upload de logo do projeto' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  uploadProjectLogo(
    @UploadedFile(new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
        new FileTypeValidator({ fileType: /(jpeg|jpg|png|webp)/ }),
      ],
    })) file: Express.Multer.File,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadService.uploadProjectLogo(file, id, user);
  }

  @Delete('projects/:id/logo')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover logo do projeto' })
  removeProjectLogo(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadService.removeProjectLogo(id, user);
  }
}
