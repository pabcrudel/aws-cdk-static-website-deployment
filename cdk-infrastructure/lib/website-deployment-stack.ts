import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class WebsiteDeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /** The s3 bucket where the website will be hosted */
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      accessControl: s3.BucketAccessControl.PRIVATE,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: s3.BucketEncryption.S3_MANAGED,
      /*
      Not turned on the static website feature of the S3 service 
      as it does not offer the caching and distribution benefits that the CloudFront service does.
      */
    });

    // Displays the S3 Bucket ARN and name on CloudFormation output
    new cdk.CfnOutput(this, 'S3BucketDetails', {
      value: `${websiteBucket.bucketName}\n${websiteBucket.bucketArn}`,
      description: 'Name and ARN of the S3 bucket hosting the website',
    });    

    /** Creating A CloudFront Origin Access Identity (OAI) user */
    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(
      this, 'CloudFrontOriginAccessIdentity'
    );

    /** Grant read access to the S3 bucket objects through the bucket resource policy to enable OAI user access via CloudFront */
    const policyStatement = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [websiteBucket.arnForObjects('*')],
      principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
    });
    
    // Adding OAI user to the website bucket
    websiteBucket.addToResourcePolicy(policyStatement);

    // Displays the policy for CloudFront OAI to access the S3 bucket on CloudFormation output
    new cdk.CfnOutput(this, 'AccessPolicyDetails', {
      value: JSON.stringify(policyStatement.toStatementJson(), null, 2),
      description: 'Policy for CloudFront Origin Access Identity to access the S3 bucket',
    });

    /** Cloudfront Response Headers Policy */
    const responseHeaderPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeadersResponseHeaderPolicy', {
      comment: 'Security headers response header policy',
      securityHeadersBehavior: {
        contentSecurityPolicy: {
          override: true,
          contentSecurityPolicy: "default-src 'self'"
        },
        strictTransportSecurity: {
          override: true,
          accessControlMaxAge: cdk.Duration.days(2 * 365),
          includeSubdomains: true,
          preload: true
        },
        contentTypeOptions: {
          override: true
        },
        referrerPolicy: {
          override: true,
          referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN
        },
        xssProtection: {
          override: true,
          protection: true,
          modeBlock: true
        },
        frameOptions: {
          override: true,
          frameOption: cloudfront.HeadersFrameOption.DENY
        }
      }
    });

    // Displays ARN of the CloudFront response headers policy on CloudFormation output
    new cdk.CfnOutput(this, 'CloudFrontResponseHeadersPolicy', {
      value: responseHeaderPolicy.node.addr,
      description: 'ARN of the CloudFront response headers policy',
    });

    /** Binding S3 bucket, OAI user and Response Headers Policy to the Cloudfront distribution */
    const cloudfrontDistribution = new cloudfront.Distribution(this, 'CloudFrontDistribution', {
      defaultRootObject: 'index.html',
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity: cloudfrontOAI
        }),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: responseHeaderPolicy
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: "/404.html"
        }
      ]
    });

    // Displays CloudFront domain name on CloudFormation output
    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: cloudfrontDistribution.domainName,
      description: 'Domain name of the CloudFront distribution',
    });

    /** Deploying the built files from the frontend to the s3 hosting the website */
    new s3deploy.BucketDeployment(this, 'WebsiteBucketDeployment', {
      sources: [s3deploy.Source.asset('../www'),],
      prune: false,
      destinationBucket: websiteBucket,
      distribution: cloudfrontDistribution,
    });
  }
}
