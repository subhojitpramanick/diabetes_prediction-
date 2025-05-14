// Initialize tooltips and set up animations
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Load prediction history from localStorage
    loadHistory();

    // Add event listener for save button
    document.getElementById('save-result').addEventListener('click', saveResult);

    // Add form validation
    const form = document.getElementById('prediction-form');
    form.addEventListener('submit', function(event) {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add('was-validated');
    });

    // Setup input range indicators
    setupBloodGlucoseIndicator();
    
    // Start animations for elements with fade-in class
    animateElements();
});

/**
 * Animate elements with fade-in class sequentially
 */
function animateElements() {
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(element => {
        const delay = element.style.animationDelay || '0s';
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        setTimeout(() => {
            element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, parseFloat(delay) * 1000);
    });
}

/**
 * Setup real-time visual indicator for blood glucose input
 */
function setupBloodGlucoseIndicator() {
    const bloodGlucoseInput = document.getElementById('blood-glucose');
    if (bloodGlucoseInput) {
        bloodGlucoseInput.addEventListener('input', updateGlucoseIndicator);
    }
}

/**
 * Update the visual glucose indicator based on input value
 */
function updateGlucoseIndicator() {
    const value = document.getElementById('blood-glucose').value;
    const normal = document.querySelector('.glucose-ranges .normal');
    const prediabetic = document.querySelector('.glucose-ranges .prediabetic');
    const diabetic = document.querySelector('.glucose-ranges .diabetic');
    
    if (!value) return;
    
    // Reset all highlights
    normal.classList.remove('highlighted');
    prediabetic.classList.remove('highlighted');
    diabetic.classList.remove('highlighted');
    
    // Highlight based on value
    if (value < 100) {
        normal.classList.add('highlighted');
        // Update progress bar position for visual indicator
        updateGlucoseProgressIndicator(parseInt(value));
    } else if (value >= 100 && value < 126) {
        prediabetic.classList.add('highlighted');
        // Update progress bar position
        updateGlucoseProgressIndicator(parseInt(value));
    } else {
        diabetic.classList.add('highlighted');
        // Update progress bar position
        updateGlucoseProgressIndicator(parseInt(value));
    }
}

/**
 * Updates the progress bar indicator based on the glucose value
 * @param {number} value - Blood glucose value
 */
function updateGlucoseProgressIndicator(value) {
    // Get progress bars
    const progressBars = document.querySelectorAll('.glucose-ranges .progress-bar');
    
    // No visual update if no value or progress bars
    if (!value || !progressBars.length) return;
    
    // Add animated indicator dot
    const progressContainer = document.querySelector('.glucose-ranges .progress');
    
    // Remove existing indicator if any
    const existingIndicator = document.querySelector('.glucose-value-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Calculate position (0-100% based on glucose range 70-300)
    // Normal: 70-99, Prediabetic: 100-125, Diabetic: 126+
    let position;
    
    if (value < 70) {
        position = 0;
    } else if (value > 300) {
        position = 100;
    } else {
        // Map the range to percentage position
        if (value < 100) {
            // 70-99 maps to 0-40%
            position = ((value - 70) / 30) * 40;
        } else if (value < 126) {
            // 100-125 maps to 40-70%
            position = 40 + ((value - 100) / 26) * 30;
        } else {
            // 126-300 maps to 70-100%
            position = 70 + ((value - 126) / 174) * 30;
        }
    }
    
    // Create and position the indicator
    const indicator = document.createElement('div');
    indicator.className = 'glucose-value-indicator';
    indicator.style.position = 'absolute';
    indicator.style.bottom = '-8px';
    indicator.style.left = `${position}%`;
    indicator.style.width = '10px';
    indicator.style.height = '10px';
    indicator.style.backgroundColor = value < 100 ? 'var(--secondary-color)' : 
                                     (value < 126 ? 'var(--warning-color)' : 'var(--danger-color)');
    indicator.style.borderRadius = '50%';
    indicator.style.transform = 'translateX(-50%)';
    indicator.style.transition = 'left 0.3s ease';
    indicator.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.2)';
    indicator.style.zIndex = '5';
    
    // Add value tooltip
    indicator.title = `${value} mg/dL`;
    
    // Add to container
    progressContainer.style.position = 'relative';
    progressContainer.appendChild(indicator);
    
    // Animate the indicator
    setTimeout(() => {
        indicator.style.transform = 'translateX(-50%) scale(1.2)';
        setTimeout(() => {
            indicator.style.transform = 'translateX(-50%) scale(1)';
        }, 200);
    }, 50);
}

/**
 * Predicts diabetes risk based on form inputs
 */
async function predictRisk() {
    try {
        // Form validation
        const form = document.getElementById('prediction-form');
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        // Show loading indicator
        document.getElementById('loading').style.display = 'block';
        document.getElementById('output').style.display = 'none';

        // Get input values from the form
        const age = document.getElementById('age').value;
        const bmi = document.getElementById('bmi').value;
        const hba1c = document.getElementById('hba1c').value;
        const blood_glucose = document.getElementById('blood-glucose').value;
        
        // Get gender value
        const gender = document.getElementById('gender').value;
        
        // Get smoking value from radio buttons
        let smoking = null;
        const smokingYes = document.getElementById('smoking-yes');
        const smokingNo = document.getElementById('smoking-no');
        if (smokingYes && smokingYes.checked) {
            smoking = 'Yes';
        } else if (smokingNo && smokingNo.checked) {
            smoking = 'No';
        }

        // Create input data object
        const inputData = {
            age: age,
            bmi: bmi,
            hba1c: hba1c,
            blood_glucose: blood_glucose,
            gender: gender,
            smoking: smoking,
        };

        // Add ripple effect to button
        addButtonRipple();

        // Send data to the backend
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(inputData),
        });

        // Check if the response is okay
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        // Get the prediction result
        const data = await response.json();
        
        // Hide loading indicator
        document.getElementById('loading').style.display = 'none';
        
        // Display the result
        displayResult(data.prediction, inputData, data.confidence);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loading').style.display = 'none';
        
        // Show error message
        const outputDiv = document.getElementById('output');
        outputDiv.style.display = 'block';
        document.getElementById('result-content').innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                An error occurred while predicting. Please try again.
            </div>
        `;
    }
}

/**
 * Add ripple effect to button when clicked
 */
function addButtonRipple() {
    const button = document.querySelector('.predict-button');
    button.classList.add('clicked');
    setTimeout(() => {
        button.classList.remove('clicked');
    }, 700);
}

/**
 * Displays the prediction result with appropriate styling and explanation
 * @param {string} prediction - The prediction result (Diabetic or Non-Diabetic)
 * @param {object} inputData - The input data used for prediction
 * @param {string} confidence - Confidence percentage of the prediction
 */
function displayResult(prediction, inputData, confidence = null) {
    const outputDiv = document.getElementById('output');
    const resultContent = document.getElementById('result-content');
    const resultExplanation = document.getElementById('result-explanation');
    
    outputDiv.style.display = 'block';
    outputDiv.classList.add('fade-in');
    
    // Set result content with appropriate styling
    if (prediction === 'Diabetic') {
        resultContent.innerHTML = `
            <div class="result-diabetic mb-3">
                <i class="fas fa-exclamation-circle me-2"></i>
                ${prediction}
            </div>
            <div class="progress mb-3">
                <div class="progress-bar bg-danger" role="progressbar" style="width: 85%" 
                    aria-valuenow="85" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            ${confidence ? `<div class="confidence-info mb-3">Confidence: ${confidence}</div>` : ''}
        `;
        
        resultExplanation.innerHTML = `
            <div class="alert alert-warning">
                <h5><i class="fas fa-info-circle me-2"></i>What does this mean?</h5>
                <p>Based on your parameters, our model predicts you may have diabetes. 
                This is not a diagnosis. Please consult with a healthcare professional for proper evaluation.</p>
            </div>
            <div class="mt-3">
                <h6><i class="fas fa-list-check me-2"></i>Next Steps:</h6>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item"><i class="fas fa-user-md me-2"></i>Schedule an appointment with your doctor</li>
                    <li class="list-group-item"><i class="fas fa-utensils me-2"></i>Consider dietary changes</li>
                    <li class="list-group-item"><i class="fas fa-running me-2"></i>Increase physical activity</li>
                </ul>
            </div>
        `;
    } else {
        resultContent.innerHTML = `
            <div class="result-non-diabetic mb-3">
                <i class="fas fa-check-circle me-2"></i>
                ${prediction}
            </div>
            <div class="progress mb-3">
                <div class="progress-bar bg-success" role="progressbar" style="width: 15%" 
                    aria-valuenow="15" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            ${confidence ? `<div class="confidence-info mb-3">Confidence: ${confidence}</div>` : ''}
        `;
        
        resultExplanation.innerHTML = `
            <div class="alert alert-success">
                <h5><i class="fas fa-info-circle me-2"></i>What does this mean?</h5>
                <p>Based on your parameters, our model predicts you are not likely to have diabetes. 
                However, it's always good to maintain a healthy lifestyle.</p>
            </div>
            <div class="mt-3">
                <h6><i class="fas fa-heart me-2"></i>Healthy Habits:</h6>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item"><i class="fas fa-apple-alt me-2"></i>Maintain a balanced diet</li>
                    <li class="list-group-item"><i class="fas fa-dumbbell me-2"></i>Regular exercise</li>
                    <li class="list-group-item"><i class="fas fa-bed me-2"></i>Adequate sleep</li>
                </ul>
            </div>
        `;
    }
    
    // Create a chart to visualize risk factors
    createRiskChart(inputData);
    
    // Scroll to results
    setTimeout(() => {
        outputDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
}

/**
 * Creates a chart to visualize the user's risk factors
 * @param {object} inputData - The input data used for prediction
 */
function createRiskChart(inputData) {
    // Remove any existing chart
    if (window.riskChart) {
        window.riskChart.destroy();
    }
    
    // Add chart to result content
    const chartContainer = document.createElement('div');
    chartContainer.className = 'mt-4 chart-container';
    chartContainer.innerHTML = '<canvas id="riskChart"></canvas>';
    document.getElementById('result-content').appendChild(chartContainer);
    
    // Define normal ranges for comparison
    const normalRanges = {
        bmi: { min: 18.5, max: 24.9, label: 'BMI' },
        hba1c: { min: 4.0, max: 5.6, label: 'HbA1c' },
        blood_glucose: { min: 70, max: 99, label: 'Blood Glucose' }
    };
    
    // Prepare data for chart
    const labels = [];
    const userData = [];
    const minData = [];
    const maxData = [];
    
    for (const key in normalRanges) {
        if (inputData[key]) {
            labels.push(normalRanges[key].label);
            userData.push(parseFloat(inputData[key]));
            minData.push(normalRanges[key].min);
            maxData.push(normalRanges[key].max);
        }
    }
    
    // Create the chart with modern styling
    const ctx = document.getElementById('riskChart').getContext('2d');
    window.riskChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Your Value',
                    data: userData,
                    backgroundColor: 'rgba(94, 96, 206, 0.7)',
                    borderColor: 'rgba(94, 96, 206, 1)',
                    borderWidth: 1,
                    borderRadius: 8,
                    barThickness: 30
                },
                {
                    label: 'Minimum Normal',
                    data: minData,
                    backgroundColor: 'rgba(46, 196, 182, 0.2)',
                    borderColor: 'rgba(46, 196, 182, 1)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    type: 'line',
                    fill: false
                },
                {
                    label: 'Maximum Normal',
                    data: maxData,
                    backgroundColor: 'rgba(255, 90, 95, 0.2)',
                    borderColor: 'rgba(255, 90, 95, 1)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    type: 'line',
                    fill: '+1'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Your Health Parameters vs. Normal Range',
                    color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#333',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    padding: 10,
                    boxPadding: 4,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted')
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted')
                    }
                }
            }
        }
    });
}

/**
 * Saves the prediction result to local storage
 */
function saveResult() {
    try {
        // Gather the form data and prediction result
        const age = document.getElementById('age').value;
        const bmi = document.getElementById('bmi').value;
        const hba1c = document.getElementById('hba1c').value;
        const blood_glucose = document.getElementById('blood-glucose').value;
        const gender = document.getElementById('gender').value;
        
        // Get smoking value from radio buttons
        let smoking = 'No';
        const smokingYes = document.getElementById('smoking-yes');
        if (smokingYes && smokingYes.checked) {
            smoking = 'Yes';
        }
        
        // Get prediction result correctly from the DOM
        let predictionResult = 'Non-Diabetic';
        const diabeticElement = document.querySelector('.result-diabetic');
        const nonDiabeticElement = document.querySelector('.result-non-diabetic');
        
        if (diabeticElement) {
            predictionResult = 'Diabetic';
        } else if (nonDiabeticElement) {
            predictionResult = 'Non-Diabetic';
        }
        
        // Create history item
        const timestamp = new Date().toISOString();
        const id = 'pred_' + Date.now();
        const historyItem = {
            id: id,
            timestamp: timestamp,
            age: age,
            bmi: bmi,
            hba1c: hba1c,
            blood_glucose: blood_glucose,
            gender: gender,
            smoking: smoking,
            result: predictionResult
        };
        
        // Get existing history or create new array
        let history = JSON.parse(localStorage.getItem('diabetesPredictionHistory')) || [];
        
        // Add new item to the beginning
        history.unshift(historyItem);
        
        // Limit history to 10 items
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        
        // Save to localStorage
        localStorage.setItem('diabetesPredictionHistory', JSON.stringify(history));
        
        // Update history display
        loadHistory();
        
        // Show success message with animation
        const saveBtn = document.getElementById('save-result');
        saveBtn.innerHTML = '<i class="fas fa-check me-2"></i>Saved!';
        saveBtn.classList.add('btn-success');
        saveBtn.classList.remove('btn-outline-primary');
        
        setTimeout(() => {
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Result';
            saveBtn.classList.remove('btn-success');
            saveBtn.classList.add('btn-outline-primary');
            
            // Scroll to history section
            document.getElementById('history').scrollIntoView({ behavior: 'smooth' });
        }, 2000);
        
    } catch (error) {
        console.error('Error saving result:', error);
        alert('Failed to save your result. Please try again.');
    }
}

/**
 * Loads and displays the prediction history from localStorage
 */
async function loadHistory() {
    const historyList = document.getElementById('history-list');
    const history = JSON.parse(localStorage.getItem('diabetesPredictionHistory')) || [];
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="text-center text-muted">Your prediction history will appear here</p>';
        return;
    }
    
    historyList.innerHTML = '';
    
    history.forEach((item, index) => {
        const date = new Date(item.timestamp);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.dataset.id = item.id;
        
        const resultClass = item.result === 'Diabetic' ? 'text-danger' : 'text-success';
        const resultIcon = item.result === 'Diabetic' 
            ? '<i class="fas fa-exclamation-circle"></i>' 
            : '<i class="fas fa-check-circle"></i>';
        
        historyItem.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-3">
                    <div class="small text-muted">${formattedDate}</div>
                </div>
                <div class="col-md-2">
                    <span class="badge ${item.result === 'Diabetic' ? 'bg-danger' : 'bg-success'}">${resultIcon} ${item.result}</span>
                </div>
                <div class="col-md-5">
                    <div class="row small">
                        <div class="col-6">
                            <i class="fas fa-calendar-alt me-1"></i> Age: ${item.age}
                        </div>
                        <div class="col-6">
                            <i class="fas fa-weight me-1"></i> BMI: ${item.bmi}
                        </div>
                        <div class="col-6">
                            <i class="fas fa-chart-line me-1"></i> HbA1c: ${item.hba1c}
                        </div>
                        <div class="col-6">
                            <i class="fas fa-tint me-1"></i> Glucose: ${item.blood_glucose}
                        </div>
                    </div>
                </div>
                <div class="col-md-2 text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="useHistoryItem('${item.id}')">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteHistoryItem('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

/**
 * Uses a history item to fill the form and make prediction
 * @param {string} id - The ID of the history item to use
 */
async function useHistoryItem(id) {
    try {
        const history = JSON.parse(localStorage.getItem('diabetesPredictionHistory')) || [];
        const item = history.find(h => h.id === id);
        
        if (!item) {
            throw new Error('History item not found');
        }
        
        // Fill the form with the history item data
        document.getElementById('age').value = item.age;
        document.getElementById('bmi').value = item.bmi;
        document.getElementById('hba1c').value = item.hba1c;
        document.getElementById('blood-glucose').value = item.blood_glucose;
        document.getElementById('gender').value = item.gender;
        
        // Handle smoking radio buttons
        if (item.smoking === 'Yes') {
            document.getElementById('smoking-yes').checked = true;
        } else {
            document.getElementById('smoking-no').checked = true;
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Highlight the form fields
        highlightFormFields();
        
        // Update glucose indicator
        updateGlucoseIndicator();
        
    } catch (error) {
        console.error('Error using history item:', error);
        alert('Failed to use this history item. Please try again.');
    }
}

/**
 * Adds a visual highlight effect to the form fields
 */
function highlightFormFields() {
    const fields = document.querySelectorAll('.form-control, .form-select, .btn-group');
    fields.forEach(field => {
        field.classList.add('highlight-animation');
        setTimeout(() => {
            field.classList.remove('highlight-animation');
        }, 1500);
    });
}

/**
 * Deletes a history item
 * @param {string} id - The ID of the history item to delete
 */
async function deleteHistoryItem(id) {
    try {
        let history = JSON.parse(localStorage.getItem('diabetesPredictionHistory')) || [];
        
        // Find the element to animate
        const element = document.querySelector(`.history-item[data-id="${id}"]`);
        if (element) {
            // Add animation
            element.style.transition = 'all 0.3s ease';
            element.style.opacity = '0';
            element.style.transform = 'translateX(20px)';
            
            // Wait for animation to complete
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Filter out the item to delete
        history = history.filter(item => item.id !== id);
        
        // Save updated history
        localStorage.setItem('diabetesPredictionHistory', JSON.stringify(history));
        
        // Update the display
        loadHistory();
    } catch (error) {
        console.error('Error deleting history item:', error);
        alert('Failed to delete history item. Please try again.');
    }
}

/**
 * Shows the BMI calculator modal
 */
function showBmiCalculator() {
    const bmiModal = new bootstrap.Modal(document.getElementById('bmiCalculatorModal'));
    bmiModal.show();
}

/**
 * Calculates BMI from height and weight
 */
function calculateBMI() {
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const heightUnit = document.getElementById('height-unit').value;
    const weightUnit = document.getElementById('weight-unit').value;
    
    if (!height || !weight || isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
        document.getElementById('bmi-result').innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            Please enter valid height and weight values.
        `;
        document.getElementById('bmi-result').style.display = 'block';
        document.getElementById('use-bmi-btn').style.display = 'none';
        return;
    }
    
    // Convert to metric if needed
    let heightInMeters = height;
    let weightInKg = weight;
    
    if (heightUnit === 'in') {
        heightInMeters = height * 0.0254; // inches to meters
    } else {
        heightInMeters = height / 100; // cm to meters
    }
    
    if (weightUnit === 'lb') {
        weightInKg = weight * 0.453592; // pounds to kg
    }
    
    // Calculate BMI
    const bmi = weightInKg / (heightInMeters * heightInMeters);
    const roundedBmi = Math.round(bmi * 10) / 10;
    
    // Display result with category
    let category, categoryClass;
    if (bmi < 18.5) {
        category = 'Underweight';
        categoryClass = 'text-warning';
    } else if (bmi < 25) {
        category = 'Normal weight';
        categoryClass = 'text-success';
    } else if (bmi < 30) {
        category = 'Overweight';
        categoryClass = 'text-warning';
    } else {
        category = 'Obese';
        categoryClass = 'text-danger';
    }
    
    document.getElementById('bmi-result').innerHTML = `
        <div class="text-center">
            <h4>Your BMI: <span class="${categoryClass}">${roundedBmi}</span></h4>
            <p>Category: <strong class="${categoryClass}">${category}</strong></p>
            <div class="progress mt-2 mb-2">
                <div class="progress-bar bg-success" role="progressbar" style="width: 25%" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                <div class="progress-bar bg-warning" role="progressbar" style="width: 25%" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                <div class="progress-bar bg-danger" role="progressbar" style="width: 50%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <div class="d-flex justify-content-between small text-muted">
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>40+</span>
            </div>
        </div>
    `;
    
    document.getElementById('bmi-result').style.display = 'block';
    
    // Show the use button
    document.getElementById('use-bmi-btn').style.display = 'block';
    
    // Save BMI value for later use
    window.calculatedBmi = roundedBmi;
}

/**
 * Uses the calculated BMI value in the main form
 */
function useBMI() {
    if (window.calculatedBmi) {
        document.getElementById('bmi').value = window.calculatedBmi;
        
        // Close the modal
        const bmiModal = bootstrap.Modal.getInstance(document.getElementById('bmiCalculatorModal'));
        bmiModal.hide();
        
        // Highlight the BMI field
        const bmiField = document.getElementById('bmi');
        bmiField.classList.add('highlight-animation');
        setTimeout(() => {
            bmiField.classList.remove('highlight-animation');
        }, 1500);
    }
}
