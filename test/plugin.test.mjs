import assert from 'node:assert/strict';
import test from 'node:test';

import { createWorkerHarness } from '@vibex/plugin-sdk/testing';

import definition from '../runtime/worker.mjs';

test('routes Office preview through the declared Artifact capability', async () => {
  const host = {
    async call(capability, operation, input) {
      if (capability !== 'artifact.preview' || operation !== 'open') {
        throw new Error(`unexpected host call ${capability}.${operation}`);
      }
      if (input?.providerId !== 'office-preview') {
        throw new Error('scope denied');
      }
      return { leaseId: 'office-preview-test' };
    },
  };
  const worker = await createWorkerHarness(definition, { host });

  assert.deepEqual(worker.handlers, ['office-preview']);
  assert.deepEqual(
    await worker.invoke('office-preview', {
      providerId: 'office-preview',
      artifactHandle: 'artifact-test',
    }),
    { leaseId: 'office-preview-test' },
  );
  await assert.rejects(
    () =>
      worker.invoke('office-preview', {
        providerId: 'other-preview',
        artifactHandle: 'artifact-test',
      }),
    /scope/i,
  );
  await assert.rejects(() => worker.invoke('undeclared', null), /not registered/);
  await worker.dispose();
});
