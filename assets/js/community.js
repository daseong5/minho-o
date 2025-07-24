// Firebase SDK 모듈 import
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, where, serverTimestamp, deleteDoc, doc, updateDoc, setDoc, getDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyA04E0cGQUp_v535tWu2lQpeQtrfiqZNZ8",
    authDomain: "pride-2p-lab.firebaseapp.com",
    projectId: "pride-2p-lab",
    storageBucket: "pride-2p-lab.firebasestorage.app",
    messagingSenderId: "171004212332",
    appId: "1:171004212332:web:bbda218dc9539ba8925449",
    measurementId: "G-PBJR562V7V"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 관리자 이메일 목록 (실제 환경에서는 데이터베이스에서 관리)
const ADMIN_EMAILS = [
    'minnho614@gmail.com',  // 현재 로그인한 계정
    'admin@pride-2p-lab.com',
    'rlatjdgh159@gmail.com'
];

let currentUser = null;
let isAdmin = false;
let isAdminMode = false;
let posts = [];
let users = [];
let bannedUsers = new Set();
let currentCategory = "자유 게시판";
let searchQuery = "";
let uploadedImages = [];
let currentPostId = null;
let currentTags = [];
let allTags = new Set();
let selectedTagFilter = null;
let dailyPostCount = 0;
let dailyCommentCount = 0;

// DOM 요소들
const loginModal = document.getElementById('loginModal');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName'); // admin 페이지에서만 사용
const userAvatar = document.getElementById('userAvatar');
const googleLoginBtn = document.querySelector('.login-btn');
const logoutBtn = document.querySelector('.logout-btn');
const writeBtn = document.getElementById('writeBtn');
const writeModal = document.getElementById('writeModal');
const closeWriteBtn = document.querySelector('.close-btn');
const postForm = document.getElementById('writeForm');
const categorySelect = document.getElementById('writeCategory');
const postTitle = document.getElementById('writeTitle');
const postContent = document.getElementById('contentEditor');
const submitBtn = document.querySelector('.submit-btn');
const searchInput = document.getElementById('searchInput');
const noResults = document.getElementById('noResults');
const loading = document.getElementById('loading');
const postsList = document.getElementById('postsList');
const adminToggle = document.getElementById('adminToggle');
const adminBadge = document.getElementById('adminBadge');
const adminDashboardBtn = document.getElementById('adminDashboardBtn');
const adminDashboard = document.getElementById('adminDashboard');
const closeDashboard = document.getElementById('closeDashboard');
const dashboardContent = document.getElementById('dashboardContent');
const totalUsers = document.getElementById('totalUsers');
const totalPosts = document.getElementById('totalPosts');
const container = document.querySelector('.container');

// 새로운 DOM 요소들
let imageUpload, imagePreview, postDetailModal, closePostDetailBtn, postDetailBody;
let linkBtn, fontSizeSelect, textColorPicker, editorError;
let tagInput, tagPreview, tagFilterBtn, tagFilterDropdown, tagFilterList;

// DOM 요소들을 안전하게 초기화
function initDOMElements() {
    imageUpload = document.getElementById('imageUpload');
    imagePreview = document.getElementById('imagePreview');
    postDetailModal = document.getElementById('postDetailModal');
    closePostDetailBtn = document.getElementById('closePostDetailBtn');
    postDetailBody = document.getElementById('postDetailBody');
    linkBtn = document.getElementById('linkBtn');
    fontSizeSelect = document.getElementById('fontSizeSelect');
    textColorPicker = document.getElementById('textColorPicker');
    editorError = document.getElementById('editorError');
    tagInput = document.getElementById('tagInput');
    tagPreview = document.getElementById('tagPreview');
    tagFilterBtn = document.getElementById('tagFilterBtn');
    tagFilterDropdown = document.getElementById('tagFilterDropdown');
    tagFilterList = document.getElementById('tagFilterList');
    
    // 이벤트 리스너 추가
    if (writeBtn) {
        writeBtn.addEventListener('click', () => {
            if (currentUser) {
                writeModal.style.display = 'block';
                if (categorySelect) categorySelect.value = currentCategory;
            } else {
                showLoginModal();
            }
        });
    }
    
    if (postForm) {
        postForm.addEventListener('submit', submitPost);
    }
}

// 인증 상태 변화 감지
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        hideLoginModal();
        if (userInfo) userInfo.classList.remove('hidden');
        if (userName) userName.textContent = user.displayName;
        if (userAvatar && user.photoURL) {
            userAvatar.style.backgroundImage = `url(${user.photoURL})`;
        }
        
        // 관리자 권한 확인
        isAdmin = ADMIN_EMAILS.includes(user.email);
        
        if (isAdmin) {
            if (adminToggle) adminToggle.classList.remove('hidden');
            if (adminBadge) adminBadge.classList.remove('hidden');
            if (adminDashboardBtn) adminDashboardBtn.classList.remove('hidden');
        }
        
        // 태그 필터 버튼 표시
        if (tagFilterBtn) {
            tagFilterBtn.classList.remove('hidden');
        }
        
        // 사용자 정보 저장
        await saveUserInfo(user);
        
        // 차단된 사용자 목록 로드
        await loadBannedUsers();
        
        loadPosts();
    } else {
        loginModal.style.display = 'flex';
        userInfo.classList.add('hidden');
        if (adminToggle) adminToggle.classList.add('hidden');
        if (adminBadge) adminBadge.classList.add('hidden');
        if (adminDashboardBtn) adminDashboardBtn.classList.add('hidden');
        if (tagFilterBtn) {
            tagFilterBtn.classList.add('hidden');
        }
    }
});

// 사용자 정보 저장
async function saveUserInfo(user) {
    try {
        await setDoc(doc(db, 'users', user.uid), {
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: serverTimestamp(),
            isAdmin: ADMIN_EMAILS.includes(user.email)
        }, { merge: true });
    } catch (error) {
        console.error('사용자 정보 저장 실패:', error);
    }
}

