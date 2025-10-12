# WeInn - Professional Property Management Platform

WeInn is a comprehensive property management platform designed specifically for hotel and villa owners. Streamline your property listings, manage bookings, and grow your hospitality business with our intuitive platform.

## Features

- **Property Listing**: Create detailed listings for hotels and villas
- **Professional Management**: Manage multiple properties from a single dashboard
- **Booking System**: Handle reservations and guest communications
- **Analytics**: Track performance and optimize your business
- **Mobile Responsive**: Access your dashboard from any device

## Technologies Used

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (Database, Authentication, Storage)
- **Build Tool**: Vite
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for backend services)

### Installation

1. Clone the repository:
```bash
git clone <YOUR_REPOSITORY_URL>
cd weinn-lister
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Main application pages
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
├── integrations/  # External service integrations
└── assets/        # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support and questions, please contact our team at support@weinn.com