import { Platform } from 'react-native';
import { EncodingType, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.onload = () => {
      const result = reader.result as string; // data:<mime>;base64,<data>
      resolve(result.split(',')[1] ?? '');
    };
    reader.readAsDataURL(blob);
  });
}

function mimeTypeForFilename(filename: string): string {
  if (filename.endsWith('.pdf')) return 'application/pdf';
  if (filename.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return 'application/octet-stream';
}

export async function downloadBlobAsFile(blob: Blob, filename: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  // Native has no browser download prompt — write the file locally, then hand it to
  // the OS share sheet so the user can save it (Files app) or send it on.
  const base64 = await blobToBase64(blob);
  const file = new File(Paths.document, filename);
  file.write(base64, { encoding: EncodingType.Base64 });

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: mimeTypeForFilename(filename),
    dialogTitle: filename,
  });
}
