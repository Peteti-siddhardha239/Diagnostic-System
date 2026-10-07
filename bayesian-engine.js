/**
 * Bayesian Disease Prediction & Sequential Updating Engine
 * Core mathematical engine for Bayesian inference and Information Theory.
 */

class BayesianEngine {
    constructor(diseases, tests) {
        // diseases: Array of { id, name, prior, description, color }
        // tests: Array of { id, name, cost, likelihoods: { [diseaseId]: { positive: float, negative: float } } }
        this.diseases = JSON.parse(JSON.stringify(diseases));
        this.tests = JSON.parse(JSON.stringify(tests));
        this.normalizePriors();
    }

    normalizePriors() {
        const sum = this.diseases.reduce((acc, d) => acc + d.prior, 0);
        if (sum > 0) {
            this.diseases.forEach(d => {
                d.prior = d.prior / sum;
            });
        }
    }

    /**
     * Compute a single update step given prior distribution and observed test result.
     * @param {Object} currentProbabilities - { [diseaseId]: float }
     * @param {string} testId - ID of the test performed
     * @param {string} result - 'positive' | 'negative'
     * @returns {Object} { posterior: { [diseaseId]: float }, mathTrace: Array, marginalLikelihood: float }
     */
    updateStep(currentProbabilities, testId, result = 'positive') {
        const test = this.tests.find(t => t.id === testId);
        if (!test) throw new Error(`Test with id ${testId} not found`);

        let jointProbabilities = {};
        let marginalLikelihood = 0;
        const mathTrace = [];

        // 1. Calculate Joint Probabilities: P(E | D_i) * P(D_i)
        this.diseases.forEach(d => {
            const diseaseId = d.id;
            const priorP = currentProbabilities[diseaseId] ?? d.prior;
            
            // Likelihood of this test result given disease
            const likelihoodInfo = test.likelihoods[diseaseId] || { positive: 0.5, negative: 0.5 };
            const likelihood = result === 'positive' 
                ? likelihoodInfo.positive 
                : (likelihoodInfo.negative ?? (1 - likelihoodInfo.positive));

            const joint = likelihood * priorP;
            jointProbabilities[diseaseId] = joint;
            marginalLikelihood += joint;

            mathTrace.push({
                diseaseId,
                diseaseName: d.name,
                prior: priorP,
                likelihood,
                joint,
                formulaSnippet: `P(${test.name}=${result} | ${d.name}) × P(${d.name}) = ${likelihood.toFixed(4)} × ${priorP.toFixed(4)} = ${joint.toFixed(6)}`
            });
        });

        // Avoid division by zero
        if (marginalLikelihood === 0) marginalLikelihood = 1e-12;

        // 2. Normalize to obtain Posterior: P(D_i | E) = Joint / P(E)
        const posterior = {};
        mathTrace.forEach(item => {
            const post = item.joint / marginalLikelihood;
            posterior[item.diseaseId] = post;
            item.posterior = post;
            item.marginalLikelihood = marginalLikelihood;
            item.calculation = `${item.joint.toFixed(6)} / ${marginalLikelihood.toFixed(6)} = ${(post * 100).toFixed(2)}%`;
        });

        return {
            test,
            result,
            prior: currentProbabilities,
            posterior,
            marginalLikelihood,
            mathTrace
        };
    }

    /**
     * Compute sequential probability trajectory for a sequence of test observations.
     * @param {Array<{ testId: string, result: 'positive'|'negative' }>} evidenceChain
     * @returns {Array<Object>} Array of state snapshots from step 0 (prior) to step N.
     */
    runSequentialChain(evidenceChain) {
        // Initial state at step 0
        let currentP = {};
        this.diseases.forEach(d => { currentP[d.id] = d.prior; });

        const history = [{
            step: 0,
            label: 'Baseline Prior',
            test: null,
            result: null,
            probabilities: { ...currentP },
            entropy: this.calculateEntropy(currentP),
            marginalLikelihood: 1.0,
            mathTrace: null
        }];

        evidenceChain.forEach((ev, idx) => {
            const stepResult = this.updateStep(currentP, ev.testId, ev.result);
            currentP = { ...stepResult.posterior };

            history.push({
                step: idx + 1,
                label: `Step ${idx + 1}: ${stepResult.test.name} (${ev.result.toUpperCase()})`,
                test: stepResult.test,
                result: ev.result,
                probabilities: { ...currentP },
                entropy: this.calculateEntropy(currentP),
                marginalLikelihood: stepResult.marginalLikelihood,
                mathTrace: stepResult.mathTrace
            });
        });

        return history;
    }

    /**
     * Calculate Shannon Entropy of a probability distribution (uncertainty metric).
     * H(X) = - sum(p * log2(p))
     */
    calculateEntropy(probabilities) {
        let entropy = 0;
        for (const id in probabilities) {
            const p = probabilities[id];
            if (p > 1e-9) {
                entropy -= p * Math.log2(p);
            }
        }
        return entropy;
    }

    /**
     * Recommend the next test that maximizes Expected Information Gain (mutual information).
     * Helps a doctor choose the most cost-effective or informative test!
     */
    recommendNextTest(currentProbabilities, excludedTestIds = []) {
        const availableTests = this.tests.filter(t => !excludedTestIds.includes(t.id));
        if (availableTests.length === 0) return null;

        const currentEntropy = this.calculateEntropy(currentProbabilities);
        const recommendations = [];

        availableTests.forEach(test => {
            // Expected entropy after running test
            // P(Pos) = sum_i P(Pos | D_i) * P(D_i)
            let pPos = 0;
            this.diseases.forEach(d => {
                const pD = currentProbabilities[d.id] ?? d.prior;
                const likPos = test.likelihoods[d.id]?.positive ?? 0.5;
                pPos += likPos * pD;
            });
            const pNeg = 1 - pPos;

            // Posterior if positive
            const updatePos = this.updateStep(currentProbabilities, test.id, 'positive');
            const entropyPos = this.calculateEntropy(updatePos.posterior);

            // Posterior if negative
            const updateNeg = this.updateStep(currentProbabilities, test.id, 'negative');
            const entropyNeg = this.calculateEntropy(updateNeg.posterior);

            // Expected Posterior Entropy
            const expectedEntropy = (pPos * entropyPos) + (pNeg * entropyNeg);
            const informationGain = Math.max(0, currentEntropy - expectedEntropy);

            // Efficiency metric = Info Gain / (Cost factor)
            const cost = test.cost || 50;
            const efficiency = (informationGain / Math.sqrt(cost)) * 100;

            recommendations.push({
                test,
                expectedEntropy,
                informationGain,
                efficiency,
                pPos,
                pNeg
            });
        });

        recommendations.sort((a, b) => b.informationGain - a.informationGain);
        return recommendations;
    }

    /**
     * Simulate an observational test result for a patient known to have `trueDiseaseId`.
     * Uses the true sensitivity/specificity with stochastic sampling.
     */
    simulateTestResult(testId, trueDiseaseId) {
        const test = this.tests.find(t => t.id === testId);
        if (!test) throw new Error("Test not found");

        const lik = test.likelihoods[trueDiseaseId] || { positive: 0.5, negative: 0.5 };
        const probPositive = lik.positive;

        const randomRoll = Math.random();
        return randomRoll < probPositive ? 'positive' : 'negative';
    }
}

// Export for Node/CommonJS or window browser context
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BayesianEngine;
} else if (typeof window !== 'undefined') {
    window.BayesianEngine = BayesianEngine;
}
