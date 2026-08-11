// Typing Tutor Logic

const keyboardLayout = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
    ['CapsLock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
    ['ShiftLeft', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'ShiftRight'],
    ['Space']
];

// Mapping characters to fingers for touch typing
const fingerMapping = {
    // Left Pinky
    '`': 'l-pinky', '1': 'l-pinky', 'q': 'l-pinky', 'a': 'l-pinky', 'z': 'l-pinky', 'ShiftLeft': 'l-pinky',
    // Left Ring
    '2': 'l-ring', 'w': 'l-ring', 's': 'l-ring', 'x': 'l-ring',
    // Left Middle
    '3': 'l-middle', 'e': 'l-middle', 'd': 'l-middle', 'c': 'l-middle',
    // Left Index
    '4': 'l-index', '5': 'l-index', 'r': 'l-index', 't': 'l-index', 'f': 'l-index', 'g': 'l-index', 'v': 'l-index', 'b': 'l-index',
    // Right Index
    '6': 'r-index', '7': 'r-index', 'y': 'r-index', 'u': 'r-index', 'h': 'r-index', 'j': 'r-index', 'n': 'r-index', 'm': 'r-index',
    // Right Middle
    '8': 'r-middle', 'i': 'r-middle', 'k': 'r-middle', ',': 'r-middle',
    // Right Ring
    '9': 'r-ring', 'o': 'r-ring', 'l': 'r-ring', '.': 'r-ring',
    // Right Pinky
    '0': 'r-pinky', '-': 'r-pinky', '=': 'r-pinky', 'p': 'r-pinky', '[': 'r-pinky', ']': 'r-pinky', '\\': 'r-pinky', ';': 'r-pinky', "'": 'r-pinky', '/': 'r-pinky', 'ShiftRight': 'r-pinky', 'Enter': 'r-pinky', 'Backspace': 'r-pinky',
    // Thumbs (Space)
    ' ': 'r-thumb',
    'Space': 'r-thumb'
};

// Shift key character mapping for finding base key
const shiftMapping = {
    '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=',
    '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/'
};

const texts = [
    "Type this to see the popup!",
    "The quick brown fox jumps over the lazy dog.",
    "Practice makes perfect when learning to touch type.",
    "Glassmorphism adds a modern and elegant feel to interfaces.",
    "0123456789 - Practice the number row precisely.",
    "Punctuation! It makes sentences pop, right? Yes, it does.",
    "function getBaseRect(el) { return el.getBoundingClientRect(); }"
];

let currentTextIndex = 0;
let targetText = texts[currentTextIndex];
let currentIndex = 0;
let errors = 0;
let startTime = null;
let isFinished = false;
let isPlaying = false; // explicitly tracks if we are in active typing mode
let statsInterval = null;
let isTutorialMode = false;

const completedTextEl = document.getElementById('completed-text');
const currentCharEl = document.getElementById('current-char');
const remainingTextEl = document.getElementById('remaining-text');
const fingerHintEl = document.getElementById('finger-hint');
const lessonListEl = document.getElementById('lesson-list');
const keyboardContainer = document.getElementById('virtual-keyboard');
const wpmEl = document.getElementById('wpm');
const accuracyEl = document.getElementById('accuracy');
const notificationModal = document.getElementById('notification-modal');
const startLessonOverlay = document.getElementById('start-lesson-overlay');
const startLessonBtn = document.getElementById('start-lesson-btn');
const abandonModal = document.getElementById('abandon-modal');
const confirmAbandonBtn = document.getElementById('confirm-abandon-btn');
const cancelAbandonBtn = document.getElementById('cancel-abandon-btn');
const policyLink = document.getElementById('policy-link');
const policyModal = document.getElementById('policy-modal');
const closePolicyBtn = document.getElementById('close-policy-btn');

let pendingLessonIndex = null;


