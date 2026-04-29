document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const logoutButton = document.getElementById('logout-button');
    const watchlistNavBtn = document.getElementById('watchlist-nav-btn');
    const toggleChatBtn = document.getElementById('toggle-chat-btn');
    const chatPanel = document.getElementById('chat-panel');
    const movieGridContainer = document.getElementById('movie-grid-container');
    const resultsPanelTitle = document.getElementById('results-panel-title');
    const chatHistory = document.getElementById('chat-history');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const trailerModal = document.getElementById('trailer-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const trailerContainer = document.getElementById('trailer-container');
    const marqueeTrack = document.getElementById('marquee-track');
    const largePreview = document.getElementById('large-preview');
const introContainer = document.getElementById("intro-video-container");
const introVideo = document.getElementById("intro-video");
const skipIntroBtn = document.getElementById("skip-intro");

  
    let state = {
        isLoading: false, username: 'Guest', watchlist: new Set(),
        displayedMovieIds: new Set(), currentMessageId: 0, lastQuery: '',
        isChatVisible: true
    };
    const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://cineminnd-ai.onrender.com';
    let marqueeAnimationId = null;

    const STATIC_POSTERS = [
  "https://image.tmdb.org/t/p/w300/qJ2tW6WMUDux911r6m7haRef0WH.jpg", // Dark Knight
  "https://image.tmdb.org/t/p/w300/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg", // Avengers
  "https://image.tmdb.org/t/p/w300/6DrHO1jr3qVrViUO6s6kFiAGM7.jpg",  // Spider-Man
  "https://image.tmdb.org/t/p/w300/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg", // Interstellar
  "https://image.tmdb.org/t/p/w300/9O1Iy9od7dWc9kJ8H0e0Qh2vL1A.jpg",
  "https://image.tmdb.org/t/p/w200/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg", 
  "https://image.tmdb.org/t/p/w200/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", 
  "https://image.tmdb.org/t/p/w200/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
   "https://image.tmdb.org/t/p/w200/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
    "https://image.tmdb.org/t/p/w200/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
     "https://image.tmdb.org/t/p/w200/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      "https://image.tmdb.org/t/p/w200/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
       "https://image.tmdb.org/t/p/w200/9gk7adHYeDvHkCSEhniVnh0k7Gq.jpg",
        "https://image.tmdb.org/t/p/w200/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", // Joker
  "https://image.tmdb.org/t/p/w300/5BwqwxMEjeFtdknRV792Svo0K1v.jpg", // Inception
  "https://image.tmdb.org/t/p/w300/xBHvZcjRiWyobQ9kxBhO6B2dtRI.jpg", // Avengers Infinity War
  "https://image.tmdb.org/t/p/w300/y31QB9kn3XSudA15tV7UWQ9XLuW.jpg",
  
  
  
  
  
   "https://image.tmdb.org/t/p/w300/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
  "https://image.tmdb.org/t/p/w300/9O1Iy9od7dWc9kJ8H0e0Qh2vL1A.jpg",
  "https://image.tmdb.org/t/p/w300/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
  "https://image.tmdb.org/t/p/w300/9gk7adHYeDvHkCSEhniVnh0k7Gq.jpg",
  "https://image.tmdb.org/t/p/w300/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
  "https://image.tmdb.org/t/p/w300/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  "https://image.tmdb.org/t/p/w300/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
  "https://image.tmdb.org/t/p/w300/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
  
  
  
  
  
  
  
  // Avatar
  "https://image.tmdb.org/t/p/w300/cezWGskPY5x7GaglTTRN4Fugfb8.jpg", // Venom
  "https://image.tmdb.org/t/p/w300/kOVEVeg59E0wsnXmF9nrh6OmWII.jpg"  // John Wick
];


function handleImageError(img) {
  img.onerror = null;
  img.src = "https://via.placeholder.com/300x450?text=No+Image";
}








    // --- AUTH & INITIALIZATION ---
    const handleLogin = async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        if (!username || !password) return alert('Please enter username and password.');
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (data.success && data.token) {
                localStorage.setItem('jwtToken', data.token);
                localStorage.setItem('username', data.username);
                state.username = data.username;
                showAppUI();
            } else { alert(data.message || 'Login failed.'); }
        } catch (err) { alert('Login failed. Please try again.'); }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value.trim();
        if (!username || !email || !password) return alert('Please fill all fields.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('Please enter a valid email.');
        if (password.length < 6) return alert('Password must be at least 6 characters.');
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert('Registration successful! Please login.');
                showLoginLink.click();
            } else { alert(`Registration failed: ${data.message || 'Unknown error'}`); }
        } catch (err) { alert('Registration failed. Please try again.'); }
    };

    const handleLogout = () => { localStorage.clear(); window.location.reload(); };

    function initializeApp() {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            state.username = localStorage.getItem('username') || 'Guest';
            showAppUI();
        } else {
            initVideoControls();
            showAuthUI();
        }
    }

    function initializeMainApp() {
        fetchWatchlist();
        populateStaticMarquee();
        renderBotResponse(`Salaam ${state.username} bhai! Main hoon Movie-Bhai 🤖🍿. Boliye, aaj kya dekhne ka mood hai? Try: "Avengers jaisi movies" ya "90s thrillers"`);
    }

    
    const startAuthSlideshow = () => {
        const slides = document.querySelectorAll('.bg-slide');
        let currentSlide = 0;
        slides.forEach((slide, index) => {
            if (index > 0) {
                const img = new Image();
                img.src = slide.dataset.src;
                img.onload = () => slide.style.backgroundImage = `url(${slide.dataset.src})`;
            }
        });
        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 6000);
    };

    const populateStaticMarquee = () => {
    marqueeTrack.innerHTML = '';

  
    const shuffled = [...STATIC_POSTERS].sort(() => 0.5 - Math.random());

    const posters = [...shuffled, ...shuffled];

    posters.forEach(url => {
        const img = document.createElement('img');

        img.src = url;
        img.alt = 'Movie Poster';
        img.className = 'marquee-poster';
        img.loading = "lazy";

        img.onerror = () => {
            img.src = "https://via.placeholder.com/300x450?text=🎬";
        };

        marqueeTrack.appendChild(img);
    });

     startInfiniteMarquee();// 🔥 start animation
};











    // --- CHAT & RECOMMENDATION LOGIC ---
    const sendMessage = (text, isFollowUp = false, pageOptions = { page: 1 }) => {
        const query = text.trim();
        if (!query || state.isLoading) return;
        if (!isFollowUp) {
            renderUserMessage(query);
            state.lastQuery = query;
        }
        chatInput.value = '';
        state.currentMessageId++;
        fetchMovies(query, state.currentMessageId, pageOptions);
    };

    const fetchMovies = async (query, messageId, pageOptions) => {
        state.isLoading = true;
        renderBotResponse(`Theek hai, aane do! Best movies dhoond raha hoon aapke liye...`, messageId, true);
        movieGridContainer.innerHTML = '';
        resultsPanelTitle.textContent = `Recommendations for "${query}"`;
        movieGridContainer.classList.remove('empty');

        const token = localStorage.getItem('jwtToken');
        if (!token) return handleLogout();

        try {
            const res = await fetch(`${API_URL}/api/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify({ message: query, page: pageOptions.page, exclude: Array.from(state.displayedMovieIds) }),
            });
            const data = await res.json();

            if (data.success && data.movies && data.movies.length > 0) {
                data.movies.forEach(movie => state.displayedMovieIds.add(movie.id));
                const textListHtml = createMovieListHtml(data.movies);
                const botResponseText = data.responseText || `Here are some recommendations I found for "${query}".`;
                updateBotResponse(messageId, botResponseText + textListHtml);
                renderResultsGrid(data.movies);
                addQuickChips(messageId, query);
            } else {
                updateBotResponse(messageId, `Arre yaar, iske liye to kuch nahi mila. Koi aur type ki movie try karein?`);
                movieGridContainer.innerHTML = `<p style="text-align:center; padding:2rem;">No movies found. Try another search!</p>`;
                movieGridContainer.classList.add('empty');
            }
        } catch (err) {
            console.error("Fetch movies error:", err);
            updateBotResponse(messageId, "Oops! Server mein kuch gadbad hai. Thodi der baad try karo, bhai.");
        } finally {
            state.isLoading = false;
        }
    };

    // --- WATCHLIST & STATE MANAGEMENT (FIXED) ---
    const fetchWatchlist = async () => {
        const token = localStorage.getItem('jwtToken');
        if (!token) return;
        
        try {
            const res = await fetch(`${API_URL}/api/watchlist`, { 
                headers: { 'Authorization': token } 
            });
            const data = await res.json();
            
            if (data.success && Array.isArray(data.watchlist)) {
                // Store as numbers to match backend
                state.watchlist = new Set(data.watchlist);
                updateWatchlistBadge();
                console.log('✅ Watchlist loaded:', state.watchlist.size, 'movies');
            }
        } catch (error) { 
            console.error('❌ Failed to fetch watchlist:', error); 
        }
    };

    const toggleWatchlist = async (button) => {
        const movieId = Number(button.dataset.movieId); // Convert to number
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            alert('Please login to manage your watchlist');
            return;
        }

        const isAdded = state.watchlist.has(movieId);
        const originalText = button.textContent;
        const originalClass = button.className;
        
        // Optimistic UI update
        button.textContent = '⏳ Saving...';
        button.disabled = true;

        try {
            const method = isAdded ? 'DELETE' : 'POST';
            const url = isAdded 
                ? `${API_URL}/api/watchlist/remove/${movieId}` 
                : `${API_URL}/api/watchlist/add`;
            
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': token 
                },
                body: !isAdded ? JSON.stringify({ movieId: movieId }) : null
            });

            const data = await res.json();
            
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Server rejected request');
            }

            // Update state on success
            if (isAdded) {
                state.watchlist.delete(movieId);
                button.textContent = '+ Add to Watchlist';
                button.classList.remove('added');
            } else {
                state.watchlist.add(movieId);
                button.textContent = '✓ Added';
                button.classList.add('added');
            }

            // Sync with server response if provided
            if (data.watchlist) {
                state.watchlist = new Set(data.watchlist);
            }

            // Update ALL other buttons for this movie
            document.querySelectorAll(`.watchlist-btn[data-movie-id="${movieId}"]`).forEach(btn => {
                if (btn !== button) {
                    btn.textContent = button.textContent;
                    btn.classList.toggle('added', !isAdded);
                }
            });

            updateWatchlistBadge();
            console.log(`✅ Movie ${movieId} ${isAdded ? 'removed from' : 'added to'} watchlist`);

        } catch (error) {
            console.error('❌ Watchlist toggle failed:', error);
            // Rollback UI on failure
            button.textContent = originalText;
            button.className = originalClass;
            alert(`Failed to update watchlist: ${error.message}`);
        } finally {
            button.disabled = false;
        }
    };

    const showWatchlist = async () => {
        resultsPanelTitle.textContent = "Your Watchlist";
        movieGridContainer.innerHTML = '<p style="text-align:center; padding:2rem;">🎬 Loading your watchlist...</p>';
        movieGridContainer.classList.remove('empty');
        
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            movieGridContainer.innerHTML = '<p style="text-align:center; padding:2rem;">Please login to view your watchlist</p>';
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/watchlist/details`, { 
                headers: { 'Authorization': token } 
            });
            const data = await res.json();
            
            if (data.success && Array.isArray(data.movies) && data.movies.length > 0) {
                // Sync state with server (store as numbers)
                state.watchlist = new Set(data.movies.map(m => m.id));
                renderResultsGrid(data.movies);
                updateWatchlistBadge();
                console.log(`✅ Watchlist displayed: ${data.movies.length} movies`);
            } else {
                movieGridContainer.innerHTML = `
                    <div style="text-align:center; padding:3rem;">
                        <p style="font-size:1.2rem; margin-bottom:1rem;">📭 Your watchlist is empty</p>
                        <p style="color: var(--secondary-text-color);">Start adding movies you want to watch!</p>
                    </div>
                `;
                movieGridContainer.classList.add('empty');
            }
        } catch (error) {
            console.error("❌ Failed to show watchlist:", error);
            movieGridContainer.innerHTML = `
                <p style="text-align:center; padding:2rem; color:#ff6b6b;">
                    ⚠️ Could not load your watchlist. Please try again.
                </p>
            `;
            movieGridContainer.classList.add('empty');
        }
    };

    const updateWatchlistBadge = () => {
        const badge = document.getElementById('watchlist-count');
        if (badge) {
            badge.textContent = state.watchlist.size;
            badge.style.display = state.watchlist.size > 0 ? 'inline' : 'none';
        }
    };

    // --- RENDERING FUNCTIONS ---
    function renderUserMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'chat-message user-message';
        messageEl.innerHTML = `<div class="message-author">${state.username}</div><div class="message-content">${text}</div>`;
        chatHistory.appendChild(messageEl);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function renderBotResponse(content, messageId = `bot-${Date.now()}`, isThinking = false) {
        const messageEl = document.createElement('div');
        messageEl.className = 'chat-message bot-message';
        messageEl.id = `message-${messageId}`;
        const thinkingIndicator = isThinking ? '<span class="dot-flashing"></span>' : '';
        messageEl.innerHTML = `<div class="message-author">Movie-Bhai 🤖</div><div class="message-content">${content}${thinkingIndicator}</div>`;
        chatHistory.appendChild(messageEl);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        return messageEl;
    }

    function updateBotResponse(messageId, newContent) {
        const messageEl = document.getElementById(`message-${messageId}`);
        if (messageEl) {
            const contentEl = messageEl.querySelector('.message-content');
            contentEl.innerHTML = newContent;
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    }

    function createMovieListHtml(movies) {
        const listItems = movies.slice(0, 5).map(movie => `<li><strong>${movie.title}</strong> (${movie.rating} ⭐)<p>${movie.why || 'Highly recommended based on your taste.'}</p></li>`).join('');
        return `<ul class="movie-list-in-chat">${listItems}</ul><div class="result-actions"><button class="follow-up-btn" data-action="not-interested">Find something else</button></div>`;
    }

    function addQuickChips(messageId, query) {
        const messageEl = document.getElementById(`message-${messageId}`);
        if (!messageEl) return;
        const chips = document.createElement('div');
        chips.className = 'quick-chips';
        const suggestions = [
            { text: "More like this", action: `similar to ${query}` },
            { text: "Higher Rated", action: `highly rated ${query}` },
            { text: "Different Genre", action: `different genre ${query}` }
        ];
        suggestions.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'quick-chip';
            btn.textContent = s.text;
            btn.addEventListener('click', () => sendMessage(s.action));
            chips.appendChild(btn);
        });
        messageEl.appendChild(chips);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function renderResultsGrid(movies) {
        movieGridContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        movies.forEach(movie => {
            const movieId = movie.id; // Already a number from TMDB
            const isAdded = state.watchlist.has(movieId);
            
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.innerHTML = `
               <img src="${movie.poster}" 
     alt="${movie.title}" 
     loading="lazy"
     onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
                <div class="movie-rating">⭐ ${movie.rating}</div>
                <div class="movie-card-overlay">
                    <p style="font-weight:bold; margin-bottom: 8px; font-size: 0.9em;">${movie.title}</p>
                    <button class="overlay-btn trailer-btn" data-movie-id="${movieId}">Watch Trailer</button>
                    <button class="overlay-btn watchlist-btn ${isAdded ? 'added' : ''}" 
                            data-movie-id="${movieId}" 
                            data-movie-title="${movie.title}">
                        ${isAdded ? '✓ Added' : '+ Add to Watchlist'}
                    </button>
                </div>
            `;
            fragment.appendChild(movieCard);
        });
        
        movieGridContainer.appendChild(fragment);
    }

    // --- HOVER PREVIEW LOGIC ---
    function setupHoverPreview() {
        movieGridContainer.addEventListener('mouseenter', handlePreviewHover, true);
        movieGridContainer.addEventListener('mouseleave', handlePreviewHover, true);
    }

    function handlePreviewHover(e) {
        if (state.isChatVisible) return;
        const card = e.target.closest('.movie-card');
        if (!card) return;

        if (e.type === 'mouseenter') {
            const img = card.querySelector('img');
            const title = card.querySelector('.movie-card-overlay p').textContent;
            const rating = card.querySelector('.movie-rating').textContent;
            largePreview.querySelector('img').src = img.src;
            largePreview.querySelector('h3').textContent = title;
            largePreview.querySelector('.preview-meta').textContent = `${rating} • Hover Preview`;
            largePreview.querySelector('.preview-trailer-btn').dataset.movieId = card.querySelector('.trailer-btn').dataset.movieId;
            largePreview.classList.add('visible');
        } else {
            largePreview.classList.remove('visible');
        }
    }

    // --- TRAILER & MODAL ---
    async function showTrailer(movieId) {
        trailerContainer.innerHTML = '';
        trailerModal.style.display = 'flex';
        const token = localStorage.getItem('jwtToken');
        try {
            const res = await fetch(`${API_URL}/api/recommend/trailer/${movieId}`, { headers: { 'Authorization': token } });
            const data = await res.json();
            if (data.success && data.trailerKey) {
                trailerContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${data.trailerKey}?autoplay=1&rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
            } else { trailerContainer.innerHTML = `<p style="text-align:center; padding:2rem;">Sorry, the trailer could not be loaded.</p>`; }
        } catch (err) { trailerContainer.innerHTML = `<p style="text-align:center; padding:2rem;">Sorry, the trailer could not be loaded.</p>`; }
    }





