import { useEffect } from 'react';

// Each EJS page loaded its own stylesheet (charSheet.css, home.css, signin.css...).
// They all style things like <body> and #site-title differently, so loading them all at
// once would make them fight. This hook adds a page's CSS only while that page is on
// screen and removes it when you leave. It can also add a class to <body> (like "subpage").
// pageClass (like "page-sheet") goes on <html> so each page file's rules only apply on its own pages.
function usePageStyle(css, bodyClass, pageClass) {
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        if (bodyClass) document.body.classList.add(bodyClass);
        if (pageClass) document.documentElement.classList.add(pageClass);

        // cleanup: runs when the page goes away
        return () => {
            style.remove();
            if (bodyClass) document.body.classList.remove(bodyClass);
            if (pageClass) document.documentElement.classList.remove(pageClass);
        };
    }, [css, bodyClass, pageClass]);
}

export default usePageStyle;
