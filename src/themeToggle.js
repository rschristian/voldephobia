if (import.meta.env.NODE_ENV !== 'production') {
    while (!document.querySelector('#theme-toggle')) {
        await new Promise((r) => setTimeout(r, 10));
    }
}

const themeToggle = document.getElementById('theme-toggle'),
    moon = document.getElementById('dark-mode'),
    sun = document.getElementById('light-mode');

let theme =
    localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && matchMedia('(prefers-color-scheme: dark)').matches)
        ? 'light'
        : 'dark';
toggle();

function toggle() {
    theme = theme == 'dark' ? 'light' : 'dark';
    document.documentElement.classList[theme === 'dark' ? 'add' : 'remove']('dark');
    (theme === 'dark' ? moon : sun).style.visibility = 'hidden';
    (theme === 'dark' ? sun : moon).style.visibility = 'visible';
    localStorage.theme = theme;
}

themeToggle.addEventListener('click', toggle);