// 🎬 BACKGROUND VIDEO SOUND CONTROL
function initVideoControls() {
    const iframe = document.getElementById("bg-video");
    const btn = document.getElementById("sound-toggle");

    if (!iframe || !btn) return;

    let isMuted = true;

    btn.addEventListener("click", () => {
        isMuted = !isMuted;

        const videoURL = isMuted
            ? "https://www.youtube.com/embed/5PSNL1qE6VY?autoplay=1&mute=1&controls=0&loop=1&playlist=5PSNL1qE6VY"
            : "https://www.youtube.com/embed/5PSNL1qE6VY?autoplay=1&mute=0&controls=0&loop=1&playlist=5PSNL1qE6VY";

        iframe.src = videoURL;

        btn.textContent = isMuted ? "🔇" : "🔊";
    });
}








function startInfiniteMarquee() {
    let speed = 0.5;

    marqueeTrack.scrollLeft = marqueeTrack.scrollWidth / 2;

    function animate() {
        marqueeTrack.scrollLeft += speed;

        // seamless infinite loop
        if (marqueeTrack.scrollLeft >= marqueeTrack.scrollWidth / 2) {
            marqueeTrack.scrollLeft = 0;
        }

        marqueeAnimationId = requestAnimationFrame(animate);
    }

    cancelAnimationFrame(marqueeAnimationId);
    animate();
}















    // --- EVENT BINDING ---
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutButton.addEventListener('click', handleLogout);
    watchlistNavBtn.addEventListener('click', showWatchlist);
    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('login-form-container').classList.add('hidden'); document.getElementById('register-form-container').classList.remove('hidden'); document.getElementById('register-username').focus(); });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('register-form-container').classList.add('hidden'); document.getElementById('login-form-container').classList.remove('hidden'); document.getElementById('login-username').focus(); });
    chatForm.addEventListener('submit', (e) => { e.preventDefault(); sendMessage(chatInput.value); });

    toggleChatBtn.addEventListener('click', () => {
        state.isChatVisible = !state.isChatVisible;
        chatPanel.classList.toggle('collapsed', !state.isChatVisible);
        toggleChatBtn.textContent = state.isChatVisible ? '💬 Hide Chat' : '🎬 Show Chat';
        if (!state.isChatVisible) setupHoverPreview();
    });

    appContainer.addEventListener('click', (e) => {
        const trailerBtn = e.target.closest('.trailer-btn') || e.target.closest('.preview-trailer-btn');
        if (trailerBtn) {
            e.stopPropagation();
            showTrailer(trailerBtn.dataset.movieId);
            return;
        }
        const watchlistBtn = e.target.closest('.watchlist-btn');
        if (watchlistBtn) {
            e.stopPropagation();
            toggleWatchlist(watchlistBtn);
            return;
        }
        const notInterestedBtn = e.target.closest('.follow-up-btn[data-action="not-interested"]');
        if (notInterestedBtn) {
            e.stopPropagation();
            const randomPage = Math.floor(Math.random() * 9) + 2;
            sendMessage(state.lastQuery, true, { page: randomPage });
            return;
        }
        const quickChip = e.target.closest('.quick-chip');
        if (quickChip) {
            e.stopPropagation();
            quickChip.click();
        }
    });





