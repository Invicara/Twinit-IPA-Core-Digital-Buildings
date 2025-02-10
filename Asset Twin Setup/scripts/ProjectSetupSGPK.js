
let RunnableScripts = [
	{ name: "Easy Asset Twin Project Setup", script: "easyAssetTwinSetup" },
	{ name: "Update Easy Asset Twin Project", script: "updateEasyAssetProject" }
]

import fs from 'fs'

const LIB = {
	proj: null,
	ctx: null,
	input: null,
	IafScriptEngine: null,
	PlatformApi: null,
	projectFolderName: null,
	documentAttributeCommonName: null,
	assetAttributeCommonName: null,
	spaceAttributeCommonName: null,
	localScriptPath: null,
	scriptAvailable: null,
	xlsConfigDataParsed: null,
	updateFlag: false
  };

const CONFIGVARS = {} 
CONFIGVARS.userConfigToUserGroupMapSolAdmin = { userConfig: "iaf_dbm_soladmin_uc", userGroup: "sol_admin" }
CONFIGVARS.userConfigToUserGroupMapProjectTeam = { userConfig: "iaf_dbm_pt_uc", userGroup: "pt" }
CONFIGVARS.userConfigToUserGroupMapProjAdmin = { userConfig: "iaf_dbm_projadmin_uc", userGroup: "proj_admin" }
CONFIGVARS.userConfigToUserGroupMapProjUser = { userConfig: "iaf_dbm_projuser_uc", userGroup: "proj_user" }
CONFIGVARS.userConfigToUserGroupMapProjVisitor = { userConfig: "iaf_dbm_visitor_uc", userGroup: "proj_visitor" }
CONFIGVARS.userGroupDescriptors = []
CONFIGVARS.userConfigDescriptors = []
CONFIGVARS.userConfigToUserGroupMap = []
CONFIGVARS.configNames = []
CONFIGVARS.configContents = []
CONFIGVARS.scriptNames = new Set([])
CONFIGVARS.scriptContents = []
CONFIGVARS.scriptsDescriptors = []


CONFIGVARS.solutionAdmin = {
	_name: 'Solutions Admin',
	_shortName: 'sol_admin',
	_description: 'Solutions Admin User Group',
	permissions: {
		//accessAll is for easy creation of an admin with access to everything
		accessAll: true
	}
}
CONFIGVARS.projectTeam = {
	_name: 'Project Team',
	_shortName: 'pt',
	_description: 'Project Team User Group',
	permissions: {
		//accessAll is for easy creation of an admin with access to everything
		accessAll: true
	}
}
CONFIGVARS.projectAdmin = {
	_name: 'Project Admin',
	_shortName: 'proj_admin',
	_description: 'Project Admin User Group',
	permissions: {
		//accessAll is for easy creation of an admin with access to everything
		accessAll: true
	}
}
CONFIGVARS.projectUser = {
	_name: 'Project User',
	_shortName: 'proj_user',
	_description: 'Project User Group',
	permissions: {
		//accessAll is for easy creation of an admin with access to everything
		accessAll: true
	}
}
CONFIGVARS.projectVisitor = {
	_name: 'Project Visitor',
	_shortName: 'proj_visitor',
	_description: 'Project visitor User Group',
	permissions: {
		//accessAll is for easy creation of an admin with access to everything
		accessAll: true
	}
}

CONFIGVARS.userConfigSolutionAdmin = {
	_name: "DBM Solution Admin",
	_shortName: "iaf_dbm_soladmin_uc",
	_description: "DBM Solution Admin User Config",
	_userType: "ipa-dt"
}
CONFIGVARS.userConfigProjectTeam = {
	_name: "DBM Project Team",
	_shortName: "iaf_dbm_pt_uc",
	_description: "DBM Project Team User Config",
	_userType: "ipa-dt"
}
CONFIGVARS.userConfigProjectAdmin = {
	_name: "DBM Project Admin",
	_shortName: "iaf_dbm_projadmin_uc",
	_description: "DBM Project Admin User Config",
	_userType: "ipa-dt"
}
CONFIGVARS.userConfigProjectUser = {
	_name: "DBM Project User",
	_shortName: "iaf_dbm_projuser_uc",
	_description: "DBM Project User Config",
	_userType: "ipa-dt"
}
CONFIGVARS.userConfigProjectVisitor = {
	_name: "DBM Project Visitor",
	_shortName: "iaf_dbm_visitor_uc",
	_description: "DBM Project visitor User Config",
	_userType: "ipa-dt"
}

CONFIGVARS.entityDataConfigAssets = {
	"entityDataConfig": {
		"Asset": {
			"Asset Properties": {
				"selected": true,
				"isProperties": true,
				"component": {
					"name": "SimpleTabbedTable",
					"className": "assert-properties-tabbed-table",
					"groupClassName": "simple-table-group-name",
					"hidden": [
					],
					"groups": {
					}
				}
			},
			"Sub Components": {
				"script": "getAssetSubComponent",
				"scriptExpiration": 0,
				"component": {
					"name": "SimpleTable",
					"className": "fixed-header simple-property-grid",
					"columns": [
						{
							"name": "Name",
							"accessor": "Asset Name"
						}
					]
				}
			},
			"Parent Components": {
				"script": "getAssetParentComponent",
				"scriptExpiration": 0,
				"component": {
					"name": "SimpleTable",
					"className": "fixed-header simple-property-grid",
					"columns": [
						{
							"name": "Name",
							"accessor": "Asset Name"
						}
					]
				}
			},
			"Collections": {
				"script": "getCollectionsForAsset",
				"scriptExpiration": 0,
				"component": {
					"name": "SimpleTable",
					"className": "fixed-header simple-property-grid",
					"columns": [
						{
							"name": "Type",
							"accessor": "properties.Type.val"
						},
						{
							"name": "Name",
							"accessor": "Collection Name"
						}
					]
				}
			},
			"Files": {
				"script": "getDocumentsForAsset",
				"scriptExpiration": 0,
				"showCount": true,
				"component": {
					"name": "SimpleTable",
					"className": "fixed-header simple-property-grid",
					"columns": [
						{
							"name": "Name",
							"accessor": "name",
							"download": true
						},
						{
							"name": "File Discipline",
							"accessor": "fileAttributes.File Discipline"
						},
						{
							"name": "File Type",
							"accessor": "fileAttributes.File Type"
						},
						{
							"name": "Levels And Locations",
							"accessor": "fileAttributes.Levels And Locations"
						}
					]
				}
			},
			"Space": {
				"script": "getSpacesForAsset",
				"scriptExpiration": 0,
				"component": {
				  "name": "SimpleTable",
				  "className": "fixed-header simple-property-grid",
				  "columns": [
					{
					  "name": "Name",
					  "accessor": "Space Name"
					},
					{
					  "name": "Number",
					  "accessor": "properties.Number.val"
					},
					{
					  "name": "Area",
					  "accessor": "properties.Area.val"
					}
				  ]
				}
			  },
		}
	}
}
CONFIGVARS.entityDataConfigModelElements = {
	"entityDataConfig": {
		"Model Element": {
			"Element Properties": {
				"selected": true,
				"isProperties": true,
				"component": {
					"name": "SimpleTableGroup",
					"className": "simple-property-grid",
					"groupClassName": "simple-table-group-name",
					"groups": {
						"Base Properties": [
							"Revit Family",
							"Revit Type",
							"SystemelementId"
						]
					}
				}
			}
		}
	}
}
CONFIGVARS.entityDataConfigSpaces = {
	"entityDataConfig": {
		"Space": {
			"Space Properties": {
				"selected": true,
				"isProperties": true,
				"component": {
					"name": "SimpleTableGroup",
					"className": "simple-property-grid",
					"groupClassName": "simple-table-group-name",
					"hidden": [
					],
					"groups": {
					}
				}
			},
			"Files": {
				"script": "getDocumentsForSpace",
				"scriptExpiration": 0,
				"showCount": true,
				"component": {
					"name": "SimpleTable",
					"className": "fixed-header simple-property-grid",
					"columns": [
						{
							"name": "Name",
							"accessor": "name",
							"download": true
						},
						{
							"name": "File Type",
							"accessor": "fileAttributes.File Type"
						},
						{
							"name": "Levels And Locations",
							"accessor": "fileAttributes.Levels And Locations"
						}
					]
				}
			},
			"Assets": {
				"script": "getAssetsForSpace",
				"scriptExpiration": 0,
				"showCount": true,
				"component": {
				  "name": "SimpleTable",
				  "className": "fixed-header simple-property-grid",
				  "columns": [
					{
					  "name": "Name",
					  "accessor": "Asset Name"
					},
					{
					  "name": "Category",
					  "accessor": "properties.Category.val"
					},
					{
					  "name": "Type",
					  "accessor": "properties.Type.val"
					}
				  ]
				}
			},
		}
	}
}


CONFIGVARS.entitySelectConfigAssets = {
	entitySelectConfig: {
		"Asset": [
			{
				"id": "assetsearch",
				"query": "<<TEXT_SEARCH>>",
				"display": "Quick Search"
			},
			{
				"id": "treesearch",
				"query": "<<TREE_SEARCH>>",
				"display": "Tree Search",
				"treeLevels": [
					{
						"property": "Category",
						"script": "getCategoriesWithCountSgpk"
					},
					{
						"property": "Type",
						"script": "getTypesWithChildrenCountSgpk"
					}
				]
			}
		]
	}
}
CONFIGVARS.entitySelectConfigSpaces = {
	entitySelectConfig: {
		"Space": [
			{
				"id": "spacesearch",
				"query": "<<TEXT_SEARCH>>",
				"display": "Search"
			},
			{
				"id": "spaceTree",
				"query": "<<TREE_SEARCH>>",
				"display": "Tree Search",
				"treeLevels": [
					{
						"property": "Name",
						"script": "getNamesWithCount"
					}
				]
			}
		]
	}
}
CONFIGVARS.entitySelectConfigCollection = {
	entitySelectConfig: {
		"Collection": [
			{
				"id": "assetsearch",
				"query": "<<TEXT_SEARCH>>",
				"display": "Quick Search"
			},
			{
				"id": "colltype",
				"query": "<<SCRIPTED_SELECTS>>",
				"display": "Collection Type",
				"script": "getCollectionTypes",
				"multi": true
			}
		]
	}
}

CONFIGVARS.entitySelectConfigModelElement = {
	entitySelectConfig: {
		"Model Element": [
			{
				"id": "revfile",
				"query": "<<SCRIPTED_SELECTS>>",
				"display": "Source Files",
				"script": "getRevitSourceFiles",
				"altScript": "getModelElementsBySourceFile",
				"multi": true,
				"op": "$or"
			},
			{
				"id": "revfam",
				"query": "<<SCRIPTED_LINKED_SELECTS>>",
				"display": "Revit Family",
				"altScript": "getModelElementsByTypeProps",
				"selects": [
					{
						"display": "Revit Family",
						"script": "getModelRevitFamilies",
						"propName": "properties.Revit Family.val"
					},
					{
						"display": "Revit Type",
						"script": "getModelRevitTypeForFamily",
						"multi": true,
						"propName": "properties.Revit Type.val"
					}
				]
			},
			{
				"id": "revcats",
				"query": "<<SCRIPTED_LINKED_SELECTS>>",
				"display": "Category",
				"altScript": "getModelElementsByCatAndType",
				"selects": [
					{
						"display": "Category",
						"script": "getModelRevitCategories",
						"propName": "Category"
					},
					{
						"display": "Type",
						"script": "getModelRevitTypesForDtCategory",
						"multi": true,
						"propName": "Type"
					}
				]
			}
		],
	}
}
CONFIGVARS.entitySelectConfigFile = {
	entitySelectConfig: {
		"File": [
			{
				"id": "filesearch",
				"query": "<<TEXT_SEARCH>>",
				"display": "Quick Search"
			},
			{
				"id": "fileatts",
				"query": "<<SCRIPTED_SELECTS>>",
				"display": "File Attributes",
				"script": "getFileAttributeSelects",
				"multi": true,
				"op": "$and",
				"selects": [
					{
						"display": "Originator",
						"propName": "fileAttributes.Originator"
					}
				]
			}
		]
	}
}
CONFIGVARS.entitySelectConfigDrawing = {
	entitySelectConfig: {
		"Drawing": [
			{
				"id": "filesearch",
				"query": "<<TEXT_SEARCH>>",
				"display": "Quick Search"
			},
			{
				"id": "treesearch",
				"query": "<<TREE_SEARCH>>",
				"display": "Tree Search",
				"altScript": "altGetFilesByDwgDiscipline",
				"treeLevels": [
					{
						"property": "Drawing Discipline",
						"script": "getDwgDisciplinesTrackedWithCount"
					},
					{
						"property": "Drawing Sub Type",
						"script": "getDwgSubTypesForDwgDisciplineTrackedWithCount"
					}
				]
			}
		]
	}
}

