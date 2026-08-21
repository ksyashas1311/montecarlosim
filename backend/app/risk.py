import numpy as np
from typing import Optional

def calculate_ruin_probability(wealth: np.ndarray) -> float:
    """
    Calculates the probability of ruin, defined as the fraction of simulated paths 
    where net worth drops to or below zero at any point during the horizon.
    """
    # wealth: shape (n_simulations, n_years + 1)
    ruined = np.any(wealth <= 0.0, axis=1)
    return float(ruined.mean())

def calculate_median_depletion_age(wealth: np.ndarray, current_age: int) -> Optional[float]:
    """
    Calculates the median age when depletion (net worth <= 0) occurs among the paths that experience ruin.
    Returns None if no paths experience ruin.
    """
    n_sims, n_years_plus_1 = wealth.shape
    ruin_ages = []
    for i in range(n_sims):
        zero_indices = np.where(wealth[i] <= 0.0)[0]
        if len(zero_indices) > 0:
            ruin_ages.append(current_age + zero_indices[0])
    
    if ruin_ages:
        return float(np.median(ruin_ages))
    return None

def calculate_var_95(terminal_wealth: np.ndarray) -> float:
    """
    Calculates 95% Value-at-Risk (VaR).
    Defined as the maximum expected loss at a 95% confidence level, measured as the
    difference between the median terminal wealth and the 5th percentile outcome.
    """
    median_wealth = np.median(terminal_wealth)
    percentile_5 = np.percentile(terminal_wealth, 5)
    return float(np.maximum(median_wealth - percentile_5, 0.0))

def calculate_cvar_95(terminal_wealth: np.ndarray) -> float:
    """
    Calculates 95% Conditional Value-at-Risk (CVaR) or Expected Shortfall.
    Defined as the expected value of terminal wealth in the worst 5% of simulated paths.
    """
    percentile_5 = np.percentile(terminal_wealth, 5)
    worst_paths = terminal_wealth[terminal_wealth <= percentile_5]
    if len(worst_paths) > 0:
        return float(worst_paths.mean())
    return float(percentile_5)
