document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT REFERENCES ---
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const logoutButton = document.getElementById('logout-button');
    const watchlistNavBtn = document.getElementById('watchlist-nav-btn');
    const movieGridContainer = document.getElementById('movie-grid-container');
    const resultsPanelTitle = document.getElementById('results-panel-title');
    const chatHistory = document.getElementById('chat-history');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const trailerModal = document.getElementById('trailer-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const trailerContainer = document.getElementById('trailer-container');
    
    // --- APPLICATION STATE ---
    let state = {
        isLoading: false, username: 'Guest', watchlist: new Set(),
        displayedMovieIds: new Set(), currentMessageId: 0, lastQuery: ''
    };
    const API_URL = 'http://localhost:5000';
    let marqueeAnimationId = null;

    // --- AUTH & INITIALIZATION ---
    const handleLogin = async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
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
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
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
            startAuthSlideshow();
            showAuthUI();
        }
    }
    
    function initializeMainApp() {
        fetchWatchlist();
        fetchInitialMoviesForMarquee();
        renderBotResponse(`Salaam ${state.username} bhai! Main hoon Movie-Bhai, aapka personal film expert. Boliye, aaj kya dekhne ka mood hai? 😎`);
    }

    // --- UI & ANIMATION ---
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
        }, 5000);
    };

    const startInfiniteMarquee = () => {
        const track = document.getElementById('poster-marquee-track');
        if (!track || track.children.length === 0) return;
        if (marqueeAnimationId) cancelAnimationFrame(marqueeAnimationId);
        let position = 0;
        const speed = 0.5;
        const animate = () => {
            position -= speed;
            track.style.transform = `translateX(${position}px)`;
            const firstChild = track.children[0];
            const itemWidth = firstChild.offsetWidth + 16;
            if (position <= -itemWidth) {
                position += itemWidth;
                track.appendChild(firstChild);
            }
            marqueeAnimationId = requestAnimationFrame(animate);
        };
        animate();
    };

    const populatePosterMarquee = (movies) => {
        const track = document.getElementById('poster-marquee-track');
        if (!track) return;
        track.innerHTML = '';
        const neededPosters = Math.ceil(window.innerWidth / (40 * 2/3)) + 30;
        const posters = [...movies, ...movies, ...movies, ...movies].slice(0, neededPosters);
        const fragment = document.createDocumentFragment();
        posters.forEach(movie => {
            const img = document.createElement('img');
            img.src = movie.poster.replace('/w500/', '/w200/');
            fragment.appendChild(img);
        });
        track.appendChild(fragment);
        startInfiniteMarquee();
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

    const fetchInitialMoviesForMarquee = async () => {
        const token = localStorage.getItem('jwtToken');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify({ message: 'latest popular movies', page: 1 }),
            });
            const data = await res.json();
            if (data.success && data.movies) populatePosterMarquee(data.movies);
        } catch (error) { console.error("Marquee fetch failed:", error); }
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
            } else {
                updateBotResponse(messageId, `Arre yaar, iske liye to kuch nahi mila. Koi aur type ki movie try karein?`);
                movieGridContainer.innerHTML = `<p>No movies found. Try another search!</p>`;
                movieGridContainer.classList.add('empty');
            }
        } catch (err) {
            console.error("Fetch movies error:", err);
            updateBotResponse(messageId, "Oops! Server mein kuch gadbad hai. Thodi der baad try karo, bhai.");
        } finally {
            state.isLoading = false;
        }
    };

    const showWatchlist = async () => {
        resultsPanelTitle.textContent = "Your Watchlist";
        movieGridContainer.innerHTML = '';
        movieGridContainer.classList.remove('empty');
        const token = localStorage.getItem('jwtToken');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/watchlist/details`, { headers: { 'Authorization': token } });
            const data = await res.json();
            if (data.success && data.movies.length > 0) {
                renderResultsGrid(data.movies);
            } else {
                movieGridContainer.innerHTML = `<p>Your watchlist is empty. Add some movies!</p>`;
                movieGridContainer.classList.add('empty');
            }
        } catch (error) {
            console.error("Failed to show watchlist:", error);
            movieGridContainer.innerHTML = `<p>Could not load your watchlist.</p>`;
            movieGridContainer.classList.add('empty');
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
        messageEl.innerHTML = `<div class="message-author">Movie-Bhai</div><div class="message-content">${content}${thinkingIndicator}</div>`;
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
        const listItems = movies.slice(0, 5).map(movie => `<li><strong>${movie.title}</strong> (${movie.rating} ⭐)<p>${movie.why}</p></li>`).join('');
        return `<ul class="movie-list-in-chat">${listItems}</ul><div class="result-actions"><button class="follow-up-btn" data-action="not-interested">Find something else</button></div>`;
    }

    function renderResultsGrid(movies) {
        movieGridContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();
        movies.forEach(movie => {
            const isAdded = state.watchlist.has(movie.id);
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.innerHTML = `
                <img src="${movie.poster}" alt="${movie.title}">
                <div class="movie-rating">⭐ ${movie.rating}</div>
                <div class="movie-card-overlay">
                    <p style="font-weight:bold; margin-bottom: 8px; font-size: 0.9em;">${movie.title}</p>
                    <button class="overlay-btn trailer-btn" data-movie-id="${movie.id}">Watch Trailer</button>
                    <button class="overlay-btn watchlist-btn ${isAdded ? 'added' : ''}" 
                            data-movie-id="${movie.id}" data-movie-title="${movie.title}">
                        ${isAdded ? '✓ Added' : '+ Add to Watchlist'}
                    </button>
                </div>
            `;
            fragment.appendChild(movieCard);
        });
        movieGridContainer.appendChild(fragment);
    }
    
    // --- WATCHLIST & OTHER HELPERS ---
    const fetchWatchlist = async () => {
        const token = localStorage.getItem('jwtToken');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/api/watchlist`, { headers: { 'Authorization': token } });
            const data = await res.json();
            if (data.success) {
                state.watchlist = new Set(data.watchlist);
            }
        } catch (error) { console.error('Failed to fetch watchlist', error); }
    };

    const toggleWatchlist = async (button) => {
        const movieId = parseInt(button.dataset.movieId);
        const token = localStorage.getItem('jwtToken');
        if (!token) return;
        const isAdded = state.watchlist.has(movieId);
        const method = isAdded ? 'DELETE' : 'POST';
        const url = isAdded ? `${API_URL}/api/watchlist/remove/${movieId}` : `${API_URL}/api/watchlist/add`;
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: isAdded ? null : JSON.stringify({ movieId })
            });
            if (res.ok) {
                if (isAdded) {
                    state.watchlist.delete(movieId);
                    button.textContent = '+ Add to Watchlist';
                    button.classList.remove('added');
                } else {
                    state.watchlist.add(movieId);
                    button.textContent = '✓ Added';
                    button.classList.add('added');
                }
            }
        } catch (error) { console.error('Watchlist toggle failed', error); }
    };
    
    async function showTrailer(movieId) {
        trailerContainer.innerHTML = '';
        trailerModal.style.display = 'flex';
        const token = localStorage.getItem('jwtToken');
        try {
            const res = await fetch(`${API_URL}/api/recommend/trailer/${movieId}`, { headers: { 'Authorization': token } });
            const data = await res.json();
            if (data.success && data.trailerKey) {
                trailerContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${data.trailerKey}?autoplay=1&rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
            } else { trailerContainer.innerHTML = `<p>Sorry, the trailer could not be loaded.</p>`; }
        } catch (err) { trailerContainer.innerHTML = `<p>Sorry, the trailer could not be loaded.</p>`; }
    }

    // --- EVENT BINDING ---
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutButton.addEventListener('click', handleLogout);
    watchlistNavBtn.addEventListener('click', showWatchlist);
    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('login-form-container').classList.add('hidden'); document.getElementById('register-form-container').classList.remove('hidden'); });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('register-form-container').classList.add('hidden'); document.getElementById('login-form-container').classList.remove('hidden'); });
    chatForm.addEventListener('submit', (e) => { e.preventDefault(); sendMessage(chatInput.value); });
    
    appContainer.addEventListener('click', (e) => {
        const trailerBtn = e.target.closest('.trailer-btn');
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
    });
    
    closeModalButton.addEventListener('click', () => { trailerModal.style.display = 'none'; trailerContainer.innerHTML = ''; });
    
    // --- INITIALIZE ---
    initializeApp();
    
    function showAuthUI() { authContainer.classList.remove('hidden'); appContainer.classList.add('hidden'); }
    function showAppUI() { authContainer.classList.add('hidden'); appContainer.classList.remove('hidden'); initializeMainApp(); }
});