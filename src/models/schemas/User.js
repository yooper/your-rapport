import { getLocalItem, setLocalItem } from '../db/local';
import { USER } from '../../services/constants';

export class User {
  constructor(authToken = null, license = 'freemium') {
    this.authToken = authToken;
    this.license = license;
    this.verifiedOn = null;
  }

  isProLicense() {
    return this.license === 'pro';
  }

  /**
   * Examines the usage of the discovery plugin request and determines if
   * a license is required to use that functionality
   * @param type
   * @param rapport
   * @param discovery_plugin
   * @returns {boolean}
   */
  isAccessible(type, rapport, discovery_plugin) {
    return true;

    switch (type) {
      case 'discoveryPlugin':
        if (!this.isProLicense() && discovery_plugin.method === 'GET') {
          return true;
        } else return this.isProLicense();
      default:
        break; // not implemented
    }
    return true;
  }

  /**
   *
   * @returns {Promise<void>}
   */
  static async login(url) {
    // parse the auth token and the license from the
    const urlParams = new URL(url).searchParams;
    if (urlParams.has('authToken') && urlParams.has('license')) {
      const user = {
        authToken: urlParams.get('authToken'),
        license: urlParams.get('license'),
      };
      await setLocalItem('user', user);
    }
  }

  /**
   * Verify will validate the auth token
   * @returns {Promise<void>}
   */
  async verify(override = false) {
    // verify has not been run, yet
    // TODO: add re-check condition
    if (this.verifiedOn && !override) {
      debug('Account verified');
      return;
    }

    try {
      // TODO: set up endpoint
      const url = 'invalid';
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = response.json();
      this.license = data.license ?? 'freemium';
    } catch (e) {
      // an error occurred, reset the credentials completely
      this.license = 'freemium';
    } finally {
      this.verifiedOn = new Date();
      await this.save();
    }
  }

  async save() {
    // license updated, or downgraded to freemium upon failure
    await setLocalItem(USER, JSON.stringify(this));
  }
}

/**
 * Return the user instance
 * @returns {Promise<User>}
 */
export async function getUser() {
  const userObj = (await getLocalItem(USER)) ?? {
    authToken: false,
    license: 'freemium',
  };
  const user = new User(userObj.authToken, userObj.license);
  // verify a user, verify is cached
  await user.verify();
  return user;
}
