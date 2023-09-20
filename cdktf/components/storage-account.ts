import { ResourceGroup } from ".././.gen/providers/azurerm/resource-group";
import { StorageAccount } from ".././.gen/providers/azurerm/storage-account";
import { StorageTable } from ".././.gen/providers/azurerm/storage-table";
import { Construct } from "constructs";

export interface StorageAccountConstructProps {
  uniquePrefix: string;
  resourceGroup: ResourceGroup;
}

export class StorageAccountConstruct extends Construct {
  public readonly storageAccount: StorageAccount;

  constructor(scope: Construct, id: string, props: StorageAccountConstructProps) {
    super(scope, id);
    this.storageAccount = new StorageAccount(this, "StorageAccount", {
      name: props.uniquePrefix + "aagamesa",
      resourceGroupName: props.resourceGroup.name,
      location: props.resourceGroup.location,
      accountTier: "Standard",
      accountReplicationType: "LRS",
      staticWebsite: {
        indexDocument: "index.html",
        error404Document: "404.html"
      }
    });

    new StorageTable(this, "markStorageTable", {
      name: "marks",
      storageAccountName: this.storageAccount.name,
    });

    new StorageTable(this, "userStorageTable", {
      name: "users",
      storageAccountName: this.storageAccount.name,
    });
  }
}