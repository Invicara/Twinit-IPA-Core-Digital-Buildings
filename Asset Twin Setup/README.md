# Easy Asset Twin App Setup
 
Objective of Easy Asset Twin project is to setup the project using a single run and avoid multiple steps to setup a project.
 
# How to use
 
1.Use the config sheet according to requirement.
2.Add the local path for Model, Scripts and Report to get the model,scripts automatically from local path and generate reports.
3.Create a project using vs code.
4.Create a script called ProjectSetup, Copy the code from ProjectSetup.js and paste to ProjectSetup.
5.Run the script EasyAssetTwinSetup, one prompt will be displayed to pick the config file.
6.Select the config sheet.
7.If BulkUploadFile is yes in import list then it will prompt once more to pick the files as per File List sheet and File List is required.
8.If AssetFileRelation is yes in import list We have added relation between Assets and Files.Assets and Files sheet is required, Assets, BulkUploadFile and DocumentAttributes should be yes in import list to create relation.
9.Setup will take sometime.
10.Setup is done.


 # How to use update script

 1.Update script is used to update the project.
 2.We can update asset, space, model, document attributes and bim type
 3.The same config sheet is required to updated the project values, by only changing the Import List access.
 4.Suppose that if only asset would be update then updated asset sheet required and access should be yes for assets in import list sheet.


# For more information about the feature Please read this confluence page
 
https://invicara.atlassian.net/wiki/spaces/PDSD/pages/3508011184/Easy+Asset+Twin+Project+Setup#