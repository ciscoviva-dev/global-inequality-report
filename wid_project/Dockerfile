FROM python:3.11-slim

# Install system dependencies
RUN apt-get update -y && \
    apt-get install -y git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/app

# Install dbt and duckdb
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the dbt project into the container
COPY . .

# Set default command to run dbt
CMD ["dbt", "run", "--profiles-dir", "."]
