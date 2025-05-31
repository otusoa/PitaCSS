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
        
        isInitialized = true;
        
        return { toggleNav, closeNav };
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