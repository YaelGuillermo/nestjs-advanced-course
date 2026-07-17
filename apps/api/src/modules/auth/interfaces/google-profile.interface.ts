// src/modules/accounts/auth/interfaces/google-profile.interface.ts
export interface GoogleProfile {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  pictureUrl?: string;
}
