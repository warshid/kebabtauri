// Initialize Lucide icons
lucide.createIcons();

// Global data variables
let leagueData = {};
let teamCompositions = {};

// Real countdown timer to actual deadline
const deadlineTime = new Date('2025-06-28T14:00:15.042Z');

function updateCountdown() {
    const now = new Date();
    const timeDiff = deadlineTime - now;
    
    if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    } else {
        document.getElementById('days').textContent = '00';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
    }
}

// Calculate dynamic insights from JSON data
function calculateInsights() {
    if (!leagueData || !teamCompositions) {
        return null;
    }

    const insights = {};

    // 1. Best Single Race - highest points from any race weekend
    let bestRace = { team: '', points: 0, race: '', chipUsed: false };
    Object.keys(leagueData).forEach(raceKey => {
        if (raceKey === 'overall') return;
        
        const race = leagueData[raceKey];
        race.teams.forEach(team => {
            if (team.points > bestRace.points) {
                bestRace = {
                    team: team.name,
                    points: team.points,
                    race: race.title,
                    chipUsed: team.points > 250 // Assume chip used if points > 250
                };
            }
        });
    });
    insights.bestRace = bestRace;

    // 2. Points Gap - difference between 1st and 2nd place
    if (leagueData.overall && leagueData.overall.teams.length >= 2) {
        const first = leagueData.overall.teams[0];
        const second = leagueData.overall.teams[1];
        insights.pointsGap = first.points - second.points;
    }

    // 3. Total Races - count of completed races (excluding overall)
    insights.totalRaces = Object.keys(leagueData).filter(key => key !== 'overall').length;

    // 4. Most Consistent - team with most wins or top 3 finishes
    const consistency = {};
    Object.keys(leagueData).forEach(raceKey => {
        if (raceKey === 'overall') return;
        
        const race = leagueData[raceKey];
        race.teams.forEach((team, index) => {
            if (!consistency[team.name]) {
                consistency[team.name] = { top3: 0, wins: 0 };
            }
            if (index < 3) consistency[team.name].top3++;
            if (index === 0) consistency[team.name].wins++;
        });
    });
    
    let mostConsistent = '';
    let bestConsistency = 0;
    Object.keys(consistency).forEach(teamName => {
        const score = consistency[teamName].wins * 3 + consistency[teamName].top3;
        if (score > bestConsistency) {
            bestConsistency = score;
            mostConsistent = teamName;
        }
    });
    insights.mostConsistent = mostConsistent;

    // 5. Big Money - team with largest remaining budget
    let bigMoney = { team: '', budget: 0, budgetText: '' };
    Object.keys(teamCompositions).forEach(teamName => {
        const team = teamCompositions[teamName];
        const budgetValue = parseFloat(team.remainingBudget.replace('$', '').replace('M', ''));
        if (budgetValue > bigMoney.budget) {
            bigMoney = {
                team: teamName,
                budget: budgetValue,
                budgetText: team.remainingBudget
            };
        }
    });
    insights.bigMoney = bigMoney;

    return insights;
}

