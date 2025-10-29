class PitaTabs {
  constructor(element, options = {}) {
    // ブラウザ環境でない場合は何もしない
    if (typeof window === 'undefined') return;

    this.element = typeof element === 'string' ? document.querySelector(element) : element;
    if (!this.element) return;

    this.config = {
      // デフォルトで開くタブのインデックス
      defaultTab: 0,
      // キーボードナビゲーションを有効にする
      enableKeyboard: true,
      // タブ切り替え時のアニメーション
      enableAnimation: true,
      // タブ切り替え時のコールバック
      onTabChange: null,
      // タブ初期化時のコールバック
      onInit: null,
      ...options
    };

    this.tabs = [];
    this.panels = [];
    this.activeIndex = this.config.defaultTab;

    this.init();
  }

  init() {
    if (!this.element) return;

    // タブボタンとパネルを取得
    this.tabs = Array.from(this.element.querySelectorAll('.tab-button'));
    this.panels = Array.from(this.element.querySelectorAll('.tab-panel'));

    if (this.tabs.length === 0 || this.panels.length === 0) {
      console.warn('PitaTabs: タブボタンまたはパネルが見つかりません');
      return;
    }

    // イベントリスナーを設定
    this.setupEventListeners();

    // 初期状態を設定
    this.setActiveTab(this.activeIndex, false);

    // 初期化コールバックを実行
    if (typeof this.config.onInit === 'function') {
      this.config.onInit(this);
    }
  }

  setupEventListeners() {
    // タブボタンのクリックイベント
    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        if (!tab.disabled) {
          this.setActiveTab(index);
        }
      });
    });

    // キーボードナビゲーション
    if (this.config.enableKeyboard) {
      this.element.addEventListener('keydown', (e) => {
        this.handleKeyDown(e);
      });
    }
  }

  handleKeyDown(e) {
    const focusedTab = document.activeElement;
    const focusedIndex = this.tabs.indexOf(focusedTab);

    if (focusedIndex === -1) return;

    let newIndex = focusedIndex;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        newIndex = focusedIndex > 0 ? focusedIndex - 1 : this.tabs.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        newIndex = focusedIndex < this.tabs.length - 1 ? focusedIndex + 1 : 0;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = this.tabs.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    this.setActiveTab(newIndex);
    this.tabs[newIndex].focus();
  }

  setActiveTab(index, triggerCallback = true) {
    if (index < 0 || index >= this.tabs.length) return;

    const previousIndex = this.activeIndex;
    this.activeIndex = index;

    // 全てのタブとパネルを非アクティブ化
    this.tabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
      tab.setAttribute('aria-selected', i === index ? 'true' : 'false');
      tab.tabIndex = i === index ? 0 : -1;
    });

    this.panels.forEach((panel, i) => {
      const isActive = i === index;
      panel.classList.toggle('active', isActive);
      panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    // アニメーション対応
    if (this.config.enableAnimation && this.panels[index]) {
      this.panels[index].style.animation = 'none';
      // フォースリフロー
      this.panels[index].offsetHeight;
      this.panels[index].style.animation = '';
    }

    // コールバックを実行
    if (triggerCallback && typeof this.config.onTabChange === 'function') {
      this.config.onTabChange(index, previousIndex, {
        activeTab: this.tabs[index],
        activePanel: this.panels[index],
        previousTab: this.tabs[previousIndex],
        previousPanel: this.panels[previousIndex]
      });
    }
  }

  // パブリックメソッド
  getActiveIndex() {
    return this.activeIndex;
  }

  getActiveTab() {
    return this.tabs[this.activeIndex];
  }

  getActivePanel() {
    return this.panels[this.activeIndex];
  }

  // 特定のタブを有効/無効にする
  setTabDisabled(index, disabled = true) {
    if (index < 0 || index >= this.tabs.length) return;

    this.tabs[index].disabled = disabled;
    this.tabs[index].setAttribute('aria-disabled', disabled ? 'true' : 'false');

    // アクティブなタブが無効化された場合、次のタブに移動
    if (disabled && index === this.activeIndex) {
      const nextIndex = this.tabs.findIndex((tab, i) => i !== index && !tab.disabled);
      if (nextIndex !== -1) {
        this.setActiveTab(nextIndex);
      }
    }
  }

  // タブにバッジを追加
  addBadge(index, text) {
    if (index < 0 || index >= this.tabs.length) return;

    const tab = this.tabs[index];
    let badge = tab.querySelector('.tab-badge');

    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'tab-badge';
      tab.appendChild(badge);
    }

    badge.textContent = text;
  }

  // タブのバッジを削除
  removeBadge(index) {
    if (index < 0 || index >= this.tabs.length) return;

    const badge = this.tabs[index].querySelector('.tab-badge');
    if (badge) {
      badge.remove();
    }
  }

  // インスタンスを破棄
  destroy() {
    // イベントリスナーは自動的にクリーンアップされる
    this.element = null;
    this.tabs = [];
    this.panels = [];
  }
}

// 自動初期化
const initTabs = () => {
  if (typeof document === 'undefined') return;

  const tabElements = document.querySelectorAll('.tabs');
  tabElements.forEach(element => {
    if (!element.pitaTabs) {
      element.pitaTabs = new PitaTabs(element);
    }
  });
};

// 自動初期化（バニラJS用・ブラウザ環境のみ）
// window.pitaTabs = { disabled: true } で無効化可能
if (typeof window !== 'undefined' && typeof document !== 'undefined' && !window.pitaTabs) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.pitaTabs = new Proxy({}, {
        get: () => 'PitaTabs initialized'
      });
      initTabs();
    });
  } else {
    window.pitaTabs = new Proxy({}, {
      get: () => 'PitaTabs initialized'
    });
    initTabs();
  }
}

// エクスポート
export default PitaTabs;