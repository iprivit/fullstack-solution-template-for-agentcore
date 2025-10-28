import * as cdk from "aws-cdk-lib"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import * as origins from "aws-cdk-lib/aws-cloudfront-origins"
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment"
import * as iam from "aws-cdk-lib/aws-iam"
import * as ssm from "aws-cdk-lib/aws-ssm"
import { Construct } from "constructs"
import { AppConfig } from "./utils/config-manager"
import * as path from "path"

export interface FrontendStackProps extends cdk.NestedStackProps {
  config: AppConfig
}

export class FrontendStack extends cdk.NestedStack {
  public distribution: cloudfront.Distribution
  public websiteBucket: s3.Bucket
  private readonly feStackName: string
  private readonly props: AppConfig

  // Configuration read from SSM
  private userPoolId: string
  private userPoolClientId: string
  private cognitoDomain: string
  private runtimeArn: string

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    const description = "GenAIID AgentCore Starter Pack - React Frontend stack"
    super(scope, id, { ...props, description })

    this.props = props.config
    this.feStackName = `${props.config.stack_name_base}-frontend`

    // Read configuration from SSM (created by backend stack)
    this.readConfigFromSSM()

    // Create S3 bucket for static website hosting
    this.createWebsiteBucket()

    // Create CloudFront distribution
    this.createCloudFrontDistribution()

    // Deploy React application with configuration
    this.deployReactApp()

    // Output important values
    this.createOutputs()
  }

  private createWebsiteBucket(): void {
    /**
     * Create S3 bucket for static website hosting.
     * Matches the Python version configuration exactly.
     */
    this.websiteBucket = new s3.Bucket(this, `${this.feStackName}-website-bucket`, {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html", // SPA routing support
    })
  }
  private createCloudFrontDistribution(): void {
    /**
     * Create CloudFront distribution for the React app.
     * Matches the Python version configuration exactly.
     */

    // Create Origin Access Control (OAC) for S3
    const originAccessControl = new cloudfront.S3OriginAccessControl(
      this,
      `${this.feStackName}-s3-oac`,
      {
        description: "OAC for GenAIID AgentCore Starter Pack React frontend",
      }
    )

    // Create S3 origin
    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(this.websiteBucket, {
      originAccessControl,
    })

    this.distribution = new cloudfront.Distribution(this, `${this.feStackName}-distribution`, {
      defaultBehavior: {
        origin: s3Origin,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
      },
      // SPA routing support - redirect 404s to index.html
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.seconds(0),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    })

    // Grant CloudFront access to S3 bucket
    this.websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: "AllowCloudFrontServicePrincipal",
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")],
        actions: ["s3:GetObject"],
        resources: [`${this.websiteBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            "AWS:SourceArn": `arn:aws:cloudfront::${cdk.Aws.ACCOUNT_ID}:distribution/${this.distribution.distributionId}`,
          },
        },
      })
    )
  }

  private deployReactApp(): void {
    /**
     * Build and deploy the React application to S3.
     * Matches the Python version configuration exactly.
     */
    const appPath = path.join(__dirname, "..", "..", "frontend")

    // Generate aws-exports.json configuration following ReVIEW pattern
    const exportsConfig = {
      Auth: {
        Cognito: {
          userPoolClientId: this.userPoolClientId,
          userPoolId: this.userPoolId,
          loginWith: {
            oauth: {
              domain: this.cognitoDomain,
              scopes: ["openid", "email", "profile"],
              redirectSignIn: [`https://${this.distribution.distributionDomainName}`],
              redirectSignOut: [`https://${this.distribution.distributionDomainName}`],
              responseType: "code",
            },
            username: true,
            email: true,
            phone: false,
          },
        },
      },
      AgentCore: {
        runtimeArn: this.runtimeArn || "",
        region: cdk.Aws.REGION,
      },
    }

    // Create aws-exports.json as a deployment source
    const exportsAsset = s3deploy.Source.jsonData("aws-exports.json", exportsConfig)

    // Create React app asset with Docker bundling
    const reactAsset = s3deploy.Source.asset(appPath, {
      bundling: {
        image: cdk.DockerImage.fromRegistry("public.ecr.aws/sam/build-nodejs18.x:latest"),
        command: [
          "sh",
          "-c",
          [
            "npm --cache /tmp/.npm install",
            "npm --cache /tmp/.npm run build",
            "cp -aur /asset-input/dist/* /asset-output/",
          ].join(" && "),
        ],
      },
    })

    // Deploy both the React app and configuration
    const deployment = new s3deploy.BucketDeployment(this, `${this.feStackName}-deployment`, {
      sources: [reactAsset, exportsAsset],
      destinationBucket: this.websiteBucket,
      distribution: this.distribution,
      prune: false, // Don't delete files not in the deployment
    })
  }

  private readConfigFromSSM(): void {
    /**
     * Read all configuration from SSM Parameter Store.
     * Matches the Python version parameter names exactly.
     */

    // Read Cognito configuration
    this.userPoolId = ssm.StringParameter.valueForStringParameter(
      this,
      `/${this.props.stack_name_base}/cognito-user-pool-id`
    )

    this.userPoolClientId = ssm.StringParameter.valueForStringParameter(
      this,
      `/${this.props.stack_name_base}/cognito-user-pool-client-id`
    )

    this.cognitoDomain = ssm.StringParameter.valueForStringParameter(
      this,
      `/${this.props.stack_name_base}/cognito-domain`
    )

    // Read runtime ARN
    this.runtimeArn = ssm.StringParameter.valueForStringParameter(
      this,
      `/${this.props.stack_name_base}/runtime-arn`
    )
  }

  private createOutputs(): void {
    /**
     * Create CloudFormation outputs.
     * Matches the Python version output names exactly.
     */
    new cdk.CfnOutput(this, `${this.feStackName}-FrontendUrl`, {
      value: `https://${this.distribution.distributionDomainName}`,
      description: "Frontend URL",
    })

    new cdk.CfnOutput(this, `${this.feStackName}-UserPoolId`, {
      value: this.userPoolId,
      description: "Cognito User Pool ID",
    })

    new cdk.CfnOutput(this, `${this.feStackName}-UserPoolClientId`, {
      value: this.userPoolClientId,
      description: "Cognito User Pool Client ID",
    })

    new cdk.CfnOutput(this, `${this.feStackName}-CognitoDomain`, {
      value: this.cognitoDomain,
      description: "Cognito Domain",
    })
  }
}
