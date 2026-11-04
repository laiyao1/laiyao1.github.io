(function () {
    const portrait = document.querySelector('.homepage-sidebar .profile-portrait');
    if (!portrait) return;

    const desktop = window.matchMedia('(min-width: 992px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let pendingFrame = 0;
    let previousWidth = null;

    function updatePortrait() {
        pendingFrame = 0;
        if (!desktop.matches || reducedMotion.matches) {
            if (previousWidth !== null) {
                portrait.style.removeProperty('max-width');
                previousWidth = null;
            }
            return;
        }

        // Match the reference's continuous 100% to 30% shrink over 280px.
        const progress = Math.min(Math.max(window.scrollY, 0) / 280, 1);
        const width = (100 - progress * 70).toFixed(2) + '%';
        if (width !== previousWidth) {
            portrait.style.maxWidth = width;
            previousWidth = width;
        }
    }

    function scheduleUpdate() {
        if (!pendingFrame) pendingFrame = window.requestAnimationFrame(updatePortrait);
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('pageshow', scheduleUpdate);
    desktop.addEventListener('change', scheduleUpdate);
    reducedMotion.addEventListener('change', scheduleUpdate);
    updatePortrait();
})();
