#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { TestBoundariesStack } from '../lib/test-boundaries-stack';

const app = new cdk.App();
new TestBoundariesStack(app, 'TestBoundariesStack', {
  env: {
    region: 'eu-west-1',
    account: '123456789012'
  }
});
