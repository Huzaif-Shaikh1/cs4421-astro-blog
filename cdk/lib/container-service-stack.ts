import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export class ContainerServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const imageTag = this.node.tryGetContext('imageTag') ?? 'v1.0.0';

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [{ name: 'public', subnetType: ec2.SubnetType.PUBLIC }],
    });

    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    const repository = ecr.Repository.fromRepositoryName(this, 'Repository', 'astro-blog');

    const logGroup = new logs.LogGroup(this, 'AppLogs', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster,
      desiredCount: 1,
      cpu: 256,
      memoryLimitMiB: 512,
      publicLoadBalancer: true,
      assignPublicIp: true,
      taskSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      circuitBreaker: { enable: true, rollback: true },
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(repository, imageTag),
        containerPort: 4321,
        environment: { NODE_ENV: 'production', HOST: '0.0.0.0', PORT: '4321' },
        logDriver: ecs.LogDrivers.awsLogs({ streamPrefix: 'astro-blog', logGroup }),
      },
    });

    service.targetGroup.configureHealthCheck({
      path: '/api/health',
      healthyHttpCodes: '200',
      interval: cdk.Duration.seconds(10),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
    });
    service.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '10');

    new cloudwatch.Alarm(this, 'UnhealthyTargetsAlarm', {
      alarmName: 'astro-blog-unhealthy-targets',
      alarmDescription: 'The load balancer has at least one unhealthy container',
      metric: service.targetGroup.metrics.unhealthyHostCount({ period: cdk.Duration.minutes(1) }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cdk.CfnOutput(this, 'AppUrl', {
      value: `http://${service.loadBalancer.loadBalancerDnsName}`,
    });
    new cdk.CfnOutput(this, 'DeployedImageTag', { value: imageTag });
  }
}