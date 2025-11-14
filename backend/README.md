# Hawker Challenge Game - Lambda Function

AWS Lambda function for the Hawker Challenge Game backend API.

## Environment Variables

This Lambda function requires the following environment variables to be configured:

| Variable | Description | Example |
|----------|-------------|---------|
| `S3_BUCKET` | S3 bucket name for storing challenge images | `hawker-game-assets` |

## DynamoDB Tables

The function expects the following DynamoDB tables:

- `hawker_centres` - Hawker centre information
- `challenges` - Game challenges
- `hawker-game-user-points` - User points balance
- `hawker-game-points-transactions` - Points transaction history
- `hawker-game-rewards` - Available rewards catalog
- `hawker-game-user-rewards` - User's claimed rewards

## IAM Permissions Required

The Lambda execution role needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/hawker_centres",
        "arn:aws:dynamodb:*:*:table/challenges",
        "arn:aws:dynamodb:*:*:table/hawker-game-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::${S3_BUCKET}/*"
    }
  ]
}
```

## API Routes

### Game Routes
- `GET /centres` - Get all hawker centres
- `GET /challenges/current` - Get random challenge
- `GET /challenges/all` - Get all challenges
- `POST /guess` - Submit a guess

### Points & Rewards Routes
- `POST /points/earn` - Award points
- `POST /points/spend` - Spend points
- `GET /points/balance` - Get user's point balance
- `GET /points/transactions` - Get transaction history
- `GET /rewards` - Get available rewards
- `POST /rewards/claim` - Claim a reward
- `GET /rewards/my-rewards` - Get user's claimed rewards

### Seller Routes (Requires 'sellers' Cognito group)
- `POST /seller/upload-url` - Get presigned S3 upload URL
- `POST /seller/challenge` - Create new challenge
- `GET /seller/challenges` - Get seller's challenges

## Authentication

Uses AWS Cognito JWT tokens passed through API Gateway authorizer.

User information is extracted from JWT claims:
- `cognito:username` or `username` or `sub` for user ID
- `cognito:groups` for user roles (e.g., 'sellers')

## Deployment

### Using AWS CLI

```bash
# Package the function
zip -r function.zip lambda_function.py

# Deploy
aws lambda update-function-code \
  --function-name hawker-challenge-api \
  --zip-file fileb://function.zip

# Set environment variables
aws lambda update-function-configuration \
  --function-name hawker-challenge-api \
  --environment Variables={S3_BUCKET=your-bucket-name}
```

### Using AWS CDK/CloudFormation

See the infrastructure as code in the `/infrastructure` directory.

## Local Testing

```bash
# Install dependencies
pip install boto3

# Set environment variables
export S3_BUCKET=your-test-bucket

# Run tests (if available)
python -m pytest tests/
```

## Error Handling

All endpoints return standardized JSON responses:

**Success:**
```json
{
  "statusCode": 200,
  "body": {
    "message": "Success",
    "data": {...}
  }
}
```

**Error:**
```json
{
  "statusCode": 400,
  "body": {
    "message": "Error description"
  }
}
```

## CORS

CORS is enabled for all origins (`*`). For production, consider restricting to your domain:

```python
"Access-Control-Allow-Origin": "https://yourdomain.com"
```