// 차단된 사용자 목록 로드
async function loadBannedUsers() {
    try {
        const bannedQuery = query(collection(db, 'bannedUsers'));
        const snapshot = await getDocs(bannedQuery);
        bannedUsers.clear();
        snapshot.docs.forEach(doc => {
            bannedUsers.add(doc.data().userId);
        });
    } catch (error) {
        console.error('차단 사용자 목록 로드 실패:', error);
    }
}

// Google 로그인
googleLoginBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        alert('로그인 실패: ' + error.message);
    }
});

// 로그아웃
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        isAdminMode = false;
        container.classList.remove('admin-mode');
    } catch (error) {
        alert('로그아웃 실패: ' + error.message);
    }
});

// 관리자 모드 토글
if (adminToggle) {
    adminToggle.addEventListener('click', () => {
        isAdminMode = !isAdminMode;
        if (container) container.classList.toggle('admin-mode', isAdminMode);
        adminToggle.textContent = isAdminMode ? '👤 일반 모드' : '👑 관리자 모드';
        adminToggle.style.backgroundColor = isAdminMode ? '#4CAF50' : '#FF6B6B';
    });
}

// 관리자 대시보드
if (adminDashboardBtn) {
    adminDashboardBtn.addEventListener('click', () => {
        if (adminDashboard) {
            adminDashboard.style.display = 'block';
            loadDashboard();
        }
    });
}

if (closeDashboard) {
    closeDashboard.addEventListener('click', () => {
        if (adminDashboard) {
            adminDashboard.style.display = 'none';
        }
    });
}

// 대시보드 탭 전환
document.querySelectorAll('.dashboard-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.dashboard-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loadDashboardContent(tab.dataset.tab);
    });
});

// 글쓰기 모달 열기/닫기
writeBtn.addEventListener('click', () => {
    if (currentUser) {
        writeModal.style.display = 'block';
        categorySelect.value = currentCategory;
    }
});

closeWriteBtn.addEventListener('click', () => {
    writeModal.style.display = 'none';
    postForm.reset();
    resetEditor();
});

// 게시글 상세보기 모달 닫기 (안전하게 초기화)
function initPostDetailModal() {
    if (closePostDetailBtn) {
        closePostDetailBtn.addEventListener('click', () => {
            postDetailModal.style.display = 'none';
            currentPostId = null;
        });
    }
}

