# ScholarHunter Frontend

AI-powered scholarship matching platform built with Next.js 14, Shadcn/ui, and modern web technologies.

## 🚀 Features

- **AI-Powered Matching**: Smart scholarship matching based on user profiles
- **Auto-Apply System**: Automated application submission with AI assistance
- **Interview Preparation**: AI mock interviews with real-time feedback
- **Application Pipeline**: Kanban-style application tracking
- **Knowledge Assistant**: AI chat for scholarship guidance
- **Dark Mode**: Full dark mode support with theme toggle
- **Responsive Design**: Mobile-first, fully responsive UI

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Components**: Shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: Zustand (ready to integrate)
- **Data Fetching**: TanStack Query (ready to integrate)
- **Animations**: Framer Motion
- **Icons**: Lucide React + Material Symbols
- **Theme**: next-themes
- **Font**: Lexend (Google Fonts)

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🎨 Design System

### Colors

- **Primary**: #135bec (Blue)
- **Background Light**: #f6f6f8
- **Background Dark**: #101622

### Typography

- **Font Family**: Lexend
- **Headings**: Bold, tracking-tight
- **Body**: Regular, leading-relaxed

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (auth)/            # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/         # Main dashboard
│   │   ├── matches/           # Top scholarship matches
│   │   ├── applications/      # Application pipeline (Kanban)
│   │   ├── interview-prep/    # Interview preparation
│   │   ├── knowledge/         # AI knowledge assistant
│   │   └── page.tsx           # Homepage
│   ├── components/
│   │   ├── ui/                # Shadcn/ui components
│   │   ├── layout/            # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── main-layout.tsx
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   └── lib/
│       └── utils.ts           # Utility functions
├── public/                    # Static assets
└── tailwind.config.ts         # Tailwind configuration
```

## 🎯 Key Pages

### Homepage (`/`)
- Hero section with CTA
- Upcoming deadlines widget
- Feature showcase
- Footer with links

### Dashboard (`/dashboard`)
- Statistics cards
- Scholarship match cards with AI rationale
- Match percentage indicators
- Quick actions

### Top Matches (`/matches`)
- Ranked scholarship list
- Detailed AI matching rationale
- Funding and deadline information
- Auto-apply functionality

### Applications (`/applications`)
- Kanban board (In Progress, Submitted, Interview)
- Action required alerts
- Progress tracking
- Agent activity monitoring

### Interview Prep (`/interview-prep`)
- Mock interview sessions
- Scenario packs
- Performance metrics
- Communication score tracking

### Knowledge Assistant (`/knowledge`)
- AI chat interface
- Document checklist
- Citation links
- Recommended reading

### Authentication
- Login page with social auth
- Registration with validation
- Forgot password flow

## 🎨 Components

### Layout Components

- **Header**: Navigation, search, notifications, theme toggle
- **Sidebar**: Navigation menu, quick access, agent health
- **MainLayout**: Wrapper combining header and sidebar

### UI Components (Shadcn/ui)

- Button
- Card
- Input
- Label
- Select
- Textarea
- Badge
- Avatar
- Dropdown Menu
- Dialog
- Sheet
- Tabs

## 🌙 Dark Mode

Dark mode is implemented using `next-themes` with:
- System preference detection
- Manual toggle in header
- Persistent theme selection
- Smooth transitions

## 📱 Responsive Design

All pages are fully responsive with breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px
- XL: > 1280px (sidebar visible)

## 🔧 Configuration

### Tailwind Config

Custom theme with:
- Primary color: #135bec
- Custom font family (Lexend)
- Extended color palette
- Custom scrollbar styles

### Next.js Config

- TypeScript strict mode
- ESLint configuration
- App router enabled

## 🚧 Future Enhancements

- [ ] Profile setup wizard
- [ ] Document preparation lab
- [ ] Real-time notifications
- [ ] Advanced filtering
- [ ] Export functionality
- [ ] Analytics dashboard
- [ ] Multi-language support

## 📝 License

MIT License - See LICENSE file for details

## 👥 Contributing

Contributions are welcome! Please read CONTRIBUTING.md for guidelines.

## 🐛 Bug Reports

Report bugs via GitHub Issues with:
- Description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

## 📧 Support

For support, email support@scholarhunter.com or join our Discord community.

---

Built with ❤️ by the ScholarHunter Team
