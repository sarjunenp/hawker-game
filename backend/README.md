# Backend - Lambda Function

AWS Lambda function for the Hawker Centre Challenge Game.

## Environment Variables

Configure these in AWS Lambda:

- `S3_BUCKET_NAME` - S3 bucket for images
- `AWS_REGION` - AWS region (e.g., ap-southeast-1)
- `CENTRES_TABLE` - DynamoDB table name
- `CHALLENGES_TABLE` - DynamoDB table name
- `USER_POINTS_TABLE` - DynamoDB table name
- `TRANSACTIONS_TABLE` - DynamoDB table name
- `REWARDS_TABLE` - DynamoDB table name
- `USER_REWARDS_TABLE` - DynamoDB table name

## Deployment

1. Zip the handler.py file
2. Upload to AWS Lambda
3. Configure environment variables
4. Set up API Gateway trigger