// 게시글 등록
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 차단된 사용자 확인
    if (bannedUsers.has(currentUser.uid)) {
        alert('이용이 정지된 사용자입니다.');
        return;
    }
    
    // 일일 게시글 제한 체크
    if (checkDailyPostLimit()) {
        alert('하루 최대 20개의 게시글까지만 작성할 수 있습니다.');
        return;
    }
    
    const title = postTitle.value.trim();
    const content = postContent.innerHTML.trim();
    const category = categorySelect.value;
    
    if (!title || !content || content === '') {
        editorError.classList.remove('hidden');
        return;
    }
    
    editorError.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.textContent = '등록 중...';
    
    try {
        // 이미지 업로드
        const imageUrls = [];
        for (const file of uploadedImages) {
            const imageRef = ref(storage, `posts/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(imageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            imageUrls.push(url);
        }
        
        await addDoc(collection(db, 'posts'), {
            title,
            content,
            category,
            author: currentUser.displayName,
            authorId: currentUser.uid,
            authorEmail: currentUser.email,
            authorPhoto: currentUser.photoURL,
            images: imageUrls,
            tags: currentTags,
            createdAt: serverTimestamp(),
            isPopular: Math.random() > 0.7
        });
        
        // 일일 게시글 카운트 증가
        incrementDailyPostCount();
        
        writeModal.style.display = 'none';
        postForm.reset();
        resetEditor();
        alert('게시글이 성공적으로 등록되었습니다!');
    } catch (error) {
        alert('글 등록 실패: ' + error.message);
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = '게시글 등록';
});

// 카테고리 버튼 클릭
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        loadPosts();
    });
});

// 검색
searchInput.addEventListener('input', async (e) => {
    searchQuery = e.target.value.toLowerCase();
    await filterPosts();
});

// 게시글 삭제
async function deletePost(postId) {
    if (!isAdmin) return;
    
    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
        try {
            await deleteDoc(doc(db, 'posts', postId));
            alert('게시글이 삭제되었습니다.');
        } catch (error) {
            alert('삭제 실패: ' + error.message);
        }
    }
}

// 사용자 차단
async function banUser(userId, userEmail, userName) {
    if (!isAdmin) return;
    
    if (confirm(`${userName} 사용자를 차단하시겠습니까?`)) {
        try {
            await setDoc(doc(db, 'bannedUsers', userId), {
                userId,
                userEmail,
                userName,
                bannedAt: serverTimestamp(),
                bannedBy: currentUser.uid
            });
            
            bannedUsers.add(userId);
            alert('사용자가 차단되었습니다.');
            loadPosts();
            if (adminDashboard.style.display === 'block') {
                loadDashboard();
            }
        } catch (error) {
            alert('차단 실패: ' + error.message);
        }
    }
}

// 사용자 차단 해제
async function unbanUser(userId) {
    if (!isAdmin) return;
    
    try {
        await deleteDoc(doc(db, 'bannedUsers', userId));
        bannedUsers.delete(userId);
        alert('차단이 해제되었습니다.');
        loadPosts();
        if (adminDashboard.style.display === 'block') {
            loadDashboard();
        }
    } catch (error) {
        alert('차단 해제 실패: ' + error.message);
    }
}

// 게시글 로드
function loadPosts() {
    loading.style.display = 'block';
    postsList.innerHTML = '';
    
    let q;
    if (currentCategory === '자유 게시판') {
        q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    } else {
        q = query(
            collection(db, 'posts'),
            where('category', '==', currentCategory),
            orderBy('createdAt', 'desc')
        );
    }
    
    onSnapshot(q, async (snapshot) => {
        posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        loading.style.display = 'none';
        await filterPosts();
    });
}

// 게시글 필터링
async function filterPosts() {
    let filteredPosts = posts;
    
    // 태그 필터 적용
    if (selectedTagFilter) {
        filteredPosts = filteredPosts.filter(post => 
            post.tags && post.tags.includes(selectedTagFilter)
        );
    }
    
    // 검색어 필터 적용
    if (searchQuery) {
        filteredPosts = filteredPosts.filter(post => 
            post.title.toLowerCase().includes(searchQuery) ||
            post.content.toLowerCase().includes(searchQuery) ||
            (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery)))
        );
    }
    
    if (filteredPosts.length === 0) {
        noResults.style.display = 'flex';
    } else {
        noResults.style.display = 'none';
    }
    
    await renderPosts(filteredPosts);
}

// 게시글 렌더링
async function renderPosts(postsToRender) {
    postsList.innerHTML = '';
    
    for (const post of postsToRender) {
        try {
            const postElement = await createPostElement(post);
            if (postElement) {
                postsList.appendChild(postElement);
            }
        } catch (error) {
            console.error('게시글 렌더링 오류:', error);
        }
    }
}

// XSS 방지 함수
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// HTML 태그 제거 및 XSS 방지
function stripHtml(html) {
    if (typeof html !== 'string') return '';
    
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// 시간을 "몇 분 전" 형식으로 변환
function formatTimeAgo(date) {
    if (!date) return '알 수 없음';
    
    const now = new Date();
    const targetDate = date instanceof Date ? date : new Date(date);
    const diffMs = now - targetDate;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) {
        return '방금 전';
    } else if (diffMinutes < 60) {
        return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
        return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
        return `${diffDays}일 전`;
    } else {
        return targetDate.toLocaleDateString('ko-KR');
    }
}

// getTimeAgo 별칭 (기존 코드 호환성)
function getTimeAgo(date) {
    return formatTimeAgo(date);
}

// 좋아요 기능
async function toggleLike(postId) {
    if (!currentUser) {
        showLoginModal();
        return;
    }

    // 개발 환경에서는 로컬 처리
    if (!window.db || !window.doc || !window.getDoc) {
        console.log('좋아요 토글 (개발 모드):', postId);
        showNotification('좋아요 처리 (개발 모드)');
        return;
    }

    try {
        const postRef = doc(db, 'posts', postId);
        const likeRef = doc(db, 'likes', `${currentUser.uid}_${postId}`);
        
        const likeDoc = await getDoc(likeRef);
        const postDoc = await getDoc(postRef);
        
        if (!postDoc.exists()) return;
        
        const postData = postDoc.data();
        let likesCount = postData.likesCount || 0;
        
        if (likeDoc.exists()) {
            // 좋아요 취소
            await deleteDoc(likeRef);
            likesCount = Math.max(0, likesCount - 1);
        } else {
            // 좋아요 추가
            await setDoc(likeRef, {
                userId: currentUser.uid,
                postId: postId,
                createdAt: new Date()
            });
            likesCount += 1;
        }
        
        // 게시글의 좋아요 수 업데이트
        await updateDoc(postRef, {
            likesCount: likesCount,
            lastActivity: new Date()
        });
        
        // UI 업데이트
        updateLikeButton(postId, !likeDoc.exists(), likesCount);
        
        // 목록에서도 업데이트
        loadPosts();
        
    } catch (error) {
        console.error('좋아요 처리 중 오류:', error);
        showNotification('좋아요 처리 중 오류가 발생했습니다.');
    }
}

// 좋아요 버튼 UI 업데이트
function updateLikeButton(postId, isLiked, count) {
    const likeButtons = document.querySelectorAll(`[data-post-id="${postId}"] .like-btn`);
    const likeCounts = document.querySelectorAll(`[data-post-id="${postId}"] .like-count`);
    
    likeButtons.forEach(btn => {
        btn.classList.toggle('liked', isLiked);
        btn.style.color = isLiked ? '#ff6b6b' : '#9e9e9e';
    });
    
    likeCounts.forEach(countEl => {
        countEl.textContent = count || 0;
    });
}

// 인기글 판정 함수
function isPopularPost(post) {
    if (!post.createdAt) return false;
    
    const now = new Date();
    const postTime = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
    const timeDiff = now - postTime;
    const hoursAgo = timeDiff / (1000 * 60 * 60);
    
    // 24시간 이내
    if (hoursAgo <= 24) {
        const totalEngagement = (post.likesCount || 0) + (post.commentsCount || 0);
        return totalEngagement >= 10;
    }
    
    return false;
}

// 게시글 통계 가져오기
async function getPostStats(postId) {
    try {
        // 좋아요 수 가져오기
        const likesQuery = query(
            collection(db, 'likes'),
            where('postId', '==', postId)
        );
        const likesSnapshot = await getDocs(likesQuery);
        const likesCount = likesSnapshot.size;
        
        // 댓글 수 가져오기
        const commentsQuery = query(
            collection(db, 'comments'),
            where('postId', '==', postId)
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        const commentsCount = commentsSnapshot.size;
        
        // 조회수는 기존 데이터 사용
        const postDoc = await getDoc(doc(db, 'posts', postId));
        const views = postDoc.exists() ? (postDoc.data().views || 0) : 0;
        
        return { likesCount, commentsCount, views };
    } catch (error) {
        console.error('게시글 통계 가져오기 오류:', error);
        return { likesCount: 0, commentsCount: 0, views: 0 };
    }
}

// 사용자가 좋아요 했는지 확인
async function checkUserLiked(postId) {
    if (!currentUser) return false;
    
    try {
        const likeRef = doc(db, 'likes', `${currentUser.uid}_${postId}`);
        const likeDoc = await getDoc(likeRef);
        return likeDoc.exists();
    } catch (error) {
        console.error('좋아요 상태 확인 오류:', error);
        return false;
    }
}

// 검색 기능
async function searchPosts(keyword) {
    if (!keyword || keyword.trim() === '') {
        loadPosts();
        return;
    }
    
    const sanitizedKeyword = sanitizeInput(keyword.trim().toLowerCase());
    
    try {
        showLoading();
        
        // 모든 게시글 가져와서 클라이언트 사이드에서 검색
        const postsQuery = query(
            collection(db, 'posts'),
            orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(postsQuery);
        const allPosts = [];
        
        for (const docSnap of snapshot.docs) {
            const post = { id: docSnap.id, ...docSnap.data() };
            
            // 차단된 사용자 필터링
            if (bannedUsers.has(post.authorId)) continue;
            
            allPosts.push(post);
        }
        
        // 검색 조건: 제목, 내용, 태그에서 키워드 포함
        const searchResults = allPosts.filter(post => {
            const title = (post.title || '').toLowerCase();
            const content = stripHtml(post.content || '').toLowerCase();
            const tags = (post.tags || []).join(' ').toLowerCase();
            
            return title.includes(sanitizedKeyword) || 
                   content.includes(sanitizedKeyword) || 
                   tags.includes(sanitizedKeyword);
        });
        
        hideLoading();
        
        if (searchResults.length === 0) {
            showNoSearchResults(keyword, allPosts);
        } else {
            displaySearchResults(searchResults, keyword);
        }
        
    } catch (error) {
        console.error('검색 오류:', error);
        hideLoading();
        showNotification('검색 중 오류가 발생했습니다.');
    }
}

// 검색 결과 표시
function displaySearchResults(posts, keyword) {
    const postsList = document.getElementById('postsList');
    const noResults = document.querySelector('.no-results');
    
    if (noResults) noResults.style.display = 'none';
    
    if (posts.length === 0) {
        postsList.innerHTML = '<div class="no-posts">검색 결과가 없습니다.</div>';
        return;
    }
    
    postsList.innerHTML = '';
    
    // 검색 결과 헤더 추가
    const searchHeader = document.createElement('div');
    searchHeader.className = 'search-results-header';
    searchHeader.innerHTML = `
        <div class="search-info">
            <span class="search-keyword">"${sanitizeInput(keyword)}"</span> 검색 결과 
            <span class="search-count">${posts.length}건</span>
        </div>
        <button class="clear-search" onclick="clearSearch()">전체 보기</button>
    `;
    postsList.appendChild(searchHeader);
    
    posts.forEach(post => {
        const postElement = createPostElement(post);
        postsList.appendChild(postElement);
    });
}

// 검색 결과 없을 때 대체 콘텐츠 표시
function showNoSearchResults(keyword, allPosts) {
    const postsList = document.getElementById('postsList');
    const noResults = document.querySelector('.no-results');
    
    // 검색 결과 없음 메시지 표시
    if (noResults) {
        noResults.style.display = 'block';
        const noResultsText = noResults.querySelector('.no-results-text span');
        if (noResultsText) {
            noResultsText.textContent = `"${sanitizeInput(keyword)}" 검색 결과가 없어 다른 게시글을 보여드릴게요`;
        }
    }
    
    // 최신 게시글 몇 개 표시
    const fallbackPosts = allPosts.slice(0, 5);
    
    postsList.innerHTML = '';
    
    const fallbackHeader = document.createElement('div');
    fallbackHeader.className = 'search-fallback-header';
    fallbackHeader.innerHTML = `
        <div class="fallback-info">
            <span class="fallback-title">추천 게시글</span>
            <button class="clear-search" onclick="clearSearch()">전체 보기</button>
        </div>
    `;
    postsList.appendChild(fallbackHeader);
    
    fallbackPosts.forEach(post => {
        const postElement = createPostElement(post);
        postsList.appendChild(postElement);
    });
}

// 검색 초기화
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    const noResults = document.querySelector('.no-results');
    if (noResults) {
        noResults.style.display = 'none';
    }
    
    loadPosts();
}

// 게시글 요소 생성 (수정된 버전)
async function createPostElement(post) {
    const article = document.createElement('article');
    article.className = 'post-item';
    article.setAttribute('data-post-id', post.id);
    
    const isAuthorBanned = bannedUsers.has(post.authorId);
    const timeAgo = formatTimeAgo(post.createdAt);
    
    // 실시간 통계 가져오기
    const stats = await getPostStats(post.id);
    
    // 썸네일이 있는지 확인
    const hasThumbnail = post.images && post.images.length > 0;
    const hasPreview = post.content && post.content.length > 0;
    
    // 인기글 판정 (실시간 데이터 사용)
    const postWithStats = { ...post, ...stats };
    const isPopular = isPopularPost(postWithStats);
    
    // 현재 사용자의 좋아요 상태 확인
    const userLiked = await checkUserLiked(post.id);

    article.innerHTML = `
        <div class="article-info">
            <div class="article-primary">
                <!-- 태그 영역 -->
                <div class="article-tag">
                    ${isPopular ? `
                        <div class="tag tag-popular">인기글</div>
                    ` : ''}
                    ${post.tags && post.tags.length > 0 ? 
                        post.tags.slice(0, isPopular ? 1 : 2).map(tag => `
                            <div class="tag tag-normal">${sanitizeInput(tag)}</div>
                        `).join('') : `
                            <div class="tag tag-normal">일반</div>
                        `
                    }
                </div>
                
                <!-- 게시글 핵심 내용 -->
                <div class="article-core">
                    <div class="article-basic">
                        <div class="article-title">${sanitizeInput(post.title)}</div>
                        ${hasThumbnail ? `
                            <div class="article-photo" style="background-image: url('${post.images[0]}')"></div>
                        ` : ''}
                    </div>
                    ${hasPreview ? `
                        <div class="article-preview">${sanitizeInput(stripHtml(post.content).substring(0, 50))}${post.content.length > 50 ? '...' : ''}</div>
                    ` : ''}
                </div>
                
                <!-- 작성자 및 시간 -->
                <div class="writer-and-time">
                    <div class="writer">
                        <div class="writer-pic" style="background-image: url('${post.authorPhoto || 'https://placehold.co/14x14'}')"></div>
                        <div class="writer-name ${isAuthorBanned ? 'banned' : ''}">${sanitizeInput(post.author)}</div>
                    </div>
                    <div class="article-time">${timeAgo}</div>
                </div>
            </div>
            
            <!-- 반응 통계 -->
            <div class="reaction">
                <div class="comment">
                    <div class="comment-icon">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <circle cx="6.5" cy="6.5" r="4.875" stroke="#9f9f9f" stroke-width="1.2"/>
                        </svg>
                    </div>
                    <div class="comment-num">${stats.commentsCount}</div>
                </div>
                <div class="like">
                    <button class="like-btn ${userLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')" style="background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px; color: ${userLiked ? '#ff6b6b' : '#9f9f9f'}; padding: 0;">
                        <div class="like-icon">
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                <path d="M6.5 11.084c-.322 0-.633-.128-.862-.356L2.406 7.496c-.458-.458-.715-1.08-.715-1.73 0-1.35 1.093-2.443 2.443-2.443.608 0 1.19.23 1.638.646L6.5 4.677l.728-.708c.448-.416 1.03-.646 1.638-.646 1.35 0 2.443 1.094 2.443 2.443 0 .65-.257 1.272-.715 1.73L7.362 10.728c-.229.228-.54.356-.862.356z" stroke="currentColor" stroke-width="1.2" fill="${userLiked ? 'currentColor' : 'none'}"/>
                            </svg>
                        </div>
                        <div class="like-num">${stats.likesCount}</div>
                    </button>
                </div>
            </div>
        </div>
        
        ${isAdmin ? `
            <div class="admin-controls">
                <button class="admin-btn delete" onclick="deletePost('${post.id}')">삭제</button>
                ${isAuthorBanned ? 
                    `<button class="admin-btn ban" onclick="unbanUser('${post.authorId}')">차단 해제</button>` : 
                    `<button class="admin-btn ban" onclick="banUser('${post.authorId}')">사용자 차단</button>`
                }
            </div>
        ` : ''}
    `;
    
    // 게시글 클릭 이벤트 (관리자 버튼과 좋아요 버튼 클릭 시 제외)
    article.addEventListener('click', (e) => {
        if (!e.target.closest('.admin-controls') && !e.target.closest('.like-btn')) {
            openPostDetail(post.id);
        }
    });
    
    return article;
}

// 게시글 상세보기에서 좋아요 버튼 추가
async function openPostDetail(postId) {
    if (!postId) return;
    
    // 개발 환경에서는 모의 데이터 사용
    if (!window.db || !window.getDoc || !window.doc) {
        console.log('게시글 상세보기 (개발 모드):', postId);
        showNotification('게시글 상세보기 (개발 모드)');
        return;
    }
    
    try {
        const postDoc = await getDoc(doc(db, 'posts', postId));
        if (!postDoc.exists()) {
            showNotification('게시글을 찾을 수 없습니다.');
            return;
        }
        
        const post = { id: postDoc.id, ...postDoc.data() };
        
        // 조회수 증가 (개발 환경에서는 스킵)
        if (window.db && window.increment) {
            await updateDoc(doc(db, 'posts', postId), {
                views: increment(1)
            });
        }
        
        // 통계 가져오기
        const stats = await getPostStats(postId);
        const userLiked = await checkUserLiked(postId);
        
        const modal = document.getElementById('postDetailModal');
        const content = modal.querySelector('.post-detail-body');
        
        const timeAgo = formatTimeAgo(post.createdAt);
        
        content.innerHTML = `
            <div class="post-detail-title">${sanitizeInput(post.title)}</div>
            <div class="post-detail-meta">
                <span class="post-detail-author">${sanitizeInput(post.author)}</span>
                <span>•</span>
                <span>${timeAgo}</span>
                <span>•</span>
                <span>조회 ${stats.views + 1}</span>
            </div>
            
            ${post.images && post.images.length > 0 ? `
                <div class="post-detail-images">
                    ${post.images.map(img => `<img src="${img}" alt="첨부 이미지" class="post-detail-image">`).join('')}
                </div>
            ` : ''}
            
            <div class="post-detail-content-text">${post.content || ''}</div>
            
            <!-- 좋아요와 댓글 통계 -->
            <div class="post-detail-stats">
                <button class="detail-like-btn ${userLiked ? 'liked' : ''}" onclick="toggleLike('${postId}')" style="background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 20px; transition: all 0.2s; color: ${userLiked ? '#ff6b6b' : '#9e9e9e'}; border: 1px solid ${userLiked ? '#ff6b6b' : '#dee2e6'};">
                    <span style="font-size: 16px;">❤️</span>
                    <span class="like-count">${stats.likesCount}</span>
                </button>
                <div class="comments-info" style="display: flex; align-items: center; gap: 6px; color: #868e96; font-size: 14px;">
                    <span>💬</span>
                    <span>댓글 ${stats.commentsCount}개</span>
                </div>
            </div>
            
            <div class="comments-section">
                <div class="comments-header">
                    <span class="comments-title">댓글</span>
                    <span class="comments-count">${stats.commentsCount}</span>
                </div>
                
                ${currentUser ? `
                    <form class="comment-form" onsubmit="addComment(event, '${postId}')">
                        <input type="text" class="comment-input" placeholder="댓글을 입력하세요..." required maxlength="500">
                        <button type="submit" class="comment-submit">등록</button>
                    </form>
                ` : ''}
                
                <div class="comments-list" id="commentsList">
                    <!-- 댓글 목록이 여기에 로드됩니다 -->
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // 댓글 로드
        loadComments(postId);
        
    } catch (error) {
        console.error('게시글 상세보기 오류:', error);
        showNotification('게시글을 불러오는 중 오류가 발생했습니다.');
    }
}

// 폼 제출 시 XSS 방지
function validateAndSanitizeForm(formData) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(formData)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value);
            
            // 추가 검증
            if (key === 'title' && value.length > 100) {
                throw new Error('제목은 100자를 초과할 수 없습니다.');
            }
            if (key === 'content' && value.length > 5000) {
                throw new Error('내용은 5000자를 초과할 수 없습니다.');
            }
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}

