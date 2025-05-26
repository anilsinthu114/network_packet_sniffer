FROM python:3.10-slim

# Install tshark and dependencies
RUN apt-get update && apt-get install -y tshark

# Set working directory
WORKDIR /app

# Copy requirements & install Python deps
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy app source
COPY . .

# Expose port and run app
EXPOSE 5000
CMD ["python3", "app.py"]

