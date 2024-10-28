# ipa-dt
Repository for Digital Twin app

To run the ipa-dt client
1. Get the repo local
2. In the local repo folder run "npm install"
3. Run "npm run watch" to start a debug server that will reload the client when you make changes to the code
4. Point your browser at "http://localhost:8083/digitaltwin"

By default the client will use dt-dev.invicara.com. To point your local client at any other Platform environment
1. Open app > public > config.js
2. Change each origin in the endPointConfig to point to the api root of the environment. DSPs api roots are the same as the front end url. For QA envs, Staging, or apps, there are different roots (qa1-api.invicara.com, staging.invicara.com, and api.inivicara.com for instance)
3. Save the file and restart your debug server

If developing Sisense features you must make the following changes to your Chrome browser config:
1. Go to chrome://flags/
2. Search "cookies"
3. Set SameSite by default cookies to Disabled
4. Set Cookies without SameSite must be secure to Disabled
5. Restart your browser