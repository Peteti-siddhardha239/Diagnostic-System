# 🩺 Dr. Bayes: Clinical Bayesian Diagnostic System & Game

An interactive, AI-driven medical diagnostic simulation and educational game grounded in **Bayes' Theorem** and **Sequential Evidence Updating**.

Located at: `C:\Users\SIDDHARDHA\Downloads\aiml\`

---

## 🎮 How to Play with Me!

You can play in **two different ways**:

### 1. In Your Web Browser (Full Graphical Experience)
- Simply double-click [`index.html`](file:///C:/Users/SIDDHARDHA/Downloads/aiml/index.html) in your file explorer, OR
- Run `python server.py` in your terminal to launch at `http://localhost:8080/index.html`.

#### Features in the Web App:
- **Emergency Room Patient HUD**: Review patient name, chief complaint, and pulse vitals.
- **Order Real-time Diagnostic Tests**: Run Rapid Antigen tests, RT-PCR, Troponin assays, ECGs, blood smears, and chest radiography with real-time audio sound effects.
- **AI Recommendation Assistant**: Identifies tests that offer the highest **Expected Information Gain** (Shannon entropy reduction) for maximum efficiency.
- **Sequential Probability Trajectory Chart**: Watch disease probabilities climb and fall step-by-step ($P_0 \to P_1 \to \dots \to P_k$).
- **Final Clinical Verdict**: Submit your diagnosis to calculate your Diagnostic Score out of 100, budget savings, and earn titles from *Intern Diagnostician* to *Master Bayesian Clinician*!
- **Sequential Simulator & Math Inspector**: Toggle test findings (+/-) and inspect the exact algebraic substitutions in the denominator and numerator.

### 2. In Your Terminal (Interactive CLI Game)
Run in PowerShell:
```powershell
python C:\Users\SIDDHARDHA\Downloads\aiml\bayes_disease_predictor.py --game
```
Play as the attending physician right from your command prompt with real-time ASCII probability bars.

---

## 📐 Mathematical Formulation

### 1. Single Diagnostic Test Formulation
Given a differential diagnosis of mutually exclusive conditions $D_1, D_2, \dots, D_n$ and an observed test result $E$:

$$P(D_i \mid E) = \frac{P(E \mid D_i) \cdot P(D_i)}{\sum_{j=1}^{n} P(E \mid D_j) \cdot P(D_j)}$$

- **Prior $P(D_i)$**: Baseline population prevalence before testing.
- **Likelihood $P(E \mid D_i)$**: Probability that test result $E$ occurs given disease $D_i$ (Sensitivity if positive, $1 - \text{Specificity}$ if false positive).
- **Marginal Likelihood $P(E)$**: Normalizing denominator (Law of Total Probability) ensuring $\sum P(D_i \mid E) = 1.0$.
- **Posterior $P(D_i \mid E)$**: Updated diagnosis probability given the evidence.

### 2. Sequential Evidence Updating
As tests $T_1, T_2, \dots, T_k$ are administered, the posterior from the prior step becomes the prior for the subsequent step:

$$\text{Posterior}_k(D_i) = P(D_i \mid T_1, \dots, T_k) = \frac{P(T_k \mid D_i) \cdot \text{Posterior}_{k-1}(D_i)}{\sum_{j=1}^n P(T_k \mid D_j) \cdot \text{Posterior}_{k-1}(D_j)}$$

---

## 📂 Project Structure

- [`index.html`](file:///C:/Users/SIDDHARDHA/Downloads/aiml/index.html) - Main dashboard with Doctor Game Mode and Simulator
- [`style.css`](file:///C:/Users/SIDDHARDHA/Downloads/aiml/style.css) - Modern dark-mode UI stylesheet
- [`bayesian-engine.js`](file:///C:/Users/SIDDHARDHA/Downloads/aiml/bayesian-engine.js) - Mathematical inference engine & Information Gain logic
- [`app.js`](file:///C:/Users/SIDDHARDHA/Downloads/aiml/app.js) - Application controller and chart visualizer
- [`sound-fx.js`](file:///C:/Users/SIDDHARDHA/Downloads/aiml/sound-fx.js) - Web Audio API synthesized sound effects
- [`bayes_disease_predictor.py`](file:///C:/Users/SIDDHARDHA/Downloads/aiml/bayes_disease_predictor.py) - Standalone Python CLI game & mathematical analyzer
- [`server.py`](file:///C:/Users/SIDDHARDHA/Downloads/aiml/server.py) - Local HTTP server launcher
