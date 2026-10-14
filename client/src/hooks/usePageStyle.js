import { useEffect } from 'react';

// Each EJS page loaded its own stylesheet (charSheet.css, home.css, signin.css...).
// They all style things like <body> and #site-title differently, so loading them all at
// once would make them fight. This hook adds a page's CSS only while that page is on
// screen and removes it when you leave. It can also add a class to <body> (like "subpage").
function usePageStyle(css, bodyClass) {
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        if (bodyClass) document.body.classList.add(bodyClass);

        // cleanup: runs when the page goes away
        return () => {
            style.remove();
            if (bodyClass) document.body.classList.remove(bodyClass);
        };
    }, [css, bodyClass]);
}

export default usePageStyle;
