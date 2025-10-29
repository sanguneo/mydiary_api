import { supabase } from '../lib/supabase';

export class StorageService {
  async createPresignedUploadUrl(args: { bucket: string; filename: string; contentType: string }) {
    const { data, error } = await supabase.storage.from(args.bucket).createSignedUploadUrl(args.filename, {
      upsert: true,
    });
    if (error || !data) {
      throw new Error(`Failed to create upload URL: ${error?.message ?? 'unknown error'}`);
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
