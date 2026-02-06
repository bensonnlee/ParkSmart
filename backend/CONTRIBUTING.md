# Contributing Guidelines

## Code Quality

This project uses [Ruff](https://docs.astral.sh/ruff/) for linting and formatting.

### Before Pushing Code

Run these commands from the `backend/` directory:

```bash
# Check for linting issues
ruff check .

# Auto-fix fixable issues
ruff check . --fix

# Format code
ruff format .

# (Optional) Type checking
mypy app/
```

### Quick One-Liner

```bash
ruff check . --fix && ruff format .
```

### IDE Integration

For real-time feedback, install the Ruff extension for your editor:

- **VS Code**: [Ruff extension](https://marketplace.visualstudio.com/items?itemName=charliermarsh.ruff)
- **PyCharm**: Enable Ruff in Settings > Tools > Ruff

### Configuration

Ruff settings are defined in `pyproject.toml`. The project enforces:

- Line length: 88 characters
- Double quotes for strings
- Sorted imports (isort-style)
- Common error checks (pyflakes, pycodestyle, bugbear)
