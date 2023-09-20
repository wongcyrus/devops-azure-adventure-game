import { Construct } from "constructs";
import { App, TerraformOutput, TerraformStack } from "cdktf";
import { AzurermProvider } from "./.gen/providers/azurerm/provider";
import { ResourceGroup } from "./.gen/providers/azurerm/resource-group";

import { AzureadProvider } from "./.gen/providers/azuread/provider";
import { AzapiProvider } from "./.gen/providers/azapi/provider";
import { StaticSiteConstruct } from "./components/static-site";
import { GithubProvider } from "./.gen/providers/github/provider";
import { GitHubConstruct } from "./components/github";
import { StorageAccountConstruct } from "./components/storage-account";


import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/.env', override: true });

class AzureAdventureGameStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AzurermProvider(this, "azure", {
      features: {
        resourceGroup: {
          preventDeletionIfContainsResources: false
        }
      },
      skipProviderRegistration: false
    });
    new AzureadProvider(this, "azuread", {});
    new AzapiProvider(this, "azapi", {});

    const githubProvider = new GithubProvider(this, "GitHubProvider", {
      token: process.env.GITHUB_TOKEN,
    });

    const repository = "azure-adventure-game";
    let uniquePrefix = "devops2324";
    const region = "eastasia";


    let resourceGroup = new ResourceGroup(this, 'resourceGroup', {
      name: uniquePrefix + `-azure-adventure-game`,
      location: region,
    });

    const storageAccountConstruct = new StorageAccountConstruct(this, "storageAccount", {
      uniquePrefix: uniquePrefix,
      resourceGroup: resourceGroup,
    });
    
    const staticSiteConstruct = new StaticSiteConstruct(this, "staticSite", {
      prefix: uniquePrefix,
      resourceGroup: resourceGroup,
      course: process.env.COURSE!,
      gameTaskFunctionUrl: process.env.GAME_TASK_FUNCTION_URL!,
      graderFunctionUrl: process.env.GRADER_FUNCTION!,
      getApikeyUrl: process.env.GET_API_KEY_FUNCTION_URL!,
      storageAccountConnectionString: storageAccountConstruct.storageAccount.primaryConnectionString,
    });

    new GitHubConstruct(this, "github", {
      repository: uniquePrefix + "-" + repository,
      clientID: staticSiteConstruct.application.id,
      clientSecret: staticSiteConstruct.applicationPassword.value,
      apiToken: staticSiteConstruct.staticSite.apiKey,
      githubProvider
    });

    new TerraformOutput(this, "StaticSiteApiKey", {
      value: staticSiteConstruct.staticSite.apiKey,
      sensitive: true
    });
    new TerraformOutput(this, "StaticSiteDefaultHostName", {
      value: staticSiteConstruct.staticSite.defaultHostName,
    });

    new TerraformOutput(this, "ApplicationPasswordKeyId", {
      value: staticSiteConstruct.applicationPassword.keyId,
    });

    new TerraformOutput(this, "AADB2C_PROVIDER_CLIENT_ID", {
      value: staticSiteConstruct.application.id,
    });
    new TerraformOutput(this, "AADB2C_PROVIDER_CLIENT_SECRET", {
      value: staticSiteConstruct.applicationPassword.value,
      sensitive: true
    });
  }
}

const app = new App();
new AzureAdventureGameStack(app, "cdktf");
app.synth();
