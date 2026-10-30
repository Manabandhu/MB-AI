import * as ImagePicker from 'expo-image-picker';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { apiFetch, parseJsonOrThrow } from '@/lib/api';
import { uploadContentType } from './uploadTypes';

export type UploadBucket = 'avatars' | 'rooms' | 'rides' | 'posts' | 'marketplace' | 'community';

type UploadTicket = {
  uploadUrl: string;
  bucket: string;
  path: string;
  publicUrl: string;
  contentType: string;
  maxBytes: number;
};

export type UploadState =
  | { status: 'idle' }
  | { status: 'picking' }
  | { status: 'uploading'; progress: number }
  | { status: 'done'; url: string }
  | { status: 'error'; message: string };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/**
 * Picks one image and uploads it straight to storage with a signed URL from the backend
 * (`POST /api/v1/media/upload-url`). Reports progress, never pretends: the returned URL exists only after the
 * upload finished, and every failure (permission, type, size, network) becomes a readable error.
 */
export function useImageUpload(bucket: UploadBucket) {
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const request = useRef<XMLHttpRequest | null>(null);

  const cancel = useCallback(() => {
    request.current?.abort();
    request.current = null;
    setState({ status: 'idle' });
  }, []);

  const pickAndUpload = useCallback(async (): Promise<string | null> => {
    try {
      setState({ status: 'picking' });
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setState({
            status: 'error',
            message: 'Allow photo access in your phone settings to add a picture.',
          });
          return null;
        }
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (picked.canceled || !picked.assets[0]) {
        setState({ status: 'idle' });
        return null;
      }
      const asset = picked.assets[0];
      const contentType = uploadContentType(asset.mimeType, asset.uri);
      if (!contentType) {
        setState({ status: 'error', message: 'Choose a JPEG, PNG, WebP, HEIC or GIF image.' });
        return null;
      }
      // Web pickers give a blob/data URI; read it so both the size check and the upload use the real bytes.
      const blob = Platform.OS === 'web' ? await (await fetch(asset.uri)).blob() : null;
      const size = blob?.size ?? asset.fileSize ?? 0;
      if (size > MAX_IMAGE_BYTES) {
        setState({
          status: 'error',
          message: 'That image is larger than 5 MB. Choose a smaller one.',
        });
        return null;
      }

      const ticket = await parseJsonOrThrow<UploadTicket>(
        await apiFetch('/api/v1/media/upload-url', {
          method: 'POST',
          body: JSON.stringify({ bucket, contentType, size: size || 1 }),
        }),
        'Upload',
      );

      setState({ status: 'uploading', progress: 0 });
      const form = new FormData();
      if (blob) {
        form.append('', blob, ticket.path.split('/').pop());
      } else {
        // React Native's FormData streams the file from its URI.
        form.append('', {
          uri: asset.uri,
          type: contentType,
          name: ticket.path.split('/').pop(),
        } as unknown as Blob);
      }
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        request.current = xhr;
        xhr.open('PUT', ticket.uploadUrl);
        xhr.setRequestHeader('x-upsert', 'false');
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setState({
              status: 'uploading',
              progress: Math.round((event.loaded / event.total) * 100),
            });
          }
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Upload failed (${xhr.status}). Please try again.`));
        xhr.onerror = () =>
          reject(new Error('Upload failed. Check your connection and try again.'));
        xhr.onabort = () => reject(new Error('Upload cancelled.'));
        xhr.send(form);
      });
      request.current = null;
      setState({ status: 'done', url: ticket.publicUrl });
      return ticket.publicUrl;
    } catch (error) {
      request.current = null;
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed.',
      });
      return null;
    }
  }, [bucket]);

  return { state, pickAndUpload, cancel, reset: () => setState({ status: 'idle' }) };
}

/** Removes one of the caller's uploads (for example a replaced avatar). */
export async function deleteUpload(bucket: UploadBucket, publicUrl: string): Promise<void> {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = publicUrl.indexOf(marker);
  if (index < 0) return;
  const response = await apiFetch('/api/v1/media/delete', {
    method: 'POST',
    body: JSON.stringify({ bucket, path: publicUrl.slice(index + marker.length) }),
  });
  if (!response.ok && response.status !== 404) throw new Error('Could not remove the old image.');
}
