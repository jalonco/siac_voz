import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';

export function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
        }
        return 'dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className={clsx(
                "p-2 rounded-lg transition-colors border",
                theme === 'dark'
                    ? "bg-slate-800 text-yellow-400 border-slate-700 hover:bg-slate-700"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            )}
            title="Alternar tema"
        >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
    );
}
