<div align="center">

# 🧮 pi-tensorix-provider

**Free models during preview via [Tensorix](https://tensorix.ai)**

_32 models — DeepSeek, Kimi, GLM, Qwen, MiniMax, Llama — all **free** for [pi](https://github.com/earendil-works/pi-coding-agent)._

[![pi extension](https://img.shields.io/badge/pi-extension-blueviolet)](https://github.com/earendil-works/pi-coding-agent)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

</div>

---

## Features

- **OpenAI-compatible API** - Uses Tensorix's `/v1/chat/completions` endpoint
- **Reasoning models** - Support for thinking models with `reasoning_effort` parameter
- **Vision models** - Image input support on Kimi K2.5, Kimi K2.6, GLM 5V Turbo, and Qwen3 VL
- **Tool use** - Function calling support
- **Streaming** - Real-time token streaming
- **Free tier** - All models available at no cost during preview

## Available Models

| Model | Context | Vision | Reasoning | Input $/M | Output $/M |
|-------|---------|--------|-----------|-----------|------------|
| Chatterbox Turbo | 131K | ❌ | ❌ | **Free** | **Free** |
| Deepseek R1 0528 | 131K | ❌ | ✅ | **Free** | **Free** |
| Deepseek V3.2 | 164K | ❌ | ✅ | **Free** | **Free** |
| Deepseek V4 Flash 0731 | 131K | ❌ | ✅ | **Free** | **Free** |
| Deepseek V4 Pro | 1.0M | ❌ | ✅ | **Free** | **Free** |
| Glm 5 | 203K | ❌ | ✅ | **Free** | **Free** |
| Glm 5 Turbo | 203K | ❌ | ✅ | **Free** | **Free** |
| Glm 5.1 | 203K | ❌ | ✅ | **Free** | **Free** |
| Glm 5.2 | 131K | ❌ | ✅ | **Free** | **Free** |
| Glm 5v Turbo | 203K | ✅ | ✅ | **Free** | **Free** |
| Kimi K2.5 | 262K | ✅ | ✅ | **Free** | **Free** |
| Kimi K2.6 | 262K | ✅ | ✅ | **Free** | **Free** |
| Kimi K2.7 Code | 131K | ✅ | ✅ | **Free** | **Free** |
| Kimi K3 | 131K | ✅ | ✅ | **Free** | **Free** |
| Minimax M2.5 | 205K | ❌ | ✅ | **Free** | **Free** |
| Minimax M3 | 131K | ✅ | ✅ | **Free** | **Free** |
| Qwen3 235b A22b 2507 | 262K | ❌ | ✅ | **Free** | **Free** |
| Qwen3.5 122b A10b | 262K | ❌ | ✅ | **Free** | **Free** |
| Qwen3.5 9b | 262K | ❌ | ✅ | **Free** | **Free** |
| Qwen3.8 2.4t A95b | 131K | ❌ | ❌ | **Free** | **Free** |
| Qwen3.8 27b | 131K | ❌ | ❌ | **Free** | **Free** |

## Installation

### Option 1: Using `pi install` (Recommended)

Install directly from GitHub:

```bash
pi install https://github.com/monotykamary/pi-tensorix-provider
```

Then set your API key and run pi:
```bash
# Recommended: add to auth.json
# See Authentication section below

# Or set as environment variable
export TENSORIX_API_KEY=your-api-key-here

pi
```

Get your API key from [tensorix.ai](https://tensorix.ai).

### Option 2: Manual Clone

1. Clone this repository:
   ```bash
   git clone https://github.com/monotykamary/pi-tensorix-provider.git
   cd pi-tensorix-provider
   ```

2. Set your Tensorix API key:
   ```bash
   # Recommended: add to auth.json
   # See Authentication section below

   # Or set as environment variable
   export TENSORIX_API_KEY=your-api-key-here
   ```

3. Run pi with the extension:
   ```bash
   pi -e /path/to/pi-tensorix-provider
   ```

## Authentication

The Tensorix API key can be configured in multiple ways (resolved in this order):

1. **`auth.json`** (recommended) — Add to `~/.pi/agent/auth.json`:
   ```json
   { "tensorix": { "type": "api_key", "key": "your-api-key" } }
   ```
   The `key` field supports literal values, env var names, and shell commands (prefix with `!`). See [pi's auth file docs](https://github.com/badlogic/pi-mono) for details.
2. **Runtime override** — Use the `--api-key` CLI flag
3. **Environment variable** — Set `TENSORIX_API_KEY`

Get your API key from [tensorix.ai](https://tensorix.ai).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TENSORIX_API_KEY` | No | Your Tensorix API key (fallback if not in auth.json) |

## Configuration

Add to your pi configuration for automatic loading:

```json
{
  "extensions": [
    "/path/to/pi-tensorix-provider"
  ]
}
```

## Usage

Once loaded, select a model with:

```
/model tensorix deepseek/deepseek-v4-pro
```

Or use `/models` to browse all available Tensorix models.

### Reasoning Effort

For reasoning models, control thinking depth:

```
/reasoning high
```

Values: `none`, `low`, `medium`, `high`

## API Compatibility

Tensorix provides an OpenAI-compatible API proxy. Key notes:

| Aspect | Behavior |
|--------|----------|
| Max tokens field | Both `max_tokens` and `max_completion_tokens` accepted |
| Thinking format | `openai` (always `reasoning_content` in response) |
| Developer role | ✅ Supported on all models |
| Reasoning effort | Accepted by reasoning models |
| `store` parameter | ❌ Not supported |

> **Note:** The Tensorix `/v1/models` endpoint only returns model IDs — no pricing,
> context lengths, or reasoning flags. `patch.json` provides these based on
> known model specifications and E2E testing.

## API Documentation

- Tensorix Docs: https://docs.tensorix.ai
- OpenAI-compatible endpoint: `https://api.tensorix.ai/v1`
- Models endpoint: `https://api.tensorix.ai/v1/models`

## License

MIT
