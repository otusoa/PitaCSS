type TabElement = HTMLElement & { disabled?: boolean };

interface PitaTabsResolvedOptions {
  defaultTab: number;
  enableKeyboard: boolean;
  enableAnimation: boolean;
  onTabChange?: (
    currentIndex: number,
    previousIndex: number,
    context: {
      activeTab: TabElement;
      activePanel: HTMLElement;
      previousTab?: TabElement;
      previousPanel?: HTMLElement;
    }
  ) => void;
  onInit?: (instance: PitaTabs) => void;
}

export interface PitaTabsOptions {
  defaultTab?: number;
  enableKeyboard?: boolean;
  enableAnimation?: boolean;
  onTabChange?: (
    currentIndex: number,
    previousIndex: number,
    context: {
      activeTab: TabElement;
      activePanel: HTMLElement;
      previousTab?: TabElement;
      previousPanel?: HTMLElement;
    }
  ) => void;
  onInit?: (instance: PitaTabs) => void;
}

// グローバル拡張: 要素とウィンドウにカスタムプロパティを付与
declare global {
  interface HTMLElement {
    pitaTabs?: PitaTabs;
  }
  interface Window {
    pitaTabs?: object;
  }
}

class PitaTabs {
  private element: HTMLElement | null;
  private config: PitaTabsResolvedOptions;
  private tabs: TabElement[] = [];
  private panels: HTMLElement[] = [];
  private activeIndex: number;

  constructor(element: string | HTMLElement, options: PitaTabsOptions = {}) {
    // ブラウザ環境でない場合は何もしない
    if (typeof window === 'undefined') {
      this.element = null;
      // デフォルト構成を最低限用意
      this.config = {
        defaultTab: 0,
        enableKeyboard: true,
        enableAnimation: true
      };
      this.activeIndex = this.config.defaultTab;
      return;
    }

    this.element = typeof element === 'string' ? document.querySelector<HTMLElement>(element) : element;
    if (!this.element) {
      // 要素がない場合でも内部状態を整えて終了
      this.config = {
        defaultTab: 0,
        enableKeyboard: true,
        enableAnimation: true
      };
      this.activeIndex = this.config.defaultTab;
      return;
    }

    this.config = {
      defaultTab: 0,
      enableKeyboard: true,
      enableAnimation: true,
      ...options
    };

    this.activeIndex = this.config.defaultTab;

    this.init();
  }

  private init(): void {
    if (!this.element) return;

    // タブボタンとパネルを取得
    this.tabs = Array.from(this.element.querySelectorAll<TabElement>('.tab-button'));
    this.panels = Array.from(this.element.querySelectorAll<HTMLElement>('.tab-panel'));

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

  private setupEventListeners(): void {
    if (!this.element) return;

    // タブボタンのクリックイベント
    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        if (!tab.disabled) {
          this.setActiveTab(index);
        }
      });
    });

    // キーボードナビゲーション
    if (this.config.enableKeyboard) {
      this.element.addEventListener('keydown', (e: KeyboardEvent) => {
        this.handleKeyDown(e);
      });
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const focusedTab = document.activeElement;
    const focusedIndex = this.tabs.findIndex(t => t === focusedTab);

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

  public setActiveTab(index: number, triggerCallback: boolean = true): void {
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
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
  public getActiveIndex(): number {
    return this.activeIndex;
  }

  public getActiveTab(): TabElement | undefined {
    return this.tabs[this.activeIndex];
  }

  public getActivePanel(): HTMLElement | undefined {
    return this.panels[this.activeIndex];
  }

  // 特定のタブを有効/無効にする
  public setTabDisabled(index: number, disabled: boolean = true): void {
    if (index < 0 || index >= this.tabs.length) return;

    const tab = this.tabs[index];
    tab.disabled = disabled;
    tab.setAttribute('aria-disabled', disabled ? 'true' : 'false');

    // アクティブなタブが無効化された場合、次のタブに移動
    if (disabled && index === this.activeIndex) {
      const nextIndex = this.tabs.findIndex((t, i) => i !== index && !t.disabled);
      if (nextIndex !== -1) {
        this.setActiveTab(nextIndex);
      }
    }
  }

  // タブにバッジを追加
  public addBadge(index: number, text: string): void {
    if (index < 0 || index >= this.tabs.length) return;

    const tab = this.tabs[index];
    let badge = tab.querySelector<HTMLSpanElement>('.tab-badge');

    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'tab-badge';
      tab.appendChild(badge);
    }

    badge.textContent = text;
  }

  // タブのバッジを削除
  public removeBadge(index: number): void {
    if (index < 0 || index >= this.tabs.length) return;

    const badge = this.tabs[index].querySelector('.tab-badge');
    if (badge) {
      badge.remove();
    }
  }

  // インスタンスを破棄
  public destroy(): void {
    // イベントリスナーは自動的にクリーンアップされる
    this.element = null;
    this.tabs = [];
    this.panels = [];
  }
}

// 自動初期化
const initTabs = (): void => {
  if (typeof document === 'undefined') return;

  const tabElements = document.querySelectorAll<HTMLElement>('.tabs');
  tabElements.forEach((element) => {
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

export default PitaTabs;
