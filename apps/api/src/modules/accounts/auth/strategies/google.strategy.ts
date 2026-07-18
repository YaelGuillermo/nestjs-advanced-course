// src/modules/accounts/auth/strategies/google.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { ConfigService } from 'src/config/config.service';
import type { User } from 'src/modules/accounts/users/entities/user.entity';
import { AUTH_ERRORS } from '../constants/auth-message.constants';
import type { GoogleProfile } from '../interfaces/google-profile.interface';
import { AuthService } from '../services/auth.service';
import { assertGoogleOAuthConfigured } from '../utils/google-oauth-config.util';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const googleOAuth = assertGoogleOAuthConfigured(configService.integrations);

    super({
      clientID: googleOAuth.clientId,
      clientSecret: googleOAuth.clientSecret,
      callbackURL: googleOAuth.callbackUrl,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    const googleProfile = this.toGoogleProfile(profile);

    if (!googleProfile.email) {
      throw new UnauthorizedException(
        AUTH_ERRORS.GOOGLE_PROFILE_EMAIL_REQUIRED,
      );
    }

    return this.authService.validateGoogleUser(googleProfile);
  }

  private toGoogleProfile(profile: Profile): GoogleProfile {
    return {
      googleId: profile.id,
      email: profile.emails?.[0]?.value ?? '',
      firstName: profile.name?.givenName ?? '',
      lastName: profile.name?.familyName ?? '',
      displayName: profile.displayName ?? '',
      pictureUrl: profile.photos?.[0]?.value,
    };
  }
}
