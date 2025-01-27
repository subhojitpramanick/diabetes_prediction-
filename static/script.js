async function predictRisk() {
    try {
        // Get input values from the form
        const age = document.getElementById('age').value;
        const bmi = document.getElementById('bmi').value;
        const hba1c = document.getElementById('hba1c').value;
        const blood_glucose = document.getElementById('blood-glucose').value;
        const gender = document.getElementById('gender').value;
        const smoking = document.getElementById('smoking').value;

        // Log inputs to ensure they are captured correctly
        console.log('Inputs:', { age, bmi, hba1c, blood_glucose, gender, smoking });

        // Send data to the backend
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                age: age,
                bmi: bmi,
                hba1c: hba1c,
                blood_glucose: blood_glucose,
                gender: gender,
                smoking: smoking,
            }),
        });

        // Log response status
        console.log('Response status:', response.status);

        // Check if the response is okay
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        // Get the prediction result
        const data = await response.json();
        console.log('Prediction Result:', data);

        // Display the result
        const outputDiv = document.getElementById('output');
        outputDiv.style.display = 'block';
        outputDiv.textContent = `Prediction: ${data.prediction}`;
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while predicting. Please try again.');
    }
}
