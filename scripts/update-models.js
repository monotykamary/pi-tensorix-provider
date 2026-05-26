#!/usr/bin/env node
/**
 * Update Tensorix models from API
 *
 * Fetches models from https://api.tensorix.ai/v1/models and updates:
 * - models.json: API model definitions with preserved curated data
 * - README.md: Model table with patch.json overrides applied
 *
 * The Tensorix /v1/models API returns minimal metadata (id only — no pricing,
 * context_length, or reasoning flags). models.json preserves curated specs for
 * known models and creates skeleton entries for new ones. patch.json corrects
 * reasoning capability and adds compatibility overrides at runtime.
 *
 * Merge order for README: models.json → apply patch.json → merge custom-models.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MODELS_API_URL = 'https://api.tensorix.ai/v1/models';
const MODELS_JSON_PATH = path.join(__dirname, '..', 'models.json');
const PATCH_JSON_PATH = path.join(__dirname, '..', 'patch.json');
const CUSTOM_MODELS_JSON_PATH = path.join(__dirname, '..', 'custom-models.json');
const README_PATH = path.join(__dirname, '..', 'README.md');

const MODELS_TO_SKIP = new Set([
  'qwen/qwen3-embedding-8b',
  'Systran/faster-whisper-large-v3',
]);

// ─── Patch application ────────────────────────────────────────────────────────

function applyPatch(model, patch) {
  const result = { ...model };

  if (patch.name !== undefined) result.name = patch.name;
  if (patch.reasoning !== undefined) result.reasoning = patch.reasoning;
  if (patch.input !== undefined) result.input = patch.input;
  if (patch.contextWindow !== undefined) result.contextWindow = patch.contextWindow;
  if (patch.maxTokens !== undefined) result.maxTokens = patch.maxTokens;
  if (patch.thinkingLevelMap !== undefined) result.thinkingLevelMap = { ...patch.thinkingLevelMap };

  if (patch.cost) {
    result.cost = {
      input: patch.cost.input ?? result.cost.input,
      output: patch.cost.output ?? result.cost.output,
      cacheRead: patch.cost.cacheRead ?? result.cost.cacheRead,
      cacheWrite: patch.cost.cacheWrite ?? result.cost.cacheWrite,
    };
  }
  if (patch.compat) {
    result.compat = { ...(result.compat || {}), ...patch.compat };
  }

  if (!result.reasoning && result.compat?.thinkingFormat) {
    delete result.compat.thinkingFormat;
  }
  if (result.compat && Object.keys(result.compat).length === 0) {
    delete result.compat;
  }

  return result;
}

function buildModels(baseModels, customModels, patchData) {
  const modelMap = new Map();

  for (const model of baseModels) {
    modelMap.set(model.id, model);
  }

  for (const [id, patchEntry] of Object.entries(patchData)) {
    const existing = modelMap.get(id);
    if (existing) {
      modelMap.set(id, applyPatch(existing, patchEntry));
    }
  }

  for (const model of customModels) {
    const existing = modelMap.get(model.id);
    const patchEntry = patchData[model.id];
    if (existing && patchEntry) {
      modelMap.set(model.id, applyPatch(model, patchEntry));
    } else if (existing) {
      modelMap.set(model.id, model);
    } else if (patchEntry) {
      modelMap.set(model.id, applyPatch(model, patchEntry));
    } else {
      modelMap.set(model.id, model);
    }
  }

  return Array.from(modelMap.values());
}

// ─── Model transformation ─────────────────────────────────────────────────────

function buildDisplayName(apiModel) {
  const id = apiModel.id || '';
  const parts = id.split('/');
  const rawName = parts.length > 1 ? parts.slice(1).join('/') : id;
  return rawName
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function transformModel(apiModel, existingModelsMap) {
  const modelId = apiModel.id;

  // Preserve existing curated data (reasoning, vision, compat, context, etc.)
  if (existingModelsMap[modelId]) {
    const existing = { ...existingModelsMap[modelId] };
    existing._meta = { isFree: true };
    return existing;
  }

  // New model — build from API data + sensible defaults
  return {
    id: modelId,
    name: buildDisplayName(apiModel),
    reasoning: false,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 131072,
    maxTokens: 131072,
    _meta: { isFree: true },
  };
}

// ─── File I/O ─────────────────────────────────────────────────────────────────

function loadJson(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// ─── README generation ────────────────────────────────────────────────────────

function formatCost(cost, isFree) {
  if (isFree) return '**Free**';
  if (cost === 0) return '-';
  return `$${cost.toFixed(2)}`;
}

function formatContextWindow(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return n.toString();
}

function generateReadmeTable(models) {
  const lines = [
    '| Model | Context | Vision | Reasoning | Input $/M | Output $/M |',
    '|-------|---------|--------|-----------|-----------|------------|',
  ];

  for (const model of models) {
    const name = model.name;
    const context = formatContextWindow(model.contextWindow);
    const vision = model.input.includes('image') ? '✅' : '❌';
    const reasoning = model.reasoning ? '✅' : '❌';
    const isFree = model._meta?.isFree ?? (model.cost.input === 0 && model.cost.output === 0);
    const inputCost = formatCost(model.cost.input, isFree);
    const outputCost = formatCost(model.cost.output, isFree);

    lines.push(`| ${name} | ${context} | ${vision} | ${reasoning} | ${inputCost} | ${outputCost} |`);
  }

  return lines.join('\n');
}

function updateReadme(models) {
  let readme = fs.readFileSync(README_PATH, 'utf8');
  const newTable = generateReadmeTable(models);

  const tableRegex = /(## Available Models\n\n)\| Model \| Context \| Vision \| Reasoning \| Input \$\/M \| Output \$\/M \|\n\|[-| ]+\|(\n\|[^\n]+\|)*\n*/;

  if (tableRegex.test(readme)) {
    readme = readme.replace(tableRegex, (match, header) => `${header}${newTable}\n\n`);
    fs.writeFileSync(README_PATH, readme);
    console.log('✓ Updated README.md');
  } else {
    console.warn('⚠ Could not find model table in "## Available Models" section');
  }
}

