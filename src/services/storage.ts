import { supabase } from '@/lib/supabase';
import { GENERIC_ERROR } from '@/lib/constants';
import { extensionOf, mimeForExtension } from '@/utils/assets';
import type { UploadedFile } from '@/types';

/** Upload a file to a public bucket and return its public URL + path. */
export async function uploadToBucket(bucket: string, path: string, file: File): Promise<UploadedFile> {
  const contentType = file.type || mimeForExtension(extensionOf(file.name));

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: false,
  });
  if (error) {
    // Common causes: bucket missing, MIME/size rejected by bucket settings.
    console.error('[storage] upload failed:', error.message);
    if (error.message.toLowerCase().includes('duplicate')) {
      throw new Error('فایلی با همین نام وجود دارد. دوباره تلاش کنید.');
    }
    throw new Error(GENERIC_ERROR);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error(GENERIC_ERROR);
  return { url: data.publicUrl, path };
}

/** Best-effort removal (orphan files are logged, never crash the UI). */
export async function removeFromBucket(bucket: string, path: string | null | undefined): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) console.warn('[storage] remove failed:', path, error.message);
}