// 검색 입력 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            const keyword = e.target.value.trim();
            
            if (keyword === '') {
                clearSearch();
                return;
            }
            
            // 디바운싱: 500ms 후에 검색 실행
            searchTimeout = setTimeout(() => {
                searchPosts(keyword);
            }, 500);
        });
        
        // 엔터 키로 즉시 검색
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                const keyword = e.target.value.trim();
                if (keyword) {
                    searchPosts(keyword);
                } else {
                    clearSearch();
                }
            }
        });
    }
});

// 알림 표시 함수
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : '#675fff'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .search-results-header, .search-fallback-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 16px;
        border: 1px solid #e9ecef;
    }
    
    .search-keyword {
        color: #675fff;
        font-weight: 600;
    }
    
    .search-count {
        color: #868e96;
        font-size: 12px;
    }
    
    .clear-search {
        background: #675fff;
        color: white;
        border: none;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 11px;
        cursor: pointer;
        transition: background 0.2s;
    }
    
    .clear-search:hover {
        background: #5650e6;
    }
    
    .fallback-title {
        color: #495057;
        font-weight: 600;
        font-size: 14px;
    }
    
    .post-detail-stats {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0;
        border-top: 1px solid #f1f3f4;
        border-bottom: 1px solid #f1f3f4;
        margin: 16px 0;
    }
    
    .detail-like-btn:hover {
        background-color: #f8f9fa !important;
    }
    
    .detail-like-btn.liked {
        background-color: #ffebee !important;
    }
    
    .like-btn.liked {
        color: #ff6b6b !important;
    }
