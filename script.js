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
        
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        callback(compressed);
    };
    img.src = base64;
}

// ====================================
// PREVIEW & GENERATE LINK
// ====================================
function showPreview() {
    const proposalData = collectFormData();
    
    // Generate unique ID
    const proposalId = generateId();
    currentProposalId = proposalId;
    
    // Save to localStorage
    saveProposal(proposalId, proposalData);
    
    // Generate link
    const link = `${window.location.origin}${window.location.pathname}?id=${proposalId}`;
    document.getElementById('proposalLink').value = link;
    
    // Render preview
    renderProposalPreview(proposalData);
    
    // Show step 5
    nextStep(5);
}

function collectFormData() {
    const messageTemplate = document.getElementById('messageTemplate').value;
    const customMessage = document.getElementById('customMessage').value;
    
    return {
        recipientName: document.getElementById('recipientName').value,
        senderName: document.getElementById('senderName').value || 'Anonymous',
        message: messageTemplate === 'custom' ? customMessage : messageTemplate,
        template: document.getElementById('selectedTemplate').value,
        photos: uploadedPhotos.filter(p => p !== null),
        enableMusic: document.getElementById('enableMusic').checked,
        enableSoundEffects: document.getElementById('enableSoundEffects').checked,
        noButtonDifficulty: document.getElementById('noButtonDifficulty').value,
        language: document.getElementById('language').value,
        createdAt: new Date().toISOString(),
        status: 'pending',
        views: 0,
        noClicks: 0,
        yesClicked: false
    };
}

function renderProposalPreview(data) {
    const container = document.getElementById('previewContainer');
    
    container.innerHTML = `
        <div class="proposal-view template-${data.template}-view" style="width: 100%; max-width: 500px; min-height: 400px;">
            <div class="proposal-message">
                <h1 class="proposal-recipient">${data.recipientName}</h1>
                <p class="proposal-text">${data.message}</p>
            </div>
            ${data.photos.length > 0 ? `
                <div class="proposal-photos">
                    ${data.photos.map(photo => `
                        <div class="proposal-photo">
                            <img src="${photo}" alt="Memory">
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            <div class="proposal-buttons" style="position: relative; height: 80px;">
                <button class="btn-yes" style="position: relative; z-index: 1;">Yes! 💕</button>
                <button class="btn-no" disabled>No 😢</button>
            </div>
            <div style="text-align: center; margin-top: 2rem; color: white; font-size: 0.9rem; opacity: 0.8;">
                Preview Mode - No button is disabled
            </div>
        </div>
    `;
}

// ====================================
// LINK SHARING
// ====================================
function copyLink() {
    const linkInput = document.getElementById('proposalLink');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    
    navigator.clipboard.writeText(linkInput.value).then(() => {
        const btn = event.target.closest('.btn-copy');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Copied!';
        btn.style.background = 'var(--success)';
        btn.style.color = 'white';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.style.color = '';
        }, 2000);
        
        playSound('success');
    });
}

function shareWhatsApp() {
    const link = document.getElementById('proposalLink').value;
    const recipientName = document.getElementById('recipientName').value;
    const message = `💘 Someone has a special Valentine's question for ${recipientName}! Open this link to see: ${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function downloadQR() {
    const link = document.getElementById('proposalLink').value;
    
    // Create QR code container
    const qrContainer = document.createElement('div');
    qrContainer.style.padding = '20px';
    qrContainer.style.background = 'white';
    qrContainer.style.borderRadius = '16px';
    
    // Generate QR code
    new QRCode(qrContainer, {
        text: link,
        width: 256,
        height: 256,
        colorDark: '#ff1744',
        colorLight: '#ffffff'
    });
    
    // Download as image
    setTimeout(() => {
        const canvas = qrContainer.querySelector('canvas');
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'valentine-qr-code.png';
        a.click();
        
        playSound('success');
    }, 100);
}

// ====================================
// RESET FORM
// ====================================
function resetForm() {
    document.getElementById('proposalForm').reset();
    uploadedPhotos = [];
    currentStep = 1;
    
    // Reset photo slots
    for (let i = 1; i <= MAX_PHOTOS; i++) {
        const preview = document.getElementById(`photoPreview${i}`);
        const label = document.querySelector(`#photoSlot${i} .photo-label`);
        const removeBtn = document.querySelector(`#photoSlot${i} .remove-photo`);
        
        if (preview) preview.style.display = 'none';
        if (label) label.style.display = 'flex';
        if (removeBtn) removeBtn.style.display = 'none';
        
        if (i > 1) {
            document.getElementById(`photoSlot${i}`).style.display = 'none';
        }
    }
    
    // Reset template selection
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Show first step
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelector('[data-step="1"]').classList.add('active');
}

function createAnother() {
    resetForm();
    showCreator();
}

