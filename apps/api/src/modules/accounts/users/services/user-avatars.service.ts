// src/modules/accounts/users/services/user-avatars.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ImageIngestService } from 'src/infrastructure/storage/services/image-ingest.service';
import { MediaStorageService } from 'src/infrastructure/storage/services/media-storage.service';
import { Repository } from 'typeorm';
import { USER_MEDIA } from '../constants/user.constants';
import { UserAvatar } from '../entities/user-avatar.entity';

@Injectable()
export class UserAvatarsService {
  constructor(
    @InjectRepository(UserAvatar)
    private readonly avatarsRepository: Repository<UserAvatar>,
    private readonly imageIngestService: ImageIngestService,
    private readonly mediaStorageService: MediaStorageService,
  ) {}

  async trySetRemoteAvatar(userId: string, url: string): Promise<void> {
    try {
      await this.setRemoteAvatar(userId, url);
    } catch {
      // Remote avatars are optional. Authentication must not fail because of a media failure.
    }
  }

  async setRemoteAvatar(userId: string, url: string): Promise<UserAvatar> {
    const existingAvatar = await this.avatarsRepository.findOne({
      where: { userId },
    });
    const oldPaths = existingAvatar?.path ? [existingAvatar.path] : [];

    const payload = await this.imageIngestService.ingestRemote({
      url,
      folder: USER_MEDIA.AVATAR_FOLDER,
      originalName: `user-${userId}-avatar`,
    });

    if (existingAvatar) {
      await this.avatarsRepository.delete({ userId });
    }

    const avatar = this.avatarsRepository.create({
      userId,
      sourceUrl: url,
      ...payload,
    });

    const savedAvatar = await this.avatarsRepository.save(avatar);

    if (oldPaths.length > 0) {
      await this.mediaStorageService.deleteMany(oldPaths);
    }

    return savedAvatar;
  }

  async removeAvatar(userId: string): Promise<void> {
    const existingAvatar = await this.avatarsRepository.findOne({
      where: { userId },
    });

    if (!existingAvatar) {
      return;
    }

    await this.avatarsRepository.delete({ userId });
    await this.mediaStorageService.deleteMany([existingAvatar.path]);
  }
}
