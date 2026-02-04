# Oshpaz AI - Calorie Tracker Telegram Bot

Production-ready Telegram Bot with Mini App for calorie tracking using OpenAI GPT-4o vision analysis.

## Features

- **AI Food Analysis**: Send food photos to get instant nutritional breakdown
- **Daily Goals**: Set and track your calorie targets (Mifflin-St Jeor calculation)
- **Progress Tracking**: Real-time visualization of calories and macros
- **Meal History**: View all meals added throughout the day
- **Mini App Dashboard**: Beautiful React-based interface with charts
- **Smart Bot**: Telegram bot with grammY framework
- **Premium Plans**: Monthly/6-month/yearly subscriptions
- **Payment Integration**: Payme & Click payment providers
- **Weight Tracking**: Track weight history and trends
- **Multi-language**: English, Uzbek, Russian support
- **Weekly Analytics**: 7-day calorie charts and macro distribution

## Tech Stack

### Backend

- **Node.js** with **TypeScript**
- **Express.js** - REST API
- **MongoDB** - Database with Mongoose ODM
- **grammY** - Telegram Bot Framework
- **OpenAI GPT-4o** - Food image analysis with structured outputs

### Frontend (Mini App)

- **React 18** with **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Charts and graphs
- **i18next** - Internationalization
- **Telegram Mini App SDK** - Native Telegram integration

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- OpenAI API Key (with GPT-4o access)

## Installation

### 1. Clone or navigate to the project

```bash
cd /Users/shohjahon/startup/oshpaz-ai
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env and add your credentials:
# - TELEGRAM_BOT_TOKEN
# - OPENAI_API_KEY
# - MONGODB_URI
```

### 3. Frontend Setup

```bash
cd ../mini-app

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env if needed (default: http://localhost:3000/api)
```

## Running Locally

### Start MongoDB

Make sure MongoDB is running locally or use MongoDB Atlas connection string.

### Start Backend

```bash
cd backend

# Development mode (with hot reload)
npm run dev

# Or build and run
npm run build
npm start
```

Backend will start on port 3000 (or your PORT env variable).

### Start Mini App

```bash
cd mini-app

# Development mode
npm run dev
```

Mini App will start on port 5173.

## Configuration

### Environment Variables

#### Backend (.env)

```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
OPENAI_API_KEY=your_openai_api_key
MONGODB_USER=your_mongodb_user
MONGODB_PASSWORD=your_mongodb_password
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=calorie_tracker
PORT=3000
MINI_APP_URL=http://localhost:5173
NODE_ENV=development
```

#### Mini App (.env)

```env
VITE_API_URL=http://localhost:3000/api
```

## Usage

### Setting Up Your Bot