function cleanModelForJson(model) {
  const { _meta, ...cleanModel } = model;
  return cleanModel;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Fetching models from ${MODELS_API_URL}...`);

  try {
    const apiKey = process.env.TENSORIX_API_KEY;
    const headers = {};
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const response = await fetch(MODELS_API_URL, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse = await response.json();
    const apiModels = apiResponse.data || apiResponse;

    if (!Array.isArray(apiModels)) {
      throw new Error('API response does not contain an array of models');
    }

    console.log(`✓ Fetched ${apiModels.length} models from API`);

    // Filter out non-chat models
    const chatModels = apiModels.filter(m => !MODELS_TO_SKIP.has(m.id));
    console.log(`✓ Filtered to ${chatModels.length} chat models (skipped ${apiModels.length - chatModels.length} non-chat)`);

    // Load existing models.json — source of truth for curated specs
    let existingModels = [];
    try {
      existingModels = JSON.parse(fs.readFileSync(MODELS_JSON_PATH, 'utf8'));
    } catch {
      // File might not exist or be invalid
    }
    const existingModelsMap = {};
    for (const m of existingModels) {
      existingModelsMap[m.id] = m;
    }

    // Transform models from API, preserving existing curated data
    let apiTransformed = chatModels.map(m => transformModel(m, existingModelsMap));

    // Sort by id
    apiTransformed.sort((a, b) => a.id.localeCompare(b.id));

    // Update models.json — API-derived model list with curated specs preserved
    const cleanModels = apiTransformed.map(cleanModelForJson);
    fs.writeFileSync(MODELS_JSON_PATH, JSON.stringify(cleanModels, null, 2) + '\n');
    console.log('✓ Updated models.json (API model list with curated specs)');

    // Log new models not yet in patch.json
    const patch = loadJson(PATCH_JSON_PATH);
    for (const m of apiTransformed) {
      if (!patch[m.id] && !existingModelsMap[m.id]) {
        console.log(`  🆕 New model: ${m.id} (${m.name}) — add to patch.json for reasoning/vision/specs`);
      }
    }

    // Build full model list for README: base → patch → custom
    const customModels = loadJson(CUSTOM_MODELS_JSON_PATH);
    const readmeModels = buildModels(
      apiTransformed,
      Array.isArray(customModels) ? customModels : [],
      patch
    );
    readmeModels.sort((a, b) => a.name.localeCompare(b.name));
    console.log('✓ Built model list (base → patch → custom) for README');

    // Update README.md with patched data
    updateReadme(readmeModels);

    // Summary
    console.log('\n--- Summary ---');
    console.log(`Total models: ${readmeModels.length}`);
    console.log(`Reasoning models (patched): ${readmeModels.filter(m => m.reasoning).length}`);
    console.log(`Vision models: ${readmeModels.filter(m => m.input.includes('image')).length}`);

    const newIds = new Set(apiTransformed.map(m => m.id));
    const oldIds = new Set(existingModels.map(m => m.id));

    const added = [...newIds].filter(id => !oldIds.has(id));
    const removed = [...oldIds].filter(id => !newIds.has(id));

    if (added.length > 0) {
      console.log(`\nNew models: ${added.join(', ')}`);
    }
    if (removed.length > 0) {
      console.log(`\nRemoved models: ${removed.join(', ')}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
