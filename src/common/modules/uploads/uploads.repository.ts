import { Injectable } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import toStream = require('buffer-to-stream');

@Injectable()
export class UploadsRepository {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  public async uploadVideo(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: 'videos', resource_type: 'video' },
        (error, result: any) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      toStream(file.buffer).pipe(upload);
    });
  }

  public async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: 'images', resource_type: 'image' },
        (error, result: any) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      toStream(file.buffer).pipe(upload);
    });
  }

  public async uploadDoc(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'docs',
          use_filename: true,
          unique_filename: true,
          resource_type: 'raw',
        },
        (error, result: any) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      toStream(file.buffer).pipe(upload);
    });
  }

  public async getVideo(publicId: string) {
    return cloudinary.video(publicId, {
      resource_type: 'video',
      type: 'authenticated',
      sign_url: true,
      secure: true,
      format: 'm3u8',
    });
  }

  public async getImage(publicId: string) {
    return cloudinary.url(publicId, {
      resource_type: 'image',
      type: 'authenticated',
      sign_url: true,
      secure: true,
    });
  }

  public async getDoc(publicId: string) {
    return cloudinary.url(publicId, {
      resource_type: 'raw',
      type: 'authenticated',
      sign_url: true,
      secure: true,
    });
  }

  public async deleteVideo(publicId: string) {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: 'video',
    });
  }
  public async deleteImage(publicId: string) {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });
  }
  public async deleteDoc(publicId: string) {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
    });
  }
}
