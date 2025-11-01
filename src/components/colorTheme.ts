type Theme = 'light' | 'dark' | 'auto';

interface ThemeToggleResolvedOptions {
  storageKey: string;
  defaultTheme: Theme;
  toggleButtonSelector: string;
  selectSelector: string;
  enableTransition: boolean;
  transitionDuration: string;
}

export interface ThemeToggleOptions {
  storageKey?: string;
  defaultTheme?: Theme;
  toggleButtonSelector?: string;
  selectSelector?: string;
  enableTransition?: boolean;
  transitionDuration?: string;
}

interface ThemeToggleEventDetail {
  theme: Theme;
  actualTheme: Exclude<Theme, 'auto'>;
  cssVariables: Record<string, string>;
}

interface PitaThemeFlag { disabled?: boolean }

interface PitaCSSConfig {
  themeToggle?: {
    autoInit?: boolean;
  }
}

declare global {
  interface Window {
    pitaCSS?: PitaCSSConfig;
    // ランタイムでは ThemeToggle のインスタンスまたはフラグオブジェクトを入れる
    pitaTheme?: ThemeToggle | PitaThemeFlag;
  }
}

class ThemeToggle {
  private config: ThemeToggleResolvedOptions;
  private currentTheme: Theme;

  constructor(options: ThemeToggleOptions = {}) {
    this.config = {
      storageKey: 'pita-css-theme',
      defaultTheme: 'auto',
      toggleButtonSelector: '[data-theme-toggle]',
      selectSelector: '[data-theme-select]',
      enableTransition: true,
      transitionDuration: '300ms',
      ...options,
    };

    const stored = this.getStoredTheme();
    this.currentTheme = stored ?? this.config.defaultTheme;
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;

    if (this.config.enableTransition) {
      this.setupThemeTransition();
    }

    this.applyTheme(this.currentTheme);
    this.setupToggleButtons();
    this.setupThemeSelects();
    this.setupSystemThemeListener();
  }

  private setupThemeTransition(): void {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = `
            :root {
                transition: 
                    background-color ${this.config.transitionDuration} ease,
                    color ${this.config.transitionDuration} ease,
                    border-color ${this.config.transitionDuration} ease;
            }
            
            * {
                transition: 
                    background-color ${this.config.transitionDuration} ease,
                    color ${this.config.transitionDuration} ease,
                    border-color ${this.config.transitionDuration} ease,
                    box-shadow ${this.config.transitionDuration} ease;
            }
        `;
    document.head.appendChild(style);
  }

  private getStoredTheme(): Theme | null {
    if (typeof localStorage === 'undefined') return null;
    const v = localStorage.getItem(this.config.storageKey);
    if (v === 'light' || v === 'dark' || v === 'auto') return v;
    return null;
  }

