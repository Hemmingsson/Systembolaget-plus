import { init } from './main.js'




const documentReadyInterval = setInterval(() => {
    if (document.readyState === "complete") {
        clearInterval(documentReadyInterval);
        console.log('%c%s', 'color: green; font-weight: 900; font-size: 14px;', '🍷 🍷 🍷 Vivino successfully injected')
        init()
    }
}, 200);