// ====================================
// PROPOSAL VIEW
// ====================================
function loadProposal() {
    const urlParams = new URLSearchParams(window.location.search);
    const proposalId = urlParams.get('id');
    
    if (!proposalId) {
        showLanding();
        return;
    }
    
    const proposal = getProposal(proposalId);
    
    if (!proposal) {
        alert('Proposal not found!');
        showLanding();
        return;
    }
    
    // Increment views
    proposal.views++;
    updateProposal(proposalId, proposal);
    
    renderProposal(proposalId, proposal);
    showPage('proposalPage');
    
    // Play background music if enabled
    if (proposal.enableMusic) {
        playBackgroundMusic();
    }
}

function renderProposal(proposalId, data) {
    const container = document.getElementById('proposalContent');
    
    const translations = {
        en: {
            yes: 'Yes! 💕',
            no: 'No 😢'
        },
        krio: {
            yes: 'Yes! 💕',
            no: 'No 😢'
        }
    };
    
    const lang = data.language || 'en';
    
    container.className = `proposal-view template-${data.template}-view`;
    container.innerHTML = `
        <div class="no-counter" style="display: none;">
            Escape attempts: <span id="noClickCount">0</span>
        </div>
        
        <div class="proposal-message">
            <h1 class="proposal-recipient">${data.recipientName}</h1>
            <p class="proposal-text">${data.message}</p>
            ${data.senderName !== 'Anonymous' ? `<p class="proposal-text" style="font-size: 1.5rem; margin-top: 1rem;">- ${data.senderName}</p>` : ''}
        </div>
        
        ${data.photos.length > 0 ? `
            <div class="proposal-photos">
                ${data.photos.map(photo => `
                    <div class="proposal-photo">
                        <img src="${photo}" alt="Memory">
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <div class="proposal-buttons" style="position: relative; min-height: 100px;">
            <button class="btn-yes" onclick="handleYes('${proposalId}')">${translations[lang].yes}</button>
            <button class="btn-no" id="noButton" onclick="handleNo('${proposalId}', '${data.noButtonDifficulty}')">${translations[lang].no}</button>
        </div>
        
        <div class="summit-badge" style="margin-top: 3rem;">
            <p style="color: white; opacity: 0.7;">Powered by <strong>Summit Technologies</strong></p>
        </div>
    `;
    
    // Initialize no button behavior
    initializeNoButton(proposalId, data.noButtonDifficulty, data.enableSoundEffects);
}

// ====================================
// NO BUTTON BEHAVIOR
// ====================================
function initializeNoButton(proposalId, difficulty, soundEnabled) {
    const noButton = document.getElementById('noButton');
    const container = noButton.parentElement;
    
    const difficultySettings = {
        easy: { speed: 300, distance: 100 },
        medium: { speed: 200, distance: 150 },
        hard: { speed: 100, distance: 200 }
    };
    
    const settings = difficultySettings[difficulty] || difficultySettings.medium;
    
    // Mouse enter event
    noButton.addEventListener('mouseenter', () => {
        moveNoButton();
        if (soundEnabled) playSound('no');
    });
    
    // Touch start for mobile
    noButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        moveNoButton();
        if (soundEnabled) playSound('no');
    });
    
    function moveNoButton() {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = noButton.getBoundingClientRect();
        
        let newX, newY;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
            newX = Math.random() * (containerRect.width - buttonRect.width);
            newY = Math.random() * (containerRect.height - buttonRect.height);
            attempts++;
        } while (attempts < maxAttempts && (
            Math.abs(newX - (buttonRect.left - containerRect.left)) < settings.distance ||
            Math.abs(newY - (buttonRect.top - containerRect.top)) < settings.distance
        ));
        
        noButton.style.transition = `all ${settings.speed}ms ease`;
        noButton.style.left = `${newX}px`;
        noButton.style.top = `${newY}px`;
        noButton.style.transform = 'none';
        
        // Update counter
        noButtonAttempts++;
        document.getElementById('noClickCount').textContent = noButtonAttempts;
        document.querySelector('.no-counter').style.display = 'block';
        
        // Update in localStorage
        const proposal = getProposal(proposalId);
        proposal.noClicks = noButtonAttempts;
        updateProposal(proposalId, proposal);
        
        // Add shake animation
        if (noButtonAttempts % 5 === 0) {
            noButton.style.animation = 'shake 0.5s';
            setTimeout(() => {
                noButton.style.animation = '';
            }, 500);
        }
        
        // Add size change on higher attempts
        if (noButtonAttempts > 10) {
            noButton.style.transform = `scale(${0.8 + Math.random() * 0.4})`;
        }
        
        // Make it transparent occasionally
        if (noButtonAttempts > 15 && Math.random() > 0.7) {
            noButton.style.opacity = '0.3';
            setTimeout(() => {
                noButton.style.opacity = '1';
            }, 500);
        }
    }
}