function initKeyboard() {
    keyboardContainer.innerHTML = '';
    
    keyboardLayout.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'keyboard-row';
        
        row.forEach(key => {
            const keyEl = document.createElement('div');
            keyEl.className = 'key';
            keyEl.setAttribute('data-key', key);
            
            // Assign finger mapping for color coding
            const fId = fingerMapping[key.toLowerCase()] || fingerMapping[key];
            if (fId) {
                keyEl.setAttribute('data-finger', fId);
            }
            
            // Special keys
            if (key.length > 1) {
                keyEl.classList.add('special');
                keyEl.textContent = key === 'ShiftLeft' || key === 'ShiftRight' ? 'Shift' : key;
                if(key === 'Space') keyEl.textContent = '';
            } else {
                keyEl.textContent = key;
            }
            
            rowEl.appendChild(keyEl);
        });
        
        keyboardContainer.appendChild(rowEl);
    });
}

function renderLessonList() {
    if (!lessonListEl) return;
    lessonListEl.innerHTML = '';
    texts.forEach((text, index) => {
        const li = document.createElement('li');
        const preview = text.length > 22 ? text.substring(0, 19) + '...' : text;
        li.textContent = `Lesson ${index + 1}: ${preview}`;
        
        if (index < currentTextIndex) {
            li.classList.add('completed');
        } else if (index === currentTextIndex) {
            li.classList.add('active');
        }
        
        li.addEventListener('click', () => {
            if (index === currentTextIndex) return; // already on this lesson
            
            if (isPlaying && currentIndex > 0 && !isFinished) {
                // User is actively practicing, show confirmation modal
                pendingLessonIndex = index;
                abandonModal.classList.remove('hidden');
            } else {
                // Not actively practicing, load immediately
                loadLesson(index);
            }
        });
        
        lessonListEl.appendChild(li);
    });
}