CONFIGVARS.handlersAsset = {
	handlers: {
		"assets": {
			"title": "Assets",
			"icon": "inv-icon-svg inv-icon-assets",
			"shortName": "assets",
			"description": "Asset Register",
			"pageComponent": "entities/EntityView",
			"path": "/assets",
			"scriptTypes": [
				"iaf_entass_allusers",
				"iaf_relations_scripts",
				"iaf_files_allusers",
				"iaf_entspa_allusers",
				"iaf_bms_allusers",
				"iaf_collect_allusers",
				"iaf_sgpk_allusers"
			],
			"onHandlerLoad": ["loadFileAttributes"],
			"config": {
				"type": {
					"singular": "Asset",
					"plural": "Assets"
				},
				"entityData": {
					"Asset": {
						"script": "getAssets"
					}
				},
				"entitySelectionPanel": {
					"nonFilterableProperties": [
						"baUniclass2015",
						"baUniclass2015Name"
					],
					"nonGroupableProperties": [
						"baUniclass2015",
						"baUniclass2015Name"
					],
					"defaultGroups": [
						"Category",
						"Type"
					]
				},
				"tableView": {
					"component": {
						"name": "EntityListView",
						"className": "entity-list-view-default",
						"multiselect": true,
						"columns": [
							{
								"name": "Name",
								"accessor": "Entity Name"
							}
						]
					}
				},
				"actions": {
					"Navigator": {
						"allow": true,
						"icon": "inv-icon-svg inv-icon-nav",
						"type": "navigate",
						"showOnTable": true,
						"navigateTo": "navigator"
					},
					"Edit": {
						"allow": true,
						"icon": "fas fa-edit",
						"type": "edit",
						"script": "editAsset",
						"showOnTable": true,
						"component": {
							"name": "EntityModal",
							"hidden": ["itemGuid"],
							"hierarchySelects": {
								"id": "edithierarchyselects",
								"query": "<<SCRIPTED_LINKED_SELECTS>>",
								"display": "Category",
								"selects": [
									{
										"display": "Category",
										"script": "getCategories"
									},
									{
										"display": "Type",
										"script": "getTypes",
										"multi": false
									}
								]
							},
							"showGroupNames": true,
							"groups": {
								"Authoring Tool": [],
								"Classification": [],
								"Location": [
								],
								"System": [],
								"Operations": [],
								"Asset Photo": []
							},
							"okButtonText": "Save"
						}
					},
					"Upload": {
						"allow": true,
						"icon": "icofont-upload-alt",
						"type": "navigate",
						"showOnTable": true,
						"navigateTo": "fileUpload"
					},
					"Collections": {
						"allow": true,
						"icon": "icofont-cubes",
						"type": "collect",
						"showOnTable": true,
						"script": "addAssetsToCollections",
						"component": {
							"name": "EntityCollectionModal",
							"okButtonText": "Apply",
							"scripts": {
								"getCollectionTypes": "getCollectionTypes",
								"getCollectionNames": "getCollectionNames"
							}
						}
					},
					"Delete": {
						"allow": true,
						"icon": "fas fa-trash-alt",
						"type": "delete",
						"script": "deleteAsset",
						"showOnTable": false,
						"component": {
							"name": "EntityModal",
							"disableAll": true,
							"okButtonText": "Delete"
						}
					}
				}
			}
		}
	}
}
CONFIGVARS.handlersSpace = {
	handlers: {
		"spaces": {
			"title": "Spaces",
			"icon": "inv-icon-svg inv-icon-spaces",
			"shortName": "spaces-ent",
			"description": "Space Entities",
			"pageComponent": "entities/EntityView",
			"path": "/spaces",
			"scriptTypes": [
				"iaf_entass_allusers",
				"iaf_relations_scripts",
				"iaf_files_allusers",
				"iaf_entspa_allusers",
				"iaf_bms_allusers",
				"iaf_collect_allusers",
				"iaf_sgpk_allusers"
			],
			"config": {
				"type": {
					"singular": "Space",
					"plural": "Spaces"
				},
				"entityData": {
					"Space": {
						"script": "getSpaces"
					}
				},
				"entitySelectionPanel": {
					"defaultGroups": [
						"Space Name"
					]
				},
				"actions": {
					"Navigator": {
						"allow": true,
						"icon": "inv-icon-svg inv-icon-nav",
						"type": "navigate",
						"showOnTable": true,
						"navigateTo": "navigator"
					},
					"Upload": {
						"allow": true,
						"icon": "icofont-upload-alt",
						"type": "navigate",
						"showOnTable": false,
						"navigateTo": "fileUpload"
					},
					"Edit": {
						"allow": true,
						"icon": "fas fa-edit",
						"type": "edit",
						"script": "editSpace",
						"showOnTable": false,
						"component": {
							"name": "EntityModal",
							"hidden": ["itemGuid"],
							"disabled": [
								"Level",
								"Area"
							],
							"showGroupNames": true,
							"groups": {
								"Space Properties": [
								]
							},
							"okButtonText": "Save"
						}
					}
				},
				"tableView": {
					"component": {
						"name": "EntityListView",
						"className": "entity-list-view-default",
						"multiselect": false,
						"columns": [
							{
								"name": "Name",
								"accessor": "Entity Name"
							}
						]
					}
				}
			}
		}
	}
}
CONFIGVARS.handlersNavigator = {
	handlers: {
		"navigator": {
			"title": "Navigator",
			"icon": "inv-icon-svg inv-icon-nav",
			"shortName": "navi",
			"description": "Model Navigator",
			pageComponent: "newNavigator/NavigatorView",
			"path": "/navigator",
			"scriptTypes": [
				"iaf_entass_allusers",
				"iaf_relations_scripts",
				"iaf_files_allusers",
				"iaf_entspa_allusers",
				"iaf_bms_allusers",
				"iaf_collect_allusers",
				"iaf_sgpk_allusers"
			],
			"config": {
				"type": [
					{
						"singular": "Asset",
						"plural": "Assets"
					},
					{
						"singular": "Space",
						"plural": "Spaces"
					}
				],
				"entityData": {
					"Asset": {
						"script": "getAssetsSgpk",
						"getEntityFromModel": "getAssetFromModelSgpk",
						"spaceMode": false
					},
					"Space": {
						"script": "getSpacesSgpk",
						"getEntityFromModel": "getSpaceFromModelSgpk",
						"spaceMode": true
					}
				},
				"actions": {
					Asset: {
						"Upload": {
							"allow": true,
							"icon": "icofont-upload-alt",
							"type": "navigate",
							"showOnTable": true,
							"navigateTo": "fileUpload"
						},
						"Spaces": {
							"allow": true,
							"icon": "inv-icon-svg inv-icon-spaces",
							"type": "navigate",
							"showOnTable": true,
							"script": "assetsToSpaces",
							"scriptResultType": "Space",
							"navigateTo": "spaces"
						},
						"Delete": {
							"allow": true,
							"icon": "fas fa-trash-alt",
							"type": "delete",
							"script": "deleteAsset",
							"showOnTable": false,
							"component": {
								"name": "EntityModal",
								"disableAll": true,
								"okButtonText": "Delete"
							}
						},
						"Edit": {
							"allow": true,
							"icon": "fas fa-edit",
							"type": "edit",
							"script": "editAsset",
							"showOnTable": false,
							"component": {
								"name": "EntityModal",
								"disabled": [
									"Entity Name"
								],
								"groupClassName": "simple-table-group-name",
								"hidden": [],
								"groups": {},
								"okButtonText": "Save"
							}
						}
					},
					Space: {
						"Upload": {
							"allow": true,
							"icon": "icofont-upload-alt",
							"type": "navigate",
							"showOnTable": false,
							"navigateTo": "fileUpload"
						},
						"Navigator": {
							"allow": true,
							"icon": "inv-icon-svg inv-icon-nav",
							"type": "navigate",
							"showOnTable": true,
							"navigateTo": "navigator"
						},
						"Assets": {
							"allow": true,
							"icon": "inv-icon-svg inv-icon-assets",
							"type": "navigate",
							"showOnTable": true,
							"script": "spacesToAssets",
							"scriptResultType": "Asset",
							"navigateTo": "assets"
						},
						"Edit": {
							"allow": true,
							"icon": "fas fa-edit",
							"type": "edit",
							"script": "editSpace",
							"showOnTable": false,
							"component": {
								"name": "EntityModal",
								"disabled": [
									"Room Number"
								],
								"hidden": [],
								"showGroupNames": true,
								"groups": {},
								"okButtonText": "Save"
							}
						}
					}
				},
				"tableView": {
					Asset: {
						"component": {
							"name": "EntityListView",
							"className": "entity-list-view-default",
							"multiselect": true,
							"columns": [
								{
									"name": "Name",
									"accessor": "Entity Name"
								}
							]
						}
					},
					Space: {
						"component": {
							"name": "EntityListView",
							"className": "entity-list-view-default",
							"multiselect": false,
							"columns": [
								{
									"name": "Name",
									"accessor": "Entity Name"
								}
							]
						}
					}
				}
			}
		}
	}
}
CONFIGVARS.handlersNavigatorSpace = {
	handlers: {
		"navigator": {
			"title": "Navigator",
			"icon": "inv-icon-svg inv-icon-nav",
			"shortName": "navi",
			"description": "Model Navigator",
			pageComponent: "newNavigator/NavigatorView",
			"path": "/navigator",
			"scriptTypes": [
				"iaf_entass_allusers",
				"iaf_relations_scripts",
				"iaf_files_allusers",
				"iaf_entspa_allusers",
				"iaf_bms_allusers",
				"iaf_collect_allusers",
				"iaf_sgpk_allusers"
			],
			"config": {
				"type": [
					{
						"singular": "Space",
						"plural": "Spaces"
					}
				],
				"entityData": {
					"Space": {
						"script": "getSpacesSgpk",
						"getEntityFromModel": "getSpaceFromModelSgpk",
						"spaceMode": true
					}
				},
				"actions": {
					Space: {
						"Upload": {
							"allow": true,
							"icon": "icofont-upload-alt",
							"type": "navigate",
							"showOnTable": false,
							"navigateTo": "fileUpload"
						},
						"Edit": {
							"allow": true,
							"icon": "fas fa-edit",
							"type": "edit",
							"script": "editSpace",
							"showOnTable": false,
							"component": {
								"name": "EntityModal",
								"disabled": [
									"Room Number"
								],
								"hidden": [],
								"showGroupNames": true,
								"groups": {},
								"okButtonText": "Save"
							}
						}
					}
				},
				"tableView": {
					Space: {
						"component": {
							"name": "EntityListView",
							"className": "entity-list-view-default",
							"multiselect": false,
							"columns": [
								{
									"name": "Name",
									"accessor": "Entity Name"
								}
							]
						}
					}
				}
			}
		}
	}
}
CONFIGVARS.handlersNavigatorAsset = {
	handlers: {
		"navigator": {
			"title": "Navigator",
			"icon": "inv-icon-svg inv-icon-nav",
			"shortName": "navi",
			"description": "Model Navigator",
			pageComponent: "newNavigator/NavigatorView",
			"path": "/navigator",
			"scriptTypes": [
				"iaf_entass_allusers",
				"iaf_relations_scripts",
				"iaf_files_allusers",
				"iaf_entspa_allusers",
				"iaf_bms_allusers",
				"iaf_collect_allusers",
				"iaf_sgpk_allusers"
			],
			"config": {
				"type": [
					{
						"singular": "Asset",
						"plural": "Assets"
					}
				],
				"entityData": {
					"Asset": {
						"script": "getAssetsSgpk",
						"getEntityFromModel": "getAssetFromModelSgpk",
						"spaceMode": false
					}
				},
				"actions": {
					Asset: {
						"Upload": {
							"allow": true,
							"icon": "icofont-upload-alt",
							"type": "navigate",
							"showOnTable": true,
							"navigateTo": "fileUpload"
						},
						"Delete": {
							"allow": true,
							"icon": "fas fa-trash-alt",
							"type": "delete",
							"script": "deleteAsset",
							"showOnTable": false,
							"component": {
								"name": "EntityModal",
								"disableAll": true,
								"okButtonText": "Delete"
							}
						},
						"Edit": {
							"allow": true,
							"icon": "fas fa-edit",
							"type": "edit",
							"script": "editAsset",
							"showOnTable": false,
							"component": {
								"name": "EntityModal",
								"disabled": [
									"Entity Name"
								],
								"groupClassName": "simple-table-group-name",
								"hidden": [],
								"groups": {},
								"okButtonText": "Save"
							}
						}
					},
				},
				"tableView": {
					Asset: {
						"component": {
							"name": "EntityListView",
							"className": "entity-list-view-default",
							"multiselect": true,
							"columns": [
								{
									"name": "Name",
									"accessor": "Entity Name"
								}
							]
						}
					}
				}
			}
		}
	}
}

CONFIGVARS.handlersNavigatorPlain = {
	handlers : {
	"navigator": {
      "title": "Model Navigator",
      "icon": "inv-icon-svg inv-icon-nav",
      "shortName": "navi",
      "description": "Model Navigator",
      "pageComponent": "newNavigator/NavigatorView",
      "path": "/modelNavigator",
      "scriptTypes": [
        "iaf_entass_allusers",
        "iaf_entspa_allusers"
      ],
      "config": {
        "type": [
          {
            "singular": "Plain",
            "plural": "Plain"
          }
        ],
        "entityData": {
          "Plain": {}
        },
        "actions": {
          "Plain": {}
        },
        "tableView": {
          "Plain": {}
        }
      }
    },
	}
}

CONFIGVARS.handlersModelElements = {
	handlers: {
		"modelelems": {
			"title": "Model Elements",
			"icon": "fas fa-building fa-2x",
			"shortName": "model",
			"description": "Model Element View",
			"pageComponent": "entities/EntityView",
			"path": "/modelelems",
			"scriptTypes": [
				"iaf_dt_model_elems"
			],
			"config": {
				"type": {
					"singular": "Model Element",
					"plural": "Model Elements"
				},
				"entityData": {
					"Model Element": {
						"script": "getModelElements"
					}
				},
				"tableView": {
					"component": {
						"name": "EntityListView",
						"className": "entity-list-view-default",
						"multiselect": true,
						"columns": [
							{
								"name": "Revit Family",
								"accessor": "properties.Revit Family.val"
							},
							{
								"name": "Revit Type",
								"accessor": "properties.Revit Type.val"
							},
							{
								"name": "Mark",
								"accessor": "properties.Mark.val"
							},
							{
								"name": "Type Mark",
								"accessor": "properties.Type Mark.val"
							},
							{
								"name": "Revit Element ID",
								"accessor": "properties.SystemelementId.val"
							}
						]
					}
				},
				"actions": {
					"Navigator": {
						"allow": true,
						"icon": "fas fa-compass fa-2x",
						"type": "navigate",
						"showOnTable": true,
						"navigateTo": "navigator"
					}
				}
			}
		},
	}
}

CONFIGVARS.handlersFile = {
	handlers: {
		"files": {
			"title": "Files",
			"icon": "inv-icon-svg inv-icon-docs",
			"shortName": "files-ent",
			"description": "Files",
			"pageComponent": "entities/EntityView",
			"path": "/files",
			"scriptTypes": [
				"iaf_collect_allusers",
				"iaf_files_allusers",
				"iaf_entspa_allusers",
				"iaf_entass_allusers",
				"iaf_sgpk_allusers"
			],
			"onHandlerLoad": [
				"loadFileAttributes"
			],
			"config": {
				"type": {
					"singular": "File",
					"plural": "Files"
				},
				"entityData": {
					"File": {
						"script": "getFiles"
					}
				},
				"entitySelectionPanel": {
					"defaultGroups": [
						"Originator"
					]
				},
				"data": {
					"Properties": {
						"selected": true,
						"isProperties": true,
						"component": {
							"name": "SimpleTable",
							"className": "simple-property-grid",
							"columns": []
						}
					},
					"Collections": {
						"script": "getCollectionsForDocument",
						"scriptExpiration": 0,
						"component": {
							"name": "SimpleTable",
							"className": "simple-property-grid simple-property-grid-clearheader"
						}
					},
					"Assets": {
						"script": "getAssetsForFileSgpk",
						"scriptExpiration": 0,
						"component": {
							"name": "SimpleTable",
							"className": "simple-property-grid simple-property-grid-clearheader"
						}
					},
					"Spaces": {
						"script": "getSpacesForFile",
						"scriptExpiration": 0,
						"component": {
							"name": "SimpleTable",
							"className": "simple-property-grid simple-property-grid-clearheader"
						}
					}
				},
				"actions": {
					"Edit": {
						"allow": true,
						"icon": "fas fa-edit",
						"type": "edit",
						"script": "editFile",
						"showOnTable": false,
						"component": {
							"name": "EntityModal",
							"disabled": ["Entity Name"],
							"propertyUiTypes": {},
							"requiredProperties": [
								"Buildings",
								"File Discipline",
								"Levels and Locations",
								"Stage Description"
							],
							"okButtonText": "Save"
						}
					},
					"Download": {
						"allow": true,
						"icon": "fas fa-file-download",
						"type": "fileDownload",
						"showOnTable": true
					},
					"Delete": {
						"allow": true,
						"icon": "fas fa-trash-alt",
						"type": "delete",
						"script": "deleteDocument",
						"showOnTable": false,
						"component": {
							"name": "EntityModal",
							"disableAll": true,
							"okButtonText": "Delete"
						}
					},
					"ExportAllFileList": {
						"allow": true,
						"icon": "fas fa-file-import",
						"script": "exportAllFileList",
						"showOnTable": true
					}
				},
				"tableView": {
					"component": {
						"name": "EntityListView",
						"className": "entity-list-view-default",
						"multiselect": true,
						"columns": [{
							"name": "Name",
							"accessor": "Entity Name"
						}]
					}
				}
			}
		}
	}
}
CONFIGVARS.handlerDrawingRegister = {
	handlers: {
		"drawingRegister": {
			"title": "Drawing Register",
			"icon": "fas fa-solid fa-drafting-compass fa-2x",
			"shortName": "drawing-reg",
			"description": "Files",
			"pageComponent": "entities/EntityView",
			"path": "/drawings",
			"scriptTypes": [
				"iaf_files_allusers"
			],
			"onHandlerLoad": [
				"loadFileAttributes"
			],
			"config": {
				"type": {
					"singular": "Drawing",
					"plural": "Drawings"
				},
				"entityData": {
					"Drawing": {
						"script": "getDrawings"
					}
				},
				"entitySelectionPanel": {
					"nonFilterableProperties": [],
					"nonGroupableProperties": [],
					"defaultGroups": [
						"Drawing Sub Type",
						"Document code",
						"Revision"
					]
				},
				"data": {
					"Properties": {
						"selected": true,
						"isProperties": true,
						"component": {
							"name": "SimpleTable",
							"className": "simple-property-grid",
							"columns": [
								{
									"name": "Document code",
									"accessor": "Document code.val"
								},
								{
									"name": "Drawing Type",
									"accessor": "Drawing Type.val"
								},
								{
									"name": "Discipline",
									"accessor": "Discipline.val"
								},
								{
									"name": "Component",
									"accessor": "Component.val"
								},
								{
									"name": "Contractor",
									"accessor": "Contractor.val"
								},
								{
									"name": "Drawing Stage",
									"accessor": "Drawing Stage.val"
								},
								{
									"name": "Location",
									"accessor": "Location.val"
								},
								{
									"name": "Package",
									"accessor": "Package.val"
								},
								{
									"name": "Handover Type",
									"accessor": "Handover Type.val"
								},
								{
									"name": "System",
									"accessor": "System.val"
								},
								{
									"name": "System Name",
									"accessor": "System Name.val"
								},
								{
									"name": "Handover Pack Number",
									"accessor": "Handover Pack Number.val"
								},
								{
									"name": "Stage",
									"accessor": "Stage.val"
								},
								{
									"name": "Document Type",
									"accessor": "Document Type.val"
								},
								{
									"name": "Description",
									"accessor": "Description.val"
								},
								{
									"name": "File Type",
									"accessor": "File Type.val"
								},
								{
									"name": "Sub Location",
									"accessor": "Sub Location.val"
								},
								{
									"name": "Spec",
									"accessor": "Spec.val"
								},
								{
									"name": "Size",
									"accessor": "Size.val"
								},
								{
									"name": "Fluid Type",
									"accessor": "Fluid Type.val"
								},
								{
									"name": "Transmittal No",
									"accessor": "Transmittal No.val"
								},
								{
									"name": "Drawing Discipline",
									"accessor": "Drawing Discipline.val"
								},
								{
									"name": "Drawing Sub Type",
									"accessor": "Drawing Sub Type.val"
								},
								{
									"name": "Revision",
									"accessor": "Revision.val"
								},
								{
									"name": "Tracked Drawing",
									"accessor": "Tracked Drawing.val"
								}
							]
						}
					},
					"Assets": {
						"script": "getAssetsForFile",
						"component": {
							"name": "SimpleTable",
							"className": "simple-property-grid simple-property-grid-clearheader"
						}
					},
					"Spaces": {
						"script": "getSpacesForFile",
						"component": {
							"name": "SimpleTable",
							"className": "simple-property-grid simple-property-grid-clearheader"
						}
					}
				},
				"actions": {
					"Edit": {
						"allow": true,
						"icon": "fas fa-edit",
						"type": "edit",
						"script": "editFile",
						"showOnTable": false,
						"component": {
							"name": "EntityModal",
							"disabled": [
								"Entity Name"
							],
							"propertyUiTypes": {},
							"requiredProperties": [
								"File Type",
								"Document Type"
							],
							"okButtonText": "Save"
						}
					},
					"Download": {
						"allow": true,
						"icon": "fas fa-file-download",
						"type": "fileDownload",
						"showOnTable": true
					},
					"ExportAllFileList": {
						"allow": true,
						"icon": "fas fa-file-export",
						"script": "exportAllFileList",
						"showOnTable": true
					},
					"Delete": {
						"allow": true,
						"icon": "fas fa-trash-alt",
						"type": "delete",
						"script": "deleteDocument",
						"showOnTable": false,
						"component": {
							"name": "EntityModal",
							"disableAll": true,
							"okButtonText": "Delete"
						}
					}
				},
				"tableView": {
					"component": {
						"name": "EntityListView",
						"className": "entity-list-view-default",
						"multiselect": true,
						"columns": [
							{
								"name": "Name",
								"accessor": "Entity Name"
							},
							{
								"name": "Document Type",
								"accessor": "properties.Document Type.val"
							},
							{
								"name": "Document Code",
								"accessor": "properties.Document code.val"
							},
							{
								"name": "System Name",
								"accessor": "properties.System Name.val"
							},
							{
								"name": "System",
								"accessor": "properties.System.val"
							},
							{
								"name": "Description",
								"accessor": "properties.Description.val"
							}
						]
					}
				}
			}
		}
	}
}

