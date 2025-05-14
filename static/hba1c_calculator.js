/**
 * HbA1c Calculator Module
 * Estimates HbA1c levels based on blood glucose and other parameters
 */

// Constants for HbA1c estimation
const HBA1C_CONSTANTS = {
    // Average Blood Glucose (mg/dL) to HbA1c (%) conversion factors
    // Based on the formula: HbA1c = (Average Blood Glucose + 46.7) / 28.7
    INTERCEPT: 46.7,
    SLOPE: 28.7,
    // Adjustment factors for different conditions
    AGE_FACTOR: 0.01,  // Slight increase for older individuals
    BMI_THRESHOLD: 25,  // BMI threshold for adjustment
    BMI_FACTOR: 0.05,   // Adjustment for high BMI
};

/**
 * Estimates HbA1c level based on blood glucose and other parameters
 * @param {number} bloodGlucose - Blood glucose level in mg/dL
 * @param {number} age - Age in years
 * @param {number} bmi - Body Mass Index
 * @param {string} gender - Gender ('Male' or 'Female')
 * @param {string} smoking - Smoking history ('Yes' or 'No')
 * @returns {number} - Estimated HbA1c level in %
 */
function estimateHbA1c(bloodGlucose, age, bmi, gender, smoking) {
    // Base estimation using the standard formula
    let estimatedHbA1c = (bloodGlucose + HBA1C_CONSTANTS.INTERCEPT) / HBA1C_CONSTANTS.SLOPE;
    
    // Apply adjustments based on other factors
    
    // Age adjustment - slight increase for older individuals
    if (age > 50) {
        estimatedHbA1c += (age - 50) * HBA1C_CONSTANTS.AGE_FACTOR;
    }
    
    // BMI adjustment - higher BMI tends to correlate with higher HbA1c
    if (bmi > HBA1C_CONSTANTS.BMI_THRESHOLD) {
        estimatedHbA1c += (bmi - HBA1C_CONSTANTS.BMI_THRESHOLD) * HBA1C_CONSTANTS.BMI_FACTOR;
    }
    
    // Gender adjustment - slight differences between males and females
    if (gender === 'Male') {
        estimatedHbA1c += 0.1; // Males tend to have slightly higher HbA1c
    }
    
    // Smoking adjustment - smoking can affect HbA1c levels
    if (smoking === 'Yes') {
        estimatedHbA1c += 0.2; // Smokers tend to have higher HbA1c
    }
    
    // Ensure the result is within reasonable bounds (4.0% - 14.0%)
    estimatedHbA1c = Math.max(4.0, Math.min(14.0, estimatedHbA1c));
    
    // Round to 1 decimal place
    return Math.round(estimatedHbA1c * 10) / 10;
}

/**
 * Interprets HbA1c level and provides a risk assessment
 * @param {number} hba1c - HbA1c level in %
 * @returns {object} - Risk assessment with level and description
 */
function interpretHbA1c(hba1c) {
    if (hba1c < 5.7) {
        return {
            level: 'Normal',
            description: 'Your HbA1c level is within the normal range.',
            color: 'success'
        };
    } else if (hba1c >= 5.7 && hba1c < 6.5) {
        return {
            level: 'Prediabetes',
            description: 'Your HbA1c level indicates prediabetes. This is a warning sign that you might develop type 2 diabetes in the future.',
            color: 'warning'
        };
    } else {
        return {
            level: 'Diabetes',
            description: 'Your HbA1c level indicates diabetes. Please consult with a healthcare professional for proper evaluation.',
            color: 'danger'
        };
    }
}

/**
 * Shows the HbA1c calculator modal
 */
function showHbA1cCalculator() {
    const hba1cModal = new bootstrap.Modal(document.getElementById('hba1cCalculatorModal'));
    hba1cModal.show();
}

/**
 * Calculates HbA1c level based on average blood glucose
 * Formula: HbA1c = (glucose + 46.7) / 28.7
 */
function calculateHbA1c() {
    const avgGlucose = parseFloat(document.getElementById('avg-blood-glucose').value);
    
    if (!avgGlucose || isNaN(avgGlucose) || avgGlucose <= 0) {
        document.getElementById('hba1c-result').innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            Please enter a valid blood glucose value.
        `;
        document.getElementById('hba1c-result').style.display = 'block';
        document.getElementById('use-hba1c-btn').style.display = 'none';
        return;
    }
    
    // Calculate HbA1c using the DCCT formula
    const hba1c = ((avgGlucose + 46.7) / 28.7).toFixed(1);
    
    // Determine risk category
    let riskCategory, riskClass;
    if (hba1c < 5.7) {
        riskCategory = 'Normal';
        riskClass = 'text-success';
    } else if (hba1c >= 5.7 && hba1c < 6.5) {
        riskCategory = 'Prediabetes';
        riskClass = 'text-warning';
    } else {
        riskCategory = 'Diabetes';
        riskClass = 'text-danger';
    }
    
    // Display result
    document.getElementById('hba1c-result').innerHTML = `
        <div class="text-center">
            <h4>Estimated HbA1c: <span class="${riskClass}">${hba1c}%</span></h4>
            <p>Category: <strong class="${riskClass}">${riskCategory}</strong></p>
            <div class="progress mt-2 mb-2">
                <div class="progress-bar bg-success" role="progressbar" style="width: 42%" aria-valuenow="42" aria-valuemin="0" aria-valuemax="100"></div>
                <div class="progress-bar bg-warning" role="progressbar" style="width: 8%" aria-valuenow="8" aria-valuemin="0" aria-valuemax="100"></div>
                <div class="progress-bar bg-danger" role="progressbar" style="width: 50%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <div class="d-flex justify-content-between small text-muted">
                <span>5.6%</span>
                <span>6.5%</span>
                <span>10%+</span>
            </div>
        </div>
    `;
    
    document.getElementById('hba1c-result').style.display = 'block';
    
    // Show the use button and save the calculated value
    document.getElementById('use-hba1c-btn').style.display = 'block';
    window.calculatedHbA1c = hba1c;
}

/**
 * Uses the calculated HbA1c value in the main form
 */
function useHbA1c() {
    if (window.calculatedHbA1c) {
        document.getElementById('hba1c').value = window.calculatedHbA1c;
        
        // Close the modal
        const hba1cModal = bootstrap.Modal.getInstance(document.getElementById('hba1cCalculatorModal'));
        hba1cModal.hide();
        
        // Highlight the HbA1c field
        const hba1cField = document.getElementById('hba1c');
        hba1cField.classList.add('highlight-animation');
        setTimeout(() => {
            hba1cField.classList.remove('highlight-animation');
        }, 1500);
    }
}