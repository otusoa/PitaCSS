// マルチフレームワーク対応のシンプルなナビゲーション (TypeScript)

declare global {
  // 既存の PitaCSSConfig（他ファイルで宣言）に asideNav セクションを拡張
  interface PitaCSSConfig {
    asideNav?: {
      autoInit?: boolean;
    };
  }
}

interface AsideNavHandle {
  toggleNav: () => void;
  closeNav: () => void;
}

const AsideNav = (() => {
  let isInitialized = false;

  const init = (): AsideNavHandle | void => {
    // ブラウザ環境でない場合は何もしない
    if (typeof document === 'undefined') return;

    // 重複初期化を防ぐ
    if (isInitialized) return;

    const toggle = document.querySelector<HTMLElement>('.nav-toggle');
    const overlay = document.querySelector<HTMLElement>('.nav-overlay');

    if (!toggle || !overlay) return;

  const toggleNav = (): void => { document.body.classList.toggle('nav-open'); };
  const closeNav = (): void => { document.body.classList.remove('nav-open'); };

    toggle.addEventListener('click', toggleNav);
    overlay.addEventListener('click', closeNav);

    // 折りたたみ機能の初期化
    initCollapsibleMenus();

    // ページ遷移時にメニューを閉じる処理を追加
    window.addEventListener('beforeunload', closeNav);

    // SPA対応: History APIによる遷移を検知
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = ((...args: Parameters<History['pushState']>): void => {
      closeNav();
      originalPushState(...args);
    }) as History['pushState'];

    history.replaceState = ((...args: Parameters<History['replaceState']>): void => {
      closeNav();
      originalReplaceState(...args);
    }) as History['replaceState'];

    // popstateイベントでもメニューを閉じる
    window.addEventListener('popstate', closeNav);

    isInitialized = true;

    return { toggleNav, closeNav };
  };

  const initCollapsibleMenus = (): void => {
    if (typeof document === 'undefined') return;

    // サブメニューを持つリストアイテムを特定
    const menuItems = document.querySelectorAll<HTMLLIElement>('aside li');

    menuItems.forEach((item) => {
      const submenu = item.querySelector<HTMLUListElement>('ul');
      if (submenu) {
        item.classList.add('has-submenu', 'collapsed');
        const link = item.querySelector<HTMLAnchorElement>('a');

        if (link) {
          link.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            toggleSubmenu(item, submenu);
          });
        }
      }
    });
  };

  const toggleSubmenu = (parentItem: HTMLElement, submenu: HTMLElement): void => {
    const isCollapsed = parentItem.classList.contains('collapsed');

    if (isCollapsed) {
      parentItem.classList.remove('collapsed');
      submenu.classList.add('expanded');
    } else {
      parentItem.classList.add('collapsed');
      submenu.classList.remove('expanded');
    }
  };

  // 自動初期化フラグ（オプション）
  type _MaybeAsideNavConfig = { pitaCSS?: { asideNav?: { autoInit?: boolean } } };
  const autoInit = typeof window !== 'undefined' &&
    ((window as unknown as _MaybeAsideNavConfig).pitaCSS?.asideNav?.autoInit !== false);

  // 自動初期化（バニラJS・ブラウザ環境のみ）
  if (typeof document !== 'undefined' && autoInit) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => { init(); });
    } else {
      init();
    }
  }

  return { init } as const;
})();

// ES6モジュールとしてエクスポート
export { AsideNav };
