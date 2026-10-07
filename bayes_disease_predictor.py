#!/usr/bin/env python3
"""
Bayesian Disease Prediction & Sequential Updating CLI System & Game
Implements Bayes' Theorem for medical diagnosis and an interactive terminal game.
"""

import sys
import math
import random

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Clinical Datasets
SCENARIOS = {
    "respiratory": {
        "name": "Respiratory Infection Differential",
        "diseases": {
            "COVID-19": 0.15,
            "Seasonal Flu": 0.20,
            "Common Cold": 0.35,
            "Allergic Rhinitis": 0.15,
            "Healthy": 0.15
        },
        "tests": {
            "High Fever (>38.5C)": {
                "COVID-19": 0.80, "Seasonal Flu": 0.90, "Common Cold": 0.15, "Allergic Rhinitis": 0.02, "Healthy": 0.01
            },
            "Loss of Taste/Smell": {
                "COVID-19": 0.65, "Seasonal Flu": 0.08, "Common Cold": 0.10, "Allergic Rhinitis": 0.05, "Healthy": 0.01
            },
            "Rapid COVID Antigen": {
                "COVID-19": 0.88, "Seasonal Flu": 0.03, "Common Cold": 0.02, "Allergic Rhinitis": 0.01, "Healthy": 0.01
            },
            "Rapid Flu Swab": {
                "COVID-19": 0.02, "Seasonal Flu": 0.85, "Common Cold": 0.03, "Allergic Rhinitis": 0.01, "Healthy": 0.01
            },
            "Nasal Eosinophil Smear": {
                "COVID-19": 0.05, "Seasonal Flu": 0.05, "Common Cold": 0.08, "Allergic Rhinitis": 0.82, "Healthy": 0.03
            }
        }
    },
    "chest_pain": {
        "name": "Emergency Acute Chest Pain Triage",
        "diseases": {
            "Myocardial Infarction": 0.15,
            "Unstable Angina": 0.20,
            "Pulmonary Embolism": 0.08,
            "GERD / Reflux": 0.32,
            "Costochondritis": 0.25
        },
        "tests": {
            "ECG ST-Elevation": {
                "Myocardial Infarction": 0.85, "Unstable Angina": 0.40, "Pulmonary Embolism": 0.18, "GERD / Reflux": 0.02, "Costochondritis": 0.01
            },
            "Cardiac Troponin I": {
                "Myocardial Infarction": 0.96, "Unstable Angina": 0.10, "Pulmonary Embolism": 0.15, "GERD / Reflux": 0.01, "Costochondritis": 0.01
            },
            "D-Dimer Elevated": {
                "Myocardial Infarction": 0.25, "Unstable Angina": 0.10, "Pulmonary Embolism": 0.95, "GERD / Reflux": 0.04, "Costochondritis": 0.03
            },
            "Chest Wall Tenderness": {
                "Myocardial Infarction": 0.05, "Unstable Angina": 0.06, "Pulmonary Embolism": 0.08, "GERD / Reflux": 0.10, "Costochondritis": 0.92
            }
        }
    }
}


def normalize_priors(priors):
    total = sum(priors.values())
    return {k: v / total for k, v in priors.items()}


def bayes_update(priors, test_likelihoods, result="positive"):
    """
    Calculate posterior probabilities given current priors and test likelihoods.
    P(D_i | E) = [P(E | D_i) * P(D_i)] / sum_j [P(E | D_j) * P(D_j)]
    """
    joint = {}
    marginal_evidence = 0.0

    for disease, prior_p in priors.items():
        lik_pos = test_likelihoods.get(disease, 0.5)
        lik = lik_pos if result == "positive" else (1.0 - lik_pos)
        j = lik * prior_p
        joint[disease] = j
        marginal_evidence += j

    if marginal_evidence == 0:
        marginal_evidence = 1e-12

    posteriors = {disease: j / marginal_evidence for disease, j in joint.items()}
    return posteriors, marginal_evidence, joint


def render_ascii_bars(probabilities):
    """Prints a clean ASCII bar chart of probabilities compatible with all terminals."""
    for disease, prob in sorted(probabilities.items(), key=lambda x: x[1], reverse=True):
        percentage = prob * 100
        bar_len = int(percentage / 2)  # 50 max chars
        bar = "#" * bar_len + "-" * (50 - bar_len)
        print(f"  {disease:<24} [{bar}] {percentage:6.2f}%")


