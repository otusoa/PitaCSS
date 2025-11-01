/**
 * Progress (TypeScript)
 */

interface ProgressLoaderConfig {
  minDuration: number;
  estimatedDuration: number;
  height: string; // CSS length
  color: string; // CSS color
  zIndex: number;
  animationSpeed: number; // ms interval
}

export interface ProgressLoaderOptions {
  minDuration?: number;
  estimatedDuration?: number;
  height?: string;
  color?: string;
  zIndex?: number;
  animationSpeed?: number;
}

declare global {
  interface Window {
    progressLoader?: ProgressLoader;
  }
}

class ProgressLoader {
  private config: ProgressLoaderConfig;
  private isLoading: boolean;
  private progressValue: number;
  private loadingStart: number;
  private progressInterval: number | null;
  private finalInterval: number | null;
  private hideTimeout: number | null;
  private progressElement: HTMLProgressElement | null;

  constructor(options: ProgressLoaderOptions = {}) {
    // ブラウザ環境でない場合は何もしない
    if (typeof window === 'undefined') {
      // 型上必要な初期化（実行時は早期 return）
      this.config = {
        minDuration: 800,
        estimatedDuration: 2000,
        height: '3px',
        color: '#007bff',
        zIndex: 1000,
        animationSpeed: 16
      };
      this.isLoading = false;
      this.progressValue = 0;
      this.loadingStart = 0;
      this.progressInterval = null;
      this.finalInterval = null;
      this.hideTimeout = null;
      this.progressElement = null;
      return;
    }

    this.config = {
      minDuration: 800,
      estimatedDuration: 2000,
      height: '3px',
      color: '#007bff',
      zIndex: 1000,
      animationSpeed: 16,
      ...options,
    };

    this.isLoading = false;
    this.progressValue = 0;
    this.loadingStart = 0;
    this.progressInterval = null;
    this.finalInterval = null;
    this.hideTimeout = null;
    this.progressElement = null;

    this.init();
  }

  private init(): void {
    // ブラウザ環境でない場合は何もしない
    if (typeof document === 'undefined') return;

    this.createProgressElement();
    this.setupNavigationHandlers();
    this.setupPageFinishHandler();

    window.addEventListener('beforeunload', () => {
      this.clearIntervals();
    });
  }