CONFIGVARS.handlerFileUpload = {
	handlers: {
		"fileUpload": {
			"title": "Add Files",
			"icon": "icofont-upload-alt",
			"actionTitle": "Add Files",
			"pageComponent": "files/UploadFilesWizard",
			"path": "/fileupload",
			"scriptTypes": [
				"iaf_collect_allusers",
				"iaf_files_allusers",
				"iaf_entspa_allusers",
				"iaf_entass_allusers",
			],
			"onHandlerLoad": [
				"loadFileAttributes"
			],
			"config": {
				"scripts": {
					"preprocessFiles": "preprocessUploadFiles",
					"postprocessFiles": "postprocessUploadFiles",
					"downloadReport": "downloadFileUploadReport"
				},
				"displayNameMap": "iaf_attributeDisplayNames",
				"columns": []

			}
		}
	}
}
CONFIGVARS.handlerCollection = {
	handlers: {
		"collections": {
			"title": "Collections",
			"icon": "icofont-cubes",
			"shortName": "colls-ent",
			"description": "Collection Entities",
			"pageComponent": "entities/EntityView",
			"path": "/collections",
			"config": {
				"type": {
					"singular": "Collection",
					"plural": "Collections"
				},
				"entityData": {
					"Collection": {
						"script": "getCollections"
					}
				},
				"entitySelectionPanel": {
					"defaultGroups": [
						"Type"
					]
				},
				"tableView": {
					"component": {
						"name": "EntityListView",
						"className": "entity-list-view-default",
						"multiselect": true,
						"columns": [
							{
								"name": "Type",
								"accessor": "properties.Type"
							},
							{
								"name": "Name",
								"accessor": "Entity Name"
							}
						]
					}
				},
				"data": {
					"Properties": {
						"selected": true,
						"isProperties": true,
						"component": {
							"name": "SimpleTable",
							"className": "simple-property-grid",
							"columns": [
								{
									"name": "Collection Type",
									"accessor": "Type.val"
								}
							]
						}
					},
					"Assets": {
						"script": "getAssetsForCollectionExtendedData",
						"scriptExpiration": 0,
						"component": {
							"name": "SimpleTable",
							"className": "fixed-header simple-property-grid",
							"columns": [
								{
									"name": "Name",
									"accessor": "Asset Name"
								},
								{
									"name": "Category",
									"accessor": "properties.Category.val"
								},
								{
									"name": "Type",
									"accessor": "properties.Type.val"
								}
							]
						}
					}
				},
				"actions": {
					"Edit": {
						"allow": true,
						"icon": "fas fa-edit",
						"type": "edit",
						"script": "editCollection",
						"showOnTable": false,
						"component": {
							"name": "EntityModal",
							"propertyUiTypes": {
								"Type": {
									"query": "<<CREATABLE_SCRIPTED_SELECTS>>",
									"script": "getCollectionTypes",
									"multi": false
								}
							},
							"requiredProperties": [
								"Type"
							],
							"okButtonText": "Save"
						}
					},
					"Edit Contents": {
						"allow": true,
						"icon": "fas fa-link",
						"type": "relate",
						"script": "removeCollectionRelation",
						"showOnTable": false,
						"component": {
							"name": "EntityRelationsModal",
							"title": "Edit Contents",
							"types": [
								"Assets",
								"Spaces"
							],
							"scripts": {
								"getRelatedEntities": "getCollectionRelatedEntities"
							}
						}
					},
					"Delete": {
						"allow": true,
						"icon": "fas fa-trash-alt",
						"type": "delete",
						"script": "deleteCollections",
						"showOnTable": true
					}
				}
			},
			"scriptTypes": [
				"iaf_collect_allusers",
				"iaf_files_allusers",
				"iaf_entspa_allusers",
				"iaf_entass_allusers",
			]
		}
	}
}

CONFIGVARS.handlersUserGroup = {
	handler: {
		"userGroup": {
			"title": "User Group",
			"actionTitle": "User Group Actions",
			"icon": "ion-gear-a icofont-2x",
			"pageComponent": "users/UserGroupView",
			"path": "/UserGroupView",
			"config": {
				"appUrl": "/digitaltwin",
				"allowUserGroupEdit": true,
				"allowUserGroupInvite": true,
				"allowManageInvites": true,
				"allowManageUsers": true,
				"allowViewPermissions": true,
				"allowManagePermissions": false
			},
			"script": {
				"itemFetchScript": "fetchNonSystemCollections"
			}
		}
	}
}

CONFIGVARS.handlersSupport = {
	handler: {
		"support": {
			"title": "Support",
			"icon": "fas fa-plug fa-2x",
			"shortName": "sup",
			"description": "Support",
			"pageComponent": "dashboards/DashboardView",
			"path": "/support",
			"config": {
				"layout": "fullpage",
				"component": "Iframe",
				"url": "https://invicara.sharepoint.com/sites/ELSTraining?market=en-US"
			},
			"scriptTypes": []
		}
	}
}

CONFIGVARS.handlerScriptRunner = {
	handler: {
		"scriptRunner": {
			"title": "Script Development",
			"actionTitle": "Validate Model",
			"icon": "icofont-code-alt",
			"pageComponent": "solutionMgmt/ScriptRunnerView",
			"path": "/scriptRunner",
			"config": {
				"allowScriptInput": true
			},
			"scriptTypes": [
				"iaf_ext_val_scr"
			]
		}
	}
}


CONFIGVARS.handlerManageModel = {
	handler: {
		"modelVer": {
			"title": "Manage Model",
			"actionTitle": "Manage Model",
			"shortName": "manmod",
			"description": "Manage Imported Model Versions",
			"icon": "ion-gear-a icofont-2x",
			"pageComponent": "models/ModelImportView",
			"path": "/manageModel",
			"config": {
				"scripts": {
					"findMissingItems": "findMissingItems",
					"download": "downloadMissingElements"
				}
			}
		}
	}
}

CONFIGVARS.groupedPagesAssetTwinNav = {
	"page": "Navigator",
	"handler": "navigator"
}
CONFIGVARS.groupedPagesAssetTwinAsset = {
	"page": "Assets",
	"handler": "assets"
}
CONFIGVARS.groupedPagesAssetTwinModelElement = {
	"page": "ModelElements",
	"handler": "modelelems"
}
CONFIGVARS.groupedPagesAssetTwinSpace = {
	"page": "spaces",
	"handler": "spaces"
}
CONFIGVARS.groupedPagesAssetTwinColl = {
	"page": "collections",
	"handler": "collections"
}
CONFIGVARS.groupedPagesAssetTwinFile = {
	"page": "Files",
	"handler": "files"
}
CONFIGVARS.groupedPagesAssetTwinFileUpload = {
	"page": "Add Files",
	"handler": "fileUpload"
}

CONFIGVARS.groupedPagesAssetTwinManageModel = {
	"page": "modelVer",
	"handler": "modelVer"
}
CONFIGVARS.groupedPagesAdminUsergrp = {
	"page": "userGroup",
	"handler": "userGroup"
}
CONFIGVARS.groupedPagesAssetTwinScriptRunner = {
	"page": "Script Development",
	"handler": "scriptRunner"
}

CONFIGVARS.groupedPagesFiles = {
	groupedPages: {
		"Files": {
			"icon": "fas fa-file-alt fa-2x",
			"position": 2,
			"pages": []
		}
	}
}
CONFIGVARS.groupedPagesAdmin = {
	groupedPages: {
		"Admin": {
			"icon": "fas fa-user-shield fa-2x",
			"position": 3,
			"pages": []
		}
	}
}
CONFIGVARS.groupedPagesDownloads = {
	"groupedPages": {
		"Downloads": {
			"icon": "inv-icon-svg inv-icon-download",
			"position": 4,
			"pages": [
				{
					"page": "Downloads",
					"handler": "downloads"
				}
			]
		}
	}
}
CONFIGVARS.updateUserConfigContent = {
	"onConfigLoad": {
		"load": [
			"iaf_dt_proj_colls",
			"iaf_dt_types",
			"iaf_collect_allusers"
		],
		"exec": [
			"loadProjectAndCollections"
		]
	},
	"entityDataConfig": {},
	"entitySelectConfig": {},
	"handlers": {
		"homepage": {
			"title": "Homepage",
			"icon": "icofont-home",
			"shortName": "homepage",
			"description": "Home",
			"pageComponent": "dashboards/DashboardView",
			"path": "/homepage",
			"config": {
				"layout": "grid",
				"className": "homepage",
				"rows": 3,
				"columns": 3,
				"panels": {
					"buttons": {
						"position": {
						  "top": 3,
						  "left": 1,
						  "bottom": 4,
						  "right": 4
						},
						"component": "CompactButtonBar",
						"actions": {
						  "Navigator": {
							"allow": true,
							"icon": "simple_navigator.png",
							"type": "navigate",
							"navigateTo": "navigator",
							"title": "Navigator",
							"text": "Explore the building model and related data"
						  },
						  "Assets": {
							"allow": true,
							"icon": "simple_assets.png",
							"type": "navigate",
							"navigateTo": "assets",
							"title": "Assets",
							"text": "Detailed asset data for operations and capital planning"
						  },
						  "Spaces": {
							"allow": true,
							"icon": "simple_spaces.png",
							"type": "navigate",
							"navigateTo": "spaces",
							"title": "Spaces",
							"text": "Spatial configuration and related data"
						  },
						  "Files": {
							"allow": true,
							"icon": "simple_files.png",
							"type": "navigate",
							"navigateTo": "files",
							"title": "Files",
							"text": "All property files for operations, property management, etc."
						  }
						}
					  }
				}
			},
			"scriptTypes": [
				"iaf_dashboard"
			]
		},
		"userGroup": {
			"title": "User Group",
			"actionTitle": "User Group Actions",
			"icon": "ion-gear-a icofont-2x",
			"pageComponent": "users/UserGroupView",
			"path": "/UserGroupView",
			"config": {
				"appUrl": "/digitaltwin",
				"allowUserGroupEdit": true,
				"allowUserGroupInvite": true,
				"allowManageInvites": true,
				"allowManageUsers": true,
				"allowViewPermissions": true,
				"allowManagePermissions": false
			},
			"script": {
				"itemFetchScript": "fetchNonSystemCollections"
			}
		},
		"downloads": {
			"title": "Downloads",
			"icon": "inv-icon-svg inv-icon-download",
			"shortName": "down",
			"description": "Downloads",
			"pageComponent": "DownloadsView",
			"systems": [
				"Autodesk Revit",
				"Autodesk Navisworks"
			],
			"path": "/downloads"
		},
		"support": {
			"title": "Support",
			"icon": "fas fa-plug fa-2x",
			"shortName": "sup",
			"description": "Support",
			"pageComponent": "dashboards/DashboardView",
			"path": "/support",
			"config": {
				"layout": "fullpage",
				"component": "Iframe",
				"url": "https://invicara.sharepoint.com/sites/ELSTraining?market=en-US"
			},
			"scriptTypes": []
		}
	},
	"homepage": {
		"handler": "homepage"
	},
	"groupedPages": {
		"Asset Twin": {
			"icon": "inv-icon-svg inv-icon-assets",
			"position": 1,
			"pages": []
		}
	},
	"settings": {
		"detailPath": "/detail",
		"show3dModel": false
	}
}

CONFIGVARS.resetUserConfigContent = {
	"onConfigLoad": {
		"load": [
			"iaf_dt_proj_colls",
			"iaf_dt_types",
			"iaf_collect_allusers"
		],
		"exec": [
			"loadProjectAndCollections"
		]
	},
	"entityDataConfig": {},
	"entitySelectConfig": {},
	"handlers": {
		"homepage": {
			"title": "Homepage",
			"icon": "icofont-home",
			"shortName": "homepage",
			"description": "Home",
			"pageComponent": "dashboards/DashboardView",
			"path": "/homepage",
			"config": {
				"layout": "grid",
				"className": "homepage",
				"rows": 3,
				"columns": 3,
				"panels": {
					"buttons": {
						"position": {
						  "top": 3,
						  "left": 1,
						  "bottom": 4,
						  "right": 4
						},
						"component": "CompactButtonBar",
						"actions": {
						  "Navigator": {
							"allow": true,
							"icon": "simple_navigator.png",
							"type": "navigate",
							"navigateTo": "navigator",
							"title": "Navigator",
							"text": "Explore the building model and related data"
						  },
						  "Assets": {
							"allow": true,
							"icon": "simple_assets.png",
							"type": "navigate",
							"navigateTo": "assets",
							"title": "Assets",
							"text": "Detailed asset data for operations and capital planning"
						  },
						  "Spaces": {
							"allow": true,
							"icon": "simple_spaces.png",
							"type": "navigate",
							"navigateTo": "spaces",
							"title": "Spaces",
							"text": "Spatial configuration and related data"
						  },
						  "Files": {
							"allow": true,
							"icon": "simple_files.png",
							"type": "navigate",
							"navigateTo": "files",
							"title": "Files",
							"text": "All property files for operations, property management, etc."
						  }
						}
					  }
				}
			},
			"scriptTypes": [
				"iaf_dashboard"
			]
		},
		"userGroup": {
			"title": "User Group",
			"actionTitle": "User Group Actions",
			"icon": "ion-gear-a icofont-2x",
			"pageComponent": "users/UserGroupView",
			"path": "/UserGroupView",
			"config": {
				"appUrl": "/digitaltwin",
				"allowUserGroupEdit": true,
				"allowUserGroupInvite": true,
				"allowManageInvites": true,
				"allowManageUsers": true,
				"allowViewPermissions": true,
				"allowManagePermissions": false
			},
			"script": {
				"itemFetchScript": "fetchNonSystemCollections"
			}
		},
		"downloads": {
			"title": "Downloads",
			"icon": "inv-icon-svg inv-icon-download",
			"shortName": "down",
			"description": "Downloads",
			"pageComponent": "DownloadsView",
			"systems": [
				"Autodesk Revit",
				"Autodesk Navisworks"
			],
			"path": "/downloads"
		},
		"support": {
			"title": "Support",
			"icon": "fas fa-plug fa-2x",
			"shortName": "sup",
			"description": "Support",
			"pageComponent": "dashboards/DashboardView",
			"path": "/support",
			"config": {
				"layout": "fullpage",
				"component": "Iframe",
				"url": "https://invicara.sharepoint.com/sites/ELSTraining?market=en-US"
			},
			"scriptTypes": []
		}
	},
	"homepage": {
		"handler": "homepage"
	},
	"groupedPages": {
		"Asset Twin": {
			"icon": "inv-icon-svg inv-icon-assets",
			"position": 1,
			"pages": []
		}
	},
	"settings": {
		"detailPath": "/detail",
		"show3dModel": false
	}
}

CONFIGVARS.scriptsDescriptorsModelImport = {
	_name: "SGPK Import model",
	_shortName: "iaf_import_model",
	_description: "SGPK Import Model",
	_userType: "iaf_import_model"
}
CONFIGVARS.scriptsDescriptorsProjColls = {
	_name: "Load Project Collection Data",
	_shortName: "iaf_dt_proj_colls",
	_description: "Load All Project Collections",
	_userType: "iaf_dt_proj_colls"
}
CONFIGVARS.scriptsDescriptorsDtTypes = {
	_name: "Type Map Interactions",
	_shortName: "iaf_dt_types",
	_description: "Scripts for interacting with the type map",
	_userType: "iaf_dt_types"
}
CONFIGVARS.scriptsDescriptorsMapElems = {
	_name: "Re-mapping type elements",
	_shortName: "iaf_map_elms_type",
	_description: "Update model type elements, after BIMtypes updated",
	_userType: "iaf_map_elms_type"
}
CONFIGVARS.scriptsDescriptorsDash = {
	_name: "Dashboard Scripts",
	_shortName: "iaf_dashboard",
	_description: "Scripts to provide data for dashboard development",
	_userType: "iaf_dashboard"
}
CONFIGVARS.scriptsDescriptorsFiles = {
	_name: "Files As Entities All Users",
	_shortName: "iaf_files_allusers",
	_description: "Files for Entity View",
	_userType: "iaf_files_allusers"
}
CONFIGVARS.scriptsDescriptorsBimpkPost = {
	_name: "BIMPK Post Import - Copy Inverse Relations",
	_shortName: "iaf_bimpk_post_imp",
	_description: "BIMPK Post Import - Copy Inverse Relations from Prev Version",
	_userType: "iaf_bimpk_post_imp"
}
CONFIGVARS.scriptsDescriptorsColls = {
	_name: "Entity Collection All Users Scripts",
	_shortName: "iaf_collect_allusers",
	_description: "Scripts to interact with collections",
	_userType: "iaf_collect_allusers"
}
CONFIGVARS.scriptsDescriptorsModelElements = {
	_name: "Model Elements Entity Page",
	_shortName: "iaf_dt_model_elems",
	_description: "Common Model Elements Business Logic",
	_userType: "iaf_dt_model_elems"
}
CONFIGVARS.scriptsDescriptorsSpace = {
	_name: "Entity Space All Users Logic",
	_shortName: "iaf_entspa_allusers",
	_description: "Common Entity Space Business Logic",
	_userType: "iaf_entspa_allusers"
}
CONFIGVARS.scriptsDescriptorsAssets = {
	_name: "Entity Asset All Users Logic",
	_shortName: "iaf_entass_allusers",
	_description: "Common Asset Business Logic",
	_userType: "iaf_entass_allusers"
}
CONFIGVARS.scriptsDescriptorsSgpk = {
	_name: "SGPK Additional Functions",
	_shortName: "iaf_sgpk_allusers",
	_description: "Load Assets, Spaces with navigator",
	_userType: "iaf_sgpk_allusers"
}

CONFIGVARS.scriptsDescriptorsAssetMapType = {
	_name: "Asset Type Map User",
	_shortName: "iaf_dt_type_map",
	_description: "Read and Manipulate Collection for Asset Type Map",
	_userType: "iaf_dt_type_map"
}

CONFIGVARS.scriptsDescriptorsModelRepValidation = {
	_name: "Export Data Script",
	_shortName: "iaf_ext_val_scr",
	_description: "Scripts to Inspect Model Content and Generate Reports",
	_userType: "iaf_ext_val_scr"
}

async function scriptList(){
	try{
	let { IafItemSvc } = LIB.PlatformApi
	let loadedScripts = await IafItemSvc.getNamedUserItems({
		"query": {}
	}, LIB.ctx, {});
	LIB.scriptAvailable = loadedScripts._list
	return LIB.scriptAvailable
    } catch(e){
		console.error('Something went Wrong!', e)
	}
}

