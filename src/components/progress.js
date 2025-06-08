/**
 * PitaProgress
 */
class ProgressLoader {
  constructor(options = {}) {
    // ブラウザ環境でない場合は何もしない
    if (typeof window === 'undefined') return;

    this.config = {
      minDuration: 800,
      estimatedDuration: 2000,
      height: '3px',
      color: '#007bff',
      zIndex: 1000,
      animationSpeed: 16,
      ...options
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

  init() {
    // ブラウザ環境でない場合は何もしない
    if (typeof document === 'undefined') return;

    this.createProgressElement();
    this.setupNavigationHandlers();
    this.setupPageFinishHandler();

    window.addEventListener('beforeunload', () => {
      this.clearIntervals();
    });
  }

  createProgressElement() {
    if (typeof document === 'undefined') return;

    // 既存の#progressエレメントを探す
    this.progressElement = document.getElementById('progress');

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
                height: 3px;
                z-index: 1000;
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
                height: 3px;
                z-index: 1000;
                width: 100%;
                border-radius: 0 !important;
                transition: opacity 0.3s ease;
            `;
    }
  }

  clearIntervals() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    if (this.finalInterval) {
      clearInterval(this.finalInterval);
      this.finalInterval = null;
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  finishLoading() {
    // 既にローディング中でない場合は何もしない
    if (!this.isLoading) return;

    const elapsed = Date.now() - this.loadingStart;
    const remainingTime = Math.max(0, this.config.minDuration - elapsed);

    this.clearIntervals();

    this.progressValue = 100;
    this.progressElement.value = this.progressValue;

    this.finalInterval = setTimeout(() => {
      this.isLoading = false;
      this.hideProgress();
    }, remainingTime);
  }

  showProgress() {
    // 既に表示中または表示処理中の場合は前回の処理をクリア
    this.clearIntervals();

    this.progressElement.style.display = 'block';
    this.progressElement.style.opacity = '0';
    this.progressElement.style.transition = '';

    requestAnimationFrame(() => {
      this.progressElement.style.transition = 'opacity 0.2s ease-in';
      this.progressElement.style.opacity = '1';
    });
  }

  hideProgress() {
    // 既に非表示処理中の場合は何もしない
    if (this.hideTimeout) return;

    this.progressElement.style.transition = 'opacity 0.5s ease-out';
    this.progressElement.style.opacity = '0';

    this.hideTimeout = setTimeout(() => {
      this.progressElement.style.display = 'none';
      this.progressElement.style.transition = '';
      this.hideTimeout = null;
    }, 500);
  }

  setupNavigationHandlers() {
    if (typeof document === 'undefined') return;

    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');

      // スキップ条件
      if (href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        link.hasAttribute('download') ||
        link.classList.contains('no-progress') ||
        link.hasAttribute('data-no-progress')) {
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

  startLoading() {
    // 既にローディング中の場合は一旦リセット
    if (this.isLoading) {
      this.clearIntervals();
    }

    this.isLoading = true;
    this.progressValue = 5;
    this.progressElement.value = this.progressValue;
    this.loadingStart = Date.now();

    this.showProgress();

    this.progressInterval = setInterval(() => {
      const elapsed = Date.now() - this.loadingStart;
      const progress = Math.min(5 + (elapsed / this.config.estimatedDuration) * 85, 90);
      this.progressValue = progress;
      this.progressElement.value = this.progressValue;

      if (progress >= 90) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
    }, this.config.animationSpeed);
  }

  setupPageFinishHandler() {
    if (typeof document === 'undefined') return;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (this.isLoading) {
          setTimeout(() => this.finishLoading(), 100);
        }
      });
    }

    window.addEventListener('load', () => {
      if (this.isLoading) {
        setTimeout(() => this.finishLoading(), 100);
      }
    });

    const observer = new MutationObserver(() => {
      if (this.isLoading) {
        setTimeout(() => this.finishLoading(), 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 手動制御用のパブリックメソッド
  start() {
    this.startLoading();
  }

  finish() {
    this.finishLoading();
  }

  destroy() {
    this.clearIntervals();
    if (this.progressElement && !document.querySelector('#progress')) {
      this.progressElement.remove();
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

// CommonJSエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProgressLoader;
}