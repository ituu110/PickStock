// PickStock App - Gamification Pattern
class PickStockGameApp {
    constructor() {
        this.items = this.loadItems();
        this.currentEditId = null;
        this.playerData = this.loadPlayerData();
        this.achievements = this.loadAchievements();
        this.init();
    }

    init() {
        this.renderItems();
        this.updateStats();
        this.updatePlayerStats();
        this.setupEventListeners();
        this.checkAchievements();
    }

    setupEventListeners() {
        // Add button
        const addButton = document.getElementById('addButton');
        if (addButton) {
            addButton.addEventListener('click', () => {
                this.showAddForm();
            });
        }

        // Form submission
        const itemForm = document.getElementById('itemForm');
        if (itemForm) {
            itemForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveItem();
            });
        }

        // Pick button
        const pickButton = document.getElementById('pickButton');
        if (pickButton) {
            pickButton.addEventListener('click', () => {
                if (this.items.length > 0) {
                    this.pickRandom();
                }
            });
        }

        // Modal backdrop click
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAllModals();
                }
            });
        });

        // Modal close buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close')) {
                this.hideAllModals();
            }
        });

        // Result modal buttons
        const pickAgainButton = document.getElementById('pickAgainButton');
        if (pickAgainButton) {
            pickAgainButton.addEventListener('click', () => {
                this.hideResult();
                if (this.items.length > 0) {
                    this.pickRandom();
                }
            });
        }

        const closeResultButton = document.getElementById('closeResultButton');
        if (closeResultButton) {
            closeResultButton.addEventListener('click', () => {
                this.hideResult();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
            if (e.key === ' ' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.pickRandom();
            }
        });
    }

    // Data Management
    loadItems() {
        try {
            const stored = localStorage.getItem('pickstock-game-items');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading items:', error);
            return [];
        }
    }

    saveItems() {
        try {
            localStorage.setItem('pickstock-game-items', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Failed to save data');
        }
    }

    loadPlayerData() {
        try {
            const stored = localStorage.getItem('pickstock-game-player');
            return stored ? JSON.parse(stored) : {
                level: 1,
                exp: 0,
                totalPicks: 0,
                pickStreak: 0,
                maxStreak: 0,
                itemsAdded: 0,
                joinDate: new Date().toISOString()
            };
        } catch (error) {
            return {
                level: 1,
                exp: 0,
                totalPicks: 0,
                pickStreak: 0,
                maxStreak: 0,
                itemsAdded: 0,
                joinDate: new Date().toISOString()
            };
        }
    }

    savePlayerData() {
        try {
            localStorage.setItem('pickstock-game-player', JSON.stringify(this.playerData));
        } catch (error) {
            console.error('Error saving player data:', error);
        }
    }

    loadAchievements() {
        try {
            const stored = localStorage.getItem('pickstock-game-achievements');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    saveAchievements() {
        try {
            localStorage.setItem('pickstock-game-achievements', JSON.stringify(this.achievements));
        } catch (error) {
            console.error('Error saving achievements:', error);
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Player Progression
    addExp(amount) {
        this.playerData.exp += amount;
        const expNeeded = this.getExpNeeded(this.playerData.level);
        
        if (this.playerData.exp >= expNeeded) {
            this.levelUp();
        }
        
        this.savePlayerData();
        this.updatePlayerStats();
    }

    getExpNeeded(level) {
        return level * 100; // Simple progression: 100, 200, 300, etc.
    }

    levelUp() {
        this.playerData.level++;
        this.playerData.exp = 0;
        this.showLevelUpEffect();
        this.addExp(0); // Trigger stats update
    }

    showLevelUpEffect() {
        const effect = document.getElementById('levelUpEffect');
        const levelText = document.getElementById('levelUpLevel');
        
        levelText.textContent = `Level ${this.playerData.level}`;
        effect.classList.add('show');
        
        // Play level up sound effect (if available)
        this.playSound('levelup');
        
        setTimeout(() => {
            effect.classList.remove('show');
        }, 3000);
    }

    // Achievement System
    checkAchievements() {
        const achievementDefs = [
            {
                id: 'first_pick',
                title: 'First Step!',
                description: 'Complete your first random pick',
                condition: () => this.playerData.totalPicks >= 1,
                exp: 50
            },
            {
                id: 'pick_master',
                title: 'Pick Master',
                description: 'Complete 10 random picks',
                condition: () => this.playerData.totalPicks >= 10,
                exp: 100
            },
            {
                id: 'collector',
                title: 'Collector',
                description: 'Add 5 items to your collection',
                condition: () => this.playerData.itemsAdded >= 5,
                exp: 75
            },
            {
                id: 'streak_5',
                title: 'On Fire!',
                description: 'Achieve a 5-pick streak',
                condition: () => this.playerData.maxStreak >= 5,
                exp: 150
            },
            {
                id: 'level_5',
                title: 'Rising Star',
                description: 'Reach level 5',
                condition: () => this.playerData.level >= 5,
                exp: 200
            }
        ];

        achievementDefs.forEach(achievement => {
            if (!this.achievements.includes(achievement.id) && achievement.condition()) {
                this.unlockAchievement(achievement);
            }
        });
    }

    unlockAchievement(achievement) {
        this.achievements.push(achievement.id);
        this.saveAchievements();
        this.showAchievementToast(achievement);
        this.addExp(achievement.exp);
    }

    showAchievementToast(achievement) {
        const toast = document.getElementById('achievementToast');
        const title = document.getElementById('achievementTitle');
        const description = document.getElementById('achievementDescription');
        
        title.textContent = achievement.title;
        description.textContent = achievement.description;
        
        toast.classList.add('show');
        
        // Play achievement sound
        this.playSound('achievement');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // Sound Effects (placeholder)
    playSound(type) {
        // In a real implementation, you would play actual sound files
        console.log(`Playing ${type} sound effect`);
    }

    // Item Management
    addItem(title, url, note) {
        const item = {
            id: this.generateId(),
            title: title.trim(),
            url: url.trim(),
            note: note.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.items.unshift(item);
        this.playerData.itemsAdded++;
        this.saveItems();
        this.savePlayerData();
        this.renderItems();
        this.updateStats();
        this.addExp(25); // Reward for adding items
        this.checkAchievements();
    }

    updateItem(id, title, url, note) {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            this.items[index] = {
                ...this.items[index],
                title: title.trim(),
                url: url.trim(),
                note: note.trim(),
                updatedAt: new Date().toISOString()
            };
            this.saveItems();
            this.renderItems();
            this.addExp(10); // Small reward for editing
        }
    }

    deleteItem(id) {
        if (confirm('Delete this item?')) {
            this.items = this.items.filter(item => item.id !== id);
            this.saveItems();
            this.renderItems();
            this.updateStats();
        }
    }

    // UI Management
    renderItems() {
        const itemsGrid = document.getElementById('itemsGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.items.length === 0) {
            itemsGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        itemsGrid.style.display = 'grid';
        emptyState.style.display = 'none';

        itemsGrid.innerHTML = this.items.map(item => `
            <div class="item-card" data-id="${item.id}">
                <div class="item-header">
                    <div class="item-title-section">
                        <span class="item-icon">📋</span>
                        <h4 class="item-title">${this.escapeHtml(item.title)}</h4>
                    </div>
                    <div class="item-actions">
                        <button class="item-action edit" onclick="app.editItem('${item.id}')" title="Edit">
                            <span>✏️</span>
                        </button>
                        <button class="item-action delete" onclick="app.deleteItem('${item.id}')" title="Delete">
                            <span>🗑️</span>
                        </button>
                    </div>
                </div>
                ${item.url ? `<div class="item-url-section"><span class="url-icon">🔗</span><a href="${this.escapeHtml(item.url)}" class="item-url" target="_blank" rel="noopener">${this.escapeHtml(item.url)}</a></div>` : ''}
                ${item.note ? `<div class="item-note-section"><span class="note-icon">📝</span><p class="item-note">${this.escapeHtml(item.note)}</p></div>` : ''}
            </div>
        `).join('');
    }

    updateStats() {
        const totalItems = this.items.length;
        const itemCountElement = document.getElementById('itemCount');
        const pickStreakElement = document.getElementById('pickStreak');
        const maxStreakElement = document.getElementById('maxStreak');
        
        if (itemCountElement) itemCountElement.textContent = totalItems;
        if (pickStreakElement) pickStreakElement.textContent = this.playerData.pickStreak;
        if (maxStreakElement) maxStreakElement.textContent = this.playerData.maxStreak;
        
        // Update pick button state
        const pickButton = document.getElementById('pickButton');
        if (pickButton) pickButton.disabled = totalItems === 0;
    }

    updatePlayerStats() {
        document.getElementById('playerLevel').textContent = this.playerData.level;
        document.getElementById('playerExp').textContent = this.playerData.exp;
        document.getElementById('totalPicks').textContent = this.playerData.totalPicks;
        
        // Update EXP bar
        const expNeeded = this.getExpNeeded(this.playerData.level);
        const expPercent = (this.playerData.exp / expNeeded) * 100;
        document.getElementById('expFill').style.width = `${expPercent}%`;
    }

    // Modal Management
    showAddForm() {
        this.currentEditId = null;
        document.getElementById('modalTitle').textContent = 'Add New Item';
        document.getElementById('saveButtonText').textContent = 'Save';
        document.getElementById('itemForm').reset();
        this.showModal('addModal');
        document.getElementById('title').focus();
    }

    editItem(id) {
        const item = this.items.find(item => item.id === id);
        if (!item) return;

        this.currentEditId = id;
        document.getElementById('modalTitle').textContent = 'Edit Item';
        document.getElementById('saveButtonText').textContent = 'Update';
        document.getElementById('title').value = item.title;
        document.getElementById('url').value = item.url || '';
        document.getElementById('note').value = item.note || '';
        this.showModal('addModal');
        document.getElementById('title').focus();
    }

    saveItem() {
        const title = document.getElementById('title').value;
        const url = document.getElementById('url').value;
        const note = document.getElementById('note').value;

        if (!title.trim()) {
            alert('Please enter a title');
            return;
        }

        // Add loading state
        const saveBtn = document.getElementById('saveButtonText');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'SAVING...';

        setTimeout(() => {
            if (this.currentEditId) {
                this.updateItem(this.currentEditId, title, url, note);
            } else {
                this.addItem(title, url, note);
            }

            saveBtn.textContent = originalText;
            this.hideAddForm();
        }, 500);
    }

    hideAddForm() {
        this.hideModal('addModal');
        this.currentEditId = null;
    }

    showModal(modalId) {
        const overlay = document.getElementById(modalId);
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.classList.add('show');
            // Focus first input
            const firstInput = overlay.querySelector('input, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    hideModal(modalId) {
        const overlay = document.getElementById(modalId);
        if (overlay) {
            overlay.classList.remove('show');
            overlay.style.display = 'none';
        }
    }

    hideAllModals() {
        const overlays = document.querySelectorAll('.modal-overlay');
        overlays.forEach(overlay => {
            overlay.classList.remove('show');
            overlay.style.display = 'none';
        });
    }

    // Pick Random Item with Game Effects
    pickRandom() {
        if (this.items.length === 0) {
            alert('No items available. Please add items first.');
            return;
        }

        // Add dramatic loading state
        const pickButton = document.getElementById('pickButton');
        const originalContent = pickButton.innerHTML;
        
        pickButton.innerHTML = `
            <div class="pick-button-inner">
                <div class="pick-button-glow"></div>
                <div class="pick-button-content">
                    <span class="pick-icon">⚡</span>
                    <span class="pick-text">Picking...</span>
                </div>
                <div class="pick-button-ring"></div>
            </div>
        `;
        pickButton.disabled = true;

        // Add screen shake effect
        document.body.style.animation = 'shake 0.5s ease-in-out infinite';

        // Create particle effects
        this.createPickEffects();

        // Simulate dramatic selection delay
        setTimeout(() => {
            document.body.style.animation = '';
            
            const randomIndex = Math.floor(Math.random() * this.items.length);
            const selectedItem = this.items[randomIndex];
            
            // Update player stats
            this.playerData.totalPicks++;
            this.playerData.pickStreak++;
            if (this.playerData.pickStreak > this.playerData.maxStreak) {
                this.playerData.maxStreak = this.playerData.pickStreak;
            }
            
            // Award EXP based on streak
            const expGain = 10 + (this.playerData.pickStreak * 2);
            this.addExp(expGain);
            
            this.savePlayerData();
            this.updateStats();
            this.updatePlayerStats();
            this.checkAchievements();
            
            this.showResult(selectedItem, expGain);
            
            // Restore button
            pickButton.innerHTML = originalContent;
            pickButton.disabled = false;
            
            // Play pick sound
            this.playSound('pick');
        }, 1000);
    }

    createPickEffects() {
        const effectsContainer = document.getElementById('pickEffects');
        if (!effectsContainer) return; // Guard against missing container
        effectsContainer.innerHTML = '';
        
        // Create multiple particle effects
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: ${['#00d4ff', '#ff6b35', '#ffd700'][Math.floor(Math.random() * 3)]};
                border-radius: 50%;
                pointer-events: none;
                animation: particle-burst 1s ease-out forwards;
                left: ${Math.random() * 200 - 100}px;
                top: ${Math.random() * 200 - 100}px;
            `;
            effectsContainer.appendChild(particle);
        }
        
        // Add CSS animation for particles
        if (!document.getElementById('particle-styles')) {
            const style = document.createElement('style');
            style.id = 'particle-styles';
            style.textContent = `
                @keyframes particle-burst {
                    0% {
                        transform: scale(0) translate(0, 0);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1) translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px);
                        opacity: 0;
                    }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-2px); }
                    75% { transform: translateX(2px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Clean up particles after animation
        setTimeout(() => {
            effectsContainer.innerHTML = '';
        }, 1000);
    }

    showResult(item, expGain) {
        document.getElementById('resultItemName').textContent = item.title;
        document.getElementById('resultItemDescription').textContent = item.note || '';
        document.getElementById('resultExp').textContent = `+${expGain}`;
        
        const urlElement = document.getElementById('resultItemUrl');
        if (item.url) {
            urlElement.href = item.url;
            urlElement.style.display = 'inline-block';
        } else {
            urlElement.style.display = 'none';
        }
        
        this.showModal('resultModal');
    }

    hideResult() {
        this.hideModal('resultModal');
        // Reset pick streak when result is dismissed
        this.playerData.pickStreak = 0;
        this.savePlayerData();
        this.updateStats();
    }

    // Utility Functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions for onclick handlers
let app;

function showAddForm() {
    app.showAddForm();
}

function hideAddForm() {
    app.hideAddForm();
}

function pickRandom() {
    app.pickRandom();
}

function hideResult() {
    app.hideResult();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new PickStockGameApp();
});