async function selectConfigSheet() {
	try{
	console.log('Please upload config sheet.')
	let xlsxFiles = await LIB.UiUtils.IafLocalFile.selectFiles({ multiple: false, accept: ".xlsx" })
	//console.log(xlsxFiles,'xlsxFiles')
	let typeWorkbook = await LIB.UiUtils.IafDataPlugin.readXLSXFiles(xlsxFiles)
	let wbJSON = LIB.UiUtils.IafDataPlugin.workbookToJSON(typeWorkbook[0])
	LIB.wbJSON = wbJSON
	let xlsConfigData = wbJSON.Config
	LIB.xlsConfigDataParsed = LIB.UiUtils.IafDataPlugin.parseGridData({ gridData: xlsConfigData })
	} catch(e){
		console.error('Something went Wrong!', e)
	}
}

function getLocalPaths(path){
	let localPaths = LIB.UiUtils.IafDataPlugin.parseGridData({ gridData: LIB.wbJSON.Path })
	let systemPath = localPaths[0][path] ? localPaths[0][path] : ''
	if(systemPath == ''){
		console.log('Path is missing in Path Sheet!')
		return
	}
	let correctPath = systemPath.substr(-1) == '/' ? systemPath : systemPath + '/'
	return correctPath
}
async function saveSheetReport(sheetData){
	let dataCSV = Object.keys(sheetData).toString() + '\n'
	dataCSV += Object.values(sheetData).toString()

	  fs.writeFileSync(getLocalPaths('Report Path') + 'Missing_Sheet_Report.csv', dataCSV, 'utf8')
	  console.log('Please check Report Location to see the reports!')
	  return
}
async function saveBulkUploadReport(bulkUploadDatas){
	  const datasForCsv = bulkUploadDatas.files.reduce((acc, uploadData) => {
		  acc += `${uploadData[bulkUploadDatas.sheetHeaderName]}, ${uploadData.Count !==undefined ? uploadData.Count : ''}\n`;
		  return acc;
		},
		`${bulkUploadDatas.sheetHeaderName}, Count \n`
	  );

	  fs.writeFileSync(getLocalPaths('Report Path') + bulkUploadDatas.sheetName +'.csv', datasForCsv, 'utf8')
	  console.log('CSV Saved for bulk upload!')
	  return
}
async function validate(){
	const statusArr = {}
	if(checkImportListAccess('Assets')){
		statusArr['Asset Sheet'] = LIB.wbJSON.Assets ? 'Available' : 'Not Available'
		statusArr['Asset Property Info'] = LIB.wbJSON['Asset Property Info'] ? 'Available' : 'Not Available'
	}
	if(checkImportListAccess('Spaces')){
		statusArr['Space Sheet'] = LIB.wbJSON.Spaces ? 'Available' : 'Not Available'
		statusArr['Space Property Info'] = LIB.wbJSON['Space Property Info'] ? 'Available' : 'Not Available'
	}
	if(checkImportListAccess('BimType')){
		statusArr['BimType Sheet'] = LIB.wbJSON['Bim Type'] ? 'Available' : 'Not Available'
	}
	if(checkImportListAccess('DocumentAttributes')){
		statusArr['DocumentAttributes Sheet'] = LIB.wbJSON['Document Attributes'] ? 'Available' : 'Not Available'
	}
	if(checkImportListAccess('ModelImport')){
		let localSgpkPath = _.get(LIB.wbJSON, "Path");
		let isModelPathExist = localSgpkPath[1][1] ? localSgpkPath[1][1] : ''
		statusArr['Model Import'] = fs.existsSync(isModelPathExist) ? 'Available' : 'Not Available'
	}
	if(checkImportListAccess('BulkFileUpload')){
	    statusArr['Bulk File Path'] = fs.existsSync(getLocalPaths('Files Path')) ? 'Available' : 'Not Available'
		statusArr['Report Path'] = fs.existsSync(getLocalPaths('Report Path')) ? 'Available' : 'Not Available'
		statusArr['File List Sheet'] = LIB.wbJSON['File List'] ? 'Available' : 'Not Available'
	}
	if(checkImportListAccess('AssetFileRelation')){
		statusArr['Assets and Files Sheet'] = LIB.wbJSON['Assets and Files'] ? 'Available' : 'Not Available'
	}
	console.log(statusArr,'status');
	let statusFiltered = Object.fromEntries(
	Object.entries(statusArr).filter(([key, value]) => value === 'Not Available') )
	console.log(statusFiltered,'statusFiltered');
	if(Object.keys(statusFiltered).length){
		let checkReportDir = fs.existsSync(getLocalPaths('Report Path'))
		if(checkReportDir){
			await saveSheetReport(statusFiltered)
		} else {
			console.log('Report Path is Missing!')
		}
		return false
	} else {
		return true
	}
	
} 
async function createUserGroups() {


	let res
	try {
		res = await LIB.PlatformApi.IafProj.addUserGroups(LIB.proj, CONFIGVARS.userGroupDescriptors, LIB.ctx);
	} catch (e) {
		res = undefined;
		throw e;
	}

	return res
}
async function userConfigsLoader() {

	try{
	const delay = (ms, value) =>
		new Promise(resolve => setTimeout(resolve, ms, value));

	async function childFunction() {
		return await Promise.all([getUserGroupsFetchDelay()]);
	}

	async function getUserGroupsFetchDelay() {
		const result = await delay(15000, "true");

		let userGroups = await LIB.PlatformApi.IafProj.getUserGroups(LIB.proj, LIB.ctx)
		console.log(userGroups, "userGroups-configloader-insidesomefunction")

		if (userGroups?.length > 0) {
			console.log(result);
			return result;
		}
	}


	async function main() {
		const result = await childFunction();
		console.log(result, "final_result")
		if (result[0] === "true") {

			let userGroups = await LIB.PlatformApi.IafProj.getUserGroups(LIB.proj, LIB.ctx)
			console.log(userGroups, "userGroups-configloader-insidemainfunc")

			//load content of the user configs 
			let parsed = CONFIGVARS.configContents.map(x => JSON.parse(x))
			let configs = _.zip(CONFIGVARS.configNames, parsed)
			console.log(configs, "configs-configloader")
			let configDefs = _.map(configs, (c) => {
				return { configName: c[0], configContent: c[1] }
			})

			//create configItems
			let configItems = []
			configDefs.forEach((c) => {
				let item = _.find(CONFIGVARS.userConfigDescriptors, { _shortName: c.configName })
				if (item) {
					item._version = { _userData: JSON.stringify(c.configContent, null, 2) }
					configItems.push(item)
				}
			})
			console.log(configItems, "configItems-configloader")


			let groupItems = []

			configDefs.forEach((c) => {
				let group = _.find(CONFIGVARS.userConfigToUserGroupMap, { userConfig: c.configName })
				console.log(group, "group")
				let item = _.find(userGroups, { _shortName: group.userGroup })
				console.log(item, "item-config")
				if (item) {
					groupItems.push(item)
				}
			})
			console.log(groupItems, "groupItems-configloader")


			//Look up the UserGroup mapped to each UserConfig


			let configsAndGroups = _.zip(configItems, groupItems)
			console.log(configsAndGroups, "configsAndGroups-configloader")
			let configsAndGroupDefs = _.map(configsAndGroups, (c) => {
				return { userConfig: c[0], userGroup: c[1] }
			})
			console.log(configsAndGroupDefs, "configsAndGroupDefs-configloader")
			let results = []

			//Do not use forEach as it is not Promise aware!
			for (let i = 0; i < configsAndGroupDefs.length; i++) {
				let result = await LIB.PlatformApi.IafUserGroup.addUserConfigs(configsAndGroupDefs[i].userGroup, [configsAndGroupDefs[i].userConfig], LIB.ctx);
				if (result && result._list) {
					result = result._list;
				}
				results.push(result);
			}
			console.log(results, "results-configloader")
			return results
		}
	}

	main();
    } catch(e){
		throw e
	}

}
async function setLocalScriptPath(){
	try{
	let localAddr = _.get(LIB.wbJSON, "Path");
	LIB.localScriptPath = localAddr === undefined ? [] : localAddr[1]
	return LIB.localScriptPath;
	} catch(e){
		throw e
	}
}
async function isUserGroupAvailable() {
	try{
	let userGroups = LIB.xlsConfigDataParsed.map(user => user.UserGroupName)
	if (userGroups.includes("Solution Admin") && isScriptExists("iaf_dbm_soladmin_uc")) {
		CONFIGVARS.userGroupDescriptors.push(CONFIGVARS.solutionAdmin)
		CONFIGVARS.userConfigDescriptors.push(CONFIGVARS.userConfigSolutionAdmin)
		CONFIGVARS.userConfigToUserGroupMap.push(CONFIGVARS.userConfigToUserGroupMapSolAdmin)
		let findUser = LIB.xlsConfigDataParsed.filter(x => x.UserGroupName == "Solution Admin")
		await loadScripts(findUser)
		Object.assign(CONFIGVARS.updateUserConfigContent,
			{
				handlers: {
					...CONFIGVARS.updateUserConfigContent.handlers,
					modelVer: CONFIGVARS.handlerManageModel.handler.modelVer
				}
			},
			{
				groupedPages: {
					...CONFIGVARS.updateUserConfigContent.groupedPages,
					Admin: CONFIGVARS.groupedPagesAdmin.groupedPages.Admin,
				}
			})
		CONFIGVARS.updateUserConfigContent.groupedPages["Admin"].pages.push(CONFIGVARS.groupedPagesAdminUsergrp)
		CONFIGVARS.updateUserConfigContent.groupedPages["Admin"].pages.push(CONFIGVARS.groupedPagesAssetTwinManageModel)

		CONFIGVARS.configNames.push("iaf_dbm_soladmin_uc")
		CONFIGVARS.configContents.push(JSON.stringify(CONFIGVARS.updateUserConfigContent))
		CONFIGVARS.updateUserConfigContent.groupedPages["Asset Twin"].pages = []
		Object.assign(CONFIGVARS.updateUserConfigContent, CONFIGVARS.resetUserConfigContent)
	}
	if (userGroups.includes("Project Admin") && isScriptExists("iaf_dbm_projadmin_uc")) {
		CONFIGVARS.userGroupDescriptors.push(CONFIGVARS.projectAdmin)
		CONFIGVARS.userConfigDescriptors.push(CONFIGVARS.userConfigProjectAdmin)
		CONFIGVARS.userConfigToUserGroupMap.push(CONFIGVARS.userConfigToUserGroupMapProjAdmin)
		let findUser = LIB.xlsConfigDataParsed.filter(x => x.UserGroupName == "Project Admin")
		console.log(findUser, "finduser-projectAdmin")
		await loadScripts(findUser)
		Object.assign(CONFIGVARS.updateUserConfigContent,
			{
				handlers: {
					...CONFIGVARS.updateUserConfigContent.handlers,
					modelVer: CONFIGVARS.handlerManageModel.handler.modelVer
				}
			},
			{
				groupedPages: {
					...CONFIGVARS.updateUserConfigContent.groupedPages,
					Admin: CONFIGVARS.groupedPagesAdmin.groupedPages.Admin,
				}
			})
		if (CONFIGVARS.updateUserConfigContent.groupedPages["Admin"].pages.length === 0) {
			CONFIGVARS.updateUserConfigContent.groupedPages["Admin"].pages.push(CONFIGVARS.groupedPagesAdminUsergrp)
			CONFIGVARS.updateUserConfigContent.groupedPages["Admin"].pages.push(CONFIGVARS.groupedPagesAssetTwinManageModel)
		}
		CONFIGVARS.configNames.push("iaf_dbm_projadmin_uc")
		CONFIGVARS.configContents.push(JSON.stringify(CONFIGVARS.updateUserConfigContent))
		CONFIGVARS.updateUserConfigContent.groupedPages["Asset Twin"].pages = []
		Object.assign(CONFIGVARS.updateUserConfigContent, CONFIGVARS.resetUserConfigContent)
	}
	if (userGroups.includes("Project User") && isScriptExists("iaf_dbm_projuser_uc")) {
		CONFIGVARS.userGroupDescriptors.push(CONFIGVARS.projectUser)
		CONFIGVARS.userConfigDescriptors.push(CONFIGVARS.userConfigProjectUser)
		CONFIGVARS.userConfigToUserGroupMap.push(CONFIGVARS.userConfigToUserGroupMapProjUser)
		let findUser = LIB.xlsConfigDataParsed.filter(x => x.UserGroupName == "Project User")
		console.log(findUser, "finduser-projectUser")
		await loadScripts(findUser)
		CONFIGVARS.configNames.push("iaf_dbm_projuser_uc")
		CONFIGVARS.configContents.push(JSON.stringify(CONFIGVARS.updateUserConfigContent))
		CONFIGVARS.updateUserConfigContent.groupedPages["Asset Twin"].pages = []
		Object.assign(CONFIGVARS.updateUserConfigContent, CONFIGVARS.resetUserConfigContent)
	}
	if (userGroups.includes("Project Visitor") && isScriptExists("iaf_dbm_visitor_uc")) {
		CONFIGVARS.userGroupDescriptors.push(CONFIGVARS.projectVisitor)
		CONFIGVARS.userConfigDescriptors.push(CONFIGVARS.userConfigProjectVisitor)
		CONFIGVARS.userConfigToUserGroupMap.push(CONFIGVARS.userConfigToUserGroupMapProjVisitor)
		let findUser = LIB.xlsConfigDataParsed.filter(x => x.UserGroupName == "Project Visitor")
		console.log(findUser, "finduser")
		await loadScripts(findUser)
		CONFIGVARS.configNames.push("iaf_dbm_visitor_uc")
		CONFIGVARS.configContents.push(JSON.stringify(CONFIGVARS.updateUserConfigContent))
		CONFIGVARS.updateUserConfigContent.groupedPages["Asset Twin"].pages = []
		Object.assign(CONFIGVARS.updateUserConfigContent, CONFIGVARS.resetUserConfigContent)
	}
    } catch(e){
		throw e
	}
}
async function scriptsLoader() {

	try{
	let scripts = _.zip(Array.from(CONFIGVARS.scriptNames), CONFIGVARS.scriptContents)
	console.log(scripts, "scripts")

	let scriptDefs = _.map(scripts, (s) => {
		return { scriptName: s[0], scriptContent: s[1] }
	})
	console.log(scriptDefs, "scriptDefs")

	let scriptItems = []
	scriptDefs.forEach((c) => {
		let item = _.find(CONFIGVARS.scriptsDescriptors, { _shortName: c.scriptName })
		if (item) {
			item._version = { _userData: c.scriptContent };
			item._namespaces = LIB.proj._namespaces
			scriptItems.push(item)
		}
	})

	console.log(scriptItems, "scriptItems")
	let results = await LIB.PlatformApi.IafScripts.create(scriptItems, LIB.ctx);
	console.log(results, "results")
	if (results && results._list) {
		results = results._list;
	}
	console.log(results, "inside-scriptloader")

	return results
	} catch(e){
		throw e
	}
}
async function createOrRecreateSGPKDatasource() {

	try{
		const query = {
		  _namespaces: LIB.proj._namespaces,
		  _userType: "sgpk_uploader"
		};
	
		const datasources = await LIB.IafScriptEngine.getDatasources(query, LIB.ctx);
	
		const filteredDatasources = _.filter(datasources, d => d._userType === "sgpk_uploader"
		  && d._name === "SGPK Uploader");
	
		_.each(filteredDatasources, async datasource => await LIB.IafScriptEngine.removeDatasource({ orchId: datasource.id }, LIB.ctx));
	
		let datasourceResult = await LIB.IafScriptEngine.addDatasource(
			{
				_name: "sgpk Uploader",
				_description: "SGPK Uploader",
				_namespaces: LIB.proj._namespaces,
				_userType: "sgpk_uploader",
				_schemaversion: "2.0",
				_params: {
					tasks: [
						{
							"name": "default_script_target",
							"_actualparams": {
								"userType": "iaf_import_model",
								"_scriptName": "importModel"
							},
							"_sequenceno": 1
						}
					]
				}
			}, LIB.ctx
		)
		return datasourceResult;
	} catch(e){
		throw e
	}
}

async function createOrRecreateColl(name, shortName, description, userType){
	try{
	return await LIB.IafScriptEngine.createOrRecreateCollection(
		{
			_name: name,
			_shortName: shortName,
			_namespaces: LIB.proj._namespaces,
			_description: description,
			_userType: userType
		}, LIB.ctx)
	} catch(e){
		throw e
	}
}

async function createItemsLot(userItemId, dataObjects){
	try{
		return await LIB.IafScriptEngine.createItemsBulk({
			_userItemId: userItemId,
			_namespaces: LIB.proj._namespaces,
			items: dataObjects
		}, LIB.ctx)
	} catch(e){
		throw e
	}
}

async function createOrRecreateIndexes(id,keys,optionName) {
	try{
		return await LIB.IafScriptEngine.createOrRecreateIndex(
			{
				_id: id,
				indexDefs: [
					{
						key: keys,
						options: {
							"name": optionName + "_search_index",
							"default_language": "english"
						}
					}
				]
			}, LIB.ctx
		)
	} catch(e){
		throw e
	}
}


async function setupCDELoader() {

	try{
	const documentAttributeCollections = _.get(LIB.wbJSON, "Document Attributes");
	if(checkImportListAccess('DocumentAttributes') && documentAttributeCollections){
		console.log(documentAttributeCollections, "documentAttributeCollections")
		let documentAttributeCollections_as_objects = LIB.UiUtils.IafDataPlugin.parseGridData(
			{ gridData: documentAttributeCollections, options: { asColumns: true } })
		console.log(documentAttributeCollections_as_objects, "documentAttributeCollections_as_objects")
		delete documentAttributeCollections_as_objects.TableView
		let file_attrib_coll = await createOrRecreateColl("FDM File Attrib Collection","easyTwinfileattrib","FDM File Attribute Collection","iaf_cde_file_attrib_coll")
	
		console.log("file_attrib_coll", file_attrib_coll)
	
		let file_attribs = await LIB.IafScriptEngine.createItems({
			_userItemId: file_attrib_coll._userItemId,
			_namespaces: LIB.proj._namespaces,
			items: documentAttributeCollections_as_objects
		}, LIB.ctx)
	
		console.log(file_attribs, "file_attribs")
		return file_attribs
	} else {
		console.log('Document Attribute Sheet Missing or Kept no!');
	}
	} catch(e){
		throw e
	}
}

