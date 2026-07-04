import { BadRequestException } from '@nestjs/common';
import { fromFile } from 'file-type';

// Raster formats only — no SVG. An uploaded SVG served back as
// image/svg+xml can carry a <script>, which is a stored-XSS vector; the
// simple, safe choice for this scope is to not accept it rather than add a
// sanitizer dependency for one branding field.
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export async function validateLogoFile(originalFilename: string, stagedFilePath: string): Promise<void> {
  const claimedExtension = originalFilename.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.includes(claimedExtension)) {
    throw new BadRequestException(`Logo must be one of: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  const sniffed = await fromFile(stagedFilePath);
  if (!sniffed || !ALLOWED_EXTENSIONS.includes(sniffed.ext)) {
    throw new BadRequestException('File content does not match its extension — upload rejected.');
  }
}
