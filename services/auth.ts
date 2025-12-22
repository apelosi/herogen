import { User } from "../types";
import { dbService } from "./db";

/**
 * Robust authentication service using the newer Google Identity Services.
 */
export const authService = {
  /**
   * Decodes a JWT token from Google to get user info without a separate fetch.
   */
  decodeJwt(token: string) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  },

  /**
   * Handles the credential returned by the official GSI button.
   */
  async handleCredentialResponse(credential: string): Promise<User> {
    const googleUser = this.decodeJwt(credential);
    const userId = googleUser.sub;
    
    let user = await dbService.getUser(userId);
    if (!user) {
      user = {
        id: userId,
        name: googleUser.name,
        email: googleUser.email,
        photoUrl: null
      };
      await dbService.saveUser(user);
    }
    
    localStorage.setItem("herogen_user_id", user.id);
    return user;
  },

  async signOut(): Promise<void> {
    localStorage.removeItem("herogen_user_id");
  },

  async getCurrentUser(): Promise<User | null> {
    const id = localStorage.getItem("herogen_user_id");
    if (!id) return null;
    return await dbService.getUser(id) || null;
  }
};