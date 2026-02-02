/**
 * Lyrics Session Manager
 * Gerencia sessões de geração de letras em memória
 * Cada sessão pode ter até 3 páginas (3 regenerações)
 */

export interface LyricsOption {
  text: string;
  index: number;
}

export interface LyricsPage {
  pageNumber: number;
  taskId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  options: LyricsOption[];
  createdAt: Date;
}

export interface LyricsSession {
  sessionId: string;
  pages: Map<number, LyricsPage>;
  selectedPage?: number;
  selectedOption?: number;
  createdAt: Date;
  updatedAt: Date;
}

class LyricsSessionManager {
  private sessions: Map<string, LyricsSession> = new Map();
  private readonly MAX_PAGES_PER_SESSION = 3;

  createSession(sessionId: string): LyricsSession {
    const session: LyricsSession = {
      sessionId,
      pages: new Map(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): LyricsSession | undefined {
    return this.sessions.get(sessionId);
  }

  addPage(sessionId: string, pageNumber: number, taskId: string): LyricsPage {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.pages.size >= this.MAX_PAGES_PER_SESSION) {
      throw new Error(`Maximum ${this.MAX_PAGES_PER_SESSION} pages per session exceeded`);
    }

    const page: LyricsPage = {
      pageNumber,
      taskId,
      status: 'PENDING',
      options: [],
      createdAt: new Date(),
    };

    session.pages.set(pageNumber, page);
    session.updatedAt = new Date();
    return page;
  }

  updatePageStatus(
    sessionId: string,
    pageNumber: number,
    status: 'SUCCESS' | 'FAILED',
    options?: LyricsOption[]
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const page = session.pages.get(pageNumber);
    if (!page) {
      throw new Error('Page not found');
    }

    page.status = status;
    if (options) {
      page.options = options;
    }
    session.updatedAt = new Date();
  }

  getPage(sessionId: string, pageNumber: number): LyricsPage | undefined {
    const session = this.sessions.get(sessionId);
    return session?.pages.get(pageNumber);
  }

  selectOption(sessionId: string, pageNumber: number, optionIndex: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const page = session.pages.get(pageNumber);
    if (!page) {
      throw new Error('Page not found');
    }

    if (page.status !== 'SUCCESS') {
      throw new Error('Page is not ready yet');
    }

    if (!page.options[optionIndex]) {
      throw new Error('Invalid option index');
    }

    session.selectedPage = pageNumber;
    session.selectedOption = optionIndex;
    session.updatedAt = new Date();
  }

  getSelectedLyrics(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.selectedPage === undefined || session.selectedOption === undefined) {
      return null;
    }

    const page = session.pages.get(session.selectedPage);
    if (!page) {
      return null;
    }

    return page.options[session.selectedOption]?.text || null;
  }

  getRemainingRegens(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return this.MAX_PAGES_PER_SESSION;
    }
    return this.MAX_PAGES_PER_SESSION - session.pages.size;
  }

  // Cleanup old sessions (call periodically)
  cleanup(maxAgeHours: number = 24): void {
    const now = new Date();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now.getTime() - session.updatedAt.getTime() > maxAge) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Singleton instance
export const lyricsSessionManager = new LyricsSessionManager();

// Cleanup every hour
setInterval(() => {
  lyricsSessionManager.cleanup(24);
}, 60 * 60 * 1000);