function handleNo(proposalId, difficulty) {
    // This function is called if they actually manage to click it
    noButtonAttempts++;
    const proposal = getProposal(proposalId);
    proposal.noClicks = noButtonAttempts;
    updateProposal(proposalId, proposal);
    
    alert('Nice try! But think again... 😊');
}

function handleYes(proposalId) {
    // Update proposal status
    const proposal = getProposal(proposalId);
    proposal.status = 'accepted';
    proposal.yesClicked = true;
    proposal.acceptedAt = new Date().toISOString();
    updateProposal(proposalId, proposal);
    
    // Trigger confetti
    triggerConfetti();
    
    // Play success sound
    playSound('celebration');
    
    // Show success modal
    setTimeout(() => {
        showSuccessModal(proposal);
    }, 1000);
}

function showSuccessModal(proposal) {
    const modal = document.getElementById('successModal');
    document.getElementById('successMessage').textContent = 'They said YES! 💕';
    document.getElementById('successSubtext').textContent = `${proposal.recipientName} accepted! Love wins! 🎉`;
    modal.classList.add('active');
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('active');
}

// ====================================
// CONFETTI ANIMATION
// ====================================
function triggerConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;
    
    const colors = ['#ff1744', '#f50057', '#ff80ab', '#ff4081'];
    
    (function frame() {
        confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
        });
        confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
        });
        
        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
    
    // Heart burst
    setTimeout(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: colors,
            shapes: ['circle'],
            scalar: 2
        });
    }, 500);
}

// ====================================
// SOUND EFFECTS
// ====================================
const sounds = {
    click: () => playBeep(200, 0.1, 'sine'),
    upload: () => playBeep(400, 0.15, 'sine'),
    success: () => {
        playBeep(523, 0.1, 'sine');
        setTimeout(() => playBeep(659, 0.1, 'sine'), 100);
        setTimeout(() => playBeep(784, 0.2, 'sine'), 200);
    },
    celebration: () => {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => playBeep(400 + i * 100, 0.1, 'sine'), i * 100);
        }
    },
    no: () => playBeep(150, 0.1, 'square')
};

function playSound(type) {
    if (sounds[type]) {
        sounds[type]();
    }
}

function playBeep(frequency, duration, type = 'sine') {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.log('Audio not supported');
    }
}

function playBackgroundMusic() {
    // Simple romantic melody
    const melody = [
        { freq: 523.25, duration: 0.5 },
        { freq: 587.33, duration: 0.5 },
        { freq: 659.25, duration: 0.5 },
        { freq: 698.46, duration: 1 }
    ];
    
    let delay = 0;
    melody.forEach(note => {
        setTimeout(() => playBeep(note.freq, note.duration, 'sine'), delay);
        delay += note.duration * 1000;
    });
}

// ====================================
// LOCAL STORAGE MANAGEMENT
// ====================================
function generateId() {
    return 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function saveProposal(id, data) {
    try {
        // Get existing proposals
        const proposals = getAllProposals();
        
        // Add timestamp if not exists
        if (!data.createdAt) {
            data.createdAt = new Date().toISOString();
        }
        
        // Add metadata
        data.lastUpdated = new Date().toISOString();
        data.version = '1.0';
        
        // Save proposal
        proposals[id] = data;
        
        // Convert to JSON string
        const jsonString = JSON.stringify(proposals);
        
        // Check size (localStorage limit is ~5-10MB)
        const sizeInBytes = new Blob([jsonString]).size;
        const sizeInMB = sizeInBytes / (1024 * 1024);
        
        if (sizeInMB > 4) {
            console.warn('Storage approaching limit. Consider clearing old proposals.');
            alert('Storage is getting full. You may want to export and clear old proposals from admin dashboard.');
        }
        
        // Save to localStorage
        localStorage.setItem('valentineProposals', jsonString);
        
        // Verify save was successful
        const saved = localStorage.getItem('valentineProposals');
        if (!saved) {
            throw new Error('Failed to verify saved data');
        }
        
        console.log(`✅ Proposal ${id} saved successfully (${sizeInMB.toFixed(2)}MB used)`);
        return true;
    } catch (e) {
        console.error('Error saving proposal:', e);
        
        // Show user-friendly error
        if (e.name === 'QuotaExceededError') {
            alert('Storage is full! Please clear old proposals from the admin dashboard or use a different browser.');
        } else {
            alert('Error saving proposal. Please try again or use a different browser.');
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

function updateProposal(id, data) {
    return saveProposal(id, data);
}

function getAllProposals() {
    try {
        const data = localStorage.getItem('valentineProposals');
        const proposals = data ? JSON.parse(data) : {};
        
        // Create automatic backup every 10 proposals
        const proposalCount = Object.keys(proposals).length;
        if (proposalCount > 0 && proposalCount % 10 === 0) {
            createAutoBackup(proposals);
        }
        
        return proposals;
    } catch (e) {
        console.error('Error getting proposals:', e);
        
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