async function modelUploadAndImport(callback){
	try{
	const orderGroupFunctionResult = await new Promise((resolve) =>
		setTimeout(async () => {
			console.log('modelimport')
			if (checkImportListAccess('ModelImport')) {

				await createOrRecreateSGPKDatasource()
				console.log('Please upload model sheet.')
				let localSgpkPath = _.get(LIB.wbJSON, "Path");
				let filePathForSgpk = localSgpkPath[1][1]
				
				let sgpkFileName = filePathForSgpk.substring(filePathForSgpk.lastIndexOf('/') + 1)
				console.log(sgpkFileName,'sgpkFileName');
				const uploadFileResults = await new Promise((resolve) =>
					setTimeout(async () => {
						await uploadFiles(callback, filePathForSgpk, sgpkFileName)
						resolve("true")
					}, 0),
				);

				let results = await importModelFile()
				console.log(results, "final-result")
				if (results === "true") {
					console.log("sgpk-loadedsuccessfully")
					//Import Model Asset Sheet
						if(checkImportListAccess('Assets')){
							await importModeledAssets('yesModel')
						} else {
							console.log('Missing required sheet!')
						}
					//Import Model Space Sheet
						if(checkImportListAccess('Spaces')){
							await importModeledSpaces('yesModel')
						} else {
							console.log('Missing Property Info Tab or Space sheet!')
						}
				}
			}
			else {
				//Import Model Asset Sheet
					if(checkImportListAccess('Assets')){
						await importModeledAssets('noModel')
					} else {
						console.log('Missing required sheet!')
					}

				//Import Model Space Sheet
					if(checkImportListAccess('Spaces')){
						await importModeledSpaces('noModel')
					} else {
						console.log('Missing required sheet!')
					}

			}
			resolve("true")
		}, 6000),
	);
	} catch(e){
		throw e
	}
}

async function createRelation(parentId, userItemId, relatedItems){
	try{
		return await LIB.IafScriptEngine.createRelations(
			{
				parentUserItemId: parentId,
				_userItemId: userItemId,
				_namespaces: LIB.proj._namespaces,
				relations: relatedItems
			}, LIB.ctx
		)
	} catch(e){
		throw e
	}
}

async function importModeledAssets(modelFlag) {

	try{
		const xlsAssetPropInfo = LIB.wbJSON["Asset Property Info"];
		let xlsAssetDataUnfiltered = LIB.wbJSON.Assets
		let xlsAssetData = xlsAssetDataUnfiltered.filter(attr => JSON.stringify(attr) !== '{}' && attr.length)
		if(!xlsAssetPropInfo && !xlsAssetData){
			console.log('Required Asset sheet is missing!')
			return
		}
		let iaf_dt_grid_as_objects = LIB.UiUtils.IafDataPlugin.parseGridData({ gridData: xlsAssetData });
		let data_as_objects = LIB.UiUtils.IafDataPlugin.parseGridData({ gridData: xlsAssetPropInfo });
	//filter out those rows with no Asset Name
	let assetRows = _.filter(iaf_dt_grid_as_objects, (row) => _.size(row['Asset Name']) > 0)

	let assetObjects = _.map(iaf_dt_grid_as_objects, row => {
		let props = {}
		data_as_objects.forEach(info => {
			props[info.Property] = {
				dName: info.Property,
				srcPropName: info.Property,
				val: row[info.Property],
				uom: info.uom,
				type: info.Type,
				epoch: info.Type === "date" ? LIB.UiUtils.IafDataPlugin.convertToEpoch(row[info.Property]) : undefined
			}
		})

		return {
			"Asset Name": row["Asset Name"],
			properties: Object.assign({}, props)
		}
	})
	console.log("assetObjects")

	let asset_coll = await createOrRecreateColl('Asset Collection','asset_coll','Physical Asset Collection','iaf_ext_asset_coll')

	console.log("asset_coll", asset_coll)

	let keys = { "Asset Name": "text" }
	let indexRes = await createOrRecreateIndexes(asset_coll._id, keys, 'assets')

	let asset_items_res = await createItemsLot(asset_coll._userItemId, assetObjects)

	console.log("asset_items_res")

	if(modelFlag == 'noModel'){
		return asset_items_res
	} else {
		let asset_query = {
			query: {},
			_userItemId: asset_coll._userItemId,
			options: {
				project: { "Asset Name": 1, _id: 1 },
				page: { getAllItems: true },
				sort: { "_id": 1 }
			}
		}
	
		let all_assets = await LIB.IafScriptEngine.getItems(
			asset_query, LIB.ctx
		)
	
		//Find revitGuid and store in sourceIds array for each asset.
		//Because revitGuid is under asset.property, it's probably easier to fill them from
		//assetRows by finding matching "Asset Name"
		let assetsWithSourceIds = _.map(all_assets, (asset) => {
			let sourceIds = []
			let row = _.find(assetRows, ["Asset Name", asset["Asset Name"]])
			if (row) {
				sourceIds.push(row.itemGuid)
			}
			asset.sourceIds = sourceIds
			return asset
		})
	
		console.log("assetsWithSourceIds")
		//console.log(assetsWithSourceIds)
	
		let nfallSourceIds = _.map(assetsWithSourceIds, 'sourceIds')
	
		console.log("nfallSourceIds")
		//console.log(nfallSourceIds)
	
		let allSourceIds = _.flatten(nfallSourceIds)
	
		console.log("allSourceIds")
		//console.log(allSourceIds)
	
		let currentModel = await LIB.IafScriptEngine.getCompositeCollection(
			{ query: { "_userType": "bim_model_version", "_namespaces": { "$in": LIB.proj._namespaces }, "_itemClass": "NamedCompositeItem" } }, LIB.ctx, { getLatestVersion: true }
		)
	
		console.log("currentModel", JSON.stringify(currentModel))
	
		if (!currentModel) return "Created Assets. No Model Present"
	
		let model_els_coll = await LIB.IafScriptEngine.getCollectionInComposite(
			currentModel._userItemId, { _userType: "rvt_elements" },
			LIB.ctx
		)
	
		console.log("model_els_coll", model_els_coll)
	
		if(model_els_coll._userType){
			let platformIdList = await LIB.IafScriptEngine.findInCollectionsByPropValuesBulk(
				{
					queryProp: { prop: "source_id", values: allSourceIds },
					collectionDesc: {
						_userType: model_els_coll._userType,
						_userItemId: model_els_coll._userItemId
					},
					options: {
						project: { platformId: 1, source_id: 1 },
						page: { getAllItems: true, getPageInfo: true },
						chunkSize: 50
					}
				}, LIB.ctx
			)
		
			console.log("platformIdList")
			//console.log(platformIdList)
		
			assetsWithSourceIds = assetsWithSourceIds.filter(a => a.sourceIds.length > 0)
		
			let assetsWithPlatformIds = _.map(assetsWithSourceIds, (asset) => {
				let platformIds = []
				//let ids = _.find(platformIdList._list, _.get(["source_id", asset.sourceIds.length > 0 ? asset.sourceIds[0], undefined]))
				let ids = _.find(platformIdList._list, { source_id: asset.sourceIds[0] })
				platformIds.push({ _id: ids ? ids._id : undefined })
				asset.platformIds = platformIds
				return asset
			})
		
			console.log("assetsWithPlatformIds")
			//console.log(assetsWithPlatformIds)
		
			//assetsWithPlatformIdArray is not needed as it produces the same array
			//since platformIds is already an array
	
			let relatedItems = _.map(assetsWithPlatformIds, (related) => {
				let obj = {
					parentItem: { _id: related._id },
					relatedItems: related.platformIds
				}
				return obj
			})
			console.log("relatedItems")
			//console.log(relatedItems)
			let result = await createRelation(asset_coll._userItemId, model_els_coll._userItemId, relatedItems)
			console.log('Import of Model Assets Complete')
			//console.log(result)
			return result
		} else {
			console.log('Missing model element collection!')
		}

	}

	} catch(e){
		throw e
	}
}

async function importModeledSpaces(modelFlag) {
	try{
		const xlsSpacePropInfo = LIB.wbJSON["Space Property Info"];
		let xlsSpaceDataUnfiltered = LIB.wbJSON.Spaces
		const xlsSpaceData = xlsSpaceDataUnfiltered.filter(attr => JSON.stringify(attr) !== '{}' && attr.length)
		if(!xlsSpaceData && !xlsSpacePropInfo){
			console.log('Missing required Sheet!');
			return
			
		}
		let iaf_dt_grid_as_objects = LIB.UiUtils.IafDataPlugin.parseGridData({ gridData: xlsSpaceData });
		let data_as_objects = LIB.UiUtils.IafDataPlugin.parseGridData({ gridData: xlsSpacePropInfo });
	//filter out those rows with no space Name
	let spaceRows = _.filter(iaf_dt_grid_as_objects, (row) => _.size(row['Name']) > 0)

	console.log(spaceRows, "spaceRows")

	let spaceObjects = _.map(iaf_dt_grid_as_objects, row => {
		let props = {}
		data_as_objects.forEach(info => {
			props[info.Property] = {
				dName: info.Property,
				srcPropName: info.Property,
				val: row[info.Property],
				uom: info.uom,
				type: info.Type,
				epoch: info.Type === "date" ? LIB.UiUtils.IafDataPlugin.convertToEpoch(row[info.Property]) : undefined
			}
		})

		return {
			"Space Name": row["Name"],
			properties: Object.assign({}, props)
		}
	})

	let space_coll = await createOrRecreateColl('Space Collection','space_coll','Physical Space Collection','iaf_ext_space_coll')
	console.log("space_coll", space_coll)

	let keys = {
		"properties.Name.val": "text",
		"Space Name": "text"
	}
	let indexRes = await createOrRecreateIndexes(space_coll._id, keys, 'text')

	let spaceItemRes = await createItemsLot(space_coll._userItemId, spaceObjects)

	if(modelFlag == 'noModel'){
		return spaceItemRes
	} else {
		let space_query = {
			query: {},
			_userItemId: space_coll._userItemId,
			options: {
				project: { "Space Name": 1, _id: 1 },
				page: { getAllItems: true },
				sort: { "_id": 1 }
			}
		}
		console.log("space_query", space_query)
		let all_spaces = await LIB.IafScriptEngine.getItems(space_query, LIB.ctx)
	
		console.log("all_spaces", all_spaces)
	
		//Find revitGuid and store in sourceIds array for each space.
		let spacesWithSourceIds = _.map(all_spaces, (space) => {
			let sourceIds = []
			let row = _.find(spaceRows, ["Name", space["Space Name"]])
			if (row) {
				sourceIds.push(row.itemGuid)
			}
			space.sourceIds = sourceIds
			return space
	
		})
	
		console.log("spacesWithSourceIds", spacesWithSourceIds)
	
		let nfallSourceIds = _.map(spacesWithSourceIds, 'sourceIds')
	
		console.log("nfallSourceIds", nfallSourceIds)
	
		let allSourceIds = _.flatten(nfallSourceIds)
	
		console.log("allSourceIds", allSourceIds)
	
		let currentModel = await LIB.IafScriptEngine.getCompositeCollection(
			{ query: { "_userType": "bim_model_version", "_namespaces": { "$in": LIB.proj._namespaces }, "_itemClass": "NamedCompositeItem" } }, LIB.ctx, { getLatestVersion: true })
		console.log("currentModel", JSON.stringify(currentModel))
		if (!currentModel) return "Created Spaces. No Model Present"
		let model_els_coll = await LIB.IafScriptEngine.getCollectionInComposite(
			currentModel._userItemId, { _userType: "rvt_elements" },
			LIB.ctx
		)
		console.log("model_els_coll", model_els_coll)
		if(model_els_coll._userType){
			let platformIdList = await LIB.IafScriptEngine.findInCollectionsByPropValuesBulk(
				{
					queryProp: { prop: "source_id", values: allSourceIds },
					collectionDesc: {
						_userType: model_els_coll._userType,
						_userItemId: model_els_coll._userItemId
					},
					options: {
						project: { platformId: 1, source_id: 1 },
						page: { getAllItems: true, getPageInfo: true },
						chunkSize: 50
					}
				}, LIB.ctx
			)
		
			console.log("platformIdList", platformIdList)
		
			spacesWithSourceIds = spacesWithSourceIds.filter(a => a.sourceIds.length > 0)
		
			let spacesWithPlatformIds = _.map(spacesWithSourceIds, (space) => {
				let platformIds = []
				let ids = _.find(platformIdList._list, { source_id: space.sourceIds[0] })
				platformIds.push({ _id: ids ? ids._id : undefined })
				space.platformIds = platformIds
				return space
			})
		
			console.log("spacesWithPlatformIds", spacesWithPlatformIds)
		
			let relatedItems = _.map(spacesWithPlatformIds, (related) => {
				let obj = {
					parentItem: { _id: related._id },
					relatedItems: related.platformIds
				}
				return obj
			})
		
			console.log("relatedItems", relatedItems)
		
			let result = await createRelation(space_coll._userItemId, model_els_coll._userItemId, relatedItems)
			console.log('Import of Model Spaces Complete. result:')
			console.log(result)
			return result
		} else {
			console.log('Missing model element collection!')
		}

	}

	} catch(e){
		throw e
	}
}

async function uploadFiles(callback, filePathForSgpk, sgpkFileName) {

	try{
	const { IafFileSvc } = LIB.PlatformApi
	// tags that we will apply to the files at upload based on file extension
	const fileTags = {
		jpg: ['image', 'jpg'],
		txt: ['text', 'txt'],
		json: ['data', 'json'],
		sgpk: ['model', 'sgpk']
	}
	console.log("fileTags")
	// select the three files in you downloaded from the course

	let filePath = filePathForSgpk

	// Read the file from the local folder
	const fileData = fs.readFileSync(filePath);

	let files = []

	let fileDetails = {
		name: sgpkFileName,
		fileObj: fileData,
	}

	files.push(fileDetails)
	//return files
	let fileUploadResults = []

	// we will provide an onComplete callback to the upload function so that we can resolve
	// our deferred Promises once the upload completes
	// we'll have this print to the console and the scripts callback
	// you will see the scripts callback content in the script results when the script
	// has completed running
	// the callback you provide for onComplete will be passed to the created file record in the file service

	function onUploadComplete(deferredResolve, file) {
		let message = file._name + ' COMPLETE'
		console.log(message)
		callback(message)
		fileUploadResults.push(file)
		deferredResolve()
	}

	// we will provide an onProgress callback as well to the upload function
	// we'll have this print to the console and the scripts callback
	// you will see the scripts callback content in the script results when the script
	// has completed running
	// the callback you provide for onProgress will be passed the bytes uplaoded so far the total bytes

	function onUploadProgress(bytesUploaded, bytesTotal, file) {
		let percentComplete = (bytesUploaded / bytesTotal * 100).toFixed(1)
		let message = file.name + ': ' + percentComplete
		console.log(message,'%')
		callback(message)
	}
	// we will provide an onError callback as well to the upload function
	// we'll have this print to the console and the scripts callback
	// you will see the scripts callback content in the script results when the script
	// has completed running

	function onUploadError(deferredReject, error, file) {
		let message = file.name + ': ERROR' + error
		console.log(message)
		callback(message)
		deferredReject(error)
	}
	// upload each file async

	let uploadPromises = [] // a collection of deferred promises, 1 for each file we upload
	for (const file of files) {
		// since the file will be uploaded async we create a Promise and only resolve it once the file
		// has been 100% uploaded, making sure that the script does not complete before that.
		// We will pass the deferred resolve method to the onUploadComplete callback
		let deferredResolve, deferredReject
		uploadPromises.push(new Promise((resolve, reject) => {
			deferredResolve = resolve
			deferredReject = reject
		}))
		try {
			let tagsForFile = fileTags[file.name.split('.')[1]]
			console.log(tagsForFile,'tagsForFile');
			
			// upload the file using resumable upload which can handle interrupts in network and which
			// will allow partial file uploads that can be completed at a later point in time
			//
			// Params:
			// 1. the file Stream, Buffer, or File to upload
			// 2. the project _namespaces to which to uplaod the files
			// 3. the parent folders for the file, if none are provided the root folder for the project will be used
			// 4. the tags to apply to the file
			// 5. the user's ctx uplaoding the files
			// 6. an options object containing
			//  the filename for the file if not provided on the file
			//      onProgress, onComplete, and onError options callbacks
			//
			// We will upload one file at a time, but you can do parallel uploads by removing await

			// and throttling the number of uploads you allow at one time

			await IafFileSvc.addFileResumable(file.fileObj, LIB.ctx._namespaces, [], tagsForFile, LIB.ctx, {
				filename: file.name,
				onProgress: (bytesUploaded, bytesTotal) => onUploadProgress(bytesUploaded, bytesTotal, file),
				onComplete: (file) => onUploadComplete(deferredResolve, file), // onComplete will be passed the file record in the file service
				onError: (error) => onUploadError(deferredReject, error, file)
			})
		} catch (e) {
			console.log(e)
			deferredReject(e)
		}
	}


	// wait for the onUploadSuccess callbacks to resolve all our deferred Promises then return from the script
	return await Promise.all(uploadPromises).then(() => {
		console.log(fileUploadResults, "fileUploadResults")
		return fileUploadResults
	})
	} catch(e){
		throw e
	}
}


async function updateFilecreateOrRecreateIndex() {

	try{
	let root_file_cont = await LIB.IafScriptEngine.getFileCollection({
		_userType: "file_container",
		_shortName: "Root Container"
	}, LIB.ctx)

	let keys =  {
		name: "text",
		"fileAttributes.Originator": "text",
		"fileAttributes.Document Type": "text",
		"fileAttributes.Levels And Locations": "text"
	}
	let index = await createOrRecreateIndexes(root_file_cont._id, keys, 'text')

	return index
	} catch(e){
		throw e
	}
}

async function createOrRecreateCollectionsCollection() {

	try{
	let collections = await createOrRecreateColl('Collections Collection','Collections','Collections of Entities','iaf_ext_coll_coll')

	let keys = {
		"Collection Name": "text",
		"properties.Type.val": "text"
	}
	await createOrRecreateIndexes(collections._id, keys, 'text')

	return collections
	} catch(e){
		throw e
	}
}

function checkImportListAccess(funcName){
	try{
	const functionAccess = _.get(LIB.wbJSON, "Import List")
	console.log(functionAccess, "functionAccess")
	let xlsConfigDataParseds = LIB.UiUtils.IafDataPlugin.parseGridData({ gridData: functionAccess })
	let getFunctionAccess = xlsConfigDataParseds.filter(x => x['Function Name'] == funcName).map(x => x.Access) == "Yes"
	console.log(getFunctionAccess, "getFunctionAccess")
	return getFunctionAccess
	} catch(e){
		throw e
	}
}

async function getExistingModel(extName){
	let { IafFileSvc } = LIB.PlatformApi

	let searchCriteria = {
		_parents: 'root',
		_name: '.*'+ extName
	}

	let getSgpk = await IafFileSvc.getFiles(searchCriteria, LIB.ctx, { _pageSize: 100, getLatestVersion: true });
	return getSgpk._list[0]
}

async function importModelFile() {

	try{
	let { IafFileSvc, IafDataSource } = LIB.PlatformApi

	let sgpk = await getExistingModel('sgpk');

	console.log('sgpk', sgpk)

	let getVersions = await IafFileSvc.getFileVersions(sgpk._id, LIB.ctx);
	let version = _.find(getVersions._list, { _version: sgpk._tipVersion })
	console.log('version', version)

	let sgpkOrch;
	let datasources = await IafDataSource.getOrchestrators(null, LIB.ctx);

	console.log('datasources', datasources);

	if (datasources) {
		sgpkOrch = _.find(datasources._list, { _userType: 'sgpk_uploader' });
	} else {
		sgpkOrch = null;
	}

	console.log('sgpkOrch', sgpkOrch);

	let task = _.find(sgpkOrch.orchsteps, { _name: 'default_script_target' });
	let seqTypeId = task._compid;

	console.log('seqTypeId', seqTypeId);

	const orchReq = {
		_namespaces: LIB.proj._namespaces,
		orchestratorId: sgpkOrch.id,
		_actualparams: [
			{
				sequence_type_id: seqTypeId,
				params: {
					_fileId: sgpk._id,
					_fileVersionId: version._id
				}
			}
		]
	};
	console.log(orchReq,'orchReq');

	//run orchestrator
	let result = await LIB.PlatformApi.IafDataSource.runOrchestrator(sgpkOrch.id, orchReq, LIB.ctx);
	console.log(result, "result")

	let orchRunResult = await LIB.PlatformApi.IafDataSource.getOrchRunStatus(result.id, LIB.ctx);
	console.log(orchRunResult, "orchRunResult")
	console.log(`orchRunResult`, orchRunResult[0].orchrunsteps)

	let orchStepRunStatus = orchRunResult[0].orchrunsteps;
	console.log(orchStepRunStatus, "orchStepRunStatus")
	//poll based on in run id until finished

	return await new Promise(resolve => {
		let interval = setInterval(async () => {
			let errStatus = _.filter(orchStepRunStatus, run_status => {
				return run_status._status === "ERROR";
			});
			let queuedStatus = _.filter(orchStepRunStatus, run_status => {
				return run_status._status === "QUEUED";
			});
			let runningStatus = _.filter(orchStepRunStatus, run_status => {
				return run_status._status === "RUNNING";
			});

			console.log(interval, "interval")
			console.log(`errStatus`, errStatus)
			console.log(`queuedStatus`, queuedStatus)
			console.log(`runningStatus`, runningStatus)

			if (!_.isEmpty(errStatus) || (_.isEmpty(queuedStatus) && _.isEmpty(runningStatus))) {

				if (_.isEmpty(errStatus)) {
					orchStepRunStatus.forEach((step) => step.status = 'COMPLETED');
					resolve('true')
				}
				//when import is complete kill the polling
				clearInterval(interval);
				//reset the currently selected model to the one we just imported
				//note: this is kept on the app itself - thus the setSelectedItems
				//not on the local state of the page
			}
			orchRunResult = await LIB.PlatformApi.IafDataSource.getOrchRunStatus(result.id, LIB.ctx);
			orchStepRunStatus = orchRunResult[0].orchrunsteps;
		}, 10000);

	});
	} catch(e){
		throw e
	}
}

async function createAssetSpaceReln(){

	try{
	    const xlsAssetPropInfo = LIB.wbJSON["Asset Property Info"];
		const xlsSpacePropInfo = LIB.wbJSON["Space Property Info"];
		if(xlsAssetPropInfo && xlsSpacePropInfo){
			let assetPropParsed = LIB.UiUtils.IafDataPlugin.parseGridData({ gridData: xlsAssetPropInfo })
			let spacePropParsed = LIB.UiUtils.IafDataPlugin.parseGridData({ gridData: xlsSpacePropInfo })
		
			let assetRelProp = assetPropParsed[0].Relation
			console.log(assetRelProp,'assetRelProp');
			
			let spaceRelProp = spacePropParsed[0].Relation
			console.log(spaceRelProp,'spaceRelProp');
			
		
			if(!assetRelProp || !spaceRelProp){
				console.log('Missing relation column in sheet!')
				return
			}
			let iaf_asset_collection = await LIB.IafScriptEngine.getCollection(
				{
					"_userType": "iaf_ext_asset_coll",
					"_shortName": "asset_coll",
					"_itemClass": "NamedUserCollection"
				}, LIB.ctx
			)

			if(iaf_asset_collection == undefined){
				console.log('Asset collection not present!')
				return false
			}
		
			let allAssets = await LIB.IafScriptEngine.getItems({
				"_userItemId": iaf_asset_collection._userItemId,
				"options": { "page": { "getAllItems": true } }
			}, LIB.ctx)
		
			console.log(allAssets.length,'length');
			console.log(allAssets[0],'1 asset');
		
			let iaf_space_collection = await LIB.IafScriptEngine.getCollection(
				{
				  _userType: "iaf_ext_space_coll",
				  _shortName: "space_coll",
				  _itemClass: "NamedUserCollection",
				}, LIB.ctx
			  )
			console.log(iaf_space_collection, 'spaceColl');
			if(iaf_space_collection == undefined){
				console.log('Space collection not present!')
				return false
			}
			let spaces = await LIB.IafScriptEngine.getItems({
				"_userItemId": iaf_space_collection._userItemId,
				"options": {"page": {"getAllItems": true}}
			 }, LIB.ctx)
			 console.log("spaces", spaces.length)
			 console.log(spaces[0],'1 spaces');
			 if(allAssets && spaces){
				let spaceObj = spaces.filter((spaceInfo) => spaceInfo.properties[spaceRelProp].val )
				console.log(spaceObj.length,'rel length');
				let relatedItems = spaceObj.map(data => { 
					 let val = _.filter(allAssets, item => data.properties[spaceRelProp].val == item.properties[assetRelProp].val);
					 if(val.length > 0){
						return { parentItem:{ _id: data._id },
						relatedItems: val.map(asset => {
							return {_id : asset._id}
						})
					}
					 }
				})
				let filteredData = relatedItems.filter(validRelations => validRelations)
				console.log(filteredData, 'relatedItems');
				if(filteredData.length > 0){
					await createRelation(iaf_space_collection._userItemId, iaf_asset_collection._userItemId, filteredData)
					let final = { success: true }
					console.log(final,'Assets and Spaces Relation Imported');
				}
			 }
		}
		else{
			console.log('Missing relation datas!');
			
		}
	} catch(e){
		throw e
	}
}

async function getScriptData(fileName) {
	try{
	CONFIGVARS.scriptNames.add(fileName)
	let actualPath = getLocalPaths('Script Path')
	console.log(actualPath,'actualPath');
	let oneClickPath = 'scripts/'
	let filenames = fs.readdirSync(actualPath + oneClickPath);
	filenames.forEach(file => {
	if(file.split('.')[0] == fileName){
		let fileContents = fs.readFileSync(actualPath + oneClickPath + file, 'utf8')
		CONFIGVARS.scriptContents.push(fileContents)
	}
	});
	//console.log(fileContents, 'Added')
	return true
	} catch(e){
		throw e
	}
}

function isScriptExists(script) {
	try{
	//console.log(loadedScripts,'loadedScripts')
	return !LIB.scriptAvailable.filter(x => x._shortName == script).length == 1
	} catch(e){
		throw e
	}
}

function getTableViewProps(props){
	try{
		if(props){
			let assetTableProperty = props.map(data => {
				return {
					"name": data.TableView,
					"accessor": "properties." + data.TableView
				};
			})
			return assetTableProperty
		}
	} catch(e){
		throw e
	}
}

async function isFilesAvailable(findUser){
	let arrayOFItems, arrayOFItemsFilePropertyUI, fileTableProperty, editPropertyFileCollection
	if(checkImportListAccess('DocumentAttributes')){
		arrayOFItems = LIB.documentAttributeCommonName.map(data => {
			console.log(data, "LIB.documentAttributeCommonNameData")
			return {
				"name": data,
				"query": data == "Manufacturer" || data == "Revision" ? "<<CREATABLE_SCRIPTED_SELECTS>>" : "<<SIMPLE_SELECT>>",
				"script": "get" + data.replace(/\s/g, ""),
				"required": false
			};
		})
	
		console.log(arrayOFItems);
		arrayOFItemsFilePropertyUI = LIB.documentAttributeCommonName.slice(0, 4).map(data => {
			return {
	
				"name": data,
				"accessor": data + ".val"
	
			};
		})
		console.log(arrayOFItemsFilePropertyUI);
	
	
		fileTableProperty = LIB.documentAttributeCommonName['tableView'].map(data => {
			return {
				"name": data.TableView,
				"accessor": "properties." + data.TableView + ".val"
			};
		})
		console.log(fileTableProperty,'fileTableProperty');
	
		editPropertyFileCollection = LIB.documentAttributeCommonName.map((obj1, index) => {
			console.log(obj1, "LIB.documentAttributeCommonName2")
			return {
				[obj1]: {
					"query": obj1 == 'Manufacturer' || obj1 == 'Revision' ? "<<CREATABLE_SCRIPTED_SELECTS>>" : "<<SCRIPTED_SELECTS>>",
					"script": "get" + obj1.replace(/\s/g, ""),
					"multi": false
				}
			};
		});
	}

	if ((findUser[0]["Files"] == "Yes" && isScriptExists("iaf_files_allusers")) || (findUser[0]["Files"] == "Yes" && LIB.updateFlag)) {
		if(isScriptExists('iaf_files_allusers')){
			CONFIGVARS.scriptsDescriptors.push(CONFIGVARS.scriptsDescriptorsFiles)
			await getScriptData('iaf_files_allusers')
		}

		Object.assign(CONFIGVARS.updateUserConfigContent,
			{
				entitySelectConfig: {
					...CONFIGVARS.updateUserConfigContent.entitySelectConfig,
					File: CONFIGVARS.entitySelectConfigFile.entitySelectConfig.File
				}
			},
			{
				handlers: {
					...CONFIGVARS.updateUserConfigContent.handlers,
					files: CONFIGVARS.handlersFile.handlers.files,
					fileUpload: CONFIGVARS.handlerFileUpload.handlers.fileUpload
				}
			},
			{
				groupedPages: {
					...CONFIGVARS.updateUserConfigContent.groupedPages,
					Files: CONFIGVARS.groupedPagesFiles.groupedPages.Files
				}
			}
		)
		if (CONFIGVARS.updateUserConfigContent.handlers.files.config.data.Properties.component.columns.length === 0 && checkImportListAccess('DocumentAttributes')) {
			console.log(editPropertyFileCollection, "editPropertyFileCollection")
			Object.assign(CONFIGVARS.updateUserConfigContent.handlers.files.config.actions.Edit.component.propertyUiTypes,
				...editPropertyFileCollection);
		}
		console.log(CONFIGVARS.updateUserConfigContent.handlers.files.config.data.Properties.component.columns.length, "filesLength")
		if (CONFIGVARS.updateUserConfigContent.handlers.files.config.data.Properties.component.columns.length === 0 && checkImportListAccess('DocumentAttributes')) {
			CONFIGVARS.updateUserConfigContent.handlers.files.config.data.Properties.component.columns.push(...arrayOFItemsFilePropertyUI)
		}
		if (CONFIGVARS.updateUserConfigContent.handlers.files.config.tableView.component.columns.length === 1 && checkImportListAccess('DocumentAttributes')) {
			CONFIGVARS.updateUserConfigContent.handlers.files.config.tableView.component.columns.push(...fileTableProperty)
		}
		console.log(CONFIGVARS.updateUserConfigContent.handlers.fileUpload.config.columns.length, "filesLength2")
		if (CONFIGVARS.updateUserConfigContent.handlers.fileUpload.config.columns.length === 0 && arrayOFItems) {
			console.log('arrayOFItems', arrayOFItems)
			CONFIGVARS.updateUserConfigContent.handlers.fileUpload.config.columns.push(...arrayOFItems)
		}
		if (CONFIGVARS.updateUserConfigContent.groupedPages["Files"].pages.length === 0) {
			CONFIGVARS.updateUserConfigContent.groupedPages["Files"].pages.push(CONFIGVARS.groupedPagesAssetTwinFile)
			CONFIGVARS.updateUserConfigContent.groupedPages["Files"].pages.push(CONFIGVARS.groupedPagesAssetTwinFileUpload)
		}
	}
}

async function isAssetAvailable(findUser){
	let assetTableProperty 
	if(checkImportListAccess('Assets')){
		assetTableProperty = getTableViewProps(LIB.assetAttributeCommonName['tableView'])
	}
	console.log(assetTableProperty,'assetTableProperty');
	if ((findUser[0]["Assets"] == "Yes" && isScriptExists("iaf_entass_allusers")) || (LIB.updateFlag && findUser[0]["Assets"] == "Yes")) {
		if(isScriptExists('iaf_entass_allusers')){
			CONFIGVARS.scriptsDescriptors.push(CONFIGVARS.scriptsDescriptorsAssets)
			await getScriptData('iaf_entass_allusers')
		}
		Object.assign(CONFIGVARS.updateUserConfigContent,
			{
				entityDataConfig: {
					...CONFIGVARS.updateUserConfigContent.entityDataConfig,
					Asset: CONFIGVARS.entityDataConfigAssets.entityDataConfig.Asset
				}
			},
			{
				entitySelectConfig: {
					...CONFIGVARS.updateUserConfigContent.entitySelectConfig,
					Asset: CONFIGVARS.entitySelectConfigAssets.entitySelectConfig.Asset
				}
			},
			{
				handlers: {
					...CONFIGVARS.updateUserConfigContent.handlers,
					assets: CONFIGVARS.handlersAsset.handlers.assets
				}
			})

			console.log(CONFIGVARS.entitySelectConfigAssets.entitySelectConfig.Asset[1],'sgpkScript');

		let assetInPages = CONFIGVARS.updateUserConfigContent.groupedPages["Asset Twin"].pages
		console.log(assetInPages,'assetInPages');
		
		if(uniquePages(assetInPages, CONFIGVARS.groupedPagesAssetTwinAsset)){
			CONFIGVARS.updateUserConfigContent.groupedPages["Asset Twin"].pages.push(CONFIGVARS.groupedPagesAssetTwinAsset)
		}

		if(CONFIGVARS.updateUserConfigContent.handlers.assets.config.tableView.component.columns.length === 1 && assetTableProperty){
			console.log(...assetTableProperty,'...assetTableProperty')
			CONFIGVARS.updateUserConfigContent.handlers.assets.config.tableView.component.columns.push(...assetTableProperty)
		}
		if(CONFIGVARS.updateUserConfigContent.entityDataConfig.Asset["Asset Properties"].component.hidden.length === 0 && LIB.assetAttributeCommonName['hiddenProps']){
			CONFIGVARS.updateUserConfigContent.entityDataConfig.Asset["Asset Properties"].component.hidden.push(...LIB.assetAttributeCommonName['hiddenProps'])
		}
		if(Object.values(CONFIGVARS.updateUserConfigContent.entityDataConfig.Asset["Asset Properties"].component.groups).length === 0 && LIB.assetAttributeCommonName['groups']){
			CONFIGVARS.updateUserConfigContent.entityDataConfig.Asset["Asset Properties"].component.groups = LIB.assetAttributeCommonName['groups']; 
		}
	}
}

async function isSpaceAvailable(findUser){
	let spaceTableProperty
	if(checkImportListAccess('Spaces')){
		spaceTableProperty = getTableViewProps(LIB.spaceAttributeCommonName['tableView'])
	}
	console.log(spaceTableProperty,'spaceTableProperty');
	if ((findUser[0]["Spaces"] == "Yes" && isScriptExists("iaf_entspa_allusers")) || (findUser[0]["Spaces"] == "Yes" && LIB.updateFlag)) {
		if(isScriptExists('iaf_entspa_allusers')){
			CONFIGVARS.scriptsDescriptors.push(CONFIGVARS.scriptsDescriptorsSpace)
			await getScriptData('iaf_entspa_allusers')
		}
		Object.assign(CONFIGVARS.updateUserConfigContent,
			{
				entityDataConfig: {
					...CONFIGVARS.updateUserConfigContent.entityDataConfig,
					Space: CONFIGVARS.entityDataConfigSpaces.entityDataConfig.Space
				}
			},
			{
				entitySelectConfig: {
					...CONFIGVARS.updateUserConfigContent.entitySelectConfig,
					Space: CONFIGVARS.entitySelectConfigSpaces.entitySelectConfig.Space
				}
			},
			{
				handlers: {
					...CONFIGVARS.updateUserConfigContent.handlers,
					spaces: CONFIGVARS.handlersSpace.handlers.spaces
				}
			})
		let spaceInPages = CONFIGVARS.updateUserConfigContent.groupedPages["Asset Twin"].pages
		console.log(spaceInPages,'spaceInPages');
		
		if(uniquePages(spaceInPages, CONFIGVARS.groupedPagesAssetTwinSpace)){
			CONFIGVARS.updateUserConfigContent.groupedPages["Asset Twin"].pages.push(CONFIGVARS.groupedPagesAssetTwinSpace)
		}
		if(CONFIGVARS.updateUserConfigContent.handlers.spaces.config.tableView.component.columns.length === 1 && spaceTableProperty){
			console.log(...spaceTableProperty,'...spaceTableProperty')
			CONFIGVARS.updateUserConfigContent.handlers.spaces.config.tableView.component.columns.push(...spaceTableProperty)
		}
		console.log(CONFIGVARS.updateUserConfigContent.entityDataConfig.Space["Space Properties"].component.hidden.length,'spacelength')
		if(CONFIGVARS.updateUserConfigContent.entityDataConfig.Space["Space Properties"].component.hidden.length === 0 && LIB.spaceAttributeCommonName['hiddenProps']){
			CONFIGVARS.updateUserConfigContent.entityDataConfig.Space["Space Properties"].component.hidden.push(...LIB.spaceAttributeCommonName['hiddenProps'])
		}
		if(Object.values(CONFIGVARS.updateUserConfigContent.entityDataConfig.Space["Space Properties"].component.groups).length === 0 && LIB.spaceAttributeCommonName['groups']){
			CONFIGVARS.updateUserConfigContent.entityDataConfig.Space["Space Properties"].component.groups = LIB.spaceAttributeCommonName['groups']; 
		}
	}
}

function uniquePages(arr, obj){
	return arr.findIndex(objs => objs.page === obj.page) === -1
}
async function isNavigatorAvailable(findUser){
	console.log(findUser,'findUser');
	
	let assetTableProperty 
	if(checkImportListAccess('Assets')){
		assetTableProperty = getTableViewProps(LIB.assetAttributeCommonName['tableView'])
	}
	console.log(assetTableProperty,'assetTableProperty');
	let spaceTableProperty
	if(checkImportListAccess('Spaces')){
		spaceTableProperty = getTableViewProps(LIB.spaceAttributeCommonName['tableView'])
	}

if (findUser[0]["Navigator"] == "Yes") {
	if(findUser[0]["Spaces"] == "No" && findUser[0]["Assets"] == "No"){
		Object.assign(CONFIGVARS.updateUserConfigContent,
			{
				handlers: {
					...CONFIGVARS.updateUserConfigContent.handlers,
					navigator: CONFIGVARS.handlersNavigatorPlain.handlers.navigator
				},
			},
			{
				entityDataConfig: {
					...CONFIGVARS.updateUserConfigContent.entityDataConfig,
					"Plain": {}
				}
			},
			{
				entitySelectConfig: {
					...CONFIGVARS.updateUserConfigContent.entitySelectConfig,
					"Plain": []
				}
			}
		)
		let navPages = CONFIGVARS.updateUserConfigContent.groupedPages["Asset Twin"].pages
		console.log(navPages,'navPages');
		
		if(uniquePages(navPages, CONFIGVARS.groupedPagesAssetTwinNav)){
			navPages.push(CONFIGVARS.groupedPagesAssetTwinNav)
		}
	} 
	if(findUser[0]["Spaces"] == "Yes" && findUser[0]["Assets"] == "No"){
		
		Object.assign(CONFIGVARS.updateUserConfigContent,
			{
				handlers: {
					...CONFIGVARS.updateUserConfigContent.handlers,
					navigator: CONFIGVARS.handlersNavigatorSpace.handlers.navigator
				},
			},
			{
				entitySelectConfig: {
					...CONFIGVARS.updateUserConfigContent.entitySelectConfig,
					Space: CONFIGVARS.entitySelectConfigSpaces.entitySelectConfig.Space
				}
			}
		)

		let navConfig = CONFIGVARS.updateUserConfigContent.handlers.navigator.config
		console.log(navConfig,'navConfig-->');

		let navPages = CONFIGVARS.updateUserConfigContent.groupedPages["Asset Twin"].pages
		console.log(navPages,'navPages');
		
		if(uniquePages(navPages, CONFIGVARS.groupedPagesAssetTwinNav)){
			navPages.push(CONFIGVARS.groupedPagesAssetTwinNav)
		}
		console.log(navConfig,'navconfig');
		
		if(navConfig.tableView.Space.component.columns.length === 1 && checkImportListAccess('Spaces')){
			navConfig.tableView.Space.component.columns.push(...spaceTableProperty)
		}
	}
	if(findUser[0]["Spaces"] == "No" && findUser[0]["Assets"] == "Yes"){
		Object.assign(CONFIGVARS.updateUserConfigContent,
			{
				handlers: {
					...CONFIGVARS.updateUserConfigContent.handlers,
					navigator: CONFIGVARS.handlersNavigatorAsset.handlers.navigator
				},
			},
			{
				entitySelectConfig: {
					...CONFIGVARS.updateUserConfigContent.entitySelectConfig,
					Space: CONFIGVARS.entitySelectConfigSpaces.entitySelectConfig.Space
				}
			}
		)

		let navPages = CONFIGVARS.updateUserConfigContent.groupedPages["Asset Twin"].pages
		console.log(navPages,'navPages');
		
		if(uniquePages(navPages, CONFIGVARS.groupedPagesAssetTwinNav)){
			navPages.push(CONFIGVARS.groupedPagesAssetTwinNav)
		}
		if(CONFIGVARS.updateUserConfigContent.handlers.navigator.config.tableView.Asset.component.columns.length === 1 && checkImportListAccess('Assets')){
			CONFIGVARS.updateUserConfigContent.handlers.navigator.config.tableView.Asset.component.columns.push(...assetTableProperty)
		}
	}
	if(findUser[0]["Spaces"] == "Yes" && findUser[0]["Assets"] == "Yes") {
		Object.assign(CONFIGVARS.updateUserConfigContent,
			{
				handlers: {
					...CONFIGVARS.updateUserConfigContent.handlers,
					navigator: CONFIGVARS.handlersNavigator.handlers.navigator
				},
			},
			{
				entitySelectConfig: {
					...CONFIGVARS.updateUserConfigContent.entitySelectConfig,
					Space: CONFIGVARS.entitySelectConfigSpaces.entitySelectConfig.Space
				}
			}
		)
		let navPages = CONFIGVARS.updateUserConfigContent.groupedPages["Asset Twin"].pages
		console.log(navPages,'navPages');
		
		if(uniquePages(navPages, CONFIGVARS.groupedPagesAssetTwinNav)){
			navPages.push(CONFIGVARS.groupedPagesAssetTwinNav)
		}
		if(CONFIGVARS.updateUserConfigContent.handlers.navigator.config.tableView.Asset.component.columns.length === 1 && checkImportListAccess('Assets')){
			CONFIGVARS.updateUserConfigContent.handlers.navigator.config.tableView.Asset.component.columns.push(...assetTableProperty)
		}
		if(CONFIGVARS.updateUserConfigContent.handlers.navigator.config.tableView.Space.component.columns.length === 1 && checkImportListAccess('Spaces')){
			CONFIGVARS.updateUserConfigContent.handlers.navigator.config.tableView.Space.component.columns.push(...spaceTableProperty)
		}
	}

}
}

async function loadScripts(findUser) {

	try{

	await isNavigatorAvailable(findUser)

	if (findUser[0]["ModelElements"] == "Yes" && isScriptExists("iaf_dt_model_elems")) {
		CONFIGVARS.scriptsDescriptors.push(CONFIGVARS.scriptsDescriptorsModelElements)
		await getScriptData('iaf_dt_model_elems')
		Object.assign(CONFIGVARS.updateUserConfigContent,
			{
				entityDataConfig: {
					...CONFIGVARS.updateUserConfigContent.entityDataConfig,
					"Model Element": CONFIGVARS.entityDataConfigModelElements.entityDataConfig["Model Element"]
				}
			},
			{
				entitySelectConfig: {
					...CONFIGVARS.updateUserConfigContent.entitySelectConfig,
					"Model Element": CONFIGVARS.entitySelectConfigModelElement.entitySelectConfig["Model Element"]
				}
			},
			{
				handlers: {
					...CONFIGVARS.updateUserConfigContent.handlers,
					modelelems: CONFIGVARS.handlersModelElements.handlers.modelelems
				}
			})
			CONFIGVARS.updateUserConfigContent.groupedPages["Asset Twin"].pages.push(CONFIGVARS.groupedPagesAssetTwinModelElement)
	}


	if (findUser[0]["SGPK Upload"] == "Yes" && isScriptExists("iaf_sgpk_allusers")) {
		CONFIGVARS.scriptsDescriptors.push(CONFIGVARS.scriptsDescriptorsSgpk,CONFIGVARS.scriptsDescriptorsModelImport, CONFIGVARS.scriptsDescriptorsMapElems)
		await getScriptData('iaf_sgpk_allusers')
		await getScriptData('iaf_import_model')
	}

	await isAssetAvailable(findUser)
	await isSpaceAvailable(findUser)
	await isFilesAvailable(findUser)

	if (findUser[0]["Collections"] == "Yes" && isScriptExists("iaf_collect_allusers")) {
		CONFIGVARS.scriptsDescriptors.push(CONFIGVARS.scriptsDescriptorsColls)
		await getScriptData('iaf_collect_allusers')
		Object.assign(CONFIGVARS.updateUserConfigContent,
			{ entitySelectConfig: { ...CONFIGVARS.updateUserConfigContent.entitySelectConfig, Collection: CONFIGVARS.entitySelectConfigCollection.entitySelectConfig.Collection } },
			{ handlers: { ...CONFIGVARS.updateUserConfigContent.handlers, collections: CONFIGVARS.handlerCollection.handlers.collections } })
			CONFIGVARS.updateUserConfigContent.groupedPages["Asset Twin"].pages.push(CONFIGVARS.groupedPagesAssetTwinColl)
	}



	CONFIGVARS.scriptsDescriptors.push(CONFIGVARS.scriptsDescriptorsDtTypes)
	await getScriptData('iaf_dt_types')

	CONFIGVARS.scriptsDescriptors.push(CONFIGVARS.scriptsDescriptorsProjColls)
	await getScriptData('iaf_dt_proj_colls')

	CONFIGVARS.scriptsDescriptors.push(CONFIGVARS.scriptsDescriptorsAssetMapType)
	await getScriptData('iaf_dt_type_map')

	CONFIGVARS.scriptsDescriptors.push(CONFIGVARS.scriptsDescriptorsMapElems)
	await getScriptData('iaf_map_elms_type')

	CONFIGVARS.scriptsDescriptors.push(CONFIGVARS.scriptsDescriptorsModelRepValidation)
	await getScriptData('iaf_ext_val_scr')
	} catch(e){
		throw e
	}
}

async function isDocumentAttrAvailable(){
	try{
    let documentAttrExcelFileRead = _.get(LIB.wbJSON, "Document Attributes");
	console.log(documentAttrExcelFileRead, "documentAttrExcelFileRead")

	if(documentAttrExcelFileRead && checkImportListAccess('DocumentAttributes')){
		LIB.documentAttributeCommonName = documentAttrExcelFileRead[0].filter(val => val !== 'TableView' && val)
		console.log(LIB.documentAttributeCommonName, "documentAttributeCommonName")
	
		let tableProps = LIB.UiUtils.IafDataPlugin.parseGridData({ gridData: documentAttrExcelFileRead });
		let tableViewDatas = tableProps.filter(tableData => tableData.TableView)
		LIB.documentAttributeCommonName['tableView'] = tableViewDatas
	} else {
		console.error('Missing Document Attributes tab or DocumentAttributes kept No')
	}
	} catch(e){
		throw e
	}
}
async function isAssetPropsAvailable(){
	try{
	let assetAttributeCollectionsFromExcel = _.get(LIB.wbJSON, "Assets");
	console.log(assetAttributeCollectionsFromExcel, "assetAttributeCollectionsFromExcel")
	LIB.assetAttributeCommonName = assetAttributeCollectionsFromExcel !== undefined ? assetAttributeCollectionsFromExcel[0] : []
	console.log(LIB.assetAttributeCommonName, "LIB.assetAttributeCommonName")
	
	let propsUnfiltered = LIB.wbJSON["Asset Property Info"]
	
	if(propsUnfiltered && checkImportListAccess('Assets')){
		let hiddenprops = propsUnfiltered.filter(attr => JSON.stringify(attr) !== '{}' && attr.length)
		console.log(hiddenprops,'hiddenprops--');
		let groups = {}
		var groupLength = 0
			hiddenprops.map((groupsdata,i) => {
				if(i == 0){
					groupsdata.map((data,j) => {
						if(data == 'Groups'){
							groupLength = j 
						}
					})
				}
				console.log(groupLength,'groupLength')
				if(groupsdata[groupLength] !== undefined && i > 0){
					let groupsData = groupsdata[groupLength + 1].split(',')
					let trimData = groupsData.map(x => x.trim())
					groups[groupsdata[groupLength]] = trimData
				}
			})
		console.log(groups,'groups')
		LIB.assetAttributeCommonName['groups'] = groups
		let hiddenpropsParsed = LIB.UiUtils.IafDataPlugin.parseGridData({ gridData: hiddenprops });
		//console.log(hiddenpropsParsed, 'asset property')
		let hiddenProps = hiddenpropsParsed.filter(props => props.Hidden).map(hidden => hidden.Hidden)
		let tableView = hiddenpropsParsed.filter(props => props.TableView)
		console.log(tableView,'tableView')
		console.log(hiddenProps,'hiddenProps')
		LIB.assetAttributeCommonName['hiddenProps'] = hiddenProps
		LIB.assetAttributeCommonName['tableView'] = tableView
		console.log(LIB.assetAttributeCommonName, "assetAttributeDatas")
	} else {
		console.error('Missing Property or Assets kept No')
	}
	} catch(e){
		throw e
	}
}
async function isSpacePropsAvailable(){
	try{
	let spaceAttributeCollectionsFromExcel = _.get(LIB.wbJSON, "Spaces");
	LIB.spaceAttributeCommonName = spaceAttributeCollectionsFromExcel === undefined ? [] : spaceAttributeCollectionsFromExcel[0]
	console.log(LIB.spaceAttributeCommonName, "LIB.spaceAttributeCommonName")

	 const spacePropsUnfiltered = LIB.wbJSON['Space Property Info']
	// console.log(spaceProps,'spaceprops')
	if(spacePropsUnfiltered && checkImportListAccess('Spaces')){
		let spaceProps = spacePropsUnfiltered.filter(attr => JSON.stringify(attr) !== '{}' && attr.length)
		let spaceGroups = {}
		var spaceGroupLen = 0
		spaceProps.map((groupsdata,i) => {
			if(i == 0){
				groupsdata.map((data,j) => {
					if(data == 'Groups'){
						spaceGroupLen = j 
					}
				})
			}
			console.log(spaceGroupLen,'spaceGroupLen')
			if(groupsdata[spaceGroupLen] !== undefined && i > 0){
				let spaceGroup = groupsdata[spaceGroupLen + 1].split(',')
				let trimmedData = spaceGroup.map(x => x.trim())
				spaceGroups[groupsdata[spaceGroupLen]] = trimmedData
			}
		})
		let hiddenSpaceProps = LIB.UiUtils.IafDataPlugin.parseGridData({ gridData: spaceProps });
		let hiddenSpaceDatas = hiddenSpaceProps.filter(props => props.Hidden).map(hidden => hidden.Hidden)
		LIB.spaceAttributeCommonName['hiddenProps'] = hiddenSpaceDatas

		console.log(spaceGroups,'spaceGroups')
		LIB.spaceAttributeCommonName['groups'] = spaceGroups

		let spaceTableView = hiddenSpaceProps.filter(table => table.TableView)
		LIB.spaceAttributeCommonName['tableView'] = spaceTableView
	} else{
		console.error('Missing sheet or Assets kept no')
	}
	} catch(e){
		throw e
	}
}

async function bulkUploadFileWithAttributes() {
	let iaf_ext_files_coll = await LIB.IafScriptEngine.getFileCollection({
		_userType: "file_container",
		_shortName: "Root Container"
	}, LIB.ctx)
	const containerObj = await LIB.PlatformApi.IafFile.getRootContainer(LIB.proj, LIB.ctx);

	let iaf_dt_grid_data = LIB.wbJSON["File List"];
	let data_as_objects = await LIB.UiUtils.IafDataPlugin.parseGridData({ gridData: iaf_dt_grid_data });
	let selectedSheetData = {};
	data_as_objects.forEach(function (item) {
		var fileName = item['File Name'];
		for (var key in item) {
			if (item[key] === undefined) {
				item[key] = '';
			}
		}
		delete item['File Name']
		selectedSheetData[fileName] = item;
	});
	let actualPath = getLocalPaths('Files Path')
	let selectFiles = fs.readdirSync(actualPath);
	// console.log('Selected file--------->',selectFiles);
  
	let missingFiles = [];
	let sucessUploadFiles = [];
	let failerUploadFiles = [];
	let allSucessFiles = []
	const selectFilesName = [];
	const fileUploadPromises = [];
	if (selectFiles.length > 100) {
		const chunkSize = 50;
		for (let i = 0; i < selectFiles.length; i += chunkSize) {
			const chunkPromises = [];
			for (let j = i; j < Math.min(i + chunkSize, selectFiles.length); j++) {
				const fileItem = selectFiles[j];
				selectFilesName.push(fileItem)
				if (!selectedSheetData.hasOwnProperty(fileItem)) {
					missingFiles.push({ "Missing in sheet File Name": fileItem });
					console.log('file not present in sheet:->', fileItem);
				} else {
					console.log('file present in sheet:->', fileItem);
					const path = actualPath + fileItem
					let fileBuffer = fs.readFileSync(path);

					fileBuffer.fileItem={
						fileAttributes: selectedSheetData[fileItem]
					}
					console.log('file object with attribute:----->>',fileBuffer)
					const uploadPromise = new Promise((resolve, reject) => {
						LIB.PlatformApi.IafFile.uploadFileResumable(containerObj, fileBuffer, {
							filename: fileItem,
							onComplete: (fileItem) => {
								resolve({ "status": "success", "fileName": fileItem });
							},
							onError: (error) => {
								reject({ "status": "rejected", "error": error, "fileName": fileItem });
							},
						}, LIB.ctx).catch((error) => {
							reject({ "status": "rejected", "error": error, "fileName": fileItem })
						})
					});
					chunkPromises.push(uploadPromise);
				}
			}
			await Promise.allSettled(chunkPromises).then((finalData) => {
				finalData.forEach((settledPromise) => {
					if (settledPromise.status === 'fulfilled') {
						const result = settledPromise.value;
						sucessUploadFiles.push({ "Success File Name": result.fileName.name });
						allSucessFiles.push(result.fileName)
					} else if (settledPromise.status === 'rejected') {
						const reason = settledPromise.reason;
						console.log('in side fail reson :------>',reason)
						failerUploadFiles.push({ "Failed File Name": reason.fileName.name });
					}
				});
			});
		}
	} else {
		for (const fileItem of selectFiles) {
			console.log(fileItem, 'fileItem');
			selectFilesName.push(fileItem)
			if (!selectedSheetData.hasOwnProperty(fileItem)) {
				missingFiles.push({ "Missing File Name": fileItem });
				console.log('file not present in sheet:->', fileItem);
			} else {
				console.log('file present in sheet:->', fileItem);
				//const path = fileItem.uri._fsPath;
				const path = actualPath + fileItem
				let fileBuffer = fs.readFileSync(path);

				fileBuffer.fileItem={
					fileAttributes: selectedSheetData[fileItem]
				}
				console.log('file object with attribute:----->>',fileBuffer)
				const uploadPromise = new Promise((resolve, reject) => {
					LIB.PlatformApi.IafFile.uploadFileResumable(containerObj, fileBuffer, {
						filename: fileItem,
						onComplete: (fileItem) => {
							resolve({ "status": "sucess", "fileName": fileItem })
						},
						onError: (error) => {
							reject({ "status": "rejected", "error": error, "fileName": fileItem })
						}
					}, LIB.ctx).catch((error) => {
						reject({ "status": "rejected", "error": error, "fileName": fileItem })
					});
				});
				fileUploadPromises.push(uploadPromise);
			}
		}
		await Promise.allSettled(fileUploadPromises).then((finalData) => {
			finalData.forEach((settledPromise) => {
				if (settledPromise.status === 'fulfilled') {
					const result = settledPromise.value;
					console.log(result, 'result');
					sucessUploadFiles.push({ "Success File Name": result.fileName.name });
					allSucessFiles.push(result.fileName)
				} else if (settledPromise.status === 'rejected') {
					const reason = settledPromise.reason;
					failerUploadFiles.push({ "Failed File Name": reason.fileName.name });
				}
			});
		});
	}

	let missingUpload = [];
	for (const keys in selectedSheetData) {
		if (!selectFilesName.includes(keys)) {
			missingUpload.push({ "Missing in folder File Name": keys })
		}
	}
	let finalFailedFiles = [];
	for (let i = 0; i < failerUploadFiles.length; i++) {
		let item = failerUploadFiles[i];
		let fileItems = await LIB.IafScriptEngine.getFileItems(
			{
				collectionDesc: { _userType: iaf_ext_files_coll._userType, _userItemId: iaf_ext_files_coll._userItemId },
				query: { "name": item['Failed File Name'] },
				options: { page: { getAllItems: true } }
			}, LIB.ctx);
		if (fileItems.length == 0) {
			finalFailedFiles.push(item);
		}
		else {
			if (!allSucessFiles.includes(item['Failed File Name'])) {
				console.log('file not include in sucess...')
				sucessUploadFiles.push({ "Success File Name": item['Failed File Name'] })
			}
			else {
				console.log('file pressenttttt in sucessss......')
			}
		}
	}
	if (missingFiles.length > 0) {
		missingFiles[0].Count = missingFiles.length;
		console.log(missingFiles,'missingfiles--')
		let saveReportDatas = {}
		saveReportDatas.sheetHeaderName = 'Missing in sheet File Name'
		saveReportDatas.sheetName = 'Missing_File_In_Sheet'
		saveReportDatas.files = missingFiles
		await saveBulkUploadReport(saveReportDatas)
		
	}

	if (sucessUploadFiles.length > 0) {
		sucessUploadFiles[0].Count = sucessUploadFiles.length;
		console.log(sucessUploadFiles,'sucessUploadFiles--')
		let saveReportDatas = {}
		saveReportDatas.sheetHeaderName = 'Success File Name'
		saveReportDatas.sheetName = 'Successfully_Upload'
		saveReportDatas.files = sucessUploadFiles
		await saveBulkUploadReport(saveReportDatas)
	}

	if (finalFailedFiles.length > 0) {
		finalFailedFiles[0].Count = finalFailedFiles.length;
		console.log(finalFailedFiles,'finalFailedFiles--')
		let saveReportDatas = {}
		saveReportDatas.sheetHeaderName = 'Failed File Name'
		saveReportDatas.sheetName = 'Failed_To_Upload'
		saveReportDatas.files = finalFailedFiles
		await saveBulkUploadReport(saveReportDatas)
	}

	if (missingUpload.length > 0) {
		missingUpload[0].Count = missingUpload.length;
		console.log(missingUpload,'missingUpload--')
		let saveReportDatas = {}
		saveReportDatas.sheetHeaderName = 'Missing in folder File Name'
		saveReportDatas.sheetName = 'Missing_File_In_Folder'
		saveReportDatas.files = missingUpload
		await saveBulkUploadReport(saveReportDatas)
	}
	console.log(missingFiles, 'missingFiles');
	console.log(sucessUploadFiles, 'sucessUploadFiles');
	console.log(finalFailedFiles, 'finalFailedFiles');
	console.log(missingUpload, 'missingUpload');
	return
}
function convertMillisecondsToReadable(milliseconds) {
	const date = new Date(milliseconds);
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const seconds = date.getSeconds();
  
	const readableFormat = `${hours}h:${minutes}m:${seconds}s`;
	return readableFormat;
  }
function logScriptExecutionTime(startTime, endTime) {
	try{
	const readableStartDateTime = convertMillisecondsToReadable(startTime);
	console.log("Export Script execution start time - ", readableStartDateTime);
	const readableEndDateTime = convertMillisecondsToReadable(endTime);
	console.log("Export Script execution end time - ", readableEndDateTime);
	const executionTime = endTime - startTime; // Calculate the execution time in milliseconds
  
	const milliseconds = executionTime;
  
	const seconds = Math.floor((milliseconds / 1000) % 60);
  
	const minutes = Math.floor((milliseconds / 1000 / 60) % 60);
  
	const hours = Math.floor((milliseconds / 1000 / 60 / 60) % 24);
  
	const exportTotalTimeTaken = [hours.toString().padStart(2, "0") + "h", minutes.toString().padStart(2, "0") + "m", seconds.toString().padStart(2, "0") + "s"].join(":");
  
	console.log("Script execution total time taken - ", exportTotalTimeTaken);
	} catch(err){
	  throw err
	}
  }
  async function assetFilesRelation(){
	let iaf_dt_grid_data = LIB.wbJSON['Assets and Files']

	if (iaf_dt_grid_data) {
		let iaf_asset_collection = await LIB.IafScriptEngine.getCollection(
			{
				"_userType": "iaf_ext_asset_coll",
				"_shortName": "asset_coll",
				"_itemClass": "NamedUserCollection"
			}, LIB.ctx
		)

		if(iaf_asset_collection == undefined){
			console.log('Asset collection not present!')
			return false
		}
		console.log(iaf_asset_collection, 'iaf_asset_collection');

		let assets = await LIB.IafScriptEngine.getItems({
			"_userItemId": iaf_asset_collection._userItemId,
			"options": { "page": { "getAllItems": true } }
		}, LIB.ctx)

		console.log(assets.length, 'length');
		let fileCollection = await LIB.IafScriptEngine.getFileCollection({
			_userType: "file_container",
			_shortName: "Root Container"
		}, LIB.ctx)
		console.log(fileCollection, "fileCollection")
		if(fileCollection == undefined){
			console.log('File collection not present')
			return false
		}
		let allDocs = await LIB.IafScriptEngine.getFileItems({
			collectionDesc: {
				_userItemId: fileCollection._userItemId,
				_namespaces: LIB.ctx._namespaces
			},
			query: {},
			options: { page: { getAllItems: true } }
		}, LIB.ctx)
		console.log(allDocs[0], "allDocs")
		let assetObj = LIB.UiUtils.IafDataPlugin.parseGridData({ gridData: iaf_dt_grid_data })
		let relatedItems = assetObj.map(asset => {
			//console.log(asset,'asset');
			let val = _.filter(assets, item => item["Asset Name"] == asset['Asset Name']);
			//console.log(val, 'val');
			return {
				parentItem: { _id: val[0]._id },
				relatedItems: asset["File Name"].split('/').map(item => {
					let relItems = allDocs.filter(doc => {
						if (doc['name'] === item) {
							return { _id: doc._id }
						}
					})
					//console.log(relItems, 'relItems');
					if(relItems.length){
						return { _id: relItems[0]._id }
					} else {
						console.log('File Not exist!')
						return false
					}
				})
			}
		})
		//console.log(relatedItems, 'relatedItems');
		let relations = {
			parentUserItemId: iaf_asset_collection._userItemId,
			_userItemId: fileCollection._userItemId,
			_namespaces: LIB.ctx._namespaces,
			relations: relatedItems
		}
		console.log('Creating relation between assets and files')
		let relationResult = await LIB.IafScriptEngine.createRelations(relations, LIB.ctx);
		console.log('relationResult', relationResult)
		let final = { success: true }
		console.log(final, 'Assets and Files Relation Imported');
	} else {
		console.log('No Data in Assets and Files Relation sheet!')
	}
}
async function updateFiles(findUser, content) {
	LIB.updateFlag = true

	//If assets or spaces is updated then table view of navigator will be updated
	if(checkImportListAccess('Assets') || checkImportListAccess('Spaces')){

		//This function is used to update the table view of navigator
		await isNavigatorAvailable(findUser)
	}
	if(checkImportListAccess('Assets')){

		//If assets is yes in import list sheet then entityDataConfig, entitySelectConfig, handler will be updated
		await isAssetAvailable(findUser)
	}
	if(checkImportListAccess('Spaces')){

		//If spaces is yes in import list sheet then entityDataConfig, entitySelectConfig, handler will be updated
		await isSpaceAvailable(findUser)
	}
	if(checkImportListAccess('DocumentAttributes')){

		//If DocumentAttributes is yes in import list sheet then entityDataConfig, entitySelectConfig, handler will be updated
		await isFilesAvailable(findUser)
	}
	console.log(CONFIGVARS.updateUserConfigContent,'updateUserConfigContent');
	
	// console.log(configJson,'JSON.stringify')
	const userData = {_userData: JSON.stringify(CONFIGVARS.updateUserConfigContent)}
	await LIB.PlatformApi.IafUserConfig.createVersion(content._id, userData, LIB.ctx);
	Object.assign(CONFIGVARS.updateUserConfigContent, CONFIGVARS.resetUserConfigContent)
}
async function updateConfig(){
	try{
		const criteria = { 
			_usertype: LIB.proj._usertype, 
			_name: LIB.proj._name 
		  };
		  
		  const userConfigs = await LIB.PlatformApi.IafUserConfig.getUserConfigs(criteria, LIB.ctx);

		  for(let i = 0; i < userConfigs.length; i++){
			let content = userConfigs[i]
				console.log(content,'content');
				let configJson = JSON.parse(content._versions[0]._userData)
				console.log(configJson,'cont')
				let findUser = LIB.xlsConfigDataParsed.filter(x => x.UserGroupName == content._name.replace('DBM ',''))
				CONFIGVARS.updateUserConfigContent = configJson

				//This function is used to update config files
				//finduser has the user detaills eg: asset : yes, space : yes, navigator: no
				//content has the config data
				await updateFiles(findUser, content)
		  }
	} catch(e){
		throw e
	}
}

let ProjSetup = {



	getRunnableScripts() {
		return RunnableScripts
	},

	async easyAssetTwinSetup(input, libraries, ctx, callback) {
		
		let { PlatformApi, UiUtils, IafScriptEngine } = libraries;
		let proj = await PlatformApi.IafProj.getCurrent(ctx);

		// LOAD ALL REUSABLE LIB
		LIB.IafScriptEngine = IafScriptEngine;
		LIB.PlatformApi = PlatformApi;
		LIB.ctx = ctx;
		LIB.input = input;
		LIB.UiUtils = UiUtils;
		LIB.proj = proj;

			//This function used to check all the available scripts
			await scriptList()

			//This function used to select the config sheet
			await selectConfigSheet()
			const startTime = new Date().getTime()
		
			//This function used to validate the sheet
			if(await validate()){
				//This function is used to check table view data in Document Attributes sheet
				//if table view data exist the table header names would be store in a variable documentAttributeCommonName
				//and when load the scripts table headers would be added to the config
				await isDocumentAttrAvailable()

				//This function used to get asset properties from asset property info sheet eg: hidden, groups, property set and table view datas
				//and set in a variabe to push into config file when condition matched
				await isAssetPropsAvailable()

				//This function used to get space propertis from space property info sheet eg: hidden, groups, property set and table view datas
				//and set in a variabe to push into config file when condition matched
				await isSpacePropsAvailable()

				//This function used to set the local script path
				await setLocalScriptPath()
		
				//This function is used to get user group details from config sheet eg: asset as Yes, space as No
				//Load the script, create the handler for manage model and admin for solution admin and project admin usergroup 
				await isUserGroupAvailable()

				//This function is used to create the user group
				await createUserGroups()

				//This function is used to create userconfigs
				await userConfigsLoader()

				//This function is used to load the required scripts
				await scriptsLoader()

				//This function is used to create or recreate indexes for file
				await updateFilecreateOrRecreateIndex()

				//This functin is used to create or recreate collections collection and create index for the collection
				await createOrRecreateCollectionsCollection()

				//This function is used to upload the model and import the model
				await modelUploadAndImport(callback)

				//This function is used to create collection for FDM File Attrib Collection
				//and create items using Document Attributes sheet objects
				await setupCDELoader()
		
				if(checkImportListAccess('BulkFileUpload')){
				//This function used to upload files bulk using file list sheet 
					await bulkUploadFileWithAttributes()
				}
				if(checkImportListAccess('AssetFileRelation')){
				//This function is used to create rellatioon between assets and files using Assets and Files sheet
					await assetFilesRelation()
				}
				//If assets and spaces is yes from import list sheet then relation will be created according to a unique property 
				if(checkImportListAccess('Assets') && checkImportListAccess('Spaces')){
					//This function is used to create relation between asset and space using a unique property
					await createAssetSpaceReln()
				}
			}
			const endTime = new Date().getTime()
			logScriptExecutionTime(startTime, endTime); 
	},
	async updateEasyAssetProject(input, libraries, ctx, callback) {
		
		let { PlatformApi, UiUtils, IafScriptEngine } = libraries;
		let proj = await PlatformApi.IafProj.getCurrent(ctx);
		console.log(proj,'project');
		

		// LOAD ALL REUSABLE LIB
		LIB.IafScriptEngine = IafScriptEngine;
		LIB.PlatformApi = PlatformApi;
		LIB.ctx = ctx;
		LIB.input = input;
		LIB.UiUtils = UiUtils;
		LIB.proj = proj;

		  
		//This function used to check all the available scripts
		await scriptList()
		//This function used to select the config sheet
		await selectConfigSheet()
		const startTime = new Date().getTime()

		//This function used to validate the sheet
			if(await validate()){
				//This function used to set the local script path
				await setLocalScriptPath()
		
				//This function is used to load the scripts in server
				await scriptsLoader()
				
				//This function is used to check model import from import list sheet. if yes then proceed
				if(checkImportListAccess('ModelImport')){
					//This function is used to upload the model and import the model 
					await modelUploadAndImport(callback)
				} else {
					//This function is used to check if sgpk model exist in server
					if(await getExistingModel('sgpk')){
						//This function is used to check assets in import list if yes and if model is exist then assets will be import
						if(checkImportListAccess('Assets')){
							//This function is used to import modeled assets
							await importModeledAssets('yesModel')
						}
						//This function is used to check Spaces in import list if yes and if model is exist then spaces will be import
						if(checkImportListAccess('Spaces')){
							//This function is used to import modeled spaces
							await importModeledSpaces('yesModel')
						}
					} else {
						if(checkImportListAccess('Assets')){
							//This function is used to import modeled assets
							await importModeledAssets('noModel')
						}
						if(checkImportListAccess('Spaces')){
							//This function is used to import modeled assets
							await importModeledSpaces('noModel')
						}
					}
				} 

				//This function used to check assets from import list sheet 
				if(checkImportListAccess('Assets')){
					//This function used to get asset properties from asset property info sheet eg: hidden, groups, property set and table view datas
					//and set in a variabe to push into config file when condition matched
					await isAssetPropsAvailable()
				}
				//This function used to validate spaces from import list sheet
				if(checkImportListAccess('Spaces')){
					//This function used to get space propertis from space property info sheet eg: hidden, groups, property set and table view datas
					//and set in a variabe to push into config file when condition matched
					await isSpacePropsAvailable()
				}
				//This function is used to check DocumentAttributes from import list
				if(checkImportListAccess('DocumentAttributes')){
					//This function is used to check table view data in Document Attributes sheet
					//if table view data exist the table header names would be store in a variable documentAttributeCommonName
					//and when load the scripts table headers would be added to the config
					await isDocumentAttrAvailable()
					//This function is used to create collection for FDM File Attrib Collection
					//and create items using Document Attributes sheet objects
					await setupCDELoader()
				}
				//This function is used to get config data from server as json, update the config and save to server with new version 
				await updateConfig()

				//If asset or space updated then relation will be created according to a unique property 
				if(checkImportListAccess('BulkFileUpload')){
				//This function used to upload files bulk using file list sheet
					await bulkUploadFileWithAttributes()
				}
				if(checkImportListAccess('AssetFileRelation')){
				//This function is used to create rellatioon between assets and files using Assets and Files sheet
					await assetFilesRelation()
				}
				if(checkImportListAccess('Assets') || checkImportListAccess('Spaces')){
					//This function is used to create relation between asset and space using a unique property
					await createAssetSpaceReln()
				}

			}
			const endTime = new Date().getTime()
			logScriptExecutionTime(startTime, endTime); 
	}
}

export default ProjSetup