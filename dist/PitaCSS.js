var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var require_PitaCSS = __commonJS({
  "PitaCSS.js"(exports, module) {
    var _a, _b, _c, _d;
    class ProgressLoader {
      constructor(options = {}) {
        if (typeof window === "undefined") return;
        this.config = {
          minDuration: 800,
          estimatedDuration: 2e3,
          height: "3px",
          color: "#007bff",
          zIndex: 1e3,
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
        if (typeof document === "undefined") return;
        this.createProgressElement();
        this.setupNavigationHandlers();
        this.setupPageFinishHandler();
        window.addEventListener("beforeunload", () => {
          this.clearIntervals();
        });
      }
      createProgressElement() {
        if (typeof document === "undefined") return;
        this.progressElement = document.getElementById("progress");
        if (!this.progressElement) {
          this.progressElement = document.createElement("progress");
          this.progressElement.id = "progress";
          this.progressElement.className = "stripe";
          this.progressElement.max = 100;
          this.progressElement.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                z-index: 1000;
                width: 100%;
                border-radius: 0 !important;
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
          document.body.appendChild(this.progressElement);
        } else {
          this.progressElement.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
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
        this.clearIntervals();
        this.progressElement.style.display = "block";
        this.progressElement.style.opacity = "0";
        this.progressElement.style.transition = "";
        requestAnimationFrame(() => {
          this.progressElement.style.transition = "opacity 0.2s ease-in";
          this.progressElement.style.opacity = "1";
        });
      }
      hideProgress() {
        if (this.hideTimeout) return;
        this.progressElement.style.transition = "opacity 0.5s ease-out";
        this.progressElement.style.opacity = "0";
        this.hideTimeout = setTimeout(() => {
          this.progressElement.style.display = "none";
          this.progressElement.style.transition = "";
          this.hideTimeout = null;
        }, 500);
      }
      setupNavigationHandlers() {
        if (typeof document === "undefined") return;
        document.addEventListener("click", (event) => {
          const link = event.target.closest("a[href]");
          if (!link) return;
          const href = link.getAttribute("href");
          if (href.startsWith("http") || href.startsWith("//") || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || link.hasAttribute("download") || link.classList.contains("no-progress") || link.hasAttribute("data-no-progress")) {
            return;
          }
          const linkUrl = new URL(href, window.location.origin);
          if (linkUrl.pathname === window.location.pathname && linkUrl.hash !== "" && linkUrl.hash !== window.location.hash) {
            return;
          }
          if (linkUrl.pathname === window.location.pathname && linkUrl.hash === window.location.hash) {
            return;
          }
          this.startLoading();
        });
      }
      startLoading() {
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
          const progress = Math.min(5 + elapsed / this.config.estimatedDuration * 85, 90);
          this.progressValue = progress;
          this.progressElement.value = this.progressValue;
          if (progress >= 90) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
          }
        }, this.config.animationSpeed);
      }
      setupPageFinishHandler() {
        if (typeof document === "undefined") return;
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => {
            if (this.isLoading) {
              setTimeout(() => this.finishLoading(), 100);
            }
          });
        }
        window.addEventListener("load", () => {
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
        if (this.progressElement && !document.querySelector("#progress")) {
          this.progressElement.remove();
        }
      }
    }
    if (typeof window !== "undefined" && typeof document !== "undefined" && !window.progressLoader) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          window.progressLoader = new ProgressLoader();
        });
      } else {
        window.progressLoader = new ProgressLoader();
      }
    }
    if (typeof module !== "undefined" && module.exports) {
      module.exports = ProgressLoader;
    }
    const AsideNav = (() => {
      var _a2, _b2;
      let isInitialized = false;
      const init = () => {
        if (typeof document === "undefined") return;
        if (isInitialized) return;
        const toggle = document.querySelector(".nav-toggle");
        const overlay = document.querySelector(".nav-overlay");
        if (!toggle || !overlay) return;
        const toggleNav = () => document.body.classList.toggle("nav-open");
        const closeNav = () => document.body.classList.remove("nav-open");
        toggle.addEventListener("click", toggleNav);
        overlay.addEventListener("click", closeNav);
        initCollapsibleMenus();
        window.addEventListener("beforeunload", closeNav);
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        history.pushState = function(...args) {
          closeNav();
          return originalPushState.apply(this, args);
        };
        history.replaceState = function(...args) {
          closeNav();
          return originalReplaceState.apply(this, args);
        };
        window.addEventListener("popstate", closeNav);
        isInitialized = true;
        return { toggleNav, closeNav };
      };
      const initCollapsibleMenus = () => {
        const menuItems = document.querySelectorAll("aside li");
        menuItems.forEach((item) => {
          const submenu = item.querySelector("ul");
          if (submenu) {
            item.classList.add("has-submenu", "collapsed");
            const link = item.querySelector("a");
            if (link) {
              link.addEventListener("click", (e) => {
                e.preventDefault();
                toggleSubmenu(item, submenu);
              });
            }
          }
        });
      };
      const toggleSubmenu = (parentItem, submenu) => {
        const isCollapsed = parentItem.classList.contains("collapsed");
        if (isCollapsed) {
          parentItem.classList.remove("collapsed");
          submenu.classList.add("expanded");
        } else {
          parentItem.classList.add("collapsed");
          submenu.classList.remove("expanded");
        }
      };
      const autoInit = typeof window !== "undefined" && ((_b2 = (_a2 = window.pitaCSS) == null ? void 0 : _a2.asideNav) == null ? void 0 : _b2.autoInit) !== false;
      if (typeof document !== "undefined" && autoInit) {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", init);
        } else {
          init();
        }
      }
      return { init };
    })();
    if (typeof module !== "undefined") module.exports = AsideNav;
    class ThemeToggle {
      constructor(options = {}) {
        this.config = {
          storageKey: "pita-css-theme",
          defaultTheme: "auto",
          // 'light', 'dark', 'auto'
          toggleButtonSelector: "[data-theme-toggle]",
          // セレクトボックス用の新しいオプション
          selectSelector: "[data-theme-select]",
          // 新しいオプション: アニメーション有効/無効
          enableTransition: true,
          transitionDuration: "300ms",
          ...options
        };
        this.currentTheme = this.getStoredTheme() || this.config.defaultTheme;
        this.init();
      }
      init() {
        if (typeof window === "undefined") return;
        if (this.config.enableTransition) {
          this.setupThemeTransition();
        }
        this.applyTheme(this.currentTheme);
        this.setupToggleButtons();
        this.setupThemeSelects();
        this.setupSystemThemeListener();
      }
      setupThemeTransition() {
        if (typeof document === "undefined") return;
        const style = document.createElement("style");
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
        if (typeof localStorage === "undefined") return null;
        return localStorage.getItem(this.config.storageKey);
      }
      setStoredTheme(theme) {
        if (typeof localStorage === "undefined") return;
        localStorage.setItem(this.config.storageKey, theme);
      }
      getSystemTheme() {
        if (typeof window === "undefined") return "light";
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      applyTheme(theme) {
        if (typeof document === "undefined") return;
        const root = document.documentElement;
        root.removeAttribute("data-theme");
        if (theme === "auto") {
          this.currentTheme = "auto";
        } else {
          root.setAttribute("data-theme", theme);
          this.currentTheme = theme;
        }
        this.setStoredTheme(theme);
        this.updateToggleButtons();
        this.dispatchThemeChangeEvent();
      }
      toggle() {
        const themes = ["light", "dark", "auto"];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.applyTheme(themes[nextIndex]);
      }
      setTheme(theme) {
        if (["light", "dark", "auto"].includes(theme)) {
          this.applyTheme(theme);
        }
      }
      setupToggleButtons() {
        if (typeof document === "undefined") return;
        const buttons = document.querySelectorAll(this.config.toggleButtonSelector);
        buttons.forEach((button) => {
          button.addEventListener("click", () => this.toggle());
        });
        this.updateToggleButtons();
      }
      setupThemeSelects() {
        if (typeof document === "undefined") return;
        const selects = document.querySelectorAll(this.config.selectSelector);
        selects.forEach((select) => {
          if (select.children.length === 0) {
            this.populateSelectOptions(select);
          }
          select.value = this.currentTheme;
          select.addEventListener("change", (e) => {
            this.setTheme(e.target.value);
          });
        });
      }
      populateSelectOptions(select) {
        const options = [
          { value: "auto", label: "システム設定", icon: "💻" },
          { value: "light", label: "ライト", icon: "☀️" },
          { value: "dark", label: "ダーク", icon: "🌙" }
        ];
        select.innerHTML = "";
        options.forEach((option) => {
          const optionElement = document.createElement("option");
          optionElement.value = option.value;
          const showIcon = select.dataset.showIcon !== "false";
          optionElement.textContent = showIcon ? `${option.icon} ${option.label}` : option.label;
          select.appendChild(optionElement);
        });
      }
      updateToggleButtons() {
        if (typeof document === "undefined") return;
        const buttons = document.querySelectorAll(this.config.toggleButtonSelector);
        buttons.forEach((button) => {
          const icons = {
            light: "☀️",
            dark: "🌙",
            auto: "💻"
          };
          if (button.dataset.showIcon !== "false") {
            button.textContent = icons[this.currentTheme] || "🔄";
          }
          button.setAttribute("data-current-theme", this.currentTheme);
          button.setAttribute("title", `現在のテーマ: ${this.getThemeLabel()}`);
          button.style.color = "var(--text-primary)";
          button.style.backgroundColor = "var(--gray-secondary)";
          button.style.border = "1px solid var(--border-primary)";
        });
        this.updateThemeSelects();
      }
      updateThemeSelects() {
        if (typeof document === "undefined") return;
        const selects = document.querySelectorAll(this.config.selectSelector);
        selects.forEach((select) => {
          select.value = this.currentTheme;
          select.setAttribute("data-current-theme", this.currentTheme);
          select.style.color = "var(--text-primary)";
          select.style.backgroundColor = "var(--gray-secondary)";
          select.style.border = "1px solid var(--border-primary)";
        });
      }
      getThemeLabel() {
        const labels = {
          light: "ライト",
          dark: "ダーク",
          auto: "システム設定"
        };
        return labels[this.currentTheme] || "unknown";
      }
      setupSystemThemeListener() {
        if (typeof window === "undefined") return;
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.addEventListener("change", () => {
          if (this.currentTheme === "auto") {
            this.dispatchThemeChangeEvent();
          }
        });
      }
      dispatchThemeChangeEvent() {
        if (typeof window === "undefined") return;
        const actualTheme = this.currentTheme === "auto" ? this.getSystemTheme() : this.currentTheme;
        window.dispatchEvent(new CustomEvent("themechange", {
          detail: {
            theme: this.currentTheme,
            actualTheme,
            // CSS変数の値も含める
            cssVariables: this.getCurrentCSSVariables()
          }
        }));
      }
      getCurrentCSSVariables() {
        if (typeof window === "undefined") return {};
        const computedStyles = getComputedStyle(document.documentElement);
        const variables = {};
        const varNames = [
          "--brand-primary",
          "--brand-secondary",
          "--gray-primary",
          "--gray-secondary",
          "--gray-tertiary",
          "--text-primary",
          "--text-secondary",
          "--text-muted",
          "--border-primary",
          "--border-secondary",
          "--status-info",
          "--status-success",
          "--status-warning",
          "--status-error",
          "--link-primary",
          "--link-hover",
          "--link-visited"
        ];
        varNames.forEach((varName) => {
          variables[varName] = computedStyles.getPropertyValue(varName).trim();
        });
        return variables;
      }
      getCurrentTheme() {
        return this.currentTheme;
      }
      getActualTheme() {
        return this.currentTheme === "auto" ? this.getSystemTheme() : this.currentTheme;
      }
    }
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const autoInit = typeof window !== "undefined" && ((_b = (_a = window.pitaCSS) == null ? void 0 : _a.themeToggle) == null ? void 0 : _b.autoInit) !== false;
      if (((_c = window.pitaTheme) == null ? void 0 : _c.disabled) || !autoInit) ;
      else if (!window.pitaTheme) {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => {
            var _a2;
            if (!((_a2 = window.pitaTheme) == null ? void 0 : _a2.disabled)) {
              window.pitaTheme = new ThemeToggle();
            }
          });
        } else {
          if (!((_d = window.pitaTheme) == null ? void 0 : _d.disabled)) {
            window.pitaTheme = new ThemeToggle();
          }
        }
      }
    }
    if (typeof module !== "undefined" && module.exports) {
      module.exports = ThemeToggle;
    }
  }
});
export default require_PitaCSS();
