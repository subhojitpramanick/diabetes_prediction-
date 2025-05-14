# Modern Diabetes Prediction Web Application

A modern, interactive web application for predicting diabetes risk based on health parameters. The application features a clean, responsive UI with dark/light mode, interactive visualizations, and local storage for prediction history.

## Features

- **Interactive UI**: Modern design with animations and visual feedback
- **Dark/Light Mode**: Toggle between dark and light themes
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Health Parameter Visualization**: Visual indicators for blood glucose levels
- **Result Charts**: Visual representation of your health parameters
- **BMI Calculator**: Calculate your BMI with height and weight
- **HbA1c Calculator**: Estimate HbA1c from average blood glucose
- **Prediction History**: Save and retrieve your prediction history
- **Health Resources**: Information about diabetes and prevention

## Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome
- **Charts**: Chart.js
- **Containerization**: Docker

## Running the Application

### Using Docker (Recommended)

1. Make sure you have Docker and Docker Compose installed on your system

2. Clone the repository:
   ```
   git clone <repository-url>
   cd diabetes_prediction
   ```

3. Build and run the container using Docker Compose:
   ```
   docker-compose up -d
   ```

4. Access the application in your browser:
   ```
   http://localhost:5000
   ```

5. To stop the application:
   ```
   docker-compose down
   ```

### Manual Setup

1. Make sure you have Python 3.9+ installed

2. Clone the repository:
   ```
   git clone <repository-url>
   cd diabetes_prediction
   ```

3. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the application:
   ```
   python app.py
   ```

5. Access the application in your browser:
   ```
   http://localhost:5000
   ```

## Environment Variables

The application can be configured using the following environment variables:

- `PORT`: The port to run the application on (default: 5000)
- `FLASK_DEBUG`: Enable debug mode (default: False)
- `FLASK_APP`: The Flask application file (default: app.py)

## Model Information

The diabetes prediction model is trained using scikit-learn and considers the following parameters:

- Age
- BMI (Body Mass Index)
- HbA1c Level
- Blood Glucose Level
- Gender
- Smoking History

## Database

The application uses SQLite to store prediction history. The database file is created in the `data` directory.

## License

[MIT License](LICENSE)

## Contributors

- Your Name <your-email@example.com>

## Acknowledgements

- Bootstrap for the UI framework
- Chart.js for data visualization
- Font Awesome for icons
- Flask team for the web framework
