# Hawker Centre Challenge Game

An interactive gamified web application for discovering and celebrating Singapore's iconic hawker centres through various challenges, games, and a rewards system.

![Singapore Hawker Centre](https://img.shields.io/badge/Made%20for-Singapore%20🇸🇬-red)
![React](https://img.shields.io/badge/React-18-blue)
![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20DynamoDB%20%7C%20S3-orange)
![Python](https://img.shields.io/badge/Python-3.9-green)

## Overview

The Hawker Centre Challenge Game is a full-stack web application that combines education, entertainment, and technology to promote Singapore's hawker food culture. Users can play various games, earn points, and redeem rewards while learning about different hawker centres across Singapore.

## 🎮 Key Features

### For Players
- ** Challenge Mode**: Identify hawker centres from photos
- ** Memory Game**: Match pairs of hawker food items
- ** Sliding Puzzle**: Solve image puzzles of hawker centres
- ** Word Scramble**: Unscramble hawker-related vocabulary
- ** Map Guess**: Pin hawker centres on an interactive map
- ** Points System**: Earn points for completing challenges
- ** Rewards**: Redeem points for discounts and special offers
- ** Digital Wallet**: Track points, transactions, and rewards

### For Sellers
- ** Challenge Upload**: Submit new challenges with photos and descriptions
- ** Rewards Management**: Create and manage reward offers
- ** Boost Challenges**: Promote challenges for better visibility
- ** Dashboard**: View all submitted challenges

### Authentication & Security
- ** AWS Cognito**: Secure user authentication
- ** Role-Based Access**: Separate player and seller permissions
- ** Protected Routes**: Secure API endpoints

##  Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                     React.js (CloudFront)                    │
│  Components: Games | Wallet | Seller Dashboard | Auth       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS/REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                     API Gateway                              │
│                  (AWS API Gateway)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Backend Logic                             │
│                  AWS Lambda (Python)                         │
│   Handlers: Games | Points | Rewards | Challenges           │
└─────────┬─────────────────────┬────────────────────┬────────┘
          │                     │                    │
          │                     │                    │
┌─────────▼──────┐  ┌──────────▼──────────┐  ┌─────▼─────────┐
│   DynamoDB     │  │   S3 Bucket         │  │   Cognito     │
│   (6 Tables)   │  │   (Images)          │  │   (Auth)      │
└────────────────┘  └─────────────────────┘  └───────────────┘
```

##  Tech Stack

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Authentication**: AWS Cognito SDK
- **Styling**: Custom CSS
- **Hosting**: AWS CloudFront + S3

### Backend
- **Runtime**: AWS Lambda (Python 3.9)
- **API**: AWS API Gateway (REST)
- **Database**: AWS DynamoDB
- **Storage**: AWS S3
- **Authentication**: AWS Cognito
- **Geolocation**: geopy library

### AWS Services
- **Cognito**: User authentication and authorization
- **Lambda**: Serverless backend functions
- **API Gateway**: RESTful API management
- **DynamoDB**: NoSQL database (6 tables)
- **S3**: Image storage for challenges
- **CloudFront**: CDN for frontend hosting
- **IAM**: Access control and permissions

##  Project Structure

```
hawker-game/
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API service layer
│   │   ├── App.js           # Main app component
│   │   └── index.js         # Entry point
│   ├── public/              # Static assets
│   ├── package.json         # Node dependencies
│   ├── .env.example         # Environment template
│   └── README.md            # Frontend documentation
│
├── backend/                  # AWS Lambda backend
│   ├── handler.py           # Lambda function handler
│   ├── requirements.txt     # Python dependencies
│   └── README.md            # Backend documentation
│
├── Prep/                     # Preparation files (optional)
├── .gitignore               # Git ignore rules
├── LICENSE                  # Project license
└── README.md                # This file
```

##  Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **Python** (v3.9 or higher)
- **AWS Account** with configured services
- **AWS CLI** (optional, for deployment)
- **Git** for version control

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hawker-game.git
   cd hawker-game
   ```

2. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your AWS credentials
   npm start
   ```

3. **Set up the backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   # Deploy to AWS Lambda
   # Configure environment variables in Lambda
   ```

For detailed setup instructions, see:
- [Frontend README](frontend/README.md)
- [Backend README](backend/README.md)

## 🗄️ Database Schema

### DynamoDB Tables

| Table Name | Purpose | Key Attributes |
|------------|---------|----------------|
| `hawker_centres` | List of hawker centres | `id`, `name`, `address`, `location` |
| `challenges` | User-submitted challenges | `id`, `image_url`, `answer_hawker_centre_id` |
| `hawker-game-user-points` | User point balances | `user_id`, `total_points`, `lifetime_points` |
| `hawker-game-points-transactions` | Transaction history | `transaction_id`, `user_id`, `amount`, `type` |
| `hawker-game-rewards` | Available rewards | `reward_id`, `title`, `points_cost`, `discount_percentage` |
| `hawker-game-user-rewards` | Claimed rewards | `claim_id`, `user_id`, `reward_id`, `claimed_at` |

## 🔐 Environment Variables

### Frontend (.env)
```bash
REACT_APP_COGNITO_USER_POOL_ID=your-user-pool-id
REACT_APP_COGNITO_CLIENT_ID=your-client-id
REACT_APP_COGNITO_REGION=ap-southeast-1
REACT_APP_API_BASE_URL=https://your-api-id.execute-api.region.amazonaws.com/dev
```

### Backend (Lambda Environment Variables)
```bash
S3_BUCKET_NAME=your-bucket-name
AWS_REGION=ap-southeast-1
CENTRES_TABLE=hawker_centres
CHALLENGES_TABLE=challenges
USER_POINTS_TABLE=hawker-game-user-points
TRANSACTIONS_TABLE=hawker-game-points-transactions
REWARDS_TABLE=hawker-game-rewards
USER_REWARDS_TABLE=hawker-game-user-rewards
```

## 🎯 API Endpoints

### Public Endpoints
- `GET /centres` - List all hawker centres
- `GET /challenges/all` - Get all active challenges

### Authenticated Endpoints (Players)
- `GET /challenges/current` - Get random challenge
- `POST /guess` - Submit challenge answer
- `POST /points/earn` - Award points
- `GET /points/balance` - Get point balance
- `GET /points/transactions` - Get transaction history
- `GET /rewards` - List available rewards
- `POST /rewards/claim` - Claim a reward
- `GET /rewards/my-rewards` - Get claimed rewards

### Authenticated Endpoints (Sellers)
- `POST /seller/upload-url` - Get presigned S3 URL
- `POST /seller/challenge` - Create new challenge
- `GET /seller/challenges` - Get seller's challenges

##  Features in Detail

### Points System
- **Memory Game**: Earn points for matching pairs
- **Sliding Puzzle**: Earn points for solving puzzles
- **Word Scramble**: Earn points for correct words
- **Map Guess**: Earn points based on accuracy
- **Challenge Completion**: Bonus points for correct guesses

### Rewards System
- Browse available rewards with discount percentages
- Redeem rewards using earned points
- Track claimed rewards with expiry dates
- Show QR codes or voucher codes for redemption

### Seller Features
- Upload challenge photos with descriptions
- Tag challenges with correct hawker centres
- Boost challenges for increased visibility (costs coins)
- Buy coins to boost challenges
- View all submitted challenges

## 🚢 Deployment

### Frontend Deployment (AWS S3 + CloudFront)
```bash
cd frontend
npm run build
aws s3 sync build/ s3://your-bucket-name
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

### Backend Deployment (AWS Lambda)
```bash
cd backend
zip -r function.zip .
aws lambda update-function-code --function-name hawker-game --zip-file fileb://function.zip
```

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test

# Backend tests (if implemented)
cd backend
python -m pytest
```

## 🐛 Troubleshooting

### Common Issues

**Issue**: "API_BASE_URL is not set"
- **Solution**: Check `.env` file exists and contains correct values

**Issue**: Authentication fails
- **Solution**: Verify Cognito configuration and clear localStorage

**Issue**: Images not loading
- **Solution**: Check S3 bucket permissions and CORS settings

**Issue**: Lambda timeout
- **Solution**: Increase Lambda timeout in AWS console

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- **Singapore Hawker Centres** - For inspiration and cultural heritage
- **AWS** - For robust cloud infrastructure
- **React Community** - For excellent documentation and tools
- **Open Source Contributors** - For libraries and frameworks used




## Roadmap

### Current Version (v1.0)
-  Multiple game modes
-  Points and rewards system
-  Seller dashboard
-  User authentication

### Planned Features (v2.0)
- [ ] Leaderboard system
- [ ] Social sharing features
- [ ] Mobile app (React Native)
- [ ] More game modes
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Push notifications

## 📚 Additional Documentation

- [Frontend Setup Guide](frontend/README.md)
- [Backend Setup Guide](backend/README.md)

## Live Demo

> Add your deployed URL here once the app is live!

**Demo URL**: `https://your-cloudfront-url.cloudfront.net`

**Built with ❤️ for Singapore's Hawker Culture**