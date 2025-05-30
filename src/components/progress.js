/**
 * PitaProgress - ページ遷移用プログレスバー
 * あらゆる環境（Vue、React、バニラJS）で動作するように設計
 */
(function () {
    // プライベート変数
    let isLoading = false;
    let progressValue = 0;
    let loadingStart = 0;
    let progressInterval = null;
    let finalInterval = null;
    let progressElement = null;
    let styleElement = null;

    // プログレスバーのスタイル定義
    const styles = `
    .pita-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      z-index: 1000;
      width: 100%;
      border-radius: 0 !important;
      display: none;
    }
    
    .pita-progress.stripe {
      background-image: linear-gradient(
        -45deg,
        rgba(255, 255, 255, 0.2) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.2) 50%,
        rgba(255, 255, 255, 0.2) 75%,
        transparent 75%,
        transparent
      );
      background-size: 30px 30px;
      animation: pita-progress-stripe 1s linear infinite;
    }
    
    @keyframes pita-progress-stripe {
      0% { background-position: 0 0; }
      100% { background-position: 30px 0; }
    }
  `;

    // プログレスバーの表示/非表示を切り替える
    function updateProgressVisibility() {
        if (progressElement) {
            progressElement.style.display = isLoading ? 'block' : 'none';
        }
    }

    // プログレスバーの値を更新
    function updateProgressValue() {
        if (progressElement) {
            progressElement.value = progressValue;
        }
    }

    // プログレスバーをクリアする関数
    function clearIntervals() {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        if (finalInterval) {
            clearInterval(finalInterval);
            finalInterval = null;
        }
    }

    // ローディング完了処理
    function finishLoading() {
        const elapsed = Date.now() - loadingStart;
        const minDuration = 800; // 最小表示時間

        clearIntervals();

        // プログレスバーを100%まで素早く完了
        progressValue = 100;
        updateProgressValue();

        // 最小表示時間を考慮してローディングを終了
        const remainingTime = Math.max(0, minDuration - elapsed);

        setTimeout(() => {
            isLoading = false;
            updateProgressVisibility();
        }, remainingTime);
    }

    // ページ遷移開始時の処理
    function startProgress() {
        // 既存のローディングをクリア
        clearIntervals();

        isLoading = true;
        progressValue = 5; // 初期値
        loadingStart = Date.now();

        updateProgressVisibility();
        updateProgressValue();

        // プログレスバーのアニメーション開始
        progressInterval = setInterval(() => {
            const elapsed = Date.now() - loadingStart;
            const estimatedDuration = 2000;

            // より自然な進行曲線
            const progress = Math.min(5 + (elapsed / estimatedDuration) * 85, 90);
            progressValue = progress;
            updateProgressValue();

            // 90%に達したら一旦停止
            if (progress >= 90) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
        }, 16); // 60FPSに近い滑らかさ
    }

    // リンククリックのハンドラー
    function handleLinkClick(e) {
        // リンクがクリックされた場合
        const target = e.target.closest('a');
        if (target &&
            target.href &&
            target.href.startsWith(window.location.origin) &&
            !e.ctrlKey && !e.metaKey &&
            target.target !== '_blank') {

            e.preventDefault();
            const href = target.href;

            // プログレスバーを開始
            startProgress();

            // 遷移をシミュレート
            setTimeout(() => {
                window.history.pushState({}, '', href);
                finishLoading();
            }, 1000);
        }
    }

    // ページナビゲーションの監視
    function handlePopState() {
        startProgress();
        // ページ遷移が完了したことをシミュレート
        setTimeout(finishLoading, 1000);
    }

    // 初期化関数
    function init() {
        // すでに初期化されている場合は何もしない
        if (progressElement) return;

        // スタイルの追加
        styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);

        // プログレスバー要素を作成
        progressElement = document.createElement('progress');
        progressElement.id = 'pita-progress';
        progressElement.className = 'pita-progress stripe';
        progressElement.max = 100;
        progressElement.value = 0;
        document.body.appendChild(progressElement);

        // イベントリスナーの設定
        window.addEventListener('popstate', handlePopState);
        document.addEventListener('click', handleLinkClick);

        // 初期状態は非表示
        updateProgressVisibility();
    }

    // クリーンアップ関数
    function destroy() {
        // イベントリスナーの削除
        window.removeEventListener('popstate', handlePopState);
        document.removeEventListener('click', handleLinkClick);

        // インターバルのクリア
        clearIntervals();

        // 要素の削除
        if (progressElement && progressElement.parentNode) {
            progressElement.parentNode.removeChild(progressElement);
            progressElement = null;
        }

        // スタイルの削除
        if (styleElement && styleElement.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
            styleElement = null;
        }
    }

    // DOMContentLoadedイベントでの初期化
    function handleDOMContentLoaded() {
        init();
    }

    // ページ読み込み時の初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
    } else {
        init();
    }

    // ページアンロード時のクリーンアップ
    window.addEventListener('beforeunload', clearIntervals);

    // 公開API
    const PitaProgress = {
        start: startProgress,
        finish: finishLoading,
        init: init,
        destroy: destroy
    };

    // グローバルスコープに公開
    if (typeof window !== 'undefined') {
        window.PitaProgress = PitaProgress;
    }

    // CommonJS環境対応
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PitaProgress;
    }

    // ES Modules対応
    if (typeof exports !== 'undefined') {
        exports.PitaProgress = PitaProgress;
    }
})();