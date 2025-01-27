# Diabetes Prediction Web App

This is a web application for predicting the likelihood of diabetes based on user input. The app uses a machine learning model trained on health-related parameters such as age, BMI, HbA1c level, blood glucose level, gender, and smoking history. The application is built using Flask and is deployed using AWS ECR and ECS.

---

## Features
- **User-Friendly Interface**: Simple and intuitive frontend for entering health details.
- **Machine Learning Model**: Predicts whether a user is diabetic or non-diabetic.
- **Real-Time Predictions**: Instant results based on user input.
- **AWS Deployment**: Deployed using AWS Elastic Container Service (ECS) and Elastic Container Registry (ECR).

---

## Tech Stack
### Frontend:
- **HTML**
- **CSS**
- **JavaScript**

### Backend:
- **Flask**: For serving the web app and handling API requests.
- **Joblib**: For loading the pre-trained ML model and scaler.

### Machine Learning:
- **Scikit-learn**: Used to build and train the predictive model.

### Deployment:
- **Docker**: Containerized application.
- **AWS ECS**: For managing and running Docker containers.
- **AWS ECR**: For storing Docker images.

---

## Prerequisites
Before running the project, ensure you have:
- Python 3.8 or above installed
- Docker installed (if running locally in a container)
- AWS CLI configured (if deploying to AWS)

---

## Installation and Setup
1. **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/diabetes-prediction-webapp.git
    cd diabetes-prediction-webapp
    ```

2. **Set up a virtual environment** (optional but recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3. **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4. **Run the app locally**:
    ```bash
    python app.py
    ```
    Open your browser and navigate to `http://127.0.0.1:5000`.

---

## Deployment
### Docker
1. **Build the Docker image**:
    ```bash
    docker build -t diabetes-prediction-app .
    ```

2. **Run the container**:
    ```bash
    docker run -p 5000:5000 diabetes-prediction-app
    ```

### AWS ECR and ECS
1. **Push the Docker image to ECR**:
    ```bash
    aws ecr get-login-password --region <your-region> | docker login --username AWS --password-stdin <ecr-repository-uri>
    docker tag diabetes-prediction-app:latest <ecr-repository-uri>:latest
    docker push <ecr-repository-uri>:latest
    ```

2. **Create an ECS Cluster**:
    Use the AWS Management Console or CLI to create a cluster and configure services/tasks.

3. **Deploy the application**:
    - Configure the task definition to use the ECR image.
    - Set up a service linked to a load balancer (optional).

---

## File Structure
