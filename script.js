// ====================================
// GLOBAL VARIABLES
// ====================================
let currentStep = 1;
let uploadedPhotos = [];
let noButtonAttempts = 0;
let currentProposalId = null;
const MAX_PHOTOS = 3;
const ADMIN_PASSWORD = 'summit2024';

// ====================================
// PAGE NAVIGATION
// ====================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showLanding() {
    showPage('landingPage');
    createFloatingHearts();
}

function showCreator() {
    showPage('creatorPage');
    resetForm();
}

function showAdminLogin() {
    document.getElementById('adminLogin').classList.add('active');
}

function closeAdminLogin() {
    document.getElementById('adminLogin').classList.remove('active');
}

function verifyAdmin() {
    const password = document.getElementById('adminPassword').value;
    if (password === ADMIN_PASSWORD) {
        closeAdminLogin();
        showPage('adminDashboard');
        loadDashboardData();
        
        // Start auto-refresh if available
        if (typeof startAutoRefresh === 'function') {
            startAutoRefresh();
        }
    } else {
        alert('Incorrect password!');
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }
}

function logout() {
    // Check if we're on admin.html page
    if (window.location.pathname.includes('admin')) {
        window.location.href = 'index.html';
    } else {
        showLanding();
    }
}

// ====================================
// FLOATING HEARTS ANIMATION
// ====================================
function createFloatingHearts() {
    const container = document.querySelector('.floating-hearts-container');
    if (!container) return;
    
    container.innerHTML = '';
    const hearts = ['💖', '💕', '💗', '💓', '💝'];
    
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            heart.style.position = 'absolute';
            heart.style.fontSize = `${Math.random() * 30 + 20}px`;
            heart.style.left = `${Math.random() * 100}%`;
            heart.style.bottom = '-50px';
            heart.style.opacity = '0';
            heart.style.animation = `floatHeart ${Math.random() * 5 + 5}s ease-in-out infinite`;
            heart.style.animationDelay = `${Math.random() * 2}s`;
            container.appendChild(heart);
        }, i * 200);
    }
}

