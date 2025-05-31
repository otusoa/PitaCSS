// マルチフレームワーク対応のシンプルなナビゲーション
const AsideNav = (() => {
    const init = () => {
        // ブラウザ環境でない場合は何もしない
        if (typeof document === 'undefined') return;
        
        const toggle = document.querySelector('.nav-toggle');
        const overlay = document.querySelector('.nav-overlay');
        
        if (!toggle || !overlay) return;
        
        const toggleNav = () => document.body.classList.toggle('nav-open');
        const closeNav = () => document.body.classList.remove('nav-open');
        
        toggle.addEventListener('click', toggleNav);
        overlay.addEventListener('click', closeNav);
        
        return { toggleNav, closeNav };
    };
    
    // 自動初期化（バニラJS・ブラウザ環境のみ）
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }
    
    return { init };
})();

// エクスポート（必要に応じて）
if (typeof module !== 'undefined') module.exports = AsideNav;