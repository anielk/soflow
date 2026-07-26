import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface VersionInfo {
  appVersion: string;
  nodeVersion: string;
  gitCommit: string | null;
}

export interface EnvironmentInfo {
  nodeEnv: string;
  storageDriver: string;
  notificationDriver: string;
}

export interface InstalledModule {
  name: string;
  description: string;
}

/**
 * Read-only platform metadata — the "System Version" / "Installed Modules"
 * the Cloudivo Operations Center (COC) will later poll. Nothing here is
 * secret (no credentials, no connection strings) so it's safe to expose to
 * any authenticated admin.
 */
@Injectable()
export class SystemService {
  constructor(private readonly configService: ConfigService) {}

  getVersion(): VersionInfo {
    return {
      appVersion: this.readAppVersion(),
      nodeVersion: process.version,
      gitCommit: this.readGitCommit(),
    };
  }

  getEnvironment(): EnvironmentInfo {
    return {
      nodeEnv: this.configService.get<string>('NODE_ENV', 'development'),
      storageDriver: this.configService.get<string>('MEDIA_STORAGE_DRIVER', 'local'),
      notificationDriver: this.configService.get<string>('NOTIFICATION_DRIVER', 'smtp'),
    };
  }

  /**
   * Manually maintained rather than introspected from Nest's module tree —
   * deliberately: Nest has no stable public API for this, and a small,
   * accurate hand-written list is more honest than a fragile reflection
   * hack. Keep this in sync with app.module.ts's imports.
   */
  getInstalledModules(): InstalledModule[] {
    return [
      { name: 'Auth', description: 'Login, registration, password reset' },
      { name: 'Users', description: 'User profiles and account settings' },
      { name: 'Workspace', description: 'Workspace branding, localization, members, creators' },
      { name: 'Media', description: 'Media library storage and thumbnails' },
      { name: 'Creators', description: 'Legacy creator account management' },
      { name: 'Notification', description: 'Outbound email via the notification provider architecture' },
      { name: 'Audit', description: 'Append-only administrative audit trail' },
      { name: 'Activity', description: 'Human-readable workspace activity feed' },
      { name: 'Health', description: 'Structured platform health checks' },
      { name: 'Dashboard', description: 'Workspace dashboard metrics' },
    ];
  }

  private readAppVersion(): string {
    try {
      const raw = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8');
      return JSON.parse(raw).version ?? 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private readGitCommit(): string | null {
    try {
      return execSync('git rev-parse --short HEAD', { cwd: __dirname, stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      return null;
    }
  }
}