function updateTextDisplay() {
    if (currentIndex >= targetText.length) {
        // Completed
        completedTextEl.textContent = targetText;
        currentCharEl.textContent = '';
        remainingTextEl.textContent = '';
        isFinished = true;
        finishLesson();
        return;
    }
    
    completedTextEl.textContent = targetText.substring(0, currentIndex);
    const currentChar = targetText[currentIndex];
    currentCharEl.textContent = currentChar === ' ' ? ' ' : currentChar; // Handle space visibly if needed
    
    // Quick fix to make space visible when it's the current char
    if (currentChar === ' ') {
        currentCharEl.style.padding = '0 8px';
    } else {
        currentCharEl.style.padding = '0 2px';
    }
    
    remainingTextEl.textContent = targetText.substring(currentIndex + 1);
    
    currentCharEl.classList.remove('error');
    
    // Auto-scroll the text wrapper so the current line is always in focus
    if (currentCharEl) {
        currentCharEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    if (isPlaying) {
        highlightNextKey(currentChar);
    } else {
        // clear highlights if not playing
        document.querySelectorAll('.key').forEach(k => k.classList.remove('highlight'));
        document.querySelectorAll('.finger').forEach(f => {
            f.classList.remove('active');
        });
    }
}

function getBaseRect(el) {
    // Mathematically deduce base position without modifying DOM
    const currentX = parseFloat(el.style.getPropertyValue('--move-x')) || 0;
    const currentY = parseFloat(el.style.getPropertyValue('--move-y')) || 0;
    const rect = el.getBoundingClientRect();
    
    return {
        left: rect.left - currentX,
        top: rect.top - currentY,
        width: rect.width,
        height: rect.height
    };
}

function highlightNextKey(char) {
    // Reset all highlights
    document.querySelectorAll('.key').forEach(k => k.classList.remove('highlight'));
    document.querySelectorAll('.finger').forEach(f => {
        f.classList.remove('active');
        f.style.setProperty('--move-x', '0px');
        f.style.setProperty('--move-y', '0px');
    });
    
    let baseChar = char.toLowerCase();
    let needsShift = false;
    
    // Check if character needs shift
    if (char !== baseChar || shiftMapping[char]) {
        needsShift = true;
        if (shiftMapping[char]) {
            baseChar = shiftMapping[char];
        }
    }
    
    if (baseChar === ' ') baseChar = 'Space';
    
    // Highlight base key
    let hintText = '';
    const keyEl = document.querySelector(`.key[data-key="${CSS.escape(baseChar)}"]`);
    if (keyEl) {
        keyEl.classList.add('highlight');
        
        // Highlight finger
        const fingerId = fingerMapping[baseChar];
        if (fingerId) {
            const fingerEl = document.querySelector(`.finger[data-finger="${fingerId}"]`);
            if (fingerEl) {
                hintText = fingerEl.getAttribute('data-name') || '';
                
                // Move finger to key
                const keyRect = keyEl.getBoundingClientRect();
                const fingerRect = getBaseRect(fingerEl);
                
                const deltaX = keyRect.left + (keyRect.width / 2) - (fingerRect.left + (fingerRect.width / 2));
                const deltaY = keyRect.bottom - 15 - fingerRect.top;
                
                fingerEl.style.setProperty('--move-x', `${deltaX}px`);
                fingerEl.style.setProperty('--move-y', `${deltaY}px`);
                fingerEl.classList.add('active');
            }
        }
    }
    
    // Highlight shift if needed
    if (needsShift) {
        // Determine which shift to use (opposite hand)
        const baseFinger = fingerMapping[baseChar] || '';
        const shiftKey = baseFinger.startsWith('l-') ? 'ShiftRight' : 'ShiftLeft';
        const shiftFinger = baseFinger.startsWith('l-') ? 'r-pinky' : 'l-pinky';
        
        const shiftEl = document.querySelector(`.key[data-key="${shiftKey}"]`);
        if (shiftEl) shiftEl.classList.add('highlight');
        
        const shiftFingerEl = document.querySelector(`.finger[data-finger="${shiftFinger}"]`);
        if (shiftFingerEl && shiftEl) {
            const shiftHint = shiftFingerEl.getAttribute('data-name') || '';
            if (shiftHint && hintText) {
                hintText = `${shiftHint} + ${hintText}`;
            } else if (shiftHint) {
                hintText = shiftHint;
            }
            
            const keyRect = shiftEl.getBoundingClientRect();
            const fingerRect = getBaseRect(shiftFingerEl);
            
            const deltaX = keyRect.left + (keyRect.width / 2) - (fingerRect.left + (fingerRect.width / 2));
            const deltaY = keyRect.bottom - 15 - fingerRect.top;
            
            shiftFingerEl.style.setProperty('--move-x', `${deltaX}px`);
            shiftFingerEl.style.setProperty('--move-y', `${deltaY}px`);
            shiftFingerEl.classList.add('active');
        }
    }
    
    if (fingerHintEl) {
        fingerHintEl.textContent = hintText ? `Use ${hintText}` : '';
    }
}







function handleKeyPress(e) {
    if (isFinished) {
        if (e.key === 'Enter') {
            nextLesson();
        }
        return;
    }
    
    if (!isPlaying) return;
    
    // Ignore keystrokes if the user is typing in the textarea
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    
    // Ignore modifier keys alone
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        // Just animate the key if it exists
        animateKey(e.code);
        return;
    }
    

    // Start timer on first key
    if (currentIndex === 0 && !startTime) {
        startTime = new Date();
        statsInterval = setInterval(updateStats, 1000);
    }
    
    const targetChar = targetText[currentIndex];
    
    if (e.key === targetChar) {
        // Correct
        currentIndex++;
        updateTextDisplay();
        updateStats();
        animateKey(e.key === ' ' ? 'Space' : e.key.toLowerCase(), e.code);
    } else {
        // Incorrect
        errors++;
        currentCharEl.classList.add('error');
        updateStats();
        animateKey(e.key === ' ' ? 'Space' : e.key.toLowerCase(), e.code);
    }
    
    e.preventDefault();
}

function animateKey(keyChar, code) {
    // Try to find the exact key by code first (e.g. Space, ShiftLeft)
    let keyEl = document.querySelector(`.key[data-key="${CSS.escape(code)}"]`);
    
    // If not found by code, try by character
    if (!keyEl) {
        keyEl = document.querySelector(`.key[data-key="${CSS.escape(keyChar)}"]`);
    }
    
    if (keyEl) {
        keyEl.classList.add('pressed');
        setTimeout(() => keyEl.classList.remove('pressed'), 150);
    }
}