// Render dynamic insights
function renderInsights() {
    const insights = calculateInsights();
    const insightsContent = document.getElementById('insightsContent');
    
    if (!insights) {
        insightsContent.innerHTML = `
            <div class="error">
                <i data-lucide="alert-circle"></i>
                <p>Unable to calculate insights. Please ensure both JSON files are loaded.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    insightsContent.innerHTML = `
        <div class="insight-row">
            <div>
                <div class="insight-label">
                    <i data-lucide="trending-up"></i>
                    <div>
                        <div style="font-weight: bold;">Points Gap</div>
                        <div style="font-size: 0.9rem; opacity: 0.8;">1st to 2nd place</div>
                    </div>
                </div>
            </div>
            <div class="insight-highlight">${insights.pointsGap || 0} pts</div>
        </div>
        <div class="insight-row">
            <div>
                <div class="insight-label">
                    <i data-lucide="flag-triangle-right"></i>
                    <div>
                        <div style="font-weight: bold;">Total Races</div>
                        <div style="font-size: 0.9rem; opacity: 0.8;">Completed (out of 24)</div>
                    </div>
                </div>
            </div>
            <div class="insight-highlight">${insights.totalRaces} / 24 races</div>
        </div>
        <div class="insight-row">
            <div>
                <div class="insight-label">
                    <i data-lucide="target"></i>
                    <div>
                        <div style="font-weight: bold;">Best Single Race</div>
                        <div style="font-size: 0.9rem; opacity: 0.8;">Highest points in any race weekend</div>
                    </div>
                </div>
            </div>
            <div class="insight-highlight">${insights.bestRace.team} (${insights.bestRace.points} pts)</div>
        </div>
        <div class="insight-row">
            <div>
                <div class="insight-label">
                    <i data-lucide="crown"></i>
                    <div>
                        <div style="font-weight: bold;">Most Consistent</div>
                        <div style="font-size: 0.9rem; opacity: 0.8;">Most top-3 finishes</div>
                    </div>
                </div>
            </div>
            <div class="insight-highlight">${insights.mostConsistent || 'N/A'}</div>
        </div>
        <div class="insight-row">
            <div>
                <div class="insight-label">
                    <i data-lucide="banknote"></i>
                    <div>
                        <div style="font-weight: bold;">Big Money</div>
                        <div style="font-size: 0.9rem; opacity: 0.8;">Largest remaining budget</div>
                    </div>
                </div>
            </div>
            <div class="insight-highlight">${insights.bigMoney.team} (${insights.bigMoney.budgetText})</div>
        </div>
    `;
    
    // Re-initialize Lucide icons for the new content
    lucide.createIcons();
}

// Load league standings data
async function loadLeagueStandings() {
    try {
        const response = await fetch('data/league-standings.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        leagueData = await response.json();
        console.log('League standings loaded successfully');
        
        // Populate team selector dropdown
        populateTeamSelector();
        
        // Render initial teams
        renderTeams('overall');
        
        return true;
    } catch (error) {
        console.error('Error loading league standings:', error);
        showError('leaderboard', 'Failed to load league standings. Please check that league-standings.json exists and is valid.');
        return false;
    }
}

// Load team compositions data
async function loadTeamCompositions() {
    try {
        const response = await fetch('data/team-compositions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        teamCompositions = await response.json();
        console.log('Team compositions loaded successfully');
        
        // Show initial team composition state
        renderTeamComposition('');
        
        return true;
    } catch (error) {
        console.error('Error loading team compositions:', error);
        showError('teamCompositionDisplay', 'Failed to load team compositions. Please check that team-compositions.json exists and is valid.');
        return false;
    }
}

// Populate team selector dropdown
function populateTeamSelector() {
    const teamSelector = document.getElementById('teamSelector');
    
    // Clear existing options except the first one
    teamSelector.innerHTML = '<option value="">Choose a team...</option>';
    
    // Add team options from the overall standings
    if (leagueData.overall && leagueData.overall.teams) {
        leagueData.overall.teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.name;
            option.textContent = team.name;
            teamSelector.appendChild(option);
        });
    }
}

// Show error message
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `
        <div class="error">
            <i data-lucide="alert-circle"></i>
            <p>${message}</p>
        </div>
    `;
    lucide.createIcons();
}

// Render teams function
function renderTeams(raceKey) {
    const data = leagueData[raceKey];
    const leaderboard = document.getElementById('leaderboard');
    const raceInfoDisplay = document.getElementById('raceInfoDisplay');
    
    if (!data) {
        showError('leaderboard', `No data found for race: ${raceKey}`);
        return;
    }
    
    raceInfoDisplay.innerHTML = `<strong>${data.title}</strong>`;
    
    leaderboard.innerHTML = '';
    
    data.teams.forEach(team => {
        const teamRow = document.createElement('div');
        teamRow.className = `team-row rank-${team.rank}`;
        teamRow.innerHTML = `
            <div class="rank">${team.rank}</div>
            <div class="team-info">
                <div class="team-name">${team.name}</div>
                <div class="team-owner">${team.owner}</div>
            </div>
            <div class="points">${team.points} pts</div>
        `;
        
        leaderboard.appendChild(teamRow);
    });
}

// Render team composition function
function renderTeamComposition(teamName) {
    const compositionDisplay = document.getElementById('teamCompositionDisplay');
    
    if (!teamName || !teamCompositions[teamName]) {
        compositionDisplay.innerHTML = `
            <div class="no-team-selected">
                <p>Select a team from the dropdown above to view their F1 team composition</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    const team = teamCompositions[teamName];
    
    compositionDisplay.innerHTML = `
        <div class="composition-header">
            <h3>${teamName}</h3>
            <div class="cost-cap">
                <i data-lucide="dollar-sign"></i>
                Remaining: ${team.remainingBudget}
            </div>
        </div>
        <div class="composition-grid">
            ${team.drivers.map(driver => `
                <div class="driver-card">
                    <div class="driver-name">${driver.name}</div>
                    <div class="driver-team">${driver.team}</div>
                    <div class="driver-price">${driver.price}</div>
                    <div class="driver-points">${driver.points} pts</div>
                </div>
            `).join('')}
            ${team.constructors.map(constructor => `
                <div class="constructor-card">
                    <div class="constructor-name">${constructor.name}</div>
                    <div class="driver-team">Constructor</div>
                    <div class="driver-price">${constructor.price}</div>
                    <div class="driver-points">${constructor.points} pts</div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Re-initialize Lucide icons for the new content
    lucide.createIcons();
}

// Smooth scrolling for navigation links
function setupSmoothScrolling() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Scroll to top button
function setupScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.display = 'flex';
        } else {
            scrollToTopBtn.style.display = 'none';
        }
    });
    
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Update countdown every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    // Load data from JSON files
    const standingsLoaded = await loadLeagueStandings();
    const compositionsLoaded = await loadTeamCompositions();
    
    if (standingsLoaded && compositionsLoaded) {
        console.log('All data loaded successfully');
        
        // Calculate and render insights
        renderInsights();
        
        // Race filter functionality
        document.getElementById('raceFilter').addEventListener('change', function() {
            renderTeams(this.value);
        });
        
        // Team selector functionality
        document.getElementById('teamSelector').addEventListener('change', function() {
            renderTeamComposition(this.value);
        });
    } else {
        console.error('Failed to load some data files');
    }
    
    // Setup smooth scrolling and scroll to top
    setupSmoothScrolling();
    setupScrollToTop();
});
