# newNavigator Viewer Component for Asset Twin

The Asset Twin configuration includes configuration for displaying an ipa-core pageComponent using the IafViewer for the 3D/2D building model. To use this component you will need to add it to your ipa-core application as described here.

## To add the NavigatorView to your ipa-core client

### Add required redux state code

1. Copy ```redux/systems.js``` and ```redux/telemetry.js``` into your ```app/ipaCore/redux``` folder
2. Update your ```ipaConfig.js``` redux settings to load the systems.js and telemetry.js files
```
redux: {
   slices: [
      {name: 'viewSystems', file: 'systems.js'},
      {name: 'telemetry', file: 'telemetry.js'}
   ]
},
``` 

### Add the GenericErrorBoundary

1. Create a new folder under ```app/ipaCore``` folder named ```components```
2. Copy ```GenericErrorBoundary/GenericErrorBoundary.jsx``` into your new ```app/ipaCore/components``` folder

### Add the newNavigator

1. Copy the ```newNavigator``` folder into your ```app/ipaCore/pageComponents``` folder