1. **Create a bot** with [@BotFather](https://t.me/botfather):
   - Send `/newbot`
   - Choose a name and username
   - Copy the bot token to your `.env` file

2. **Set up Mini App**:
   - Send `/newapp` to BotFather
   - Select your bot
   - Provide app details
   - Set the Mini App URL (for development: `https://your-ngrok-url.ngrok.io`)

### Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Initialize user, show welcome message |
| `/goal <num>` | Set daily calorie goal (1000-5000) |
| `/stats` | Get today's statistics |
| `/grant` | Admin: grant premium access |

### Using the Bot

1. **Start the bot**: Send `/start` command
2. **Set your goal**: Click "Change Goal" in the Mini App or use `/goal 2500`
3. **Track meals**: Send a photo of your food to the bot
4. **View dashboard**: Open the Mini App from the bot menu
5. **Check stats**: Use `/stats` command for quick overview
6. **Subscribe**: Use Premium tab in Mini App for subscription plans

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── bot/
│   │   │   └── bot.ts              # grammY bot logic
│   │   ├── config/
│   │   │   ├── constants.ts         # App constants
│   │   │   └── database.ts          # MongoDB connection
│   │   ├── models/
│   │   │   ├── User.ts              # User schema (profile, metrics, weight history)
│   │   │   ├── Meal.ts              # Meal schema (calories, macros, items)
│   │   │   ├── Wallet.ts            # Wallet schema (balance, currency)
│   │   │   ├── Transaction.ts       # Transaction history
│   │   │   └── Subscription.ts      # Premium subscription plans
│   │   ├── routes/
│   │   │   ├── user.routes.ts       # User endpoints
│   │   │   ├── meal.routes.ts       # Meal endpoints
│   │   │   ├── payment.routes.ts    # Payment endpoints (Payme, Click)
│   │   │   └── subscription.routes.ts # Subscription endpoints
│   │   ├── services/
│   │   │   ├── openai.service.ts    # OpenAI integration (GPT-4o, Whisper)
│   │   │   ├── user.service.ts      # User operations
│   │   │   ├── meal.service.ts      # Meal operations
│   │   │   └── payment.service.ts   # Payment gateway integration
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   └── server.ts                # Express server
│   ├── package.json
│   └── tsconfig.json
│
└── mini-app/
    ├── src/
    │   ├── components/
    │   │   ├── Dashboard.tsx        # Main dashboard with progress
    │   │   ├── Stats.tsx            # Weekly analytics & charts
    │   │   ├── Profile.tsx          # User profile & onboarding
    │   │   ├── Premium.tsx          # Subscription & payments
    │   │   ├── EditMeal.tsx         # Edit/delete meals
    │   │   ├── Wizard/              # Onboarding flow
    │   │   │   ├── Wizard.tsx
    │   │   │   ├── BodyStatsStep.tsx
    │   │   │   ├── GenderStep.tsx
    │   │   │   ├── ActivityGoalStep.tsx
    │   │   │   └── SummaryStep.tsx
    │   │   ├── ProgressBar.tsx      # Progress visualization
    │   │   ├── CircleProgress.tsx   # Circular progress
    │   │   ├── NutritionBreakdown.tsx # Macros display
    │   │   ├── MealHistory.tsx      # Meals list
    │   │   ├── GoalSetting.tsx      # Goal input
    │   │   └── BottomNavigation.tsx # Tab navigation
    │   ├── services/
    │   │   └── api.ts               # Backend API client
    │   ├── utils/
    │   │   └── telegram.ts          # Telegram SDK utilities
    │   ├── types.ts                 # TypeScript types
    │   ├── i18n.ts                  # Internationalization setup
    │   ├── App.tsx                  # Root component
    │   └── main.tsx                 # Entry point
    ├── package.json
    └── vite.config.ts
```

## API Endpoints

### User

- `GET /api/user/:tgId` - Get user profile
- `PUT /api/user/:tgId/goal` - Update daily goal
- `PUT /api/user/:tgId/profile` - Update user profile
- `GET /api/user/:tgId/stats/today` - Get today's stats
- `GET /api/user/:tgId/weight-history` - Get weight history

### Meals

- `GET /api/meals/:tgId/today` - Get today's meals
- `GET /api/meals/:tgId/recent` - Get recent 10 meals
- `GET /api/meals/:tgId/history?date=YYYY-MM-DD` - Get meals by date
- `GET /api/meals/:tgId/stats/7days` - Get weekly stats
- `GET /api/meals/:tgId/analytics` - Get analytics data
- `GET /api/meals/:mealId` - Get single meal
- `PUT /api/meals/:mealId` - Update meal
- `DELETE /api/meals/:mealId?tgId=xxx` - Delete a meal

### Payments

- `POST /api/payments/create-invoice` - Generate Payme/Click payment links
- `POST /api/payments/webhook/mock` - Test webhook handler

### Subscription

- `GET /api/subscription/:tgId` - Get subscription status & balance
- `POST /api/subscription/purchase` - Purchase plan using balance

## Database Models

| Model | Description |
|-------|-------------|
| **User** | Telegram profile, daily goal, physical metrics (age, height, weight, gender), activity level, weight history |
| **Meal** | Food entries with calories, protein, carbs, fats, item breakdown, confidence score |
| **Wallet** | User balance in UZS currency |
| **Transaction** | Payment history (deposit, subscription_purchase, bonus) |
| **Subscription** | Premium plans (free, monthly, yearly) with start/end dates |

## Premium Plans

| Plan | Price (UZS) | Duration |
|------|-------------|----------|
| Monthly | 29,000 | 1 month |
| 6 Months | 129,000 | 6 months |
| Yearly | 199,000 | 12 months |

**Payment Providers:** Payme, Click

## Deployment

### Backend Deployment (Railway/Render)

1. Connect your repository
2. Set environment variables
3. Deploy with build command: `cd backend && npm install && npm run build`
4. Start command: `cd backend && npm start`

### Mini App Deployment (Vercel/Netlify)

1. Connect your repository
2. Set root directory to `mini-app`
3. Build command: `npm run build`
4. Output directory: `dist`

## Features in Detail

### OpenAI Integration

The bot uses GPT-4o with **Structured Outputs** to ensure consistent JSON responses:

```typescript
{
  "name": "Grilled chicken with rice and vegetables",
  "totalCalories": 450,
  "totalProtein": 35,
  "totalCarbs": 52,
  "totalFats": 8,
  "confidence": 0.85,
  "items": [
    { "name": "Grilled chicken", "weight": 150, "calories": 250, "protein": 30, "carbs": 0, "fats": 5 },
    { "name": "Rice", "weight": 100, "calories": 130, "protein": 3, "carbs": 28, "fats": 1 },
    { "name": "Vegetables", "weight": 80, "calories": 70, "protein": 2, "carbs": 24, "fats": 2 }
  ]
}
```

### Smart Calorie Goal Calculation

Uses **Mifflin-St Jeor equation** for BMR calculation:
- Accounts for gender, age, height, weight
- Activity level multipliers (1.2 - 1.9)
- Fitness goal adjustments (lose_weight: -500, maintain: 0, gain_muscle: +500)

### Error Handling

- Non-food images: Returns user-friendly error message
- Blurry photos: Asks user to send clearer image
- API failures: Graceful error handling with retry options

### Data Persistence

- All meals linked to Telegram user ID
- Daily stats aggregation
- Historical data retrieval by date
- Weight history tracking
- Transaction audit trail

## License

ISC

## Support

For issues or questions, please create an issue in the repository.