  private setStoredTheme(theme: Theme): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.config.storageKey, theme);
  }

  private getSystemTheme(): Exclude<Theme, 'auto'> {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // 既存のテーマ属性を削除
    root.removeAttribute('data-theme');

    if (theme === 'auto') {
      // auto の場合は属性未設定でメディアクエリに委譲
      this.currentTheme = 'auto';
    } else {
      root.setAttribute('data-theme', theme);
      this.currentTheme = theme;
    }

    this.setStoredTheme(theme);
    this.updateToggleButtons();
    this.dispatchThemeChangeEvent();
  }

  public toggle(): void {
    const themes: Theme[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.applyTheme(themes[nextIndex]);
  }

  public setTheme(theme: Theme): void {
    this.applyTheme(theme);
  }

  private setupToggleButtons(): void {
    if (typeof document === 'undefined') return;

    const buttons = document.querySelectorAll<HTMLElement>(this.config.toggleButtonSelector);
    buttons.forEach((button) => {
      button.addEventListener('click', () => this.toggle());
    });

    this.updateToggleButtons();
  }

  private setupThemeSelects(): void {
    if (typeof document === 'undefined') return;

    const selects = document.querySelectorAll<HTMLSelectElement>(this.config.selectSelector);
    selects.forEach((select) => {
      // セレクトボックスが空の場合、オプションを自動生成
      if (select.children.length === 0) {
        this.populateSelectOptions(select);
      }

      // 現在のテーマを選択状態にする
      select.value = this.currentTheme;

      // 変更イベントリスナーを追加
      select.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLSelectElement;
        const v = target.value;
        const next: Theme = v === 'light' || v === 'dark' || v === 'auto' ? v : 'auto';
        this.setTheme(next);
      });
    });
  }

  private populateSelectOptions(select: HTMLSelectElement): void {
    const opts: ReadonlyArray<{ value: Theme; label: string; icon: string }> = [
      { value: 'auto', label: 'システム設定', icon: '💻' },
      { value: 'light', label: 'ライト', icon: '☀️' },
      { value: 'dark', label: 'ダーク', icon: '🌙' },
    ];

    // 既存のオプションをクリア
    select.innerHTML = '';

    opts.forEach((option) => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;

      // アイコンを含めるかどうかを判断
      const showIcon = select.dataset.showIcon !== 'false';
      optionElement.textContent = showIcon ? `${option.icon} ${option.label}` : option.label;

      select.appendChild(optionElement);
    });
  }

  private updateToggleButtons(): void {
    if (typeof document === 'undefined') return;

    const buttons = document.querySelectorAll<HTMLElement>(this.config.toggleButtonSelector);
    const icons: Record<Theme, string> = {
      light: '☀️',
      dark: '🌙',
      auto: '💻',
    };

    buttons.forEach((button) => {
      if (button.dataset.showIcon !== 'false') {
        button.textContent = icons[this.currentTheme] ?? '🔄';
      }

      button.setAttribute('data-current-theme', this.currentTheme);
      button.setAttribute('title', `現在のテーマ: ${this.getThemeLabel()}`);

      // CSS変数に基づいたスタイル適用のヘルパー
      button.style.color = 'var(--text-primary)';
      button.style.backgroundColor = 'var(--gray-secondary)';
      button.style.border = '1px solid var(--border-primary)';
    });

    // セレクトボックスも更新
    this.updateThemeSelects();
  }

  private updateThemeSelects(): void {
    if (typeof document === 'undefined') return;

    const selects = document.querySelectorAll<HTMLSelectElement>(this.config.selectSelector);
    selects.forEach((select) => {
      select.value = this.currentTheme;
      select.setAttribute('data-current-theme', this.currentTheme);

      // CSS変数に基づいたスタイル適用
      select.style.color = 'var(--text-primary)';
      select.style.backgroundColor = 'var(--gray-secondary)';
      select.style.border = '1px solid var(--border-primary)';
    });
  }

  private getThemeLabel(): string {
    const labels: Record<Theme, string> = {
      light: 'ライト',
      dark: 'ダーク',
      auto: 'システム設定',
    };
    return labels[this.currentTheme] ?? 'unknown';
  }

  private setupSystemThemeListener(): void {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === 'auto') {
        this.dispatchThemeChangeEvent();
      }
    });
  }

  private dispatchThemeChangeEvent(): void {
    if (typeof window === 'undefined') return;

    const actualTheme: Exclude<Theme, 'auto'> =
      this.currentTheme === 'auto' ? this.getSystemTheme() : this.currentTheme;

    const detail: ThemeToggleEventDetail = {
      theme: this.currentTheme,
      actualTheme,
      cssVariables: this.getCurrentCSSVariables(),
    };

    window.dispatchEvent(new CustomEvent<ThemeToggleEventDetail>('themechange', { detail }));
  }

  private getCurrentCSSVariables(): Record<string, string> {
    if (typeof window === 'undefined') return {};

    const computedStyles = getComputedStyle(document.documentElement);
    const variables: Record<string, string> = {};

    // 主要なCSS変数を取得
    const varNames = [
      '--brand-primary',
      '--brand-secondary',
      '--gray-primary',
      '--gray-secondary',
      '--gray-tertiary',
      '--text-primary',
      '--text-secondary',
      '--text-muted',
      '--border-primary',
      '--border-secondary',
      '--status-info',
      '--status-success',
      '--status-warning',
      '--status-error',
      '--link-primary',
      '--link-hover',
      '--link-visited',
    ] as const;

    varNames.forEach((varName) => {
      variables[varName] = computedStyles.getPropertyValue(varName).trim();
    });

    return variables;
  }

  public getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  public getActualTheme(): Exclude<Theme, 'auto'> {
    return this.currentTheme === 'auto' ? this.getSystemTheme() : this.currentTheme;
  }
}

// 自動初期化の改良版（無効化対応）
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // 自動初期化フラグ（オプション）
  const autoInit = typeof window !== 'undefined' && window.pitaCSS?.themeToggle?.autoInit !== false;

  // 既に無効化されている場合はスキップ
  const disabled = typeof window.pitaTheme === 'object' && 'disabled' in (window.pitaTheme as PitaThemeFlag)
    ? Boolean((window.pitaTheme as PitaThemeFlag).disabled)
    : false;

  if (disabled || !autoInit) {
    // 何もしない
  } else if (!window.pitaTheme) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        const disabledLate = typeof window.pitaTheme === 'object' && 'disabled' in (window.pitaTheme as PitaThemeFlag)
          ? Boolean((window.pitaTheme as PitaThemeFlag).disabled)
          : false;
        if (!disabledLate) {
          window.pitaTheme = new ThemeToggle();
        }
      });
    } else {
      const disabledLate = typeof window.pitaTheme === 'object' && 'disabled' in (window.pitaTheme as PitaThemeFlag)
        ? Boolean((window.pitaTheme as PitaThemeFlag).disabled)
        : false;
      if (!disabledLate) {
        window.pitaTheme = new ThemeToggle();
      }
    }
  }
}

export default ThemeToggle;
