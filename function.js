// Menunggu hingga seluruh konten halaman HTML dimuat
document.addEventListener('DOMContentLoaded', () => {

    // === BAGIAN ELEMEN DOM ===
    // Mengambil semua elemen dari HTML yang akan kita manipulasi
    const app = document.getElementById('app');
    const mainNav = document.getElementById('main-nav');

    // Views (Halaman)
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const feedView = document.getElementById('feed-view');
    const profileView = document.getElementById('profile-view');

    // Forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Tombol Navigasi
    const navHomeBtn = document.getElementById('nav-home');
    const navProfileBtn = document.getElementById('nav-profile');
    const navLogoutBtn = document.getElementById('nav-logout');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    // Konten Feed
    const postContentInput = document.getElementById('post-content');
    const submitPostBtn = document.getElementById('submit-post');
    const feedContainer = document.getElementById('feed-container');

    // Konten Profil
    const profileUsername = document.getElementById('profile-username');
    const profileStats = document.getElementById('profile-stats');
    const followUnfollowBtn = document.getElementById('follow-unfollow-btn');
    const backToFeedBtn = document.getElementById('back-to-feed-btn');
    const profilePostsContainer = document.getElementById('profile-posts-container');

    // === BAGIAN MANAJEMEN DATA (Menggunakan Local Storage) ===
    // Fungsi untuk mendapatkan data dari Local Storage
    const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];
    // Fungsi untuk menyimpan data ke Local Storage
    const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // Variabel untuk menyimpan state aplikasi
    let state = {
        users: getData('users'),
        posts: getData('posts'),
        follows: getData('follows'),
        loggedInUserId: JSON.parse(localStorage.getItem('loggedInUserId')) || null,
    };

    // === FUNGSI INSIALISASI APLIKASI ===
    const initApp = () => {
        // Membuat akun 'Lana' jika belum ada
        createLanaAccountIfNeeded();
        // Memperbarui state dari local storage untuk memastikan data sinkron
        state.users = getData('users');
        state.follows = getData('follows');
        
        // Memeriksa apakah ada pengguna yang sedang login
        if (state.loggedInUserId) {
            showView('feed');
        } else {
            showView('login');
        }
    };
    
    // Fungsi untuk membuat akun Lana dan follower botnya (HANYA SEKALI)
    const createLanaAccountIfNeeded = () => {
        const lanaExists = getData('users').some(user => user.email === 'lana@socmed.com');
        if (!lanaExists) {
            console.log("Membuat akun Lana dan follower bot untuk pertama kali...");
            let users = [];
            let follows = [];
            let nextUserId = 1;

            // Membuat akun Lana
            const lana = {
                id: nextUserId++,
                username: 'Lana',
                email: 'lana@socmed.com',
                password: '123456', // Di aplikasi nyata, password harus di-hash!
                verified: true
            };
            users.push(lana);

            // Membuat beberapa bot follower (simulasi)
            for (let i = 1; i <= 20; i++) {
                const bot = {
                    id: nextUserId++,
                    username: `Bot Pengikut ${i}`,
                    email: `bot${i}@socmed.com`,
                    password: 'botpassword',
                    verified: true
                };
                users.push(bot);
                // Membuat data 'follow': bot mengikuti Lana
                follows.push({ followerId: bot.id, followingId: lana.id });
            }
            
            setData('users', users);
            setData('follows', follows);
            console.log("Akun Lana dan bot berhasil dibuat.");
        }
    };

    // === BAGIAN MANAJEMEN TAMPILAN (VIEW) ===
    const showView = (viewId) => {
        // Sembunyikan semua view terlebih dahulu
        [loginView, registerView, feedView, profileView].forEach(v => v.classList.add('hidden'));
        
        // Tampilkan view yang diminta
        const viewToShow = document.getElementById(`${viewId}-view`);
        if (viewToShow) {
            viewToShow.classList.remove('hidden');
        }

        // Tampilkan atau sembunyikan navigasi utama
        if (state.loggedInUserId) {
            mainNav.classList.remove('hidden');
            // Reset gaya tombol navigasi
            navHomeBtn.classList.remove('text-blue-600', 'font-semibold');
            navProfileBtn.classList.remove('text-blue-600', 'font-semibold');
            
            // Atur gaya tombol aktif
            if (viewId === 'feed') {
                 navHomeBtn.classList.add('text-blue-600', 'font-semibold');
            } else if (viewId === 'profile' && document.getElementById('profile-view').dataset.userId == state.loggedInUserId) {
                 navProfileBtn.classList.add('text-blue-600', 'font-semibold');
            }

        } else {
            mainNav.classList.add('hidden');
        }

        // Render konten yang sesuai untuk view
        if (viewId === 'feed') renderFeed();
    };

    // === BAGIAN AUTENTIKASI ===
    const handleRegister = (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (state.users.some(u => u.email === email)) {
            alert('Email sudah terdaftar. Silakan gunakan email lain.');
            return;
        }

        const newUser = {
            id: Date.now(), // ID unik berdasarkan waktu
            username,
            email,
            password, // Ingat, ini tidak aman!
            verified: false
        };

        state.users.push(newUser);
        setData('users', state.users);
        
        // Otomatis login setelah daftar
        state.loggedInUserId = newUser.id;
        localStorage.setItem('loggedInUserId', JSON.stringify(newUser.id));

        alert('Pendaftaran berhasil! Anda sekarang login.');
        registerForm.reset();
        showView('feed');
    };

    const handleLogin = (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const user = state.users.find(u => u.email === email && u.password === password);

        if (user) {
            state.loggedInUserId = user.id;
            localStorage.setItem('loggedInUserId', JSON.stringify(user.id));
            loginForm.reset();
            showView('feed');
        } else {
            alert('Email atau password salah.');
        }
    };

    const handleLogout = () => {
        state.loggedInUserId = null;
        localStorage.removeItem('loggedInUserId');
        showView('login');
    };

    // === BAGIAN RENDER KONTEN DINAMIS ===
    // Fungsi untuk membuat elemen HTML dari sebuah postingan
    const createPostElement = (post) => {
        const author = state.users.find(u => u.id === post.userId);
        if (!author) return ''; // Jika penulis tidak ditemukan

        const postDiv = document.createElement('div');
        postDiv.className = 'bg-white p-4 rounded-lg shadow-md mb-4';
        
        const verifiedBadge = author.verified ? `<span class="verified-badge" title="Akun Terverifikasi">✔️</span>` : '';

        postDiv.innerHTML = `
            <div class="flex items-center mb-2">
                <img src="https://placehold.co/40x40/E2E8F0/4A5568?text=${author.username.charAt(0)}" class="w-10 h-10 rounded-full mr-3" alt="Avatar">
                <div>
                    <a href="#" class="font-bold hover:underline user-link" data-user-id="${author.id}">${author.username}</a>${verifiedBadge}
                    <p class="text-sm text-gray-500">${new Date(post.timestamp).toLocaleString('id-ID')}</p>
                </div>
            </div>
            <p class="mb-3">${post.content}</p>
            <div>
                <button class="text-blue-500 hover:underline comment-btn" data-post-id="${post.id}">Komentar</button>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-200 comment-section hidden" id="comments-for-${post.id}">
                <h4 class="font-semibold text-sm mb-2">Komentar Anonim:</h4>
                <div class="comment-list">
                    ${post.comments.map(c => `<p class="text-sm bg-gray-100 p-2 rounded mb-1">${c.content}</p>`).join('')}
                </div>
                <div class="mt-2">
                    <input type="text" class="w-full text-sm p-1 border rounded comment-input" placeholder="Tulis komentar anonim...">
                    <button class="text-sm bg-gray-200 px-2 py-1 rounded mt-1 hover:bg-gray-300 submit-comment-btn" data-post-id="${post.id}">Kirim</button>
                </div>
            </div>
        `;
        return postDiv;
    };

    const renderFeed = () => {
        feedContainer.innerHTML = ''; // Kosongkan feed
        const sortedPosts = [...state.posts].sort((a, b) => b.timestamp - a.timestamp);
        sortedPosts.forEach(post => {
            const postElement = createPostElement(post);
            if(postElement) feedContainer.appendChild(postElement);
        });
    };

    const renderProfile = (userId) => {
        const user = state.users.find(u => u.id === userId);
        if (!user) {
            alert('Pengguna tidak ditemukan.');
            showView('feed');
            return;
        }

        profileView.dataset.userId = userId; // Simpan ID user di elemen view

        // Update nama dan badge verifikasi
        const verifiedBadge = user.verified ? `<span class="verified-badge" title="Akun Terverifikasi">✔️</span>` : '';
        profileUsername.innerHTML = `${user.username}${verifiedBadge}`;
        
        // Hitung followers dan following
        const followers = state.follows.filter(f => f.followingId === userId);
        const following = state.follows.filter(f => f.followerId === userId);

        // **SIMULASI UNTUK LANA**
        const followerCount = user.email === 'lana@socmed.com' ? '9.038.024' : followers.length;

        profileStats.innerHTML = `
            <span><strong>${state.posts.filter(p => p.userId === userId).length}</strong> Postingan</span>
            <span><strong>${followerCount}</strong> Pengikut</span>
            <span><strong>${following.length}</strong> Mengikuti</span>
        `;
        
        // Logika tombol Follow/Unfollow/Edit
        if (userId === state.loggedInUserId) {
            followUnfollowBtn.classList.add('hidden');
        } else {
            followUnfollowBtn.classList.remove('hidden');
            const isFollowing = state.follows.some(f => f.followerId === state.loggedInUserId && f.followingId === userId);
            if (isFollowing) {
                followUnfollowBtn.textContent = 'Unfollow';
                followUnfollowBtn.className = 'w-full p-2 rounded text-white bg-red-500 hover:bg-red-600';
                followUnfollowBtn.dataset.action = 'unfollow';
            } else {
                followUnfollowBtn.textContent = 'Follow';
                followUnfollowBtn.className = 'w-full p-2 rounded text-white bg-blue-500 hover:bg-blue-600';
                followUnfollowBtn.dataset.action = 'follow';
            }
            followUnfollowBtn.dataset.userId = userId;
        }

        // Render postingan pengguna
        profilePostsContainer.innerHTML = '';
        const userPosts = [...state.posts].filter(p => p.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
        userPosts.forEach(post => {
            const postElement = createPostElement(post);
            if(postElement) profilePostsContainer.appendChild(postElement);
        });

        showView('profile');
    };

    // === BAGIAN AKSI PENGGUNA ===
    const handleCreatePost = () => {
        const content = postContentInput.value.trim();
        if (!content) {
            alert('Postingan tidak boleh kosong.');
            return;
        }

        const newPost = {
            id: Date.now(),
            userId: state.loggedInUserId,
            content,
            timestamp: Date.now(),
            comments: []
        };

        state.posts.push(newPost);
        setData('posts', state.posts);
        postContentInput.value = '';
        renderFeed();
    };
    
    const handleFollowUnfollow = (targetUserId) => {
        const isFollowing = state.follows.some(f => f.followerId === state.loggedInUserId && f.followingId === targetUserId);
        
        if (isFollowing) {
            // Unfollow
            state.follows = state.follows.filter(f => !(f.followerId === state.loggedInUserId && f.followingId === targetUserId));
        } else {
            // Follow
            state.follows.push({ followerId: state.loggedInUserId, followingId: targetUserId });
        }
        
        setData('follows', state.follows);
        renderProfile(targetUserId); // Render ulang profil untuk update tombol dan statistik
    };

    const handleComment = (postId, commentContent) => {
        if (!commentContent.trim()) return;

        const post = state.posts.find(p => p.id === postId);
        if (post) {
            post.comments.push({ id: Date.now(), content: commentContent });
            setData('posts', state.posts);
            
            // Render ulang view yang sedang aktif
            if (!feedView.classList.contains('hidden')) {
                renderFeed();
            } else if (!profileView.classList.contains('hidden')) {
                renderProfile(parseInt(profileView.dataset.userId));
            }
        }
    };

    // === EVENT LISTENERS ===
    // Listener untuk form
    registerForm.addEventListener('submit', handleRegister);
    loginForm.addEventListener('submit', handleLogin);
    
    // Listener untuk link navigasi
    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showView('register'); });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); showView('login'); });
    navLogoutBtn.addEventListener('click', handleLogout);
    navHomeBtn.addEventListener('click', () => showView('feed'));
    navProfileBtn.addEventListener('click', () => renderProfile(state.loggedInUserId));
    backToFeedBtn.addEventListener('click', () => showView('feed'));

    // Listener untuk aksi
    submitPostBtn.addEventListener('click', handleCreatePost);
    followUnfollowBtn.addEventListener('click', (e) => {
        const userIdToFollow = parseInt(e.target.dataset.userId);
        handleFollowUnfollow(userIdToFollow);
    });

    // Event Delegation untuk elemen dinamis (postingan, komentar, dll)
    app.addEventListener('click', (e) => {
        // Klik link nama pengguna
        if (e.target.matches('.user-link')) {
            e.preventDefault();
            const userId = parseInt(e.target.dataset.userId);
            renderProfile(userId);
        }

        // Klik tombol komentar
        if (e.target.matches('.comment-btn')) {
            const postId = e.target.dataset.postId;
            const commentSection = document.getElementById(`comments-for-${postId}`);
            commentSection.classList.toggle('hidden');
        }

        // Klik tombol kirim komentar
        if (e.target.matches('.submit-comment-btn')) {
            const postId = parseInt(e.target.dataset.postId);
            const input = e.target.previousElementSibling;
            handleComment(postId, input.value);
            input.value = '';
        }
    });

    // Jalankan aplikasi
    initApp();
});
