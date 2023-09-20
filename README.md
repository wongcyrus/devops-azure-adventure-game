# Azure Adventure
A game on top of [Azure Automatic Grading Engine](https://techcommunity.microsoft.com/t5/educator-developer-blog/microsoft-azure-automatic-grading-engine-oct-2021-update/ba-p/2849141) project.

Students have to finish task to create or configure Azure resources and wins the coins.

[![Azure Adventure Demo](http://img.youtube.com/vi/nfor8kO01_4/0.jpg)](http://www.youtube.com/watch?v=nfor8kO01_4 "Azure Adventure Demo")


You need to create the service principal of reader role for 1 subscription.
```
az ad sp create-for-rbac --role="Reader" --scopes="/subscriptions/<Your Subscription ID>"
```


## Setup with Coddespaces
Install nvm and use node 16 https://github.com/nvm-sh/nvm
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
```
Close terminal, and use a new terminal 
```
nvm install 16
nvm use 16
npm i 
npm install -g @azure/static-web-apps-cli
```


## Run local test server
Reference https://learn.microsoft.com/en-us/azure/static-web-apps/local-development
```
npm run build
cd api && npm i
cd ..
swa start build --api-location api
```
You can skip build command if you are just modifed the managed function.


And, you can deploy the reactjs website to Azure Blob Storage Static Website or use Azure Static Web Apps

## Deploy with Azure Static Web Apps

The Codespace includes Terraform and this project constain a CDK-TF project for deployment.
Rename .env.template to ```.env```.
```
GITHUB_TOKEN=<GitHub Token (classic) with repo and delete_repo permission for Terraform.>
COURSE=<Your course partition key>
GAME_TASK_FUNCTION_URL=<Azure Game Task Function Url with function key.>
GRADER_FUNCTION_URL=<Azure Grader Function Url with function key.>
GET_API_KEY_FUNCTION_URL=<Azure Function Url with function key to get student's service principal.>
```
For local development, Rename ```local.settings.template``` to local.settings.json.
And update it as ```.env```
```
{
    "IsEncrypted": false,
    "Values": {
      "AzureWebJobsStorage": "",
      "FUNCTIONS_WORKER_RUNTIME": "node",
      "course":"devops",
      "getApikeyUrl":"https://xxx.azurewebsites.net/api/GetApiKeyFunction?code=",
      "graderFunctionUrl":"https://xxx.azurewebsites.net/api/AzureGraderFunction?code=",
      "gameTaskFunctionUrl":"https://xxx.azurewebsites.net/api/GameTaskFunction?code=",
      "storageAccountConnectionString": ""
    }
  }
```

Login your Azure and set the default subscription.
```
az login --use-device-code
az account set -s <subacription id>
az account show
```
Run CDK-TF
```
./deploy.sh
```


## Phaser 3 + React 17 Top-Down game demo

There is a better version of this project here: https://github.com/blopa/top-down-react-phaser-game-template

Made with an ejected Create React App.

Read moe about this project:
- https://pablo.gg/en/blog/coding/how-to-create-a-top-down-rpg-maker-like-game-with-phaser-js-and-react
- https://pablo.gg/en/blog/coding/i-made-a-top-down-game-version-of-my-blog-with-phaser-and-react/

## Special thanks
This game would not be possible without the help of some amazing people and their work, so here is my list of special thanks.
- [Pablo Benmaman](https://pablo.gg/en/blog/coding/how-to-create-a-top-down-rpg-maker-like-game-with-phaser-js-and-react/) for the project.
- [photonstorm](https://github.com/photonstorm), for creating [Phaser.io](https://github.com/photonstorm/phaser).
- [Annoraaq](https://github.com/Annoraaq), for creating the [grid-engine](https://github.com/Annoraaq/grid-engine) plugin.
- [ArMM1998](https://itch.io/profile/armm1998), for the [characters sprites and tilesets](https://opengameart.org/content/zelda-like-tilesets-and-sprites).
- [PixElthen](https://elthen.itch.io/), for the [slime sprites](https://opengameart.org/content/pixel-art-mini-slime-sprites).
- [pixelartm](https://itch.io/profile/pixelartm), for the [pirate hat sprites](https://opengameart.org/content/pirate-1).
- [jkjkke](https://opengameart.org/users/jkjkke), for the [Game Over screen background](https://opengameart.org/content/background-6).
- [KnoblePersona](https://opengameart.org/users/knoblepersona), for the [Main Menu screen background](https://opengameart.org/content/ocean-background).
- [Min](https://opengameart.org/users/min), for the [open book sprite](https://opengameart.org/content/open-book-0).
