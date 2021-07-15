import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from '@aws-cdk/custom-resources';


export class TestBoundariesStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
    super(scope, id, props);

     // VPC and Network Security Group
     const vpc = ec2.Vpc.fromLookup(this, 'vpc', { vpcName: 'main' });
     const sg = new ec2.SecurityGroup(this, 'sg', {
       vpc: vpc,
       allowAllOutbound: true,
       securityGroupName: 'my-sg',
     });
     sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));
 
     // VPC Endpoint
     const vpcEndpoint = new ec2.InterfaceVpcEndpoint(this, 'i-vpc-endpoint', {
       vpc: vpc,
       service: {
         name: 'com.amazonaws.eu-west-1.execute-api',
         port: 443,
       },
       subnets: vpc.selectSubnets({
         onePerAz: true,
         subnetType: ec2.SubnetType.PRIVATE,
       }),
       privateDnsEnabled: true,
       securityGroups: [sg],
     });


    const interfaceIds = vpcEndpoint.vpcEndpointNetworkInterfaceIds;
    const customRes = new AwsCustomResource(this, 'customRes', {
      onUpdate: {
        service: 'EC2',
        action: 'describeNetworkInterfaces',
        outputPath: `NetworkInterfaces.PrivateIpAddress`,
        parameters: { NetworkInterfaceIds: interfaceIds },
        physicalResourceId: PhysicalResourceId.fromResponse(`NetworkInterfaces.PrivateIpAddress`),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: AwsCustomResourcePolicy.ANY_RESOURCE }),
    });
    
    const permissionsBoundaryArn = `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:policy/CDKAppScopePermissions`;

    iam.PermissionsBoundary.of(this).apply(iam.ManagedPolicy.fromManagedPolicyArn(this, 'xx', permissionsBoundaryArn));

  }
}
