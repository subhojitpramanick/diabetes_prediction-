from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
import joblib
import logging

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__, static_folder='static', template_folder='templates')

# Load the model, scaler, and column names
model = joblib.load('diabetes_model.joblib')
scaler = joblib.load('scaler.joblib')
columns = joblib.load('columns.joblib')

@app.route('/')
def home():
    return render_template('index.html')  # Serve the HTML file from templates folder

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Log the received JSON
        app.logger.info(f"Received data: {request.json}")

        # Retrieve input data
        data = request.json
        age = float(data['age'])
        bmi = float(data['bmi'])
        HbA1c_level = float(data['hba1c'])
        blood_glucose_level = float(data['blood_glucose'])
        gender = data['gender']
        smoking_history = data['smoking']

        # Create a DataFrame for the input
        input_data = pd.DataFrame({
            'age': [age],
            'bmi': [bmi],
            'HbA1c_level': [HbA1c_level],
            'blood_glucose_level': [blood_glucose_level],
            'gender_Male': [1 if gender == 'Male' else 0],
            'smoking_history_Yes': [1 if smoking_history == 'Yes' else 0],
        })

        # Add missing columns with 0
        for col in columns:
            if col not in input_data.columns:
                input_data[col] = 0

        # Reorder columns to match training data
        input_data = input_data[columns]

        # Scale the input
        input_scaled = scaler.transform(input_data)

        # Make prediction
        prediction = model.predict(input_scaled)
        result = 'Diabetic' if prediction[0] == 1 else 'Non-Diabetic'

        # Return the prediction
        return jsonify({'prediction': result})
    except Exception as e:
        app.logger.error(f"Error during prediction: {str(e)}")
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)