  private createProgressElement(): void {
    if (typeof document === 'undefined') return;

    // 既存の#progressエレメントを探す
    const existing = document.getElementById('progress');
    this.progressElement = existing as HTMLProgressElement | null;

    if (!this.progressElement) {
      // 既存の要素がない場合は新規作成
      this.progressElement = document.createElement('progress');
      this.progressElement.id = 'progress';
      this.progressElement.className = 'stripe';
      this.progressElement.max = 100;
      this.progressElement.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                z-index: ${this.config.zIndex};
                width: 100%;
                border-radius: 0 !important;
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
      document.body.appendChild(this.progressElement);
    } else {
      // 既存要素にもスタイルとトランジションを設定
      this.progressElement.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                z-index: ${this.config.zIndex};
                width: 100%;
                border-radius: 0 !important;
                transition: opacity 0.3s ease;
            `;
    }

    // オプション（height/color/zIndex）をスタイルへ反映
    if (this.progressElement) {
      // 高さ
      this.progressElement.style.height = this.config.height;
      // 色（対応ブラウザでは progress の色付けに使用）
      this.progressElement.style.setProperty('accent-color', this.config.color);
      // 念のため z-index も直接反映（上の cssText で設定済みだが上書き可能に）
      this.progressElement.style.zIndex = String(this.config.zIndex);
    }
  }

  private clearIntervals(): void {
    if (this.progressInterval !== null) {
      window.clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    if (this.finalInterval !== null) {
      window.clearTimeout(this.finalInterval);
      this.finalInterval = null;
    }
    if (this.hideTimeout !== null) {
      window.clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  private finishLoading(): void {
    // 既にローディング中でない場合は何もしない
    if (!this.isLoading) return;
    if (!this.progressElement) return;

    const elapsed = Date.now() - this.loadingStart;
    const remainingTime = Math.max(0, this.config.minDuration - elapsed);

    this.clearIntervals();

    this.progressValue = 100;
    this.progressElement.value = this.progressValue;

    this.finalInterval = window.setTimeout(() => {
      this.isLoading = false;
      this.hideProgress();
    }, remainingTime);
  }

  private showProgress(): void {
    if (!this.progressElement) return;
    // 既に表示中または表示処理中の場合は前回の処理をクリア
    this.clearIntervals();

    this.progressElement.style.display = 'block';
    this.progressElement.style.opacity = '0';
    this.progressElement.style.transition = '';

    requestAnimationFrame(() => {
      if (!this.progressElement) return;
      this.progressElement.style.transition = 'opacity 0.2s ease-in';
      this.progressElement.style.opacity = '1';
    });
  }

  private hideProgress(): void {
    if (!this.progressElement) return;
    // 既に非表示処理中の場合は何もしない
    if (this.hideTimeout !== null) return;

    this.progressElement.style.transition = 'opacity 0.5s ease-out';
    this.progressElement.style.opacity = '0';

    this.hideTimeout = window.setTimeout(() => {
      if (!this.progressElement) return;
      this.progressElement.style.display = 'none';
      this.progressElement.style.transition = '';
      this.hideTimeout = null;
    }, 500);
  }

  private setupNavigationHandlers(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      const link = target.closest<HTMLAnchorElement>('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // スキップ条件
      if (
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        link.hasAttribute('download') ||
        link.classList.contains('no-progress') ||
        link.hasAttribute('data-no-progress')
      ) {
        return;
      }

      const linkUrl = new URL(href, window.location.origin);
      // パスが同じで、ハッシュだけが変化する場合はプログレスバーを表示しない
      if (
        linkUrl.pathname === window.location.pathname &&
        linkUrl.hash !== '' &&
        linkUrl.hash !== window.location.hash
      ) {
        return;
      }
      // パスもハッシュも同じ場合もスキップ
      if (
        linkUrl.pathname === window.location.pathname &&
        linkUrl.hash === window.location.hash
      ) {
        return;
      }

      this.startLoading();
    });
  }

  private startLoading(): void {
    if (!this.progressElement) return;
    // 既にローディング中の場合は一旦リセット
    if (this.isLoading) {
      this.clearIntervals();
    }

    this.isLoading = true;
    this.progressValue = 5;
    this.progressElement.value = this.progressValue;
    this.loadingStart = Date.now();

    this.showProgress();

    this.progressInterval = window.setInterval(() => {
      if (!this.progressElement) return;
      const elapsed = Date.now() - this.loadingStart;
      const progress = Math.min(5 + (elapsed / this.config.estimatedDuration) * 85, 90);
      this.progressValue = progress;
      this.progressElement.value = this.progressValue;

      if (progress >= 90 && this.progressInterval !== null) {
        window.clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
    }, this.config.animationSpeed);
  }

  private setupPageFinishHandler(): void {
    if (typeof document === 'undefined') return;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (this.isLoading) {
          window.setTimeout(() => this.finishLoading(), 100);
        }
      });
    }

    window.addEventListener('load', () => {
      if (this.isLoading) {
        window.setTimeout(() => this.finishLoading(), 100);
      }
    });

    const observer = new MutationObserver(() => {
      if (this.isLoading) {
        window.setTimeout(() => this.finishLoading(), 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // 手動制御用のパブリックメソッド
  public start(): void {
    this.startLoading();
  }

  public finish(): void {
    this.finishLoading();
  }

  public destroy(): void {
    this.clearIntervals();
    if (this.progressElement) {
      // オーナーシップが曖昧なため、そのまま DOM から除去。
      this.progressElement.remove();
      this.progressElement = null;
    }
  }
}

// 自動初期化（バニラJS用・ブラウザ環境のみ）
if (typeof window !== 'undefined' && typeof document !== 'undefined' && !window.progressLoader) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.progressLoader = new ProgressLoader();
    });
  } else {
    window.progressLoader = new ProgressLoader();
  }
}

// エクスポート
export default ProgressLoader;
