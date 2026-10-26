#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { StaticSiteStack } from '../lib/static-site-stack';
import { ContainerRegistryStack } from '../lib/container-registry-stack';

const app = new cdk.App();
new StaticSiteStack(app, 'StaticSiteStack');
new ContainerRegistryStack(app, 'ContainerRegistryStack');