`;

document.head.appendChild(style);

// 댓글 로드
function loadComments(postId) {
    // orderBy 제거하고 클라이언트에서 정렬 (Firebase 인덱스 불필요)
    const commentsQuery = query(
        collection(db, 'comments'),
        where('postId', '==', postId)
    );
    
    onSnapshot(commentsQuery, (snapshot) => {
        let comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // 클라이언트에서 정렬 (최신순)
        comments.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.toMillis() - a.createdAt.toMillis();
        });
        
        renderComments(comments);
        
        const commentsCountEl = document.getElementById('commentsCount');
        if (commentsCountEl) {
            commentsCountEl.textContent = comments.length;
        }
    }, (error) => {
        console.error('댓글 로드 실패:', error);
    });
}

// 댓글 렌더링
function renderComments(comments) {
    const commentsList = document.getElementById('commentsList');
    
    commentsList.innerHTML = comments.map(comment => {
        const timeAgo = formatTimeAgo(comment.createdAt);
        const canDelete = currentUser && (currentUser.uid === comment.authorId || isAdmin);
        
        return `
            <div class="comment-item">
                <div class="comment-author">
                    <div class="comment-author-pic" ${comment.authorPhoto ? `style="background-image: url(${comment.authorPhoto}); background-size: cover;"` : ''}></div>
                    <span class="comment-author-name">${comment.author || '익명'}</span>
                    <span class="comment-time">${timeAgo}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
                ${canDelete ? `<button class="comment-delete" onclick="deleteComment('${comment.id}')">삭제</button>` : ''}
            </div>
        `;
    }).join('');
}

// 댓글 추가
async function addComment(postId) {
    const commentInput = document.getElementById('commentInput');
    
    if (!commentInput) {
        alert('댓글 입력창을 찾을 수 없습니다.');
        return;
    }
    
    const content = commentInput.value.trim();
    
    if (!content) {
        alert('댓글 내용을 입력해주세요.');
        return;
    }
    
    // 차단된 사용자 확인
    if (bannedUsers.has(currentUser.uid)) {
        alert('이용이 정지된 사용자입니다.');
        return;
    }
    
    // 일일 댓글 제한 체크
    if (checkDailyCommentLimit()) {
        alert('하루 최대 20개의 댓글까지만 작성할 수 있습니다.');
        return;
    }
    
    try {
        await addDoc(collection(db, 'comments'), {
            postId,
            content,
            author: currentUser.displayName,
            authorId: currentUser.uid,
            authorPhoto: currentUser.photoURL,
            createdAt: serverTimestamp()
        });
        
        // 일일 댓글 카운트 증가
        incrementDailyCommentCount();
        
        commentInput.value = '';
    } catch (error) {
        console.error('댓글 등록 실패:', error);
        alert('댓글 등록 실패: ' + error.message);
    }
}

// 댓글 삭제
async function deleteComment(commentId) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    
    try {
        await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
        alert('댓글 삭제 실패: ' + error.message);
    }
}

// 태그 관련 함수들
function initTagSystem() {
    if (!tagInput) return;
    
    // 태그 입력 처리
    tagInput.addEventListener('input', handleTagInput);
    tagInput.addEventListener('keydown', handleTagKeydown);
    
    // 인기 태그 클릭
    document.querySelectorAll('.popular-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const tagName = tag.dataset.tag;
            addTag(tagName);
        });
    });
    
    // 태그 필터 버튼
    if (tagFilterBtn) {
        tagFilterBtn.addEventListener('click', toggleTagFilter);
    }
    
    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', (e) => {
        if (tagFilterDropdown && tagFilterBtn && 
            !tagFilterDropdown.contains(e.target) && !tagFilterBtn.contains(e.target)) {
            tagFilterDropdown.style.display = 'none';
            tagFilterBtn.classList.remove('active');
        }
    });
}

function handleTagInput(e) {
    const value = e.target.value;
    const lastChar = value[value.length - 1];
    
    if (lastChar === ' ' || lastChar === '#') {
        const tagText = value.slice(0, -1).trim();
        if (tagText) {
            const cleanTag = tagText.replace(/^#/, '');
            if (cleanTag) {
                addTag(cleanTag);
                tagInput.value = '';
            }
        }
    }
}

function handleTagKeydown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const value = tagInput.value.trim();
        if (value) {
            const cleanTag = value.replace(/^#/, '');
            if (cleanTag) {
                addTag(cleanTag);
                tagInput.value = '';
            }
        }
    }
}

function addTag(tagName) {
    if (tagName.length > 20) {
        alert('태그는 20자 이하로 입력해주세요.');
        return;
    }
    
    if (currentTags.length >= 5) {
        alert('태그는 최대 5개까지 추가할 수 있습니다.');
        return;
    }
    
    if (currentTags.includes(tagName)) {
        alert('이미 추가된 태그입니다.');
        return;
    }
    
    currentTags.push(tagName);
    updateTagPreview();
}

function removeTag(tagName) {
    currentTags = currentTags.filter(tag => tag !== tagName);
    updateTagPreview();
}

function updateTagPreview() {
    if (!tagPreview) return;
    
    tagPreview.innerHTML = currentTags.map(tag => `
        <span class="tag-item">
            #${tag}
            <button class="tag-remove" onclick="removeTag('${tag}')">×</button>
        </span>
    `).join('');
}

function toggleTagFilter() {
    const isVisible = tagFilterDropdown.style.display === 'block';
    
    if (isVisible) {
        tagFilterDropdown.style.display = 'none';
        tagFilterBtn.classList.remove('active');
    } else {
        updateTagFilterList();
        tagFilterDropdown.style.display = 'block';
        tagFilterBtn.classList.add('active');
    }
}

function updateTagFilterList() {
    if (!tagFilterList) return;
    
    const tagCounts = {};
    posts.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
            post.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });
    
    const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
    
    tagFilterList.innerHTML = `
        <div class="filter-tag-item ${!selectedTagFilter ? 'active' : ''}" onclick="filterByTag(null)">
            <span class="filter-tag-name">전체 보기</span>
            <span class="filter-tag-count">${posts.length}</span>
        </div>
        ${sortedTags.map(([tag, count]) => `
            <div class="filter-tag-item ${selectedTagFilter === tag ? 'active' : ''}" onclick="filterByTag('${tag}')">
                <span class="filter-tag-name">#${tag}</span>
                <span class="filter-tag-count">${count}</span>
            </div>
        `).join('')}
    `;
}

async function filterByTag(tag) {
    selectedTagFilter = tag;
    tagFilterDropdown.style.display = 'none';
    tagFilterBtn.classList.remove('active');
    
    if (tag) {
        tagFilterBtn.textContent = `🏷️ #${tag}`;
        tagFilterBtn.classList.add('active');
    } else {
        tagFilterBtn.textContent = '🏷️ 태그';
        tagFilterBtn.classList.remove('active');
    }
    
    await filterPosts();
}

