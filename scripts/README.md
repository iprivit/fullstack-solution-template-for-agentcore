# Scripts

Utility scripts for deployment verification and operational tasks.

## Setup

```bash
# Create virtual environment
uv venv

# Install dependencies
uv pip install -r requirements.txt
```

## Running Scripts

Run any script using:

```bash
uv run python scripts/<script-name>.py
```

## Available Scripts

### test-feedback-api.py

Tests the deployed Feedback API endpoint with Cognito authentication.

**Prerequisites:**

- Stack deployed to AWS
- Cognito user created (see [Deployment Guide](../docs/DEPLOYMENT.md))

**Usage:**

```bash
uv run python scripts/test-feedback-api.py
```

**What it does:**

1. Fetches configuration from SSM Parameter Store
2. Authenticates with Cognito (prompts for credentials)
3. Runs API tests (positive/negative feedback, validation)
4. Displays test results
