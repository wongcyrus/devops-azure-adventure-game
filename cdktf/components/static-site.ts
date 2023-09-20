import { Construct } from "constructs";

import { ApplicationInsights } from ".././.gen/providers/azurerm/application-insights";
import { StaticSite } from ".././.gen/providers/azurerm/static-site";
import { ResourceAction } from "../.gen/providers/azapi/resource-action";
import { Fn } from "cdktf";
import { Application } from ".././.gen/providers/azuread/application";
import { ApplicationPassword } from ".././.gen/providers/azuread/application-password";
import { ResourceGroup } from ".././.gen/providers/azurerm/resource-group";

export interface StaticSiteConstructProps {
  prefix: string;
  gameTaskFunctionUrl: string;
  graderFunctionUrl: string;
  getApikeyUrl: string;
  course: string;
  storageAccountConnectionString: string;
  resourceGroup: ResourceGroup;
}

export class StaticSiteConstruct extends Construct {
  public readonly staticSite: StaticSite;
  public readonly application: Application;
  public readonly applicationPassword: ApplicationPassword;

  constructor(scope: Construct, id: string, props: StaticSiteConstructProps) {
    super(scope, id);
    this.staticSite = new StaticSite(this, "StaticSite", {
      location: props.resourceGroup.location,
      name: props.prefix + "StaticSite",
      resourceGroupName: props.resourceGroup.name,
      skuTier: "Free",
    });

    const applicationInsights = new ApplicationInsights(this, "ApplicationInsights", {
      name: props.prefix +"ApplicationInsights",
      resourceGroupName: props.resourceGroup.name,
      location: props.resourceGroup.location,
      applicationType: "web",
    })

    new ResourceAction(this, "StaticSiteAction", {
      type: "Microsoft.Web/staticSites/config@2022-03-01",
      resourceId: this.staticSite.id + "/config/appsettings",
      method: "PUT",
      body: `${Fn.jsonencode({
        "properties": {
          "APPINSIGHTS_INSTRUMENTATIONKEY": `${applicationInsights.instrumentationKey}`,
          "APPLICATIONINSIGHTS_CONNECTION_STRING": `${applicationInsights.connectionString}`,
          "course": `${props.course}`,
          "getApikeyUrl": `${props.getApikeyUrl}`,
          "gameTaskFunctionUrl": `${props.gameTaskFunctionUrl}`,
          "graderFunctionUrl": `${props.graderFunctionUrl}`,
          "storageAccountConnectionString": `${props.storageAccountConnectionString}`,
        },
        "kind": "appsettings"
      })}`
    });


    this.application = new Application(this, "Application", {
      displayName: props.prefix +"Application",
      signInAudience: "AzureADMyOrg",
      web: {
        redirectUris: ["https://" + this.staticSite.defaultHostName + "/.auth/login/aadb2c/callback"],
        implicitGrant: {
          accessTokenIssuanceEnabled: true,
          idTokenIssuanceEnabled: true
        }
      }
    });

    this.applicationPassword = new ApplicationPassword(this, "ApplicationPwd", {
      applicationObjectId: this.application.objectId,
      displayName: "Application cred",
    });
  }
}