// 에디터 리셋 수정
function resetEditor() {
    postContent.innerHTML = '';
    uploadedImages = [];
    currentTags = [];
    imagePreview.innerHTML = '';
    updateTagPreview();
    if (tagInput) tagInput.value = '';
    editorError.classList.add('hidden');
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// 일일 제한 관련 함수들
function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function checkDailyPostLimit() {
    const todayKey = `posts_${currentUser.uid}_${getTodayDateString()}`;
    const todayCount = parseInt(localStorage.getItem(todayKey) || '0');
    return todayCount >= 20;
}

function checkDailyCommentLimit() {
    const todayKey = `comments_${currentUser.uid}_${getTodayDateString()}`;
    const todayCount = parseInt(localStorage.getItem(todayKey) || '0');
    return todayCount >= 20;
}

function incrementDailyPostCount() {
    const todayKey = `posts_${currentUser.uid}_${getTodayDateString()}`;
    const todayCount = parseInt(localStorage.getItem(todayKey) || '0');
    localStorage.setItem(todayKey, (todayCount + 1).toString());
}

function incrementDailyCommentCount() {
    const todayKey = `comments_${currentUser.uid}_${getTodayDateString()}`;
    const todayCount = parseInt(localStorage.getItem(todayKey) || '0');
    localStorage.setItem(todayKey, (todayCount + 1).toString());
}

function getDailyPostCount() {
    const todayKey = `posts_${currentUser.uid}_${getTodayDateString()}`;
    return parseInt(localStorage.getItem(todayKey) || '0');
}

function getDailyCommentCount() {
    const todayKey = `comments_${currentUser.uid}_${getTodayDateString()}`;
    return parseInt(localStorage.getItem(todayKey) || '0');
}

// 리치 에디터 초기화
function initRichEditor() {
    if (contentEditor) {
        // 에디터 기본 설정
        contentEditor.addEventListener('focus', () => {
            if (contentEditor.innerHTML === '' || contentEditor.innerHTML === '<br>') {
                contentEditor.innerHTML = '';
            }
        });
        
        contentEditor.addEventListener('blur', () => {
            if (contentEditor.innerHTML.trim() === '') {
                contentEditor.innerHTML = '';
            }
        });
    }
}

// 이미지 업로드 초기화
function initImageUpload() {
    if (imageInput) {
        imageInput.addEventListener('change', previewImages);
    }
}

// 중복 제거됨 - 이미 위에 정의되어 있음

// 중복 제거됨 - 이미 위에 정의되어 있음

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    initDOMElements();
    initRichEditor();
    initImageUpload();
    initPostDetailModal();
    initTagSystem();
});

