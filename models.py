from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class PredictionRecord(db.Model):
    """Model for storing diabetes prediction records"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Will be nullable until we implement authentication
    prediction_result = db.Column(db.String(20), nullable=False)  # 'Diabetic' or 'Non-Diabetic'
    age = db.Column(db.Float, nullable=False)
    bmi = db.Column(db.Float, nullable=False)
    hba1c = db.Column(db.Float, nullable=False)
    blood_glucose = db.Column(db.Float, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    smoking = db.Column(db.String(5), nullable=False)
    confidence = db.Column(db.String(10), nullable=True)  # Store confidence percentage if available
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)  # Alias for created_at for compatibility
    
    def to_dict(self):
        """Convert record to dictionary for JSON response"""
        return {
            'id': self.id,
            'prediction_result': self.prediction_result,
            'parameters': {
                'age': self.age,
                'bmi': self.bmi,
                'hba1c': self.hba1c,
                'blood_glucose': self.blood_glucose,
                'gender': self.gender,
                'smoking': self.smoking
            },
            'confidence': self.confidence,
            'date': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class User(db.Model):
    """User model for authentication"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    predictions = db.relationship('PredictionRecord', backref='user', lazy=True)
    
    def to_dict(self):
        """Convert user to dictionary for JSON response"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }