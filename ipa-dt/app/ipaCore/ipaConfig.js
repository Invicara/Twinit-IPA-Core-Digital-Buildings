
const ipaConfig = {
  appName: "",
  applicationId: "0f02c817-8655-423e-9d22-5439187078f9",
  configUserType: 'ipa-dt',
  scriptPlugins: [
    "ipa-dt-script-plugins.js",
    "file-perm-script-plugins.js"
  ],
  redux: {
    slices: [
      {name: 'connections', file: 'connections.js'},
      {name: 'systemBuilder', file: 'system-builder.js'},
      {name: 'viewSystems', file: 'systems.js'},
      {name: 'telemetry', file: 'telemetry.js'}
    ]
  },
  components: {
    dashboard: [
      {name: "SisenseWidgets", file: "controls/SisenseWidgets.jsx"},
      {name: "SisenseIframe", file: "controls/SisenseIframe.jsx"},
      {name: "PropertyInfoTable", file: "controls/PropertyInfoTable.jsx"},
      {name: "MatterportViewer", file: "controls/MatterportViewer.jsx"},
      {name: "StaticContentLoader", file: "controls/StaticContentLoader.jsx"},
      {name: "ImageCarousel", file: "controls/ImageCarousel.jsx"},
    ],
    entityData: [
      {name: "SisenseWidgets", file: "controls/SisenseWidgets.jsx"},
      {name: "HaystackPointReadingTable", file: "controls/HaystackPointReadingTable.jsx"},
      {name: "MatterportViewer", file: "controls/MatterportViewer.jsx"},
      {name: "TelemetryBottomVisualisation", file: "navigator/TelemetryBottomVisualisation.jsx"}
    ],
    entityAction: [
      {name: "ServiceRequestModal", file: "ServiceRequestModal.jsx"}
    ]
  }
}

export default ipaConfig