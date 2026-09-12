import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { App } from 'aws-cdk-lib';
import { ApiStack } from './lib/api-stack';

const app = new App();

new ApiStack(app, 'ConstructionInventoryApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'eu-west-1',
  },
});
