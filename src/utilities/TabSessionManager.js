import { RAPPORT } from '../services/constants';

export class TabSessionManager {
  constructor() {
    this.sessions = new Map(); // key = tabId, value = session object
  }

  initializeTab(tabId, url) {
    if (!this.sessions.has(tabId)) {
      this.sessions.set(tabId, {
        tabId,
        url,
        state: 'initialized',
        history: [],
        timeStarted: Date.now(),
        timeEnded: null
      });
    }
  }

  updateUrl(tabId, url) {
    const session = this.sessions.get(tabId);
    if (session) {
      session.url = url;
    }
  }

  updateState(tabId, state) {
    const session = this.sessions.get(tabId);
    if (session) {
      session.state = state;
    }
  }

  logMessage(tabId, type, message) {
    const session = this.sessions.get(tabId);
    if (session) {
      session.history.push({
        type, // "sent" or "received"
        message,
        timestamp: new Date().toISOString()
      });
    }
  }

  endSession(tabId) {
    const session = this.sessions.get(tabId);
    if (session) {
      session.timeEnded = Date.now();
    }
  }

  getSession(tabId) {
    return this.sessions.get(tabId);
  }

  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  searchByState(state) {
    return this.getAllSessions().filter(session => session.state === state);
  }

  searchByUrlPart(partialUrl) {
    return this.getAllSessions().filter(session =>
      session.url?.includes(partialUrl)
    );
  }

  searchByMessageKeyword(keyword) {
    return this.getAllSessions().filter(session =>
      session.history.some(entry => JSON.stringify(entry.message).includes(keyword))
    );
  }

  getActiveDuration(tabId) {
    const session = this.sessions.get(tabId);
    if (!session) return 0;
    const end = session.timeEnded ?? Date.now();
    return end - session.timeStarted;
  }
}

export const tabSessionManager = new TabSessionManager();

