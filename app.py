from flask import Flask, render_template, request, jsonify, session
import pandas as pd
import numpy as np
import joblib
import logging
import os
import time
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from models import db, PredictionRecord, User
import secrets

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)

app = Flask(__name__, static_folder='static', template_folder='templates')

# Configure SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///diabetes_prediction.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = secrets.token_hex(16)  # For session management

# Initialize database
db.init_app(app)

# Create database tables if they don't exist
with app.app_context():
    db.create_all()

# Load the model, scaler, and column names
try:
    model = joblib.load('diabetes_model.joblib')
    scaler = joblib.load('scaler.joblib')
    columns = joblib.load('columns.joblib')
    logging.info("Model and dependencies loaded successfully")
except Exception as e:
    logging.error(f"Error loading model or dependencies: {str(e)}")
    raise

@app.route('/')
def home():
    # Serve the modernized UI
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    start_time = time.time()
    request_id = datetime.now().strftime("%Y%m%d%H%M%S-") + str(int(time.time() * 1000) % 1000)
    
    try:
        # Log the received request
        logging.info(f"Request {request_id}: Received prediction request")
        
        # Validate that we received JSON data
        if not request.is_json:
            logging.warning(f"Request {request_id}: Invalid request format - not JSON")
            return jsonify({
                'error': 'Invalid request format. Please send JSON data.',
                'request_id': request_id
            }), 400
            
        # Retrieve and validate input data
        data = request.json
        required_fields = ['age', 'bmi', 'hba1c', 'blood_glucose', 'gender', 'smoking']
        
        # Check for missing fields
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            logging.warning(f"Request {request_id}: Missing required fields: {missing_fields}")
            return jsonify({
                'error': f"Missing required fields: {', '.join(missing_fields)}",
                'request_id': request_id
            }), 400
            
        # Validate numeric fields
        try:
            age = float(data['age'])
            bmi = float(data['bmi'])
            HbA1c_level = float(data['hba1c'])
            blood_glucose_level = float(data['blood_glucose'])
            
            # Basic range validation
            if age <= 0 or age > 120:
                return jsonify({'error': 'Age must be between 1 and 120', 'request_id': request_id}), 400
            if bmi <= 0 or bmi > 100:
                return jsonify({'error': 'BMI must be between 1 and 100', 'request_id': request_id}), 400
            if HbA1c_level <= 0 or HbA1c_level > 20:
                return jsonify({'error': 'HbA1c level must be between 1 and 20', 'request_id': request_id}), 400
            if blood_glucose_level <= 0 or blood_glucose_level > 1000:
                return jsonify({'error': 'Blood glucose level must be between 1 and 1000', 'request_id': request_id}), 400
                
        except ValueError as ve:
            logging.warning(f"Request {request_id}: Invalid numeric value: {str(ve)}")
            return jsonify({
                'error': 'Invalid numeric values provided. Please check your inputs.',
                'request_id': request_id
            }), 400
            
        # Validate categorical fields
        gender = data['gender']
        smoking_history = data['smoking']
        
        if gender not in ['Male', 'Female']:
            return jsonify({'error': 'Gender must be either Male or Female', 'request_id': request_id}), 400
        if smoking_history not in ['Yes', 'No']:
            return jsonify({'error': 'Smoking history must be either Yes or No', 'request_id': request_id}), 400

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
        
        # Calculate probability if model supports it
        probability = None
        try:
            if hasattr(model, 'predict_proba'):
                proba = model.predict_proba(input_scaled)[0]
                probability = round(proba[1] * 100, 2) if result == 'Diabetic' else round(proba[0] * 100, 2)
        except Exception as prob_error:
            logging.warning(f"Request {request_id}: Could not calculate probability: {str(prob_error)}")

        # Calculate response time
        response_time = round((time.time() - start_time) * 1000, 2)  # in milliseconds
        logging.info(f"Request {request_id}: Prediction completed in {response_time}ms. Result: {result}")

        # Save prediction to database
        try:
            prediction_record = PredictionRecord(
                prediction_result=result,
                age=age,
                bmi=bmi,
                hba1c=HbA1c_level,
                blood_glucose=blood_glucose_level,
                gender=gender,
                smoking=smoking_history,
                confidence=f"{probability}%" if probability is not None else None
            )
            db.session.add(prediction_record)
            db.session.commit()
            logging.info(f"Request {request_id}: Prediction saved to database with ID {prediction_record.id}")
        except Exception as db_error:
            logging.error(f"Request {request_id}: Failed to save prediction to database: {str(db_error)}")
            # Continue even if database save fails
        
        # Return the prediction with additional information
        response = {
            'prediction': result,
            'request_id': request_id,
            'response_time_ms': response_time,
            'record_id': prediction_record.id if 'prediction_record' in locals() else None
        }
        
        if probability is not None:
            response['confidence'] = f"{probability}%"
            
        return jsonify(response)
        
    except Exception as e:
        # Log the error with traceback
        logging.error(f"Request {request_id}: Error during prediction: {str(e)}", exc_info=True)
        
        # Calculate response time even for errors
        response_time = round((time.time() - start_time) * 1000, 2)
        
        # Return a user-friendly error message
        return jsonify({
            'error': 'An unexpected error occurred during prediction. Please try again later.',
            'request_id': request_id,
            'response_time_ms': response_time
        }), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        records = PredictionRecord.query.order_by(PredictionRecord.timestamp.desc()).limit(10).all()
        history = []
        
        for record in records:
            history.append({
                'id': record.id,
                'prediction_result': record.prediction_result,
                'date': record.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'parameters': {
                    'age': record.age,
                    'bmi': record.bmi,
                    'hba1c': record.hba1c,
                    'blood_glucose': record.blood_glucose,
                    'gender': record.gender,
                    'smoking': record.smoking
                },
                'confidence': record.confidence
            })
        
        return jsonify({'status': 'success', 'history': history})
    except Exception as e:
        logging.error(f"Error retrieving history: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'message': 'Failed to retrieve history'}), 500

@app.route('/api/history/<int:record_id>', methods=['DELETE'])
def delete_history(record_id):
    try:
        record = PredictionRecord.query.get(record_id)
        if not record:
            return jsonify({'status': 'error', 'message': 'Record not found'}), 404
            
        db.session.delete(record)
        db.session.commit()
        
        return jsonify({'status': 'success', 'message': 'Record deleted successfully'})
    except Exception as e:
        logging.error(f"Error deleting record {record_id}: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'message': 'Failed to delete record'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    start_time = time.time()
    
    # Check database connection
    db_status = "OK"
    db_error = None
    try:
        # Simple database query to check connection
        PredictionRecord.query.limit(1).all()
    except Exception as e:
        db_status = "ERROR"
        db_error = str(e)
    
    # Check model availability
    model_status = "OK" if 'model' in globals() and model is not None else "ERROR"
    scaler_status = "OK" if 'scaler' in globals() and scaler is not None else "ERROR"
    
    # Get memory usage
    memory_info = {}
    try:
        import psutil
        process = psutil.Process(os.getpid())
        memory_info = {
            'rss': f"{process.memory_info().rss / (1024 * 1024):.2f} MB",  # Resident Set Size
            'vms': f"{process.memory_info().vms / (1024 * 1024):.2f} MB",  # Virtual Memory Size
            'percent': f"{process.memory_percent():.2f}%"
        }
    except ImportError:
        memory_info = {"status": "psutil not installed"}
    
    # Response time
    response_time = round((time.time() - start_time) * 1000, 2)  # in milliseconds
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'components': {
            'database': {
                'status': db_status,
                'error': db_error
            },
            'model': {
                'status': model_status
            },
            'scaler': {
                'status': scaler_status
            }
        },
        'memory': memory_info,
        'response_time_ms': response_time
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'The requested resource was not found'
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'status': 'error',
        'message': 'The method is not allowed for the requested URL'
    }), 405

@app.errorhandler(500)
def server_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Internal server error'
    }), 500

if __name__ == '__main__':
    # Get port and debug settings from environment variables
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() in ['true', '1', 't']
    
    # Log startup information
    logging.info(f"Starting Diabetes Prediction App on port {port} with debug={debug_mode}")
    
    # Run the app
    app.run(debug=debug_mode, host='0.0.0.0', port=port)


