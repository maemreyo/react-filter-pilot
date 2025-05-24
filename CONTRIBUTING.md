# Contributing to react-filter-pilot

We love your input! We want to make contributing to react-filter-pilot as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## We Develop with Github

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## We Use [Github Flow](https://guides.github.com/introduction/flow/index.html)

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using Github's [issues](https://github.com/yourusername/react-filter-pilot/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/yourusername/react-filter-pilot/issues/new); it's that easy!

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Development Process

### Prerequisites

- Node.js >= 14
- npm >= 7

### Setup

```bash
# Clone your fork
git clone https://github.com/your-username/react-filter-pilot.git
cd react-filter-pilot

# Install dependencies
npm install

# Run tests in watch mode
npm run test:watch

# Run the build
npm run build
```

### Development Workflow

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. Make your changes and ensure tests pass:
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

3. Add tests for any new functionality

4. Update documentation if needed

5. Commit your changes following our commit message conventions (see below)

6. Push to your fork and submit a pull request

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This leads to more readable messages that are easy to follow when looking through the project history.

**Format:** `<type>(<scope>): <subject>`

**Examples:**
```
feat(filters): add date range filter support
fix(pagination): correct page calculation for empty results
docs(readme): update installation instructions
test(hooks): add tests for useFilterPilot
chore(deps): update dependencies
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Testing

- Write tests for any new functionality
- Ensure all tests pass before submitting PR
- Aim for high test coverage (>80%)
- Use the test utilities provided in `src/test-utils`

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Style

We use ESLint and Prettier to maintain code quality and consistency.

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Documentation

- Update README.md if you change functionality
- Add JSDoc comments to exported functions
- Update TypeScript types as needed
- Add examples for new features

### Pull Request Process

1. Update the README.md with details of changes to the interface
2. Update the CHANGELOG.md with a note describing your changes
3. The PR will be merged once you have the sign-off of at least one maintainer

## Project Structure

```
react-filter-pilot/
├── src/              # Source code
│   ├── hooks/       # React hooks
│   ├── adapters/    # URL adapters
│   ├── types/       # TypeScript types
│   ├── utils/       # Utilities
│   └── test-utils/  # Test helpers
├── docs/            # Documentation
├── playground/      # Development playground
└── examples/        # Usage examples
```

## Common Issues

### TypeScript Errors

If you encounter TypeScript errors, ensure you're using the correct version:
```bash
npm install typescript@^5.2.0
```

### Test Failures

Clear the Jest cache if tests are failing unexpectedly:
```bash
npm test -- --clearCache
```

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers directly.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.