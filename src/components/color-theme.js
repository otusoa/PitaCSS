/**
 * PitaCSS Theme Toggle Utility
 * ダークモード/ライトモードの切り替え機能
 * 
 * 対応するCSS変数:
 * - :root (デフォルトライト)
 * - [data-theme="dark"] (明示的ダーク)
 * - [data-theme="light"] (明示的ライト)  
 * - @media (prefers-color-scheme: dark) :root:not([data-theme]) (システムダーク)
 */
class ThemeToggle {
    constructor(options = {}) {
        this.config = {
            storageKey: 'pita-css-theme',
            defaultTheme: 'auto', // 'light', 'dark', 'auto'
            toggleButtonSelector: '[data-theme-toggle]',
            // 新しいオプション: アニメーション有効/無効
            enableTransition: true,
            transitionDuration: '300ms',
            ...options
        };

        this.currentTheme = this.getStoredTheme() || this.config.defaultTheme;
        this.init();
    }

    init() {
        if (typeof window === 'undefined') return;

        // テーマ切り替え時のトランジション設定
        if (this.config.enableTransition) {
            this.setupThemeTransition();
        }

        this.applyTheme(this.currentTheme);
        this.setupToggleButtons();
        this.setupSystemThemeListener();
    }

    setupThemeTransition() {
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

    getStoredTheme() {
        if (typeof localStorage === 'undefined') return null;
        return localStorage.getItem(this.config.storageKey);
    }

    setStoredTheme(theme) {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(this.config.storageKey, theme);
    }

    getSystemTheme() {
        if (typeof window === 'undefined') return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    applyTheme(theme) {
        if (typeof document === 'undefined') return;

        const root = document.documentElement;
        
        // 既存のテーマ属性を削除
        root.removeAttribute('data-theme');
        
        if (theme === 'auto') {
            // autoの場合は属性を設定せず、CSSの@media (prefers-color-scheme)に任せる
            // これにより :root:not([data-theme]) のルールが適用される
            this.currentTheme = 'auto';
        } else {
            // 明示的にテーマを設定
            // [data-theme="light"] または [data-theme="dark"] のルールが適用される
            root.setAttribute('data-theme', theme);
            this.currentTheme = theme;
        }

        this.setStoredTheme(theme);
        this.updateToggleButtons();
        this.dispatchThemeChangeEvent();
    }

    toggle() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.applyTheme(themes[nextIndex]);
    }

    setTheme(theme) {
        if (['light', 'dark', 'auto'].includes(theme)) {
            this.applyTheme(theme);
        }
    }

    setupToggleButtons() {
        if (typeof document === 'undefined') return;

        const buttons = document.querySelectorAll(this.config.toggleButtonSelector);
        buttons.forEach(button => {
            button.addEventListener('click', () => this.toggle());
        });

        this.updateToggleButtons();
    }

    updateToggleButtons() {
        if (typeof document === 'undefined') return;

        const buttons = document.querySelectorAll(this.config.toggleButtonSelector);
        buttons.forEach(button => {
            // ボタンのテキストや属性を更新
            const icons = {
                light: '☀️',
                dark: '🌙',
                auto: '💻'
            };
            
            if (button.dataset.showIcon !== 'false') {
                button.textContent = icons[this.currentTheme] || '🔄';
            }
            
            button.setAttribute('data-current-theme', this.currentTheme);
            button.setAttribute('title', `現在のテーマ: ${this.getThemeLabel()}`);
            
            // CSS変数に基づいたスタイル適用のヘルパー
            button.style.color = 'var(--text-primary)';
            button.style.backgroundColor = 'var(--gray-secondary)';
            button.style.border = '1px solid var(--border-primary)';
        });
    }

    getThemeLabel() {
        const labels = {
            light: 'ライト',
            dark: 'ダーク',
            auto: 'システム設定'
        };
        return labels[this.currentTheme] || 'unknown';
    }

    setupSystemThemeListener() {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
            if (this.currentTheme === 'auto') {
                this.dispatchThemeChangeEvent();
            }
        });
    }

    dispatchThemeChangeEvent() {
        if (typeof window === 'undefined') return;

        const actualTheme = this.currentTheme === 'auto' ? this.getSystemTheme() : this.currentTheme;
        
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: {
                theme: this.currentTheme,
                actualTheme: actualTheme,
                // CSS変数の値も含める
                cssVariables: this.getCurrentCSSVariables()
            }
        }));
    }

    getCurrentCSSVariables() {
        if (typeof window === 'undefined') return {};
        
        const computedStyles = getComputedStyle(document.documentElement);
        const variables = {};
        
        // 主要なCSS変数を取得
        const varNames = [
            '--brand-primary', '--brand-secondary',
            '--gray-primary', '--gray-secondary', '--gray-tertiary',
            '--text-primary', '--text-secondary', '--text-muted',
            '--border-primary', '--border-secondary',
            '--status-info', '--status-success', '--status-warning', '--status-error',
            '--link-primary', '--link-hover', '--link-visited'
        ];
        
        varNames.forEach(varName => {
            variables[varName] = computedStyles.getPropertyValue(varName).trim();
        });
        
        return variables;
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getActualTheme() {
        return this.currentTheme === 'auto' ? this.getSystemTheme() : this.currentTheme;
    }
}

// 自動初期化
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.pitaTheme = new ThemeToggle();
        });
    } else {
        window.pitaTheme = new ThemeToggle();
    }
}

// エクスポート
export default ThemeToggle;

// CommonJSエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeToggle;
}