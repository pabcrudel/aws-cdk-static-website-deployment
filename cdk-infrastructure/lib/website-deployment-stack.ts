import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
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
    });
    /*
    Not turned on the static website feature of the S3 service 
    as it does not offer the caching and distribution benefits that the CloudFront service does.
    */

    /** A CloudFront Origin Access Identity (OAI) user is granted read access to the S3 bucket objects through the bucket resource policy to enable user access via CloudFront. */
    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(
      this, 'CloudFrontOriginAccessIdentity'
    );

    // Adding OAI user to the website bucket
    websiteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [websiteBucket.arnForObjects('*')],
      principals: [new iam.CanonicalUserPrincipal(
        cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
    }));
  }
}
