# Hawker Centre Challenge Game - Frontend

React-based frontend for the Hawker Centre Challenge Game - an interactive platform for discovering Singapore's hawker centres through gamified challenges.

## Features

### Game Modes
- **Challenge Mode**: Guess hawker centres from photos
- **Memory Game**: Match pairs of hawker food items
- **Sliding Puzzle**: Solve puzzles of hawker centre images
- **Word Scramble**: Unscramble hawker-related words
- **Map Guess**: Locate hawker centres on an interactive map

### User Features
- **Points & Rewards System**: Earn points and redeem rewards
- **Wallet**: Track points, transactions, and claimed rewards
- **Authentication**: Secure login via AWS Cognito
- **Responsive Design**: Mobile-friendly interface

### Seller Features
- **Challenge Upload**: Sellers can upload their own challenges
- **Rewards Management**: Create and manage rewards
- **Challenge Boosting**: Boost challenges for better visibility

## Tech Stack

- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Authentication**: AWS Cognito
- **State Management**: React Hooks (useState, useEffect)
- **Styling**: CSS (custom styles)
- **Hosting**: AWS CloudFront + S3

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- AWS Account with configured services:
  - Cognito User Pool
  - API Gateway
  - Lambda Functions
  - DynamoDB Tables
  - S3 Bucket
  - CloudFront Distribution

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/sarjunenp/hawker-game.git
cd hawker-game/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your AWS credentials:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# AWS Cognito Configuration
REACT_APP_COGNITO_USER_POOL_ID=ap-southeast-1_xxxxxxxxx
REACT_APP_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_COGNITO_REGION=ap-southeast-1

# API Gateway
REACT_APP_API_BASE_URL=https://xxxxxxxxxx.execute-api.ap-southeast-1.amazonaws.com/dev
```

### 4. Start Development Server

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## 🏗️ Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## 📁 Project Structure

```
frontend/
├── public/
│   ├── index.html          # HTML template
│   ├── favicon.ico         # App icon
│   └── manifest.json       # PWA manifest
├── src/
│   ├── components/         # React components
│   │   ├── Challenge.js    # Main challenge component
│   │   ├── Guess.js        # Guessing interface
│   │   ├── LandingPage.js  # Home page
│   │   ├── MapGuess.js     # Map-based guessing
│   │   ├── MemoryGame.js   # Memory card game
│   │   ├── ProtectedRoute.js # Auth route wrapper
│   │   ├── Seller.js       # Seller dashboard
│   │   ├── SellerRewards.js # Seller rewards management
│   │   ├── SlidingPuzzle.js # Puzzle game
│   │   ├── Wallet.js       # Points wallet
│   │   ├── WalletBadge.js  # Points display badge
│   │   ├── WordScramble.js # Word scramble game
│   │   └── *.css           # Component styles
│   ├── services/           # API services
│   │   ├── api.js          # Axios instance & API calls
│   │   └── pointsService.js # Points & rewards API
│   ├── App.js              # Main app component
│   ├── App.css             # Global app styles
│   ├── index.js            # App entry point
│   └── index.css           # Global CSS
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies
└── README.md               # This file
```

## 🔧 Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder

### `npm run eject`
⚠️ **Warning**: This is a one-way operation!

## Deployment

### Deploy to AWS S3 + CloudFront

1. **Build the production bundle:**
   ```bash
   npm run build
   ```

2. **Upload to S3:**
   ```bash
   aws s3 sync build/ s3://your-bucket-name
   ```

3. **Invalidate CloudFront cache:**
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id YOUR_DISTRIBUTION_ID \
     --paths "/*"
   ```

## Authentication

The app uses AWS Cognito for user authentication. Users can:
- Sign up with email and password
- Sign in with Cognito credentials
- Access protected routes (requires authentication)
- Sellers have special permissions for challenge creation

### User Groups
- **Players**: Can play games, earn points, and redeem rewards
- **Sellers**: Can upload challenges and manage rewards

## Game Features

### Points System
- Earn points by completing challenges
- Each game mode awards different point values
- Track points in the wallet

### Rewards
- Browse available rewards in the wallet
- Redeem rewards using earned points
- View claimed rewards with expiry dates

### Challenge Upload (Sellers Only)
- Upload photos of hawker stalls
- Tag with correct hawker centre
- Add shop descriptions
- Boost challenges for visibility

## Security

- All API endpoints require authentication
- JWT tokens stored in localStorage
- Sensitive data never committed to repository
- Environment variables for all configuration

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### "API_BASE_URL is not set"
- Check that `.env` file exists
- Verify `REACT_APP_API_BASE_URL` is set
- Restart development server after changing `.env`

### Authentication Issues
- Clear localStorage and cookies
- Verify Cognito configuration
- Check user pool and client ID are correct

### API Connection Failed
- Verify API Gateway URL is correct
- Check Lambda function is deployed
- Ensure CORS is configured on API Gateway

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_COGNITO_USER_POOL_ID` | Cognito User Pool ID | `ap-southeast-1_AbC123dEf` |
| `REACT_APP_COGNITO_CLIENT_ID` | Cognito App Client ID | `1234567890abcdefghijklmno` |
| `REACT_APP_COGNITO_REGION` | AWS Region | `ap-southeast-1` |
| `REACT_APP_API_BASE_URL` | API Gateway endpoint | `https://abc123.execute-api.ap-southeast-1.amazonaws.com/dev` |

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- Singapore hawker centres for inspiration
- AWS for cloud infrastructure
- React community for excellent tools and libraries

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact: your-email@example.com

## 🔗 Related Documentation

- [Backend README](../backend/README.md)
- [Main Project README](../README.md)
- [AWS Setup Guide](../docs/AWS_SETUP.md) (if you create one)

---

Built with ❤️ for Singapore's hawker culture