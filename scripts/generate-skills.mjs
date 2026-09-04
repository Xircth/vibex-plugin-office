#!/usr/bin/env node
/**
 * Generate contents/skills from the locked officecli binary.
 * officecli is the only source of skill text; do not edit the copies by hand.
 */

import { createHash } from 'node:crypto';
import { chmod, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SKILL_IDS = [
  'pptx',
  'word',
  'excel',
  'morph-ppt',
  'morph-ppt-3d',
  'pitch-deck',
  'academic-paper',
  'data-dashboard',
  'financial-model',
  'word-form',
];
const WORKFLOW_SKILL = {
  'create-document': 'word',
  'modify-document': 'word',
  'create-presentation': 'pptx',
  'modify-presentation': 'pptx',
  'analyze-spreadsheet': 'excel',
  'generate-spreadsheet': 'excel',
};

const TITLES = {
  pptx: 'PowerPoint',
  word: 'Word',
  excel: 'Excel',
  'morph-ppt': 'Morph PPT',
  'morph-ppt-3d': 'Morph PPT 3D',
  'pitch-deck': 'Pitch deck',
  'academic-paper': 'Academic paper',
  'data-dashboard': 'Data dashboard',
  'financial-model': 'Financial model',
  'word-form': 'Word form',
};

async function main() {
  const runtime = JSON.parse(
    await readFile(join(ROOT, 'depends/runtimes/officecli.json'), 'utf8')
  );
  const officecli = await resolveOfficecli(runtime);
  const version = await run(officecli, ['--version']);
  if (!version.includes(runtime.version)) {
    throw new Error(
      `officecli ${version.trim()} is not the locked ${runtime.version}`
    );
  }
  const listed = await run(officecli, ['load_skill']);
  for (const id of SKILL_IDS) {
    if (!new RegExp(`^## ${id}$`, 'm').test(listed)) {
      throw new Error(`locked officecli does not advertise skill ${id}`);
    }
  }

  const skillsRoot = join(ROOT, 'contents/skills');
  await rm(skillsRoot, { recursive: true, force: true });
  await mkdir(skillsRoot, { recursive: true });
  for (const id of SKILL_IDS) {
    const markdown = await run(officecli, ['load_skill', id]);
    if (!markdown.startsWith('---\n')) {
      throw new Error(`load_skill ${id} did not return a SKILL.md`);
    }
    const dest = join(skillsRoot, id);
    await mkdir(dest, { recursive: true });
    await writeFile(join(dest, 'SKILL.md'), markdown.endsWith('\n') ? markdown : `${markdown}\n`);
  }

  await rewritePluginJson();
  await rewriteWorkflowSkills();
  await rewriteContentIndex();
  console.log(`generated ${SKILL_IDS.length} skills from officecli ${runtime.version}`);
}

async function resolveOfficecli(runtime) {
  if (process.env.OFFICECLI) return process.env.OFFICECLI;
  const platformKey = `${process.platform}-${process.arch}`;
  const distribution = runtime.distributions?.[platformKey];
  if (!distribution?.url) {
    throw new Error(`no officecli distribution for ${platformKey}`);
  }
  const cache = join(tmpdir(), `officecli-${runtime.version}-${platformKey}`);
  await mkdir(cache, { recursive: true });
  const dest = join(cache, process.platform === 'win32' ? 'officecli.exe' : 'officecli');
  try {
    await chmod(dest, 0o755);
    return dest;
  } catch {
    const response = await fetch(distribution.url);
    if (!response.ok) {
      throw new Error(`download officecli failed: ${response.status}`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== distribution.sha256) {
      throw new Error(`officecli sha256 mismatch for ${platformKey}`);
    }
    await writeFile(dest, bytes);
    await chmod(dest, 0o755);
    return dest;
  }
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      const out = Buffer.concat(stdout).toString('utf8');
      if (code !== 0) {
        reject(
          new Error(
            `${command} ${args.join(' ')} exited ${code}: ${Buffer.concat(stderr).toString('utf8')}`
          )
        );
        return;
      }
      resolve(out);
    });
  });
}

async function rewritePluginJson() {
  const path = join(ROOT, '.vibex-plugin/plugin.json');
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  const skillIntegrations = SKILL_IDS.map((id) => ({
    id,
    kind: 'content.skill',
    resource: `contents/skills/${id}`,
    targets: ['codex', 'claude-code', 'acp'],
  }));
  manifest.integrations = [
    ...skillIntegrations,
    ...manifest.integrations.filter((item) => item.kind !== 'content.skill'),
  ];
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function rewriteWorkflowSkills() {
  const workflows = join(ROOT, 'contents/workflows');
  for (const id of await readdir(workflows)) {
    const required = WORKFLOW_SKILL[id];
    if (!required) continue;
    const path = join(workflows, id, 'workflow.json');
    const workflow = JSON.parse(await readFile(path, 'utf8'));
    workflow.requires.skills = [required];
    await writeFile(path, `${JSON.stringify(workflow, null, 2)}\n`);
  }
}

async function rewriteContentIndex() {
  const path = join(ROOT, '.vibex-plugin/content.index.json');
  const index = JSON.parse(await readFile(path, 'utf8'));
  const skills = SKILL_IDS.map((id) => ({
    path: `contents/skills/${id}/SKILL.md`,
    kind: 'skill',
    title: TITLES[id] ?? id,
  }));
  const other = index.items.filter((item) => item.kind !== 'skill');
  index.items = [...skills, ...other];
  await writeFile(path, `${JSON.stringify(index, null, 2)}\n`);
}

await main();
