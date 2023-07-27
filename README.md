# AWS CDK Website Deployment Stack

This AWS CDK stack deploys a static website using Amazon S3 for hosting and Amazon CloudFront for content delivery. It ensures a secure and performant setup by integrating various AWS services and policies.

## Stack Overview

The stack consists of the following components:

1. **S3 Bucket**: The stack creates an Amazon S3 bucket to host the static website. The bucket is configured to deny public read access and enforce encryption of objects.

2. **CloudFront Distribution**: A CloudFront distribution is set up to cache and deliver the website's content globally. It uses the S3 bucket as its origin.

3. **Origin Access Identity (OAI)**: The CloudFront distribution is associated with an Origin Access Identity (OAI) user. This OAI user is granted read access to the S3 bucket objects through a resource policy.

4. **Response Headers Policy**: A CloudFront response headers policy is applied to enhance security and set various security headers like Content Security Policy (CSP), Strict Transport Security (HSTS), Content-Type Options, Referrer Policy, XSS Protection, and Frame Options.

5. **Bucket Deployment**: The stack deploys the static files of the website to the S3 bucket using the `aws-cdk-lib/aws-s3-deployment` library.

## Permissions and Security

- The S3 bucket is configured to be private, denying public read access. Only the CloudFront distribution's OAI user has read access to the bucket's objects.
- The CloudFront distribution helps deliver the website content securely and efficiently with global caching.
- The CloudFront response headers policy ensures enhanced security by setting various HTTP security headers.

## Outputs

- `CloudFrontDomainName`: The domain name of the CloudFront distribution through which the website is accessible.

## Usage

To deploy this stack, you can use AWS CDK CLI and run the following command:

```sh
cdk deploy
```
After deployment, you will get the CloudFrontDomainName output, which you can use to access your website through CloudFront.

Remember to customize the sources in the BucketDeployment construct to point to the appropriate location of your website files.

## Important Notes

- The stack does not enable the static website feature of the S3 service since it relies on CloudFront for caching and distribution benefits.

## License

This project is licensed under the terms of the [MIT License](./LICENSE).