def play_terminal_doctor_game():
    """Interactive CLI Doctor Diagnostic Game."""
    print("=" * 70)
    print(">>> WELCOME TO DR. BAYES: CLINICAL DIAGNOSTIC GAME <<<")
    print("=" * 70)
    print("You are the attending diagnostician. A patient has entered triage.")
    print("Select a clinical scenario:")
    keys = list(SCENARIOS.keys())
    for idx, k in enumerate(keys, 1):
        print(f" [{idx}] {SCENARIOS[k]['name']}")

    choice = input("\nEnter scenario (default 1): ").strip()
    scenario_key = keys[0]
    if choice.isdigit() and 1 <= int(choice) <= len(keys):
        scenario_key = keys[int(choice) - 1]

    scenario = SCENARIOS[scenario_key]
    diseases = scenario["diseases"]
    tests = scenario["tests"]

    # Secretly roll true disease based on prior
    roll = random.random()
    cum = 0.0
    true_disease = list(diseases.keys())[0]
    for d, p in diseases.items():
        cum += p
        if roll <= cum:
            true_disease = d
            break

    current_p = normalize_priors(diseases)
    budget = 250
    ordered_tests = []

    print(f"\n--- Clinical Scenario: {scenario['name']} ---")
    print("Initial Population Baseline Priors:")
    render_ascii_bars(current_p)

    while True:
        print("\n" + "-" * 70)
        print(f"Remaining Budget: ${budget} | Tests Completed: {len(ordered_tests)}")
        print("Available Actions:")
        print(" [D] Submit Final Diagnosis Verdict")
        
        test_names = list(tests.keys())
        for idx, tname in enumerate(test_names, 1):
            status = "(ALREADY RUN)" if tname in ordered_tests else "(Cost: $40)"
            print(f" [{idx}] Order Test: {tname} {status}")
        print(" [Q] Quit Game")

        action = input("\nSelect action: ").strip()
        if action.upper() == "Q":
            print("Game exited.")
            return

        if action.upper() == "D":
            print("\nSelect your final diagnosis:")
            d_list = list(diseases.keys())
            for idx, dname in enumerate(d_list, 1):
                print(f" [{idx}] {dname} (Current Bayesian Probability: {current_p[dname]*100:.1f}%)")
            d_choice = input("Enter choice: ").strip()
            if d_choice.isdigit() and 1 <= int(d_choice) <= len(d_list):
                guessed_disease = d_list[int(d_choice) - 1]
                print("\n" + "=" * 70)
                if guessed_disease == true_disease:
                    print("*** CORRECT DIAGNOSIS! EXCELLENT CLINICAL ACUMEN! ***")
                else:
                    print("[!] INCORRECT DIAGNOSIS! Patient had another condition.")
                print(f"True Pathology: {true_disease}")
                print(f"Your Verdict:   {guessed_disease}")
                print(f"Bayesian Probability at Decision: {current_p[true_disease]*100:.2f}%")
                print(f"Remaining Budget: ${budget}")
                print("=" * 70)
                return

        if action.isdigit() and 1 <= int(action) <= len(test_names):
            selected_test = test_names[int(action) - 1]
            if selected_test in ordered_tests:
                print("You already ordered this test!")
                continue
            if budget < 40:
                print("Insufficient budget!")
                continue

            budget -= 40
            ordered_tests.append(selected_test)

            # Probabilistic test result based on true disease
            prob_pos = tests[selected_test].get(true_disease, 0.5)
            result = "positive" if random.random() < prob_pos else "negative"

            print(f"\nRunning {selected_test}...")
            print(f"RESULT RECEIVED: [{result.upper()}]")

            # Bayesian update
            current_p, marginal, _ = bayes_update(current_p, tests[selected_test], result)
            print(f"Marginal Evidence P(E): {marginal:.6f}")
            print("\nUpdated Posterior Probability Distribution:")
            render_ascii_bars(current_p)


def run_demonstration():
    """Runs automated demonstration of sequential Bayesian updates."""
    print("=" * 75)
    print("BAYESIAN SEQUENTIAL UPDATING DEMONSTRATION")
    print("=" * 75)

    scenario = SCENARIOS["respiratory"]
    priors = normalize_priors(scenario["diseases"])

    print(f"Clinical Case: {scenario['name']}")
    print("\n[Step 0: Baseline Population Priors]")
    render_ascii_bars(priors)

    test_sequence = [
        ("High Fever (>38.5C)", "positive"),
        ("Loss of Taste/Smell", "positive"),
        ("Rapid COVID Antigen", "positive")
    ]

    curr_p = priors
    for step_num, (tname, res) in enumerate(test_sequence, 1):
        print(f"\n[Step {step_num}: Test Observed -> {tname} ({res.upper()})]")
        curr_p, marginal, joint = bayes_update(curr_p, scenario["tests"][tname], res)
        print(f"Marginal Likelihood Denominator P(E) = {marginal:.6f}")
        render_ascii_bars(curr_p)

    print("\n" + "=" * 75)
    print("Demonstration Complete! Run with '--game' to play the interactive doctor game.")
    print("=" * 75)


if __name__ == "__main__":
    if "--game" in sys.argv or "-g" in sys.argv:
        play_terminal_doctor_game()
    else:
        run_demonstration()
