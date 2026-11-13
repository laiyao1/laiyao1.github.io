(function () {
    'use strict';

    const label = document.querySelector('.navbar-name-text');
    if (!label) return;

    const primaryName = label.textContent.trim();
    const alternateName = (label.dataset.alternateName || '').trim();
    if (!primaryName || !alternateName || primaryName === alternateName) return;

    const names = [Array.from(primaryName), Array.from(alternateName)];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const holdDuration = 3000;
    const typeDuration = 140;
    const deleteDuration = 80;
    const blankDuration = 220;
    let nameIndex = 0;
    let characterCount = names[0].length;
    let deleting = true;
    let timer = null;
    let nextDelay = holdDuration;

    function render() {
        label.textContent = names[nameIndex].slice(0, characterCount).join('');
        label.lang = nameIndex === 0 ? 'en' : 'zh-Hant';
    }

    function stop() {
        window.clearTimeout(timer);
        timer = null;
    }

    function schedule(delay) {
        stop();
        nextDelay = delay;
        if (!reducedMotion.matches && document.visibilityState !== 'hidden') {
            timer = window.setTimeout(advance, delay);
        }
    }

    function advance() {
        timer = null;
        if (reducedMotion.matches || document.visibilityState === 'hidden') return;

        if (deleting) {
            characterCount -= 1;
            render();
            if (characterCount === 0) {
                nameIndex = (nameIndex + 1) % names.length;
                deleting = false;
                schedule(blankDuration);
            } else schedule(deleteDuration);
        } else {
            characterCount += 1;
            render();
            if (characterCount === names[nameIndex].length) {
                deleting = true;
                schedule(holdDuration);
            } else schedule(typeDuration);
        }
    }

    function syncMotion() {
        stop();
        if (reducedMotion.matches) {
            nameIndex = 0;
            characterCount = names[0].length;
            deleting = true;
            nextDelay = holdDuration;
            render();
        } else schedule(nextDelay);
    }

    document.addEventListener('visibilitychange', syncMotion);
    window.addEventListener('pageshow', syncMotion);
    reducedMotion.addEventListener('change', syncMotion);
    render();
    syncMotion();
}());
