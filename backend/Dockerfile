FROM python:3.12-slim AS base

# Install Terraform for validation
ARG TERRAFORM_VERSION=1.9.8
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl unzip && \
    curl -fsSL "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip" \
        -o /tmp/terraform.zip && \
    unzip /tmp/terraform.zip -d /usr/local/bin/ && \
    rm /tmp/terraform.zip && \
    apt-get purge -y curl unzip && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