// 누락된 전역 함수들 추가
function showLoginModal() {
    if (loginModal) {
        loginModal.classList.remove('hidden');
        loginModal.style.display = 'flex';
    }
}

function hideLoginModal() {
    if (loginModal) {
        loginModal.classList.add('hidden');
        loginModal.style.display = 'none';
    }
}

function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(error => {
        console.error('로그인 실패:', error);
        showNotification('로그인에 실패했습니다.');
    });
}

function logout() {
    signOut(auth).then(() => {
        // UI 상태 초기화
        if (userInfo) userInfo.classList.add('hidden');
        if (adminToggle) adminToggle.classList.add('hidden');
        if (adminBadge) adminBadge.classList.add('hidden');
        if (adminDashboardBtn) adminDashboardBtn.classList.add('hidden');
        
        currentUser = null;
        isAdmin = false;
        
        showNotification('로그아웃되었습니다.');
    }).catch(error => {
        console.error('로그아웃 실패:', error);
    });
}

function closeWriteModal() {
    writeModal.style.display = 'none';
    if (postForm) postForm.reset();
    resetEditor();
    
    // 색상 입력 초기화
    const colorInputs = document.querySelectorAll('input[type="color"]');
    colorInputs.forEach(input => {
        input.value = '#000000'; // 기본 검은색으로 설정
    });
}

