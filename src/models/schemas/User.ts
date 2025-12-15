import { DiscoveryPlugin } from './DiscoveryPlugin';
import { IRapport } from '../../types';
import { getUtcNow } from '../../utilities/transformers';

export interface UserData {
  accessToken: string;
  verifiedOn: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class User {

  accessToken: string;
  verifiedOn: number;


  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.verifiedOn = 0;
  }

  /**
   * Some behaviors will be restricted based on certain criteria
   * @param type
   * @param rapport
   * @param discoveryPlugin
   * @returns {boolean}
   */
  isAccessible(type: string, rapport: IRapport, discoveryPlugin: DiscoveryPlugin): boolean {
    return true;
  }

  /**
   * Parse the access token to get more information
   */
  getSubscriptionPayload() : SubscriptionPayload {
    return JSON.parse(atob(this.accessToken)) as SubscriptionPayload;
  }

  /***
   * Verifies the token is still valid
   * @returns {Promise<boolean>}
   */
  async verify(): Promise<boolean> {
    if(!this.accessToken) {
      return false;
    }
    const unixEpochInSeconds: number = getUtcNow();
    if(this.verifiedOn && this.verifiedOn + 3600 * 24 * 7 > unixEpochInSeconds){
      return true;
    }

    // verify the access token exists,
    try{
      const payload: SubscriptionPayload = this.getSubscriptionPayload();
      const response = await fetch('https://bakerstreet.llc/wp-json/yr/v1/verify',{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ access_code: payload.access_code })
      });

      // access token is invalid or expired
      if(!response.ok){
        this.verifiedOn = 0;
        await this.delete();
      }
      else{
        this.verifiedOn = Math.floor(Date.now() / 1000);
        await this.save();
        return true;
      }
    }
    catch(e){
        this.verifiedOn = 0;
        await this.delete();
    }
    return false;
  }

  /**
   * Delete the user data
   */
  async delete()
  {
    const instance = { user: null };
    await chrome.storage.local.set(instance);
  }
  /**
   * Persist the data to storage
   * @returns {Promise<void>}
   */
  async save(): Promise<void> {
    const encoded = btoa(JSON.stringify(this));
    const instance = { user: encoded };
    await chrome.storage.local.set(instance);
  }
}

/**
 * Return the user instance or null if
 * 1) User is not authenticated
 * 2) Authentication token has expired
 * @returns {Promise<User | null>}
 */
export async function getUser(): Promise<User | null> {
  const result = await chrome.storage.local.get('user');
  const encoded = result?.user;

  if (!encoded || typeof encoded !== 'string') {
    return null;
  }
  const userData = JSON.parse(atob(encoded)) as UserData;
  const user = new User(userData.accessToken);
  await user.verify();
  user.verifiedOn = userData.verifiedOn;
  return user;
}


interface SubscriptionPayload {
  email: string;
  customer_id: string;
  subscription_id: string;
  subscription_status: string;
  product_id: string;
  price_id: string;
  current_period_end: number;
  created_at: number;
  expires_at: number;
  access_code: string;
}
