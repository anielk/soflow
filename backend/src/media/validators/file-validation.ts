import { BadRequestException } from '@nestjs/common';
import { fromFile } from 'file-type';
import { MediaType } from '@prisma/client';

const ALLOWED_EXTENSIONS: Record<MediaType, string[]> = {
  IMAGE: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  VIDEO: ['mp4', 'mov', 'mkv', 'webm'],
};

export interface ValidatedFile {
  type: MediaType;
  extension: string;
  mimeType: string;
}

function bucketForExtension(extension: string): MediaType | null {
  if (ALLOWED_EXTENSIONS.IMAGE.includes(extension)) return MediaType.IMAGE;
  if (ALLOWED_EXTENSIONS.VIDEO.includes(extension)) return MediaType.VIDEO;
  return null;
}

export async function validateUploadedFile(
  originalFilename: string,
  stagedFilePath: string,
): Promise<ValidatedFile> {
  const claimedExtension = originalFilename.split('.').pop()?.toLowerCase() ?? '';
  const claimedType = bucketForExtension(claimedExtension);

  if (!claimedType) {
    throw new BadRequestException(
      `File type ".${claimedExtension}" is not allowed. Allowed: ${[
        ...ALLOWED_EXTENSIONS.IMAGE,
        ...ALLOWED_EXTENSIONS.VIDEO,
      ].join(', ')}`,
    );
  }

  // Never trust the client-supplied extension/MIME alone — sniff the actual
  // bytes and make sure they land in the same bucket (image/video) the
  // claimed extension does. This catches e.g. a renamed .exe claiming .png.
  const sniffed = await fromFile(stagedFilePath);
  if (!sniffed) {
    throw new BadRequestException('Could not verify file content — upload rejected.');
  }

  const sniffedType = bucketForExtension(sniffed.ext);
  if (sniffedType !== claimedType) {
    throw new BadRequestException('File content does not match its extension — upload rejected.');
  }

  return { type: claimedType, extension: claimedExtension, mimeType: sniffed.mime };
}
