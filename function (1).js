document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen UI Global ---
    const authPage = document.getElementById('auth-page');
    const chatPage = document.getElementById('chat-page');
    const loginFormContainer = document.getElementById('login-form-container');
    const registerFormContainer = document.getElementById('register-form-container');

    // --- Database Lokal (LocalStorage) ---
    const db = {
        getUsers: () => JSON.parse(localStorage.getItem('chat_users')) || [],
        saveUsers: (users) => localStorage.setItem('chat_users', JSON.stringify(users)),
        getCurrentUser: () => JSON.parse(localStorage.getItem('chat_current_user')),
        setCurrentUser: (userId) => localStorage.setItem('chat_current_user', JSON.stringify(userId)),
        logoutUser: () => localStorage.removeItem('chat_current_user'),
    };

    // --- State Aplikasi ---
    let currentUser = null;
    let currentChatFriendId = null;

    // =================================================================
    // INISIALISASI APLIKASI
    // =================================================================
    function init() {
        setupEventListeners();
        const loggedInUserId = db.getCurrentUser();
        if (loggedInUserId) {
            const users = db.getUsers();
            currentUser = users.find(u => u.id === loggedInUserId);
            if (currentUser) {
                showChatPage();
            } else {
                // Jika user tidak ditemukan (data korup), logout
                db.logoutUser();
                showAuthPage();
            }
        } else {
            showAuthPage();
        }
    }

    function setupEventListeners() {
        // Navigasi Auth
        document.getElementById('show-register').addEventListener('click', (e) => { e.preventDefault(); showRegisterForm(); });
        document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });

        // Form Handler
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        document.getElementById('register-form').addEventListener('submit', handleRegister);
        document.getElementById('add-friend-form').addEventListener('submit', handleAddFriend);
        document.getElementById('message-form').addEventListener('submit', handleSendMessage);
        document.getElementById('profile-update-form').addEventListener('submit', handleProfileUpdate);

        // Tombol
        document.getElementById('logout-button').addEventListener('click', handleLogout);
        document.getElementById('profile-button').addEventListener('click', showProfileModal);
        document.getElementById('cancel-profile-update').addEventListener('click', hideProfileModal);
        
        // Listener untuk update realtime antar tab (simulasi)
        window.addEventListener('storage', (e) => {
            if (e.key === 'chat_users' && currentUser) {
                const users = db.getUsers();
                currentUser = users.find(u => u.id === currentUser.id);
                renderFriendsList();
                if (currentChatFriendId) {
                    renderChatMessages(currentChatFriendId);
                }
            }
        });
    }

    // =================================================================
    // MANAJEMEN TAMPILAN (UI)
    // =================================================================
    function showAuthPage() {
        authPage.classList.remove('hidden');
        chatPage.classList.add('hidden');
        showLoginForm();
    }

    function showChatPage() {
        authPage.classList.add('hidden');
        chatPage.classList.remove('hidden');
        loadChatUI();
    }

    function showLoginForm() {
        loginFormContainer.classList.remove('hidden');
        registerFormContainer.classList.add('hidden');
    }
    
    function showRegisterForm() {
        loginFormContainer.classList.add('hidden');
        registerFormContainer.classList.remove('hidden');
    }

    function loadChatUI() {
        if (!currentUser) return;
        document.getElementById('user-profile-name').textContent = currentUser.name;
        document.getElementById('user-profile-id').textContent = `ID: ${currentUser.id}`;
        document.getElementById('user-profile-pic').src = currentUser.profilePic || 'https://placehold.co/40x40/E2E8F0/4A5568?text=U';
        renderFriendsList();
    }

    function renderFriendsList() {
        const friendsListEl = document.getElementById('friends-list');
        friendsListEl.innerHTML = '';
        const users = db.getUsers();
        
        if (currentUser.friends.length === 0) {
            friendsListEl.innerHTML = `<p class="text-center text-sm text-gray-500 p-4">Belum ada teman. Cari teman menggunakan ID mereka.</p>`;
            return;
        }

        currentUser.friends.forEach(friendId => {
            const friend = users.find(u => u.id === friendId);
            if (friend) {
                const friendEl = document.createElement('div');
                friendEl.className = 'flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700';
                friendEl.dataset.friendId = friend.id;
                friendEl.innerHTML = `
                    <img src="${friend.profilePic || 'https://placehold.co/40x40/E2E8F0/4A5568?text=F'}" class="w-10 h-10 rounded-full object-cover">
                    <div class="flex-grow">
                        <p class="font-semibold">${friend.name}</p>
                    </div>
                `;
                friendEl.addEventListener('click', () => openChat(friend.id));
                friendsListEl.appendChild(friendEl);
            }
        });
    }

    function openChat(friendId) {
        currentChatFriendId = friendId;
        const users = db.getUsers();
        const friend = users.find(u => u.id === friendId);

        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('chat-area').classList.remove('hidden');

        document.getElementById('chat-friend-name').textContent = friend.name;
        document.getElementById('chat-friend-pic').src = friend.profilePic || 'https://placehold.co/40x40/E2E8F0/4A5568?text=F';
        
        renderChatMessages(friendId);
    }

    function renderChatMessages(friendId) {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = '';
        
        const chatKey = [currentUser.id, friendId].sort().join('_');
        const messages = currentUser.chats[chatKey] || [];

        if (messages.length === 0) {
            messagesContainer.innerHTML = `<p class="text-center text-sm text-gray-500">Mulai percakapanmu!</p>`;
            return;
        }

        messages.forEach(msg => {
            const isMe = msg.from === currentUser.id;
            const msgEl = document.createElement('div');
            msgEl.className = `flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`;
            msgEl.innerHTML = `
                <div class="max-w-xs md:max-w-md p-3 rounded-2xl ${isMe ? 'bg-indigo-600 text-white rounded-br-lg' : 'bg-white dark:bg-gray-700 rounded-bl-lg'}">
                    <p>${msg.msg}</p>
                </div>
            `;
            messagesContainer.appendChild(msgEl);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function showProfileModal() {
        document.getElementById('profile-name-input').value = currentUser.name;
        document.getElementById('profile-preview-pic').src = currentUser.profilePic || 'https://placehold.co/40x40/E2E8F0/4A5568?text=U';
        document.getElementById('profile-modal').classList.remove('hidden');
    }

    function hideProfileModal() {
        document.getElementById('profile-modal').classList.add('hidden');
    }

    // =================================================================
    // HANDLER FUNGSI INTI
    // =================================================================
    function handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;

        if (!email.endsWith('@gmail.com')) {
            alert('Email harus menggunakan @gmail.com');
            return;
        }
        
        const users = db.getUsers();
        if (users.some(u => u.email === email)) {
            alert('Email sudah terdaftar.');
            return;
        }

        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        const newUser = {
            id: newId,
            email: email,
            password: password, // Di aplikasi nyata, ini harus di-hash!
            name: name,
            profilePic: '',
            friends: [],
            chats: {}
        };

        users.push(newUser);
        db.saveUsers(users);
        alert('Registrasi berhasil! Silakan login.');
        showLoginForm();
    }

    function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        const users = db.getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            currentUser = user;
            db.setCurrentUser(user.id);
            showChatPage();
        } else {
            alert('Email atau password salah.');
        }
    }

    function handleLogout() {
        currentUser = null;
        currentChatFriendId = null;
        db.logoutUser();
        showAuthPage();
    }

    function handleAddFriend(e) {
        e.preventDefault();
        const friendIdInput = document.getElementById('friend-id-input');
        const friendId = parseInt(friendIdInput.value);
        friendIdInput.value = '';

        if (isNaN(friendId) || friendId === currentUser.id) {
            alert('ID tidak valid.');
            return;
        }

        if (currentUser.friends.includes(friendId)) {
            alert('Pengguna ini sudah menjadi teman Anda.');
            return;
        }
        
        const users = db.getUsers();
        const friend = users.find(u => u.id === friendId);

        if (friend) {
            // Tambahkan ke daftar teman masing-masing
            currentUser.friends.push(friendId);
            friend.friends.push(currentUser.id);
            
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            const friendIndex = users.findIndex(u => u.id === friendId);
            users[userIndex] = currentUser;
            users[friendIndex] = friend;
            
            db.saveUsers(users);
            renderFriendsList();
            alert(`${friend.name} berhasil ditambahkan sebagai teman!`);
        } else {
            alert('Pengguna dengan ID tersebut tidak ditemukan.');
        }
    }

    function handleSendMessage(e) {
        e.preventDefault();
        const msgInput = document.getElementById('message-input');
        const msgText = msgInput.value.trim();
        if (!msgText || !currentChatFriendId) return;
        msgInput.value = '';

        const newMessage = {
            from: currentUser.id,
            to: currentChatFriendId,
            msg: msgText,
            timestamp: new Date().toISOString()
        };

        const users = db.getUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        const friendIndex = users.findIndex(u => u.id === currentChatFriendId);

        const chatKey = [currentUser.id, currentChatFriendId].sort().join('_');

        // Tambahkan pesan ke chat history kedua user
        if (!users[userIndex].chats[chatKey]) users[userIndex].chats[chatKey] = [];
        users[userIndex].chats[chatKey].push(newMessage);
        
        if (!users[friendIndex].chats[chatKey]) users[friendIndex].chats[chatKey] = [];
        users[friendIndex].chats[chatKey].push(newMessage);
        
        currentUser = users[userIndex]; // Update state lokal
        db.saveUsers(users);
        renderChatMessages(currentChatFriendId);
    }

    function handleProfileUpdate(e) {
        e.preventDefault();
        const newName = document.getElementById('profile-name-input').value.trim();
        const newPicFile = document.getElementById('profile-pic-input').files[0];

        const users = db.getUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);

        if (newName) {
            users[userIndex].name = newName;
        }

        if (newPicFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                users[userIndex].profilePic = e.target.result;
                currentUser = users[userIndex];
                db.saveUsers(users);
                loadChatUI(); // Update UI setelah gambar dimuat
                hideProfileModal();
            };
            reader.readAsDataURL(newPicFile);
        } else {
            currentUser = users[userIndex];
            db.saveUsers(users);
            loadChatUI();
            hideProfileModal();
        }
    }

    // --- Jalankan Aplikasi ---
    init();
});
