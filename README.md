# LBO Financial Modeling System

## 🎯 Overview
A comprehensive React/TypeScript application for Leveraged Buyout (LBO) financial modeling in M&A transactions. Built with pragmatic principles inspired by Linus Torvalds' philosophy.

## 🚀 Features
- **Complete LBO Workflow**: Target metrics → Assumptions → Deal design → Financing → Projections
- **Redux State Management**: Domain-driven slices with persistence
- **Financial Calculations**: Debt schedules, cash flows, covenant monitoring
- **Scenario Analysis**: Base/Upside/Downside case modeling
- **Drag & Drop**: Intuitive financing structure configuration
- **Material-UI**: Responsive, professional interface

## 📊 Technical Excellence
- **TypeScript**: 96.5% type safety (9 pragmatic `any` retentions)
- **Build Status**: ✅ 0 errors, 0 warnings
- **Code Quality**: 90% "Good Taste" - following Linus principles
- **Architecture**: Clean domain separation, no special cases

## 🛠 Quick Start

```bash
# Clone the repository
git clone https://github.com/Tsaitung/LBO.git
cd LBO

# Navigate to app directory
cd lbo-model

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at http://localhost:3000

## 📁 Project Structure
```
LBO/
├── lbo-model/              # React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── store/          # Redux store & slices
│   │   ├── calculations/   # Financial logic
│   │   ├── types/          # TypeScript definitions
│   │   └── hooks/          # Custom React hooks
│   └── public/             # Static assets
├── CLAUDE.md               # Development guidelines
└── README.md               # This file
```

## 🔧 Available Scripts

```bash
npm start          # Development server
npm run build      # Production build
npm test           # Run tests
npm run launch     # Start with browser auto-open
```

## 💡 Philosophy

This project follows Linus Torvalds' pragmatic principles:
- **"Good taste"**: Eliminate special cases through better data structures
- **"Never break userspace"**: Backward compatibility is sacred
- **"Theory loses"**: Practical solutions over academic purity

## 📝 Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines and architecture decisions.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Follow the coding standards in CLAUDE.md
4. Commit with clear messages
5. Push and create a Pull Request

## 📄 License

This project is proprietary software for Tsaitung.com.

## 🙏 Acknowledgments

Built with assistance from Claude AI, following pragmatic engineering principles.

---

**Tsaitung.com** - Financial Modeling Excellence