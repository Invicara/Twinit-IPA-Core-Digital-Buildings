# ipa-dt (A Twinit ipa-core React Digital Twin Client)

![digitaltwin image](../img/asset02.png)

A full digital twin React web client application, ready to install and run. You must have knowledge of working with an ipa-core application, it's required user groups, user configs, and user config format in order use ipa-dt.

## Config First
1. You must add you application id to app/ipaConfig/ipaConfig.js
2. If you are using a user config userType other than ipa-dt you must also update it in the same file

To run the ipa-dt client
1. Get the repo local
2. In the local repo folder run "npm install"
3. Run "npm run watch" to start a debug server that will reload the client when you make changes to the code
4. Point your browser at "http://localhost:8083/digitaltwin"

By default the client will use sandbox-api.invicara.com. To point your local client at any other Twinit environment
1. Open app > public > config.js
2. Change each origin in the endPointConfig to point to the api root of the environment.
3. Save the file and restart your debug server

![digitaltwin image](../img/asset01.png)

## Node Requirement

Node 14 and npm 6 is required.

## Accessing Twinit Libraries

Note: if you are experiencing access or authentication issues be sure you have closely followed [the steps on twinit.dev to configure your .npmrc file](https://twinit.dev/docs/apis/javascript/npm-install). An .npmc file is included for you at the root of the ipa-core client code, but you must make sure you have correctly created your environment variables for it to work.

## License

The ipa-dt client application code is provided under an [Apache License Version 2.0](../LICENSE) and its associated Warranty. Updates of future ipa-dt releases will be posted when determined to be ready and not at any regular schedule. Issues can be submitted through [the developer support site](https://developer-support.twinit.com/support/home). No guarantees or estimates will be provided on if or when any one issue will be addressed.