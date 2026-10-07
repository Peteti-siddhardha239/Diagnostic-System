/**
 * Clinical Datasets & Application Controller
 * Handles Game Mode, Simulator Mode, Canvas & Chart.js rendering, and UI interactions.
 */

const PRESET_SCENARIOS = {
    respiratory: {
        id: "respiratory",
        name: "Respiratory Infection Differential",
        description: "Patient presents with cough, fatigue, and fever during respiratory virus season.",
        diseases: [
            { id: "covid19", name: "COVID-19", prior: 0.15, color: "#ef4444", description: "SARS-CoV-2 viral infection with systemic inflammatory risks." },
            { id: "influenza", name: "Seasonal Influenza (Flu)", prior: 0.20, color: "#f97316", description: "Orthomyxovirus infection causing acute high fever and myalgia." },
            { id: "cold", name: "Common Cold (Rhinovirus)", prior: 0.35, color: "#06b6d4", description: "Upper respiratory tract infection, typically mild and self-limiting." },
            { id: "allergy", name: "Allergic Rhinitis", prior: 0.15, color: "#8b5cf6", description: "Non-infectious immunoglobulin E mediated nasal hypersensitivity." },
            { id: "healthy", name: "Healthy / Non-specific", prior: 0.15, color: "#10b981", description: "Mild fatigue without active underlying respiratory infection." }
        ],
        tests: [
            {
                id: "fever_high",
                name: "High Grade Fever (>38.5°C)",
                cost: 15,
                likelihoods: {
                    covid19: { positive: 0.80, negative: 0.20 },
                    influenza: { positive: 0.90, negative: 0.10 },
                    cold: { positive: 0.15, negative: 0.85 },
                    allergy: { positive: 0.02, negative: 0.98 },
                    healthy: { positive: 0.01, negative: 0.99 }
                }
            },
            {
                id: "anosmia",
                name: "Anosmia / Loss of Taste & Smell",
                cost: 20,
                likelihoods: {
                    covid19: { positive: 0.65, negative: 0.35 },
                    influenza: { positive: 0.08, negative: 0.92 },
                    cold: { positive: 0.10, negative: 0.90 },
                    allergy: { positive: 0.05, negative: 0.95 },
                    healthy: { positive: 0.01, negative: 0.99 }
                }
            },
            {
                id: "covid_antigen",
                name: "Rapid SARS-CoV-2 Antigen Test",
                cost: 35,
                likelihoods: {
                    covid19: { positive: 0.88, negative: 0.12 },
                    influenza: { positive: 0.03, negative: 0.97 },
                    cold: { positive: 0.02, negative: 0.98 },
                    allergy: { positive: 0.01, negative: 0.99 },
                    healthy: { positive: 0.01, negative: 0.99 }
                }
            },
            {
                id: "flu_swab",
                name: "Rapid Influenza A/B Swab",
                cost: 45,
                likelihoods: {
                    covid19: { positive: 0.02, negative: 0.98 },
                    influenza: { positive: 0.85, negative: 0.15 },
                    cold: { positive: 0.03, negative: 0.97 },
                    allergy: { positive: 0.01, negative: 0.99 },
                    healthy: { positive: 0.01, negative: 0.99 }
                }
            },
            {
                id: "chest_xray",
                name: "Chest Radiography (Infiltrates/GGO)",
                cost: 140,
                likelihoods: {
                    covid19: { positive: 0.72, negative: 0.28 },
                    influenza: { positive: 0.35, negative: 0.65 },
                    cold: { positive: 0.04, negative: 0.96 },
                    allergy: { positive: 0.02, negative: 0.98 },
                    healthy: { positive: 0.01, negative: 0.99 }
                }
            },
            {
                id: "eosinophil",
                name: "Nasal Cytology / Eosinophil Smear",
                cost: 50,
                likelihoods: {
                    covid19: { positive: 0.05, negative: 0.95 },
                    influenza: { positive: 0.05, negative: 0.95 },
                    cold: { positive: 0.08, negative: 0.92 },
                    allergy: { positive: 0.82, negative: 0.18 },
                    healthy: { positive: 0.03, negative: 0.97 }
                }
            }
        ],
        patientScenarios: [
            {
                name: "Elena Rostova (Age 32)",
                complaint: "Sudden onset body chills, persistent dry cough, and headache since yesterday.",
                vitals: "Temp: 38.8°C | HR: 94 bpm | SpO2: 97%"
            },
            {
                name: "Marcus Vance (Age 45)",
                complaint: "Loss of coffee smell this morning, mild sore throat, and extreme exhaustion.",
                vitals: "Temp: 37.6°C | HR: 78 bpm | SpO2: 98%"
            },
            {
                name: "Sophia Chen (Age 24)",
                complaint: "Sneezing fits, itchy watery eyes, and clear nasal discharge for 3 days.",
                vitals: "Temp: 36.7°C | HR: 72 bpm | SpO2: 99%"
            }
        ]
    },
    screening_paradox: {
        id: "screening_paradox",
        name: "Base Rate Fallacy (Rare Disease Paradox)",
        description: "Classic Bayesian paradox: A 99% accurate test for a rare disease (prevalence 0.1%) yields mostly false positives!",
        diseases: [
            { id: "rare_disease", name: "Rare Syndrome X (0.1% Prevalence)", prior: 0.001, color: "#dc2626", description: "Severe rare metabolic syndrome affecting 1 in 1,000 individuals." },
            { id: "healthy_pop", name: "Healthy Population (99.9%)", prior: 0.999, color: "#10b981", description: "Normal population without the target genetic pathology." }
        ],
        tests: [
            {
                id: "initial_screen",
                name: "First-Line Screening Assay (99% Sens, 95% Spec)",
                cost: 50,
                likelihoods: {
                    rare_disease: { positive: 0.99, negative: 0.01 },
                    healthy_pop: { positive: 0.05, negative: 0.95 }
                }
            },
            {
                id: "repeat_screen",
                name: "Independent Secondary Biomarker (95% Sens, 98% Spec)",
                cost: 100,
                likelihoods: {
                    rare_disease: { positive: 0.95, negative: 0.05 },
                    healthy_pop: { positive: 0.02, negative: 0.98 }
                }
            },
            {
                id: "confirmatory_dna",
                name: "Definitive Genomic DNA Sequencing (99.9% Sens, 99.8% Spec)",
                cost: 350,
                likelihoods: {
                    rare_disease: { positive: 0.999, negative: 0.001 },
                    healthy_pop: { positive: 0.002, negative: 0.998 }
                }
            }
        ],
        patientScenarios: [
            {
                name: "Routine Checkup: David K. (Age 40)",
                complaint: "Asymptomatic individual undergoing company annual biometric wellness panel.",
                vitals: "Temp: 36.8°C | BP: 120/80 | Normal"
            }
        ]
    },
    chest_pain: {
        id: "chest_pain",
        name: "Emergency Chest Pain Triage",
        description: "Emergency Department acute presentation: Differentiating coronary syndrome from mimics.",
        diseases: [
            { id: "mi", name: "Myocardial Infarction (STEMI/NSTEMI)", prior: 0.15, color: "#dc2626", description: "Acute coronary artery occlusion leading to myocardial necrosis." },
            { id: "angina", name: "Unstable Angina", prior: 0.20, color: "#f59e0b", description: "Transient cardiac ischemia without immediate cell death biomarker rise." },
            { id: "pe", name: "Pulmonary Embolism (PE)", prior: 0.08, color: "#7c3aed", description: "Thrombus occluding pulmonary arterial vasculature." },
            { id: "gerd", name: "GERD / Esophageal Spasm", prior: 0.32, color: "#0284c7", description: "Acid reflux or hypermotility mimicking retrosternal burning." },
            { id: "costo", name: "Musculoskeletal Costochondritis", prior: 0.25, color: "#16a34a", description: "Benign inflammation of costochondral junctions provoked by palpation." }
        ],
        tests: [
            {
                id: "ecg_st",
                name: "12-Lead ECG (ST Elevation / T-wave inversion)",
                cost: 40,
                likelihoods: {
                    mi: { positive: 0.85, negative: 0.15 },
                    angina: { positive: 0.40, negative: 0.60 },
                    pe: { positive: 0.18, negative: 0.82 },
                    gerd: { positive: 0.02, negative: 0.98 },
                    costo: { positive: 0.01, negative: 0.99 }
                }
            },
            {
                id: "troponin",
                name: "High-Sensitivity Cardiac Troponin I (>99th percentile)",
                cost: 75,
                likelihoods: {
                    mi: { positive: 0.96, negative: 0.04 },
                    angina: { positive: 0.10, negative: 0.90 },
                    pe: { positive: 0.15, negative: 0.85 },
                    gerd: { positive: 0.01, negative: 0.99 },
                    costo: { positive: 0.01, negative: 0.99 }
                }
            },
            {
                id: "d_dimer",
                name: "D-Dimer Plasma Biomarker Elevated",
                cost: 65,
                likelihoods: {
                    mi: { positive: 0.25, negative: 0.75 },
                    angina: { positive: 0.10, negative: 0.90 },
                    pe: { positive: 0.95, negative: 0.05 },
                    gerd: { positive: 0.04, negative: 0.96 },
                    costo: { positive: 0.03, negative: 0.97 }
                }
            },
            {
                id: "palpation",
                name: "Reproducible Chest Wall Tenderness on Palpation",
                cost: 10,
                likelihoods: {
                    mi: { positive: 0.05, negative: 0.95 },
                    angina: { positive: 0.06, negative: 0.94 },
                    pe: { positive: 0.08, negative: 0.92 },
                    gerd: { positive: 0.10, negative: 0.90 },
                    costo: { positive: 0.92, negative: 0.08 }
                }
            },
            {
                id: "antacid_relief",
                name: "Immediate Relief with Liquid Antacid/Lidocaine",
                cost: 20,
                likelihoods: {
                    mi: { positive: 0.08, negative: 0.92 },
                    angina: { positive: 0.05, negative: 0.95 },
                    pe: { positive: 0.02, negative: 0.98 },
                    gerd: { positive: 0.88, negative: 0.12 },
                    costo: { positive: 0.05, negative: 0.95 }
                }
            }
        ],
        patientScenarios: [
            {
                name: "Arthur Pendelton (Age 58)",
                complaint: "Sudden crushing retrosternal pressure radiating to left jaw, diaphoresis.",
                vitals: "Temp: 37.1°C | BP: 155/95 | HR: 102 bpm | RR: 22"
            },
            {
                name: "Clara Briggs (Age 42)",
                complaint: "Sharp pleuritic chest discomfort when taking deep breath, right calf swollen.",
                vitals: "Temp: 37.4°C | BP: 118/76 | HR: 110 bpm | SpO2: 92%"
            }
        ]
    },
    tropical_fever: {
        id: "tropical_fever",
        name: "Tropical Fever Investigation",
        description: "Traveler returning with high fever, headache, and severe musculoskeletal pains.",
        diseases: [
            { id: "malaria", name: "Malaria (P. falciparum)", prior: 0.28, color: "#e11d48", description: "Intraerythrocytic protozoan parasite transmitted by Anopheles mosquitoes." },
            { id: "dengue", name: "Dengue Fever", prior: 0.30, color: "#f59e0b", description: "Flavivirus transmitted by Aedes mosquitoes, causing 'breakbone fever'." },
            { id: "typhoid", name: "Typhoid Fever (Salmonella)", prior: 0.18, color: "#84cc16", description: "Systemic enteric bacterial illness with sustained step-ladder fever." },
            { id: "chikungunya", name: "Chikungunya", prior: 0.14, color: "#06b6d4", description: "Alphavirus causing crippling symmetrical polyarthralgia." },
            { id: "mild_viral", name: "Mild Enteric Viral Illness", prior: 0.10, color: "#64748b", description: "Self-limiting traveler's gastroenteritis or nonspecific summer virus." }
        ],
        tests: [
            {
                id: "blood_smear",
                name: "Thick & Thin Blood Giemsa Smear",
                cost: 30,
                likelihoods: {
                    malaria: { positive: 0.95, negative: 0.05 },
                    dengue: { positive: 0.01, negative: 0.99 },
                    typhoid: { positive: 0.01, negative: 0.99 },
                    chikungunya: { positive: 0.01, negative: 0.99 },
                    mild_viral: { positive: 0.01, negative: 0.99 }
                }
            },
            {
                id: "dengue_ns1",
                name: "Dengue NS1 Antigen Rapid Test",
                cost: 40,
                likelihoods: {
                    malaria: { positive: 0.02, negative: 0.98 },
                    dengue: { positive: 0.90, negative: 0.10 },
                    typhoid: { positive: 0.02, negative: 0.98 },
                    chikungunya: { positive: 0.03, negative: 0.97 },
                    mild_viral: { positive: 0.01, negative: 0.99 }
                }
            },
            {
                id: "widal_test",
                name: "Typhidot / Blood Culture (S. Typhi)",
                cost: 50,
                likelihoods: {
                    malaria: { positive: 0.04, negative: 0.96 },
                    dengue: { positive: 0.03, negative: 0.97 },
                    typhoid: { positive: 0.86, negative: 0.14 },
                    chikungunya: { positive: 0.02, negative: 0.98 },
                    mild_viral: { positive: 0.02, negative: 0.98 }
                }
            },
            {
                id: "tourniquet",
                name: "Tourniquet Test (Capillary Fragility)",
                cost: 10,
                likelihoods: {
                    malaria: { positive: 0.10, negative: 0.90 },
                    dengue: { positive: 0.80, negative: 0.20 },
                    typhoid: { positive: 0.05, negative: 0.95 },
                    chikungunya: { positive: 0.20, negative: 0.80 },
                    mild_viral: { positive: 0.02, negative: 0.98 }
                }
            },
            {
                id: "severe_arthralgia",
                name: "Severe Symmetrical Polyarthralgia (Joint Pain)",
                cost: 15,
                likelihoods: {
                    malaria: { positive: 0.25, negative: 0.75 },
                    dengue: { positive: 0.50, negative: 0.50 },
                    typhoid: { positive: 0.20, negative: 0.80 },
                    chikungunya: { positive: 0.95, negative: 0.05 },
                    mild_viral: { positive: 0.10, negative: 0.90 }
                }
            }
        ],
        patientScenarios: [
            {
                name: "Dr. Sanjay Roy (Age 39)",
                complaint: "Returned 4 days ago from rural field work. Sudden spiking rigors and sweats.",
                vitals: "Temp: 39.5°C | HR: 112 bpm | BP: 110/70"
            }
        ]
    }
};

