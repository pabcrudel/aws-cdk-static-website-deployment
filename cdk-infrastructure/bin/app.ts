#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WebsiteDeploymentStack } from '../lib/website-deployment-stack';

const app = new cdk.App();
new WebsiteDeploymentStack(app, 'WebsiteDeploymentStack');