// ADMIN DASHBOARD
const adminDashboard = document.getElementById('admin-dashboard');
const closeAdminBtn = document.getElementById('close-admin-btn');

async function openAdminPanel() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return alert('Login first');

    try {
        const res = await fetch(`${API_URL}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }  // ← ADD "Bearer "
        });
        const json = await res.json();

        if (json.success) {
            document.getElementById('total-users').textContent = json.stats.totalUsers;
            document.getElementById('active-today').textContent = json.stats.activeToday;
            document.getElementById('new-week').textContent = json.stats.newThisWeek;

            const list = document.getElementById('top-users-list');
            list.innerHTML = json.stats.topWatchlists.map(u => `
                <div style="padding:12px; background:rgba(255,255,255,0.03); margin:8px 0; border-radius:12px; display:flex; justify-content:space-between;">
                    <span>👑 ${u.username}</span>
                    <span style="color:#a855f7; font-weight:bold;">${u.movies} movies</span>
                </div>
            `).join('');

            adminDashboard.classList.remove('hidden');
        } else {
            alert('Only admin can access this');
        }
    } catch (err) {
        alert('Failed to load admin panel');
    }
}
closeAdminBtn.addEventListener('click', () => adminDashboard.classList.add('hidden'));

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        openAdminPanel();
    }
});



function showAppUI() {
    introContainer.classList.remove('hidden');
    introVideo.currentTime = 0;

    const playPromise = introVideo.play();

    if (playPromise !== undefined) {
        playPromise.catch(() => {
            startApp();
        });
    }

    introVideo.onended = () => {
        startApp();
    };

    skipIntroBtn.onclick = () => {
        introVideo.pause();
        introContainer.classList.add('hidden');
        startApp();
    };
}
















    closeModalButton.addEventListener('click', () => { trailerModal.style.display = 'none'; trailerContainer.innerHTML = ''; });
    trailerModal.addEventListener('click', (e) => { if (e.target === trailerModal) { trailerModal.style.display = 'none'; trailerContainer.innerHTML = ''; } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { trailerModal.style.display = 'none'; trailerContainer.innerHTML = ''; } });

    // --- INITIALIZE ---
    initializeApp();

    function showAuthUI() { authContainer.classList.remove('hidden'); appContainer.classList.add('hidden'); }
  };
}

// original logic moved here
function startApp() {
    introContainer.classList.add('hidden');

    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');

    initializeMainApp();
}
});