class AppController {
    constructor() {
        this.currentScenarioKey = 'respiratory';
        this.engine = null;
        this.activeTab = 'game'; // 'game' | 'simulator' | 'guide'
        
        // Simulator state
        this.simulatorEvidence = []; // Array of { testId, result }
        this.simulatorStepIndex = 0;
        this.simulatorHistory = [];
        this.simulatorIsPlaying = false;
        this.playTimer = null;

        // Game state
        this.gameState = {
            active: false,
            patient: null,
            trueDiseaseId: null,
            budget: 350,
            initialBudget: 350,
            spent: 0,
            testsRun: [], // Array of { testId, testName, cost, result }
            currentProbabilities: {},
            history: [],
            score: null,
            gameFinished: false,
            diagnosisGuessed: null
        };

        this.chartInstance = null;
        this.barChartInstance = null;
        this.gameChartInstance = null;

        this.init();
    }

    init() {
        this.loadScenario(this.currentScenarioKey);
        this.setupEventListeners();
        this.switchTab('game');
        this.startNewGame();
    }

    loadScenario(scenarioKey) {
        this.currentScenarioKey = scenarioKey;
        const data = PRESET_SCENARIOS[scenarioKey];
        this.engine = new BayesianEngine(data.diseases, data.tests);
        
        // Reset simulator evidence
        this.simulatorEvidence = [];
        this.updateSimulator();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Sound toggle
        const soundBtn = document.getElementById('soundToggleBtn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const isMuted = window.soundFx ? window.soundFx.toggleMute() : false;
                soundBtn.textContent = isMuted ? '🔇 Audio: Muted' : '🔊 Audio: On';
                soundBtn.classList.toggle('muted', isMuted);
            });
        }

        // Scenario selects
        const simSelect = document.getElementById('simScenarioSelect');
        if (simSelect) {
            simSelect.addEventListener('change', (e) => {
                this.loadScenario(e.target.value);
            });
        }

        const gameSelect = document.getElementById('gameScenarioSelect');
        if (gameSelect) {
            gameSelect.addEventListener('change', (e) => {
                this.loadScenario(e.target.value);
                this.startNewGame();
            });
        }

        // Simulator controls
        const resetSimBtn = document.getElementById('resetSimBtn');
        if (resetSimBtn) {
            resetSimBtn.addEventListener('click', () => {
                this.simulatorEvidence = [];
                this.updateSimulator();
            });
        }

        const playBtn = document.getElementById('playTimelineBtn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.toggleSimulatorPlayback();
            });
        }

        const stepSlider = document.getElementById('stepSlider');
        if (stepSlider) {
            stepSlider.addEventListener('input', (e) => {
                this.setSimulatorStep(parseInt(e.target.value, 10));
            });
        }

        // Math modal close
        const closeMathBtn = document.getElementById('closeMathModalBtn');
        if (closeMathBtn) {
            closeMathBtn.addEventListener('click', () => {
                document.getElementById('mathModal').classList.add('hidden');
            });
        }

        // New game button
        const newGameBtn = document.getElementById('newGameBtn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                this.startNewGame();
            });
        }

        // Window resize -> redraw fallback canvases
        window.addEventListener('resize', () => {
            this.renderCharts();
            if (this.gameState.active) {
                this.renderGameChart();
            }
        });
    }

    switchTab(tabName) {
        this.activeTab = tabName;
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-content').forEach(section => {
            section.classList.toggle('active', section.id === `tab-${tabName}`);
        });

        if (tabName === 'simulator') {
            this.updateSimulator();
        } else if (tabName === 'game') {
            if (!this.gameState.active) {
                this.startNewGame();
            } else {
                this.renderGameUI();
            }
        }
    }

    // ==========================================
    // 🎮 DOCTOR GAME MODE IMPLEMENTATION
    // ==========================================

    startNewGame() {
        const scenario = PRESET_SCENARIOS[this.currentScenarioKey];
        if (window.soundFx) window.soundFx.playHeartbeat();

        // 1. Pick a random patient profile or generate one
        const patientProfiles = scenario.patientScenarios || [];
        const randomProfile = patientProfiles[Math.floor(Math.random() * patientProfiles.length)] || {
            name: "Patient Unknown (Age 38)",
            complaint: "Presents with acute uncharacterized symptoms.",
            vitals: "Temp: 38.2°C | BP: 125/82 | HR: 88 bpm"
        };

        // 2. Secretly roll true disease according to baseline priors!
        const randRoll = Math.random();
        let cumulative = 0;
        let selectedTrueDiseaseId = scenario.diseases[0].id;
        for (const d of scenario.diseases) {
            cumulative += d.prior;
            if (randRoll <= cumulative) {
                selectedTrueDiseaseId = d.id;
                break;
            }
        }

        // Initial probabilities = priors
        const initialP = {};
        scenario.diseases.forEach(d => { initialP[d.id] = d.prior; });

        this.gameState = {
            active: true,
            patient: randomProfile,
            trueDiseaseId: selectedTrueDiseaseId,
            initialBudget: 350,
            budget: 350,
            spent: 0,
            testsRun: [],
            currentProbabilities: initialP,
            history: [{
                step: 0,
                label: 'Baseline Prior',
                testName: 'Admission',
                result: 'N/A',
                probabilities: { ...initialP }
            }],
            score: null,
            gameFinished: false,
            diagnosisGuessed: null
        };

        this.renderGameUI();
    }

    orderGameTest(testId) {
        if (!this.gameState.active || this.gameState.gameFinished) return;

        const test = this.engine.tests.find(t => t.id === testId);
        if (!test) return;

        if (this.gameState.budget < test.cost) {
            alert(`Insufficient funds! Test costs $${test.cost}, but you only have $${this.gameState.budget} remaining.`);
            return;
        }

        // Deduct cost
        this.gameState.budget -= test.cost;
        this.gameState.spent += test.cost;

        if (window.soundFx) window.soundFx.playTestBeep();

        // Simulate stochastic result based on true disease
        const result = this.engine.simulateTestResult(testId, this.gameState.trueDiseaseId);

        if (window.soundFx) {
            setTimeout(() => {
                if (result === 'positive') window.soundFx.playPositiveResult();
                else window.soundFx.playNegativeResult();
            }, 120);
        }

        // Calculate Bayesian update
        const update = this.engine.updateStep(this.gameState.currentProbabilities, testId, result);
        this.gameState.currentProbabilities = update.posterior;

        this.gameState.testsRun.push({
            testId,
            testName: test.name,
            cost: test.cost,
            result
        });

        this.gameState.history.push({
            step: this.gameState.testsRun.length,
            label: `Test ${this.gameState.testsRun.length}: ${test.name}`,
            testName: test.name,
            result,
            probabilities: { ...update.posterior }
        });

        this.renderGameUI();
    }

    submitFinalDiagnosis(guessedDiseaseId) {
        if (!this.gameState.active || this.gameState.gameFinished) return;

        this.gameState.gameFinished = true;
        this.gameState.diagnosisGuessed = guessedDiseaseId;

        const isCorrect = (guessedDiseaseId === this.gameState.trueDiseaseId);
        const trueDisease = this.engine.diseases.find(d => d.id === this.gameState.trueDiseaseId);
        const guessedDisease = this.engine.diseases.find(d => d.id === guessedDiseaseId);
        
        // Posterior probability assigned to the true condition
        const finalPTrue = this.gameState.currentProbabilities[this.gameState.trueDiseaseId];
        
        // Compute score: (Accuracy * 60) + (Budget remaining * 0.1) + (Bayesian calibration * 30)
        let baseScore = isCorrect ? 60 : 0;
        let budgetBonus = Math.max(0, Math.round(this.gameState.budget * 0.1));
        let confidenceBonus = Math.round(finalPTrue * 30);
        let totalScore = Math.min(100, Math.max(0, baseScore + budgetBonus + confidenceBonus));

        let rankTitle = "Intern Diagnostician";
        if (totalScore >= 90) rankTitle = "Master Bayesian Clinician 🏆";
        else if (totalScore >= 75) rankTitle = "Chief of Diagnostic Medicine 🩺";
        else if (totalScore >= 50) rankTitle = "Senior Attending Physician ⚕️";

        this.gameState.score = {
            isCorrect,
            totalScore,
            rankTitle,
            trueDisease,
            guessedDisease,
            finalPTrue: (finalPTrue * 100).toFixed(1) + "%",
            spent: this.gameState.spent,
            budgetLeft: this.gameState.budget
        };

        if (window.soundFx) {
            if (isCorrect) window.soundFx.playVictory();
            else window.soundFx.playDefeat();
        }

        this.renderGameUI();
    }

    renderGameUI() {
        const container = document.getElementById('tab-game');
        if (!container) return;

        const patient = this.gameState.patient;
        const scenario = PRESET_SCENARIOS[this.currentScenarioKey];

        // Patient Card Info
        const patientNameEl = document.getElementById('gamePatientName');
        if (patientNameEl) patientNameEl.textContent = patient.name;

        const complaintEl = document.getElementById('gamePatientComplaint');
        if (complaintEl) complaintEl.textContent = `"${patient.complaint}"`;

        const vitalsEl = document.getElementById('gamePatientVitals');
        if (vitalsEl) vitalsEl.textContent = patient.vitals;

        // Budget & Tests Status
        const budgetEl = document.getElementById('gameBudgetVal');
        if (budgetEl) budgetEl.textContent = `$${this.gameState.budget}`;

        const spentEl = document.getElementById('gameSpentVal');
        if (spentEl) spentEl.textContent = `$${this.gameState.spent}`;

        const countEl = document.getElementById('gameTestsCountVal');
        if (countEl) countEl.textContent = `${this.gameState.testsRun.length} ordered`;

        // Available Tests Panel
        const testsListEl = document.getElementById('gameAvailableTestsList');
        if (testsListEl) {
            const alreadyRunIds = this.gameState.testsRun.map(t => t.testId);
            const recommendations = this.engine.recommendNextTest(this.gameState.currentProbabilities, alreadyRunIds);
            const topRecommendedId = recommendations && recommendations.length > 0 ? recommendations[0].test.id : null;

            testsListEl.innerHTML = this.engine.tests.map(test => {
                const isRun = alreadyRunIds.includes(test.id);
                const canAfford = this.gameState.budget >= test.cost;
                const isRecommended = (test.id === topRecommendedId && !this.gameState.gameFinished);

                return `
                    <div class="game-test-card ${isRun ? 'run' : ''} ${!canAfford ? 'unaffordable' : ''}">
                        <div class="test-header">
                            <span class="test-title">${test.name}</span>
                            <span class="test-cost-badge">$${test.cost}</span>
                        </div>
                        ${isRecommended ? '<div class="rec-badge">💡 AI Recommend: High Info Gain</div>' : ''}
                        <div class="test-actions">
                            ${isRun 
                                ? `<span class="badge completed">✓ Performed (${this.gameState.testsRun.find(t=>t.testId===test.id).result.toUpperCase()})</span>`
                                : `<button class="btn btn-sm btn-primary order-test-btn" data-test-id="${test.id}" ${(!canAfford || this.gameState.gameFinished) ? 'disabled' : ''}>
                                    ${canAfford ? 'Order Test 🧪' : 'Insufficient Funds'}
                                   </button>`
                            }
                        </div>
                    </div>
                `;
            }).join('');

            // Bind order buttons
            testsListEl.querySelectorAll('.order-test-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const testId = e.currentTarget.dataset.testId;
                    this.orderGameTest(testId);
                });
            });
        }

        // Test Log Table
        const logTableEl = document.getElementById('gameTestLogs');
        if (logTableEl) {
            if (this.gameState.testsRun.length === 0) {
                logTableEl.innerHTML = `<tr><td colspan="4" class="text-muted text-center">No tests ordered yet. Review patient vitals and select a diagnostic test above.</td></tr>`;
            } else {
                logTableEl.innerHTML = this.gameState.testsRun.map((t, idx) => `
                    <tr>
                        <td><strong>#${idx + 1}</strong></td>
                        <td>${t.testName}</td>
                        <td>$${t.cost}</td>
                        <td>
                            <span class="result-tag ${t.result}">
                                ${t.result === 'positive' ? '➕ Positive' : '➖ Negative'}
                            </span>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // Diagnosis Guess Options Panel
        const diagListEl = document.getElementById('gameDiagnosisOptionsList');
        if (diagListEl) {
            diagListEl.innerHTML = this.engine.diseases.map(d => {
                const currentProb = ((this.gameState.currentProbabilities[d.id] || 0) * 100).toFixed(1);
                const isSelected = (this.gameState.diagnosisGuessed === d.id);
                const isTrue = (this.gameState.gameFinished && d.id === this.gameState.trueDiseaseId);

                let extraClass = '';
                if (this.gameState.gameFinished) {
                    if (isTrue) extraClass = 'true-diagnosis';
                    else if (isSelected && !isTrue) extraClass = 'wrong-diagnosis';
                }

                return `
                    <button class="btn diag-choice-btn ${extraClass}" data-disease-id="${d.id}" ${this.gameState.gameFinished ? 'disabled' : ''}>
                        <div class="diag-name">${d.name}</div>
                        <div class="diag-prob-bar-container">
                            <div class="diag-prob-bar" style="width: ${currentProb}%; background-color: ${d.color};"></div>
                        </div>
                        <div class="diag-prob-label">Posterior Probability: <strong>${currentProb}%</strong></div>
                    </button>
                `;
            }).join('');

            diagListEl.querySelectorAll('.diag-choice-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const dId = e.currentTarget.dataset.diseaseId;
                    if (confirm(`Confirm clinical diagnosis: "${this.engine.diseases.find(d=>d.id===dId).name}"?`)) {
                        this.submitFinalDiagnosis(dId);
                    }
                });
            });
        }

        // Render Game Chart
        this.renderGameChart();

        // Game Finished Result Banner
        const resultBannerEl = document.getElementById('gameResultBanner');
        if (resultBannerEl) {
            if (this.gameState.gameFinished && this.gameState.score) {
                const s = this.gameState.score;
                resultBannerEl.classList.remove('hidden');
                resultBannerEl.className = `result-banner ${s.isCorrect ? 'banner-success' : 'banner-failure'}`;
                resultBannerEl.innerHTML = `
                    <div class="banner-icon">${s.isCorrect ? '🎉' : '⚠️'}</div>
                    <div class="banner-body">
                        <h3>${s.isCorrect ? 'Correct Diagnosis!' : 'Misdiagnosis!'}</h3>
                        <p><strong>Actual Disease:</strong> ${s.trueDisease.name} | <strong>Your Verdict:</strong> ${s.guessedDisease.name}</p>
                        <p>Bayesian Confidence at Decision: <strong>${s.finalPTrue}</strong> | Budget Saved: <strong>$${s.budgetLeft}</strong></p>
                        <div class="banner-score">Score: <strong>${s.totalScore}/100</strong> &bull; Title: <em>${s.rankTitle}</em></div>
                        <button class="btn btn-light mt-3" id="bannerPlayAgainBtn">Play Next Mystery Patient 🔄</button>
                    </div>
                `;
                const playAgainBtn = document.getElementById('bannerPlayAgainBtn');
                if (playAgainBtn) {
                    playAgainBtn.addEventListener('click', () => this.startNewGame());
                }
            } else {
                resultBannerEl.classList.add('hidden');
            }
        }
    }

    renderGameChart() {
        const ctx = document.getElementById('gameChartCanvas');
        if (!ctx) return;

        const labels = this.gameState.history.map((h, i) => i === 0 ? 'Baseline' : `Test ${i}`);
        const datasets = this.engine.diseases.map(d => {
            const dataPoints = this.gameState.history.map(h => (h.probabilities[d.id] * 100).toFixed(1));
            return {
                label: d.name,
                data: dataPoints,
                borderColor: d.color,
                backgroundColor: d.color + '22',
                borderWidth: 2.5,
                fill: false,
                tension: 0.2,
                pointRadius: 4,
                pointHoverRadius: 6
            };
        });

        if (typeof Chart !== 'undefined') {
            if (this.gameChartInstance) {
                this.gameChartInstance.destroy();
            }
            this.gameChartInstance = new Chart(ctx, {
                type: 'line',
                data: { labels, datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            min: 0,
                            max: 100,
                            title: { display: true, text: 'Posterior Probability (%)' },
                            grid: { color: 'rgba(255,255,255,0.08)' }
                        },
                        x: {
                            title: { display: true, text: 'Diagnostic Sequence' },
                            grid: { color: 'rgba(255,255,255,0.08)' }
                        }
                    },
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, color: '#e2e8f0' } }
                    }
                }
            });
        } else {
            this.drawCanvasFallback(ctx, labels, datasets);
        }
    }

    // ==========================================
    // 🔬 SIMULATOR MODE IMPLEMENTATION
    // ==========================================

    updateSimulator() {
        this.simulatorHistory = this.engine.runSequentialChain(this.simulatorEvidence);
        if (this.simulatorStepIndex >= this.simulatorHistory.length) {
            this.simulatorStepIndex = this.simulatorHistory.length - 1;
        }

        const slider = document.getElementById('stepSlider');
        if (slider) {
            slider.max = this.simulatorHistory.length - 1;
            slider.value = this.simulatorStepIndex;
        }

        this.renderSimulatorControls();
        this.renderCharts();
        this.renderSimulatorInspector();
    }

    renderSimulatorControls() {
        const testsContainer = document.getElementById('simTestsContainer');
        if (!testsContainer) return;

        testsContainer.innerHTML = this.engine.tests.map(test => {
            const activeEv = this.simulatorEvidence.find(e => e.testId === test.id);
            const status = activeEv ? activeEv.result : 'inactive';

            return `
                <div class="test-item-card">
                    <div class="test-item-info">
                        <strong>${test.name}</strong>
                        <div class="text-muted small">Cost: $${test.cost}</div>
                    </div>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm ${status === 'positive' ? 'btn-danger' : 'btn-outline'}" 
                                onclick="app.setSimulatorTest('${test.id}', 'positive')">
                            ➕ Positive
                        </button>
                        <button class="btn btn-sm ${status === 'negative' ? 'btn-info' : 'btn-outline'}" 
                                onclick="app.setSimulatorTest('${test.id}', 'negative')">
                            ➖ Negative
                        </button>
                        <button class="btn btn-sm ${status === 'inactive' ? 'btn-secondary' : 'btn-outline'}" 
                                onclick="app.setSimulatorTest('${test.id}', 'inactive')">
                            ∅ Inactive
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    setSimulatorTest(testId, state) {
        // Remove existing evidence for this test
        this.simulatorEvidence = this.simulatorEvidence.filter(e => e.testId !== testId);
        if (state !== 'inactive') {
            this.simulatorEvidence.push({ testId, result: state });
        }
        this.updateSimulator();
    }

    setSimulatorStep(stepIdx) {
        this.simulatorStepIndex = Math.max(0, Math.min(stepIdx, this.simulatorHistory.length - 1));
        const slider = document.getElementById('stepSlider');
        if (slider) slider.value = this.simulatorStepIndex;

        const currentStep = this.simulatorHistory[this.simulatorStepIndex];
        const stepLabel = document.getElementById('currentStepLabel');
        if (stepLabel) {
            stepLabel.textContent = currentStep.label;
        }

        this.renderSimulatorInspector();
        this.renderBarChart();
    }

    toggleSimulatorPlayback() {
        const btn = document.getElementById('playTimelineBtn');
        if (this.simulatorIsPlaying) {
            clearInterval(this.playTimer);
            this.simulatorIsPlaying = false;
            if (btn) btn.textContent = '▶️ Play Timeline';
        } else {
            this.simulatorIsPlaying = true;
            if (btn) btn.textContent = '⏸️ Pause';
            if (this.simulatorStepIndex >= this.simulatorHistory.length - 1) {
                this.setSimulatorStep(0);
            }
            this.playTimer = setInterval(() => {
                if (this.simulatorStepIndex < this.simulatorHistory.length - 1) {
                    this.setSimulatorStep(this.simulatorStepIndex + 1);
                } else {
                    this.toggleSimulatorPlayback();
                }
            }, 1200);
        }
    }

    renderCharts() {
        this.renderTrajectoryLineChart();
        this.renderBarChart();
    }

    renderTrajectoryLineChart() {
        const ctx = document.getElementById('trajectoryChartCanvas');
        if (!ctx) return;

        const labels = this.simulatorHistory.map(h => h.step === 0 ? 'Prior P₀' : `Step ${h.step}`);
        const datasets = this.engine.diseases.map(d => {
            const dataPoints = this.simulatorHistory.map(h => (h.probabilities[d.id] * 100).toFixed(1));
            return {
                label: d.name,
                data: dataPoints,
                borderColor: d.color,
                backgroundColor: d.color + '22',
                borderWidth: 2.5,
                fill: false,
                tension: 0.2,
                pointRadius: 5
            };
        });

        if (typeof Chart !== 'undefined') {
            if (this.chartInstance) {
                this.chartInstance.destroy();
            }
            this.chartInstance = new Chart(ctx, {
                type: 'line',
                data: { labels, datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            min: 0,
                            max: 100,
                            title: { display: true, text: 'Posterior Probability (%)' },
                            grid: { color: 'rgba(255,255,255,0.08)' }
                        },
                        x: {
                            title: { display: true, text: 'Evidence Arrival Sequence' },
                            grid: { color: 'rgba(255,255,255,0.08)' }
                        }
                    },
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, color: '#e2e8f0' } }
                    }
                }
            });
        } else {
            this.drawCanvasFallback(ctx, labels, datasets);
        }
    }

    renderBarChart() {
        const ctx = document.getElementById('barChartCanvas');
        if (!ctx) return;

        const currentStep = this.simulatorHistory[this.simulatorStepIndex] || this.simulatorHistory[0];
        const labels = this.engine.diseases.map(d => d.name);
        const data = this.engine.diseases.map(d => (currentStep.probabilities[d.id] * 100).toFixed(1));
        const colors = this.engine.diseases.map(d => d.color);

        if (typeof Chart !== 'undefined') {
            if (this.barChartInstance) {
                this.barChartInstance.destroy();
            }
            this.barChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Posterior %',
                        data,
                        backgroundColor: colors,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            min: 0,
                            max: 100,
                            title: { display: true, text: 'Probability (%)' },
                            grid: { color: 'rgba(255,255,255,0.08)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        } else {
            this.drawBarFallback(ctx, labels, data, colors);
        }
    }

    renderSimulatorInspector() {
        const inspectorEl = document.getElementById('mathInspectorContent');
        if (!inspectorEl) return;

        const currentStep = this.simulatorHistory[this.simulatorStepIndex];
        if (!currentStep) return;

        if (currentStep.step === 0) {
            inspectorEl.innerHTML = `
                <div class="math-card">
                    <h4>Baseline Prior Probabilities (Step 0)</h4>
                    <p class="text-muted">No diagnostic tests executed yet. Showing population epidemiological prevalence $P(D_i)$:</p>
                    <table class="table math-table">
                        <thead><tr><th>Disease</th><th>Prior $P(D_i)$</th><th>Percentage</th></tr></thead>
                        <tbody>
                            ${this.engine.diseases.map(d => `
                                <tr>
                                    <td><strong style="color: ${d.color}">${d.name}</strong></td>
                                    <td>${d.prior.toFixed(4)}</td>
                                    <td><strong>${(d.prior * 100).toFixed(2)}%</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            return;
        }

        const trace = currentStep.mathTrace;
        const test = currentStep.test;
        const result = currentStep.result;
        const marginal = currentStep.marginalLikelihood;

        inspectorEl.innerHTML = `
            <div class="math-card">
                <h4>Bayesian Decomposition for: ${test.name} (${result.toUpperCase()})</h4>
                <div class="formula-box">
                    $$P(D_i \\mid E) = \\frac{P(E \\mid D_i) \\cdot P(D_i)}{\\sum_{j=1}^n P(E \\mid D_j) \\cdot P(D_j)}$$
                    <div class="marginal-box">
                        <strong>Marginal Evidence $P(E) = \\sum P(E \\mid D_j) P(D_j)$:</strong>
                        <code>${marginal.toFixed(6)}</code>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table math-table">
                        <thead>
                            <tr>
                                <th>Disease ($D_i$)</th>
                                <th>Prior $P(D_i)$</th>
                                <th>Likelihood $P(E|D_i)$</th>
                                <th>Joint Numerator</th>
                                <th>Posterior $P(D_i|E)$</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${trace.map(item => `
                                <tr>
                                    <td><strong>${item.diseaseName}</strong></td>
                                    <td>${item.prior.toFixed(4)}</td>
                                    <td>${item.likelihood.toFixed(4)}</td>
                                    <td><code>${item.joint.toFixed(6)}</code></td>
                                    <td><strong class="highlight-posterior">${(item.posterior * 100).toFixed(2)}%</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // ==========================================
    // 🎨 HTML5 CANVAS FALLBACK CHART ENGINE
    // For 100% offline environments without CDN
    // ==========================================

    drawCanvasFallback(canvas, labels, datasets) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.parentElement.clientWidth || 600;
        const h = canvas.height = canvas.parentElement.clientHeight || 300;

        ctx.clearRect(0, 0, w, h);
        const padding = { left: 50, right: 20, top: 20, bottom: 40 };
        const plotW = w - padding.left - padding.right;
        const plotH = h - padding.top - padding.bottom;

        // Axes
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, h - padding.bottom);
        ctx.lineTo(w - padding.right, h - padding.bottom);
        ctx.stroke();

        // Y Grid
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        for (let i = 0; i <= 5; i++) {
            const val = i * 20;
            const y = h - padding.bottom - (val / 100) * plotH;
            ctx.fillText(`${val}%`, 10, y + 4);
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();
        }

        // Plot lines
        datasets.forEach(ds => {
            ctx.strokeStyle = ds.borderColor;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ds.data.forEach((val, idx) => {
                const x = padding.left + (idx / Math.max(1, labels.length - 1)) * plotW;
                const y = h - padding.bottom - (val / 100) * plotH;
                if (idx === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Dots
            ds.data.forEach((val, idx) => {
                const x = padding.left + (idx / Math.max(1, labels.length - 1)) * plotW;
                const y = h - padding.bottom - (val / 100) * plotH;
                ctx.fillStyle = ds.borderColor;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }

    drawBarFallback(canvas, labels, data, colors) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.parentElement.clientWidth || 400;
        const h = canvas.height = canvas.parentElement.clientHeight || 250;

        ctx.clearRect(0, 0, w, h);
        const padding = { left: 40, right: 20, top: 20, bottom: 50 };
        const plotW = w - padding.left - padding.right;
        const plotH = h - padding.top - padding.bottom;

        const barWidth = (plotW / labels.length) * 0.6;
        const stepW = plotW / labels.length;

        data.forEach((val, idx) => {
            const barH = (val / 100) * plotH;
            const x = padding.left + idx * stepW + (stepW - barWidth) / 2;
            const y = h - padding.bottom - barH;

            ctx.fillStyle = colors[idx];
            ctx.fillRect(x, y, barWidth, barH);

            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(`${val}%`, x + 2, y - 5);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px sans-serif';
            ctx.fillText(labels[idx].substring(0, 8), x, h - padding.bottom + 15);
        });
    }
}

// Global initialization
let app = null;
window.addEventListener('DOMContentLoaded', () => {
    app = new AppController();
    window.app = app;
});