function closePostDetail() {
    postDetailModal.style.display = 'none';
    currentPostId = null;
}

function addPopularTag(element) {
    const tagName = element.textContent.trim();
    addTag(tagName);
}

function formatText(command, value = null) {
    if (command === 'fontSize') {
        document.execCommand('fontSize', false, value);
    } else if (command === 'foreColor') {
        document.execCommand('foreColor', false, value);
    } else {
        document.execCommand(command, false, value);
    }
    
    // 에디터에 포커스 유지
    if (contentEditor) {
        contentEditor.focus();
    }
}

function insertLink() {
    const url = prompt('링크 URL을 입력하세요:');
    if (url) {
        document.execCommand('createLink', false, url);
    }
    if (contentEditor) {
        contentEditor.focus();
    }
}

function previewImages(event) {
    const files = Array.from(event.target.files);
    const preview = document.getElementById('imagePreview');
    
    if (files.length > 5) {
        alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
        event.target.value = '';
        return;
    }
    
    preview.innerHTML = '';
    uploadedImages = [];
    
    files.forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'image-preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" class="image-preview-img" alt="미리보기">
                    <button type="button" class="image-remove" onclick="removeImage(${index})">×</button>
                `;
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
            uploadedImages.push(file);
        }
    });
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    
    // 파일 input 재생성
    const imageInput = document.getElementById('imageInput');
    const dt = new DataTransfer();
    uploadedImages.forEach(file => dt.items.add(file));
    imageInput.files = dt.files;
    
    // 미리보기 재생성
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    
    uploadedImages.forEach((file, newIndex) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'image-preview-item';
            div.innerHTML = `
                <img src="${e.target.result}" class="image-preview-img" alt="미리보기">
                <button type="button" class="image-remove" onclick="removeImage(${newIndex})">×</button>
            `;
            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

// 게시글 제출 함수
async function submitPost(event) {
    event.preventDefault();
    
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    const title = postTitle?.value?.trim();
    const content = postContent?.innerHTML?.trim();
    const category = categorySelect?.value;
    
    if (!title || !content || !category) {
        showNotification('모든 필드를 입력해주세요.', 'error');
        return;
    }
    
    try {
        const postData = {
            title: sanitizeInput(title),
            content: content, // 리치 텍스트는 그대로 저장
            category: category,
            author: currentUser.displayName || '익명',
            authorId: currentUser.uid,
            authorPhoto: currentUser.photoURL || '',
            authorEmail: currentUser.email || '',
            tags: currentTags || [],
            images: [], // 이미지는 개발 환경에서는 비활성화
            views: 0,
            commentsCount: 0,
            likesCount: 0,
            createdAt: new Date(),
            lastActivity: new Date()
        };
        
        // 개발 환경에서는 로컬 저장
        if (!window.db) {
            console.log('게시글 작성 (개발 모드):', postData);
            showNotification('게시글이 작성되었습니다. (개발 모드)');
            closeWriteModal();
            return;
        }
        
        // 프로덕션 환경에서는 Firebase에 저장
        await addDoc(collection(window.db, 'posts'), postData);
        showNotification('게시글이 성공적으로 작성되었습니다.');
        closeWriteModal();
        
    } catch (error) {
        console.error('게시글 작성 오류:', error);
        showNotification('게시글 작성 중 오류가 발생했습니다.', 'error');
    }
}

// 전역 함수로 노출 (인라인 이벤트 핸들러용)
window.deletePost = deletePost;
window.banUser = banUser;
window.unbanUser = unbanUser;
window.openPostDetail = openPostDetail;
window.deleteComment = deleteComment;
window.removeTag = removeTag;
window.filterByTag = filterByTag;
window.signInWithGoogle = signInWithGoogle;
window.logout = logout;
window.closeWriteModal = closeWriteModal;
window.closePostDetail = closePostDetail;
window.addPopularTag = addPopularTag;
window.formatText = formatText;
window.insertLink = insertLink;
window.previewImages = previewImages;
window.removeImage = removeImage;
window.showLoginModal = showLoginModal;
window.hideLoginModal = hideLoginModal;
window.submitPost = submitPost; 