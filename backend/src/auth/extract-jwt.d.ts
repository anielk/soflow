declare module 'passport-jwt' {
  import { Strategy as BaseStrategy } from 'passport';
  import { Request } from 'express';

  export class ExtractJwt {
    static fromAuthHeader(token: string): string;
    static fromAuthHeaderAsBearerToken(): any;
    static fromQueryString(name: string): string;
  }

  export class Strategy extends BaseStrategy {
    constructor(options?: StrategyOptions);
    validate<T = any>(req: Request, payload: T, done: (err: Error, user?: T) => void): void;
  }

  export interface StrategyOptions {
    secretOrKey: string;
    jwtFromRequest?: ExtractJwt['fromAuthHeader'] | ExtractJwt['fromAuthHeaderAsBearerToken'];
    passReqToCallback?: boolean;
    ignoreExpiration?: boolean;
  }
}