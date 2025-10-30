import { AppError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

export class StorageService {
  async createPresignedUploadUrl(args: { bucket: string; filename: string; contentType: string }) {
    const { data, error } = await supabase.storage.from(args.bucket).createSignedUploadUrl(args.filename, {
      upsert: true,
    });
    if (error || !data) {
      throw new AppError('Failed to create upload URL', {
        status: 500,
        code: 'storage_presign_failed',
        details: {
          bucket: args.bucket,
          filename: args.filename,
          supabase: error?.message ?? null,
        },
        cause: error ?? undefined,
      });
    }
    return {
      url: data.signedUrl,
      token: data.token,
      path: data.path,
      contentType: args.contentType,
    };
  }
}

export const storageService = new StorageService();