function updateStats() {
    if (!startTime) return;
    
    const now = new Date();
    const timeElapsedInMinutes = (now - startTime) / 60000;
    
    // Words per minute calculation (standard is 5 chars = 1 word)
    const wordsTyped = (currentIndex) / 5;
    const wpm = timeElapsedInMinutes > 0 ? Math.round(wordsTyped / timeElapsedInMinutes) : 0;
    
    // Accuracy
    const totalStrokes = currentIndex + errors;
    const accuracy = totalStrokes > 0 ? Math.round((currentIndex / totalStrokes) * 100) : 100;
    
    wpmEl.textContent = `${wpm} WPM`;
    accuracyEl.textContent = `${accuracy}% Accuracy`;
}

function finishLesson() {
    if (statsInterval) clearInterval(statsInterval);
    document.querySelectorAll('.key').forEach(k => k.classList.remove('highlight'));
    document.querySelectorAll('.finger').forEach(f => {
        f.classList.remove('active');
        f.style.setProperty('--move-x', '0px');
        f.style.setProperty('--move-y', '0px');
    });
    
    setTimeout(() => {
        notificationModal.classList.remove('hidden');
    }, 500);
}

function loadLesson(index) {
    if (index >= texts.length) return;
    currentTextIndex = index;
    targetText = texts[currentTextIndex];
    currentIndex = 0;
    errors = 0;
    startTime = null;
    isFinished = false;
    isPlaying = false; // Wait for user to start
    
    if (statsInterval) clearInterval(statsInterval);
    wpmEl.textContent = '0';
    accuracyEl.textContent = '100';
    
    // Show start overlay
    startLessonOverlay.classList.remove('hidden');
    
    updateTextDisplay();
    renderLessonList();
}

function nextLesson() {
    notificationModal.classList.add('hidden');
    currentTextIndex = (currentTextIndex + 1) % texts.length;
    loadLesson(currentTextIndex);
}


// --- Custom Lesson Logic ---
const customLessonTextEl = document.getElementById('custom-lesson-text');
const addCustomLessonBtn = document.getElementById('add-custom-lesson-btn');

addCustomLessonBtn.addEventListener('click', () => {
    let customText = customLessonTextEl.value.trim();
    if (customText.length > 0) {
        // Sanitize spaces to single spaces to avoid formatting issues
        customText = customText.replace(/\s+/g, ' ');
        
        texts.push(customText);
        const newIndex = texts.length - 1;
        customLessonTextEl.value = ''; // clear input
        
        if (isPlaying && currentIndex > 0 && !isFinished) {
            // User is actively practicing, show confirmation modal
            pendingLessonIndex = newIndex;
            abandonModal.classList.remove('hidden');
        } else {
            // Jump directly to this new lesson
            loadLesson(newIndex);
        }
        
        // Scroll the lesson list to the bottom
        setTimeout(() => {
            const scrollArea = document.querySelector('.lesson-scroll-area');
            if (scrollArea) {
                scrollArea.scrollTop = scrollArea.scrollHeight;
            }
        }, 50);
    }
});


startLessonBtn.addEventListener('click', () => {
    isPlaying = true;
    startLessonOverlay.classList.add('hidden');
    highlightNextKey(targetText[currentIndex]);
    document.body.focus();
});

// Abandon Modal Listeners
cancelAbandonBtn.addEventListener('click', () => {
    abandonModal.classList.add('hidden');
    pendingLessonIndex = null;
    document.body.focus();
});

confirmAbandonBtn.addEventListener('click', () => {
    abandonModal.classList.add('hidden');
    if (pendingLessonIndex !== null) {
        loadLesson(pendingLessonIndex);
        pendingLessonIndex = null;
    }
});

// Policy Modal Listeners
policyLink.addEventListener('click', (e) => {
    e.preventDefault();
    policyModal.classList.remove('hidden');
});

closePolicyBtn.addEventListener('click', () => {
    policyModal.classList.add('hidden');
    document.body.focus();
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === policyModal) {
        policyModal.classList.add('hidden');
        document.body.focus();
    }
});


function init() {
    initKeyboard();
    updateTextDisplay(); // This naturally calls highlightNextKey(currentChar)
    renderLessonList();
    
    document.addEventListener('keydown', handleKeyPress);
}

// Initialize
init();
