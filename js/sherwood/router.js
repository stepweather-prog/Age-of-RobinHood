/**
 * Sherwood Router
 * Простая навигация между экранами игры
 */

Sherwood.Router = {
    _history: [],
    
    navigate(screen, params = {}) {
        this._history.push({ screen, params });
        Sherwood.dispatch({ type: 'NAVIGATE', payload: { screen, params } });
    },
    
    back() {
        if (this._history.length > 1) {
            this._history.pop();
            const prev = this._history[this._history.length - 1];
            Sherwood.dispatch({ type: 'NAVIGATE', payload: prev });
            return prev;
        }
        return null;
    },
    
    getCurrent() {
        return this._history.length > 0 ? this._history[this._history.length - 1] : null;
    },
    
    getHistory() {
        return [...this._history];
    }
};