// ====================================
// FORM NAVIGATION
// ====================================
function nextStep(step) {
    // Validation
    if (!validateCurrentStep()) return;
    
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelector(`[data-step="${step}"]`).classList.add('active');
    currentStep = step;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(step) {
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelector(`[data-step="${step}"]`).classList.add('active');
    currentStep = step;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateCurrentStep() {
    if (currentStep === 1) {
        const recipientName = document.getElementById('recipientName').value;
        if (!recipientName.trim()) {
            alert('Please enter the recipient\'s name');
            return false;
        }
    }
    
    if (currentStep === 2) {
        const selectedTemplate = document.getElementById('selectedTemplate').value;
        if (!selectedTemplate) {
            alert('Please select a template');
            return false;
        }
    }
    
    return true;
}

// ====================================
// MESSAGE CUSTOMIZATION
// ====================================
function updateCustomMessage() {
    const template = document.getElementById('messageTemplate').value;
    const customGroup = document.getElementById('customMessageGroup');
    
    if (template === 'custom') {
        customGroup.style.display = 'block';
    } else {
        customGroup.style.display = 'none';
    }
}

// ====================================
// TEMPLATE SELECTION
// ====================================
function selectTemplate(templateName) {
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    document.querySelector(`[data-template="${templateName}"]`).classList.add('selected');
    document.getElementById('selectedTemplate').value = templateName;
    
    playSound('click');
}

// ====================================
// PHOTO UPLOAD
// ====================================
function handlePhotoUpload(slotNumber) {
    const input = document.getElementById(`photoInput${slotNumber}`);
    const file = input.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const base64Image = e.target.result;
        
        // Compress and resize image
        compressImage(base64Image, (compressed) => {
            uploadedPhotos[slotNumber - 1] = compressed;
            
            // Show preview
            const preview = document.getElementById(`photoPreview${slotNumber}`);
            const label = document.querySelector(`#photoSlot${slotNumber} .photo-label`);
            const removeBtn = document.querySelector(`#photoSlot${slotNumber} .remove-photo`);
            
            preview.src = compressed;
            preview.style.display = 'block';
            label.style.display = 'none';
            removeBtn.style.display = 'flex';
            
            // Show next slot if available
            if (slotNumber < MAX_PHOTOS) {
                document.getElementById(`photoSlot${slotNumber + 1}`).style.display = 'block';
            }
            
            playSound('upload');
        });
    };
    
    reader.readAsDataURL(file);
}

function removePhoto(slotNumber) {
    uploadedPhotos[slotNumber - 1] = null;
    
    const preview = document.getElementById(`photoPreview${slotNumber}`);
    const label = document.querySelector(`#photoSlot${slotNumber} .photo-label`);
    const removeBtn = document.querySelector(`#photoSlot${slotNumber} .remove-photo`);
    const input = document.getElementById(`photoInput${slotNumber}`);
    
    preview.src = '';
    preview.style.display = 'none';
    label.style.display = 'flex';
    removeBtn.style.display = 'none';
    input.value = '';
    
    playSound('click');
}

function compressImage(base64, callback) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Max dimensions
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }
        } else {
            if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        callback(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = base64;
}

// ====================================
// MUSIC SELECTION
// ====================================
function selectMusic(musicId) {
    document.querySelectorAll('.music-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    document.querySelector(`[data-music="${musicId}"]`).classList.add('selected');
    document.getElementById('selectedMusic').value = musicId;
    
    playSound('click');
}

// ====================================
// PROPOSAL CREATION
// ====================================
function generateProposal() {
    if (!validateCurrentStep()) return;
    
    const recipientName = document.getElementById('recipientName').value;
    const senderName = document.getElementById('senderName').value || 'Anonymous';
    const template = document.getElementById('selectedTemplate').value;
    const messageTemplate = document.getElementById('messageTemplate').value;
    const customMessage = document.getElementById('customMessage').value;
    const selectedMusic = document.getElementById('selectedMusic').value;
    
    const message = messageTemplate === 'custom' ? customMessage : messageTemplate;
    
    const proposalId = 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const proposalData = {
        recipientName,
        senderName,
        template,
        message,
        music: selectedMusic,
        photos: uploadedPhotos.filter(p => p !== null),
        createdAt: new Date().toISOString(),
        views: 0,
        yesClicked: false,
        noClicks: 0
    };
    
    // Save proposal with better error handling
    try {
        saveProposal(proposalId, proposalData);
        currentProposalId = proposalId;
        
        // Generate shareable URL - THIS IS THE FIX
        const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
        const shareUrl = `${baseUrl}?id=${proposalId}`;
        
        // Encode the proposal data in the URL for sharing
        const encodedData = btoa(JSON.stringify(proposalData));
        const fullShareUrl = `${baseUrl}?id=${proposalId}&data=${encodedData}`;
        
        document.getElementById('shareLink').value = fullShareUrl;
        
        nextStep(4);
        playSound('success');
        
    } catch (error) {
        console.error('Error creating proposal:', error);
        alert('Failed to create proposal. Please try again.');
    }
}

function copyShareLink() {
    const linkInput = document.getElementById('shareLink');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        
        const btn = event.target.closest('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Copied!';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
        
        playSound('success');
    } catch (err) {
        alert('Failed to copy link. Please copy manually.');
    }
}

function shareWhatsApp() {
    const shareUrl = document.getElementById('shareLink').value;
    const recipientName = document.getElementById('recipientName').value;
    const message = `💘 Someone has a special Valentine's message for ${recipientName}! 💝\n\nClick here to see it: ${shareUrl}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function downloadQR() {
    const shareUrl = document.getElementById('shareLink').value;
    const qrContainer = document.createElement('div');
    qrContainer.id = 'qrCode';
    
    new QRCode(qrContainer, {
        text: shareUrl,
        width: 256,
        height: 256,
        colorDark: '#ff1744',
        colorLight: '#ffffff',
    });
    
    setTimeout(() => {
        const canvas = qrContainer.querySelector('canvas');
        const link = document.createElement('a');
        link.download = 'valentine-qr-code.png';
        link.href = canvas.toDataURL();
        link.click();
        
        playSound('success');
    }, 500);
}

function createAnother() {
    resetForm();
    nextStep(1);
}

function resetForm() {
    document.getElementById('recipientName').value = '';
    document.getElementById('senderName').value = '';
    document.getElementById('messageTemplate').value = 'Will you be my Valentine?';
    document.getElementById('customMessage').value = '';
    document.getElementById('customMessageGroup').style.display = 'none';
    document.getElementById('selectedTemplate').value = '';
    document.getElementById('selectedMusic').value = 'none';
    
    uploadedPhotos = [];
    
    for (let i = 1; i <= MAX_PHOTOS; i++) {
        removePhoto(i);
        if (i > 1) {
            document.getElementById(`photoSlot${i}`).style.display = 'none';
        }
    }
    
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    document.querySelectorAll('.music-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    currentStep = 1;
}

// ====================================
// PROPOSAL VIEWING - FIXED FOR URL SHARING
// ====================================
function loadProposal() {
    const urlParams = new URLSearchParams(window.location.search);
    const proposalId = urlParams.get('id');
    const encodedData = urlParams.get('data');
    
    if (!proposalId) {
        showNotFound();
        return;
    }
    
    let proposal = null;
    
    // First, try to get from URL-encoded data (for sharing)
    if (encodedData) {
        try {
            proposal = JSON.parse(atob(encodedData));
            // Save it to localStorage for future views
            saveProposal(proposalId, proposal);
        } catch (e) {
            console.error('Error decoding proposal data:', e);
        }
    }
    
    // If no encoded data, try localStorage
    if (!proposal) {
        proposal = getProposal(proposalId);
    }
    
    // If still no proposal found
    if (!proposal) {
        showNotFound();
        return;
    }
    
    // Increment view count
    proposal.views = (proposal.views || 0) + 1;
    saveProposal(proposalId, proposal);
    currentProposalId = proposalId;
    
    renderProposal(proposal);
    showPage('proposalPage');
}

function showNotFound() {
    showPage('proposalPage');
    const content = document.getElementById('proposalContent');
    content.innerHTML = `
        <div class="proposal-not-found">
            <div class="not-found-icon">💔</div>
            <h2>Proposal Not Found</h2>
            <p>This proposal link may be invalid or expired.</p>
            <button class="btn-primary" onclick="window.location.href='index.html'">
                Create Your Own Proposal
            </button>
        </div>
    `;
}

function renderProposal(proposal) {
    const content = document.getElementById('proposalContent');
    const template = proposal.template || 'romantic-sunset';
    
    // Build photo gallery HTML
    let photosHTML = '';
    if (proposal.photos && proposal.photos.length > 0) {
        photosHTML = `
            <div class="proposal-photos">
                ${proposal.photos.map(photo => `
                    <div class="proposal-photo">
                        <img src="${photo}" alt="Memory">
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Render proposal view
    content.innerHTML = `
        <div class="proposal-template ${template}">
            <div class="proposal-background"></div>
            <div class="proposal-container">
                <div class="proposal-heart-logo">💘</div>
                <h1 class="proposal-recipient">${proposal.recipientName}</h1>
                <div class="proposal-message">${proposal.message}</div>
                ${photosHTML}
                <div class="proposal-sender">- From ${proposal.senderName}</div>
                <div class="proposal-buttons">
                    <button class="btn-yes" onclick="handleYes()">
                        Yes! 💕
                    </button>
                    <button class="btn-no" onclick="handleNo()">
                        No
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Play music if selected
    if (proposal.music && proposal.music !== 'none') {
        playBackgroundMusic(proposal.music);
    }
    
    // Add template-specific animations
    addTemplateAnimations(template);
}

function addTemplateAnimations(template) {
    const container = document.querySelector('.proposal-container');
    
    setTimeout(() => {
        container.style.animation = 'slideInScale 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';
    }, 100);
}

// ====================================
// PROPOSAL RESPONSES
// ====================================
function handleYes() {
    const proposal = getProposal(currentProposalId);
    if (proposal) {
        proposal.yesClicked = true;
        saveProposal(currentProposalId, proposal);
    }
    
    // Show success modal
    document.getElementById('successModal').classList.add('active');
    document.getElementById('successMessage').textContent = 'They said YES! 💕';
    document.getElementById('successSubtext').textContent = 'Love wins! 🎉';
    
    // Confetti celebration
    launchConfetti();
    playSound('success');
}

function handleNo() {
    const proposal = getProposal(currentProposalId);
    if (proposal) {
        proposal.noClicks = (proposal.noClicks || 0) + 1;
        saveProposal(currentProposalId, proposal);
    }
    
    noButtonAttempts++;
    const noBtn = document.querySelector('.btn-no');
    
    if (noButtonAttempts < 3) {
        // Move button to random position
        const container = document.querySelector('.proposal-buttons');
        const containerRect = container.getBoundingClientRect();
        const btnRect = noBtn.getBoundingClientRect();
        
        const maxX = containerRect.width - btnRect.width;
        const maxY = containerRect.height - btnRect.height;
        
        const randomX = Math.random() * maxX;
        const randomY = Math.random() * maxY;
        
        noBtn.style.position = 'absolute';
        noBtn.style.left = randomX + 'px';
        noBtn.style.top = randomY + 'px';
        noBtn.style.transform = 'none';
        
        playSound('click');
    } else if (noButtonAttempts === 3) {
        noBtn.textContent = 'Are you sure? 🥺';
        noBtn.style.fontSize = '0.9rem';
    } else if (noButtonAttempts === 4) {
        noBtn.textContent = 'Really? 💔';
        noBtn.style.backgroundColor = 'var(--gray)';
    } else {
        // After many attempts, make Yes button bigger and more appealing
        const yesBtn = document.querySelector('.btn-yes');
        yesBtn.style.transform = 'scale(1.2)';
        yesBtn.style.animation = 'pulse 1s infinite';
        yesBtn.textContent = 'YES! Please! 💝';
        
        noBtn.style.display = 'none';
    }
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('active');
    noButtonAttempts = 0;
}

// ====================================
// CONFETTI EFFECT
// ====================================
function launchConfetti() {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 7,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#ff1744', '#ff80ab', '#f50057', '#ff6b9d']
        });
        
        confetti({
            particleCount: 7,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#ff1744', '#ff80ab', '#f50057', '#ff6b9d']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

// ====================================
// SOUND EFFECTS
// ====================================
function playSound(type) {
    // Simple beep sounds using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'click') {
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'success') {
        oscillator.frequency.value = 1200;
        gainNode.gain.value = 0.15;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === 'upload') {
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
    }
}

function playBackgroundMusic(musicId) {
    // Placeholder for background music
    // In production, you would load actual audio files here
    console.log('Playing music:', musicId);
}

// ====================================
// LOCAL STORAGE FUNCTIONS
// ====================================
function saveProposal(id, data) {
    try {
        const proposals = getAllProposals();
        proposals[id] = data;
        localStorage.setItem('valentineProposals', JSON.stringify(proposals));
        createAutoBackup(proposals);
        return true;
    } catch (e) {
        console.error('Error saving proposal:', e);
        if (e.name === 'QuotaExceededError') {
            alert('Storage limit exceeded. Please delete some old proposals.');
        }
        return false;
    }
}

function getProposal(id) {
    try {
        const proposals = getAllProposals();
        return proposals[id] || null;
    } catch (e) {
        console.error('Error getting proposal:', e);
        return null;
    }
}

function getAllProposals() {
    try {
        const data = localStorage.getItem('valentineProposals');
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error('Error reading proposals:', e);
        
        // Try to recover from backup
        const backup = localStorage.getItem('valentineProposals_backup');
        if (backup) {
            console.log('Recovering from backup...');
            try {
                return JSON.parse(backup);
            } catch (backupError) {
                console.error('Backup also corrupted:', backupError);
            }
        }
        
        return {};
    }
}

function createAutoBackup(proposals) {
    try {
        localStorage.setItem('valentineProposals_backup', JSON.stringify(proposals));
        localStorage.setItem('valentineProposals_backup_date', new Date().toISOString());
        console.log('✅ Auto-backup created');
    } catch (e) {
        console.warn('Could not create backup:', e);
    }
}

function deleteProposal(id) {
    try {
        const proposals = getAllProposals();
        delete proposals[id];
        localStorage.setItem('valentineProposals', JSON.stringify(proposals));
        return true;
    } catch (e) {
        console.error('Error deleting proposal:', e);
        return false;
    }
}

// ====================================
// ADMIN DASHBOARD
// ====================================
function loadDashboardData() {
    const proposals = getAllProposals();
    const proposalsArray = Object.entries(proposals).map(([id, data]) => ({ id, ...data }));
    
    // Calculate statistics
    const total = proposalsArray.length;
    const accepted = proposalsArray.filter(p => p.yesClicked).length;
    const totalViews = proposalsArray.reduce((sum, p) => sum + (p.views || 0), 0);
    const successRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    
    // Update stats
    document.getElementById('totalProposals').textContent = total;
    document.getElementById('acceptedProposals').textContent = accepted;
    document.getElementById('successRate').textContent = successRate + '%';
    document.getElementById('totalViews').textContent = totalViews;
    
    // Update table
    const tbody = document.getElementById('proposalsTableBody');
    tbody.innerHTML = '';
    
    // Sort by date (newest first)
    proposalsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    proposalsArray.forEach(proposal => {
        const row = document.createElement('tr');
        const date = new Date(proposal.createdAt).toLocaleDateString();
        const status = proposal.yesClicked ? '✅ Accepted' : (proposal.views > 0 ? '👀 Viewed' : '📤 Sent');
        
        row.innerHTML = `
            <td>${date}</td>
            <td>${proposal.senderName}</td>
            <td>${proposal.recipientName}</td>
            <td>${formatTemplateName(proposal.template)}</td>
            <td>${status}</td>
            <td>${proposal.noClicks || 0}</td>
            <td>${proposal.views || 0}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    if (proposalsArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--gray);">No proposals yet</td></tr>';
    }
}

function formatTemplateName(template) {
    return template.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function exportData() {
    const proposals = getAllProposals();
    const proposalsArray = Object.entries(proposals).map(([id, data]) => ({ id, ...data }));
    
    if (proposalsArray.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Create CSV
    let csv = 'Date,Sender,Recipient,Template,Status,No Clicks,Views,Message\n';
    
    proposalsArray.forEach(proposal => {
        const date = new Date(proposal.createdAt).toLocaleDateString();
        const status = proposal.yesClicked ? 'Accepted' : (proposal.views > 0 ? 'Viewed' : 'Sent');
        const message = proposal.message.replace(/,/g, ';').replace(/\n/g, ' ');
        
        csv += `${date},"${proposal.senderName}","${proposal.recipientName}","${formatTemplateName(proposal.template)}",${status},${proposal.noClicks || 0},${proposal.views || 0},"${message}"\n`;
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `valentine-proposals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    playSound('success');
}

function clearAllData() {
    if (confirm('Are you sure you want to delete ALL proposal data? This cannot be undone!')) {
        if (confirm('Really sure? This will permanently delete everything!')) {
            localStorage.removeItem('valentineProposals');
            loadDashboardData();
            alert('All data has been cleared');
        }
    }
}

// ====================================
// INITIALIZATION
// ====================================
document.addEventListener('DOMContentLoaded', () => {
    // Check URL path for admin access
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const proposalId = urlParams.get('id');
    
    // Route to appropriate page
    if (path.includes('/admin') || path.includes('admin.html')) {
        showAdminLogin();
    } else if (proposalId) {
        loadProposal();
    } else {
        showLanding();
        createFloatingHearts();
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAdminLogin();
            closeSuccessModal();
        }
    });
    
    // Test localStorage availability on load
    testLocalStorage();
});

// ====================================
// STORAGE AVAILABILITY TEST
// ====================================
function testLocalStorage() {
    try {
        const testKey = '__valentine_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        console.error('localStorage not available:', e);
        showStorageWarning();
        return false;
    }
}

function showStorageWarning() {
    const warning = document.createElement('div');
    warning.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff1744;
        color: white;
        padding: 1rem;
        text-align: center;
        z-index: 10000;
        font-weight: 600;
    `;
    warning.textContent = '⚠️ Warning: Data storage not available. Proposals may not be saved.';
    document.body.appendChild(warning);
    
    setTimeout(() => {
        warning.remove();
    }, 5000);
}

// ====================================
// UTILITY FUNCTIONS
// ====================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Prevent right-click on photos (optional protection)
document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
    }
});

// Handle window resize
window.addEventListener('resize', debounce(() => {
    // Recalculate positions if needed
    if (document.querySelector('.btn-no')) {
        // Reset no button position on resize
        const noButton = document.querySelector('.btn-no');
        if (noButton) {
            noButton.style.left = '50%';
            noButton.style.top = '0';
            noButton.style.transform = 'translateX(-50%)';
        }
    }
}, 250));

// Console Easter Egg
console.log('%c💘 Summit Technologies Valentine Creator', 'color: #ff1744; font-size: 20px; font-weight: bold;');
console.log('%cMade with love in Sierra Leone 🇸🇱', 'color: #f50057; font-size: 14px;');
console.log('%cAdmin password hint: Check the code or ask the developer! 😉', 'color: #666; font-size: 12px;');
