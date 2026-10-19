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
- **Quiet live model sync** - Models refresh from the Tensorix API in the background, at most hourly and by one pi process at a time ([details](#model-sync))

## Available Models

| Model | Context | Vision | Reasoning | Input $/M | Output $/M |
|-------|---------|--------|-----------|-----------|------------|
| Chatterbox Turbo | 131K | ❌ | ❌ | **Free** | **Free** |
| Deepseek V4 Flash 0731 | 131K | ❌ | ✅ | **Free** | **Free** |
| Deepseek V4 Pro 0813 | 131K | ❌ | ❌ | **Free** | **Free** |
| Deepseek V4.1 Flash | 131K | ❌ | ❌ | **Free** | **Free** |
| Deepseek V4.1 Flash 1017 | 131K | ❌ | ❌ | **Free** | **Free** |
| Glm 5.2 | 131K | ❌ | ✅ | **Free** | **Free** |
| Glm 5.3 | 131K | ❌ | ❌ | **Free** | **Free** |
| Glm 5.3 Flash | 131K | ❌ | ❌ | **Free** | **Free** |
| Kimi K2.7 Code | 131K | ✅ | ✅ | **Free** | **Free** |
| Kimi K3 | 131K | ✅ | ✅ | **Free** | **Free** |
| Minimax M3 | 131K | ✅ | ✅ | **Free** | **Free** |
| Qwen3.8 2.4t A95b | 131K | ❌ | ❌ | **Free** | **Free** |
| Qwen3.8 27b | 131K | ❌ | ❌ | **Free** | **Free** |
| Qwen3.8 Flash Next | 131K | ❌ | ❌ | **Free** | **Free** |

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
| `PI_PROVIDER_SYNC_TTL_MS` | No | Model sync freshness window in ms (default `3600000`; `0` = revalidate every session start) |

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

## Model sync

Startup never waits on the network. pi starts with the cached catalog (`~/.pi/agent/cache/tensorix-models.json`,
falling back to the bundled `models.json`) and revalidates against `/v1/models` in the background — only when:

- a Tensorix API key is configured (no key, no request),
- the cache is older than 1 hour, missing, or was fetched with a different API key, and
- no other pi process is already refreshing it (a `tensorix-models.lock` file next to the cache).

So `/new`, `/reload`, `pi -p` and fan-out child agents share one cache instead of each calling the API; a
session that skips the fetch still picks up a cache another process refreshed. A failed refresh is retried after
5 minutes at the earliest. `PI_PROVIDER_SYNC_TTL_MS` changes the window (`0` revalidates on every session start).
Only a hash fingerprint of the key is stored (`tensorix-models.sync.json`), never the key itself.

## API Documentation

- Tensorix Docs: https://docs.tensorix.ai
- OpenAI-compatible endpoint: `https://api.tensorix.ai/v1`
- Models endpoint: `https://api.tensorix.ai/v1/models`

## License

MIT
