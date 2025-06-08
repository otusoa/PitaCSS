// マルチフレームワーク対応のシンプルなナビゲーション
const AsideNav = (() => {
	let isInitialized = false;

	const init = () => {
		// ブラウザ環境でない場合は何もしない
		if (typeof document === 'undefined') return;

		// 重複初期化を防ぐ
		if (isInitialized) return;

		const toggle = document.querySelector('.nav-toggle');
		const overlay = document.querySelector('.nav-overlay');

		if (!toggle || !overlay) return;

		const toggleNav = () => document.body.classList.toggle('nav-open');
		const closeNav = () => document.body.classList.remove('nav-open');

		toggle.addEventListener('click', toggleNav);
		overlay.addEventListener('click', closeNav);

		// 折りたたみ機能の初期化
		initCollapsibleMenus();

		// ページ遷移時にメニューを閉じる処理を追加
		window.addEventListener('beforeunload', closeNav);

		// SPA対応: History APIによる遷移を検知
		const originalPushState = history.pushState;
		const originalReplaceState = history.replaceState;

		history.pushState = function (...args) {
			closeNav();
			return originalPushState.apply(this, args);
		};

		history.replaceState = function (...args) {
			closeNav();
			return originalReplaceState.apply(this, args);
		};

		// popstateイベントでもメニューを閉じる
		window.addEventListener('popstate', closeNav);

		isInitialized = true;

		return { toggleNav, closeNav };
	};

	const initCollapsibleMenus = () => {
		// サブメニューを持つリストアイテムを特定
		const menuItems = document.querySelectorAll('aside li');

		menuItems.forEach(item => {
			const submenu = item.querySelector('ul');
			if (submenu) {
				item.classList.add('has-submenu', 'collapsed');
				const link = item.querySelector('a');

				if (link) {
					link.addEventListener('click', (e) => {
						e.preventDefault();
						toggleSubmenu(item, submenu);
					});
				}
			}
		});
	};

	const toggleSubmenu = (parentItem, submenu) => {
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
	const autoInit = typeof window !== 'undefined' &&
		window.pitaCSS?.asideNav?.autoInit !== false;

	// 自動初期化（バニラJS・ブラウザ環境のみ）
	if (typeof document !== 'undefined' && autoInit) {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', init);
		} else {
			init();
		}
	}

	return { init };
})();

// ES6モジュールとしてエクスポート
export { AsideNav };

// CommonJSとの互換性も保持
if (typeof module !== 'undefined') module.exports = AsideNav;