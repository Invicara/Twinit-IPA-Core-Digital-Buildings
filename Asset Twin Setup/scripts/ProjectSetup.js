
let RunnableScripts = [
	{ name: "One Click Project Setup", script: "oneClickSetup" }
]

import fs from 'fs'

let bimpOrchResultId

async function createUserGroups(input, libraries, ctx, userGroupDescriptors) {
	let { PlatformApi, IafScriptEngine } = libraries

	let proj = await PlatformApi.IafProj.getCurrent(ctx)
	console.log(proj, "proj")
	let res
	try {
		res = await PlatformApi.IafProj.addUserGroups(proj, userGroupDescriptors, ctx);
	} catch (e) {
		res = undefined;
		throw e;
	}

	return res
}
async function userConfigsLoader(input, libraries, ctx) {

	let { PlatformApi, UiUtils } = libraries

	let proj = await PlatformApi.IafProj.getCurrent(ctx)

	// let userGroups = await PlatformApi.IafProj.getUserGroups(proj, ctx)
	// console.log(userGroups, "userGroups-configloader-first")


	const delay = (ms, value) =>
		new Promise(resolve => setTimeout(resolve, ms, value));

	async function childFunction() {
		return await Promise.all([getUserGroupsFetchDelay()]);
	}

	async function getUserGroupsFetchDelay() {
		const result = await delay(15000, "true");
		let proj = await PlatformApi.IafProj.getCurrent(ctx)

		let userGroups = await PlatformApi.IafProj.getUserGroups(proj, ctx)
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
			let proj = await PlatformApi.IafProj.getCurrent(ctx)

			let userGroups = await PlatformApi.IafProj.getUserGroups(proj, ctx)
			console.log(userGroups, "userGroups-configloader-insidemainfunc")

			//load content of the user configs 
			let parsed = configContents.map(x => JSON.parse(x))
			let configs = _.zip(configNames, parsed)
			console.log(configs, "configs-configloader")
			let configDefs = _.map(configs, (c) => {
				return { configName: c[0], configContent: c[1] }
			})

			//create configItems
			let configItems = []
			configDefs.forEach((c) => {
				let item = _.find(userConfigDescriptors, { _shortName: c.configName })
				if (item) {
					item._version = { _userData: JSON.stringify(c.configContent, null, 2) }
					configItems.push(item)
				}
			})
			console.log(configItems, "configItems-configloader")


			let groupItems = []

			configDefs.forEach((c) => {
				let group = _.find(userConfigToUserGroupMap, { userConfig: c.configName })
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
				let result = await PlatformApi.IafUserGroup.addUserConfigs(configsAndGroupDefs[i].userGroup, [configsAndGroupDefs[i].userConfig], ctx);
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

}

async function scriptsLoader(input, libraries, ctx) {

	let { PlatformApi, UiUtils } = libraries

	let proj = await PlatformApi.IafProj.getCurrent(ctx)

	let scripts = _.zip(Array.from(scriptNames), scriptContents)
	console.log(scripts, "scripts")

	let scriptDefs = _.map(scripts, (s) => {
		return { scriptName: s[0], scriptContent: s[1] }
	})
	console.log(scriptDefs, "scriptDefs")

	let scriptItems = []
	scriptDefs.forEach((c) => {
		let item = _.find(scriptsDescriptors, { _shortName: c.scriptName })
		if (item) {
			item._version = { _userData: c.scriptContent };
			item._namespaces = proj._namespaces
			scriptItems.push(item)
		}
	})

	console.log(scriptItems, "scriptItems")
	let results = await PlatformApi.IafScripts.create(scriptItems, ctx);
	console.log(results, "results")
	if (results && results._list) {
		results = results._list;
	}
	console.log(results, "inside-scriptloader")

	return results

}
async function createOrRecreateBIMPKDatasource(input, libraries, ctx) {

		let { PlatformApi, IafScriptEngine } = libraries
	
		let proj = await PlatformApi.IafProj.getCurrent(ctx)
	
		const query = {
		  _namespaces: proj._namespaces,
		  _userType: "bimpk_uploader"
		};
	
		const datasources = await IafScriptEngine.getDatasources(query, ctx);
	
		const filteredDatasources = _.filter(datasources, d => d._userType === "bimpk_uploader"
		  && d._name === "BIMPK Uploader");
	
		_.each(filteredDatasources, async datasource => await IafScriptEngine.removeDatasource({ orchId: datasource.id }, ctx));
	
		let datasourceResult = await IafScriptEngine.addDatasource(
			{
				_name: "BIMPK Uploader",
				_description: "BIMPK Uploader",
				_namespaces: proj._namespaces,
				_userType: "bimpk_uploader",
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
			}, ctx
		)
		return datasourceResult;
}
async function createOrRecreateRemapElementsTypeDatasource(input, libraries, ctx) {

	let { PlatformApi, IafScriptEngine } = libraries

	let proj = await PlatformApi.IafProj.getCurrent(ctx)

	const query = {
		_namespaces: proj._namespaces,
		_userType: "map_elements_type"
	};

	const datasources = await IafScriptEngine.getDatasources(query, ctx);

	const filteredDatasources = _.filter(datasources, d => d._userType === "map_elements_type"
		&& d._name === "Map Elements type");

	_.each(filteredDatasources, async datasource => await IafScriptEngine.removeDatasource({ orchId: datasource.id }, ctx));

	let datasourceResult = await IafScriptEngine.addDatasource(
		{
			_name: "Map Elements type",
			_description: "Orchestrator to map elements to dtCategory and dtType from type map coll",
			_namespaces: proj._namespaces,
			_userType: "map_elements_type",
			_params: {
				tasks: [
					{
						_orchcomp: "default_script_target",
						_name: "Map type map to elements",
						_sequenceno: 1,
						"_actualparams": {
							"userType": "iaf_map_elms_type",
							"_scriptName": "mapAssetCollection"
						}
					}
				]
			}
		}, ctx
	)
	return datasourceResult;
}
async function createOrRecreateSGPKDatasource(input, libraries, ctx) {

	let { PlatformApi, IafScriptEngine } = libraries

	let proj = await PlatformApi.IafProj.getCurrent(ctx)

	const query = {
		_namespaces: proj._namespaces,
		_userType: "sgpk_uploader"
	};

	const datasources = await IafScriptEngine.getDatasources(query, ctx);

	const filteredDatasources = _.filter(datasources, d => d._userType === "sgpk_uploader"
		&& d._name === "SGPK Uploader");

	_.each(filteredDatasources, async datasource => await IafScriptEngine.removeDatasource({ orchId: datasource.id }, ctx));

	let datasourceResult = await IafScriptEngine.addDatasource(
		{
			_name: "SGPK Uploader",
			_description: "Orchestrator to upload model from SGPK file",
			_namespaces: proj._namespaces,
			_userType: "sgpk_uploader",
			_params: {
				tasks: [
					{
						name: "scz_relations_target",
						_sequenceno: 3
					},
					{
						name: "default_script_target",
						"_actualparams": {
							"userType": "iaf_sgpk_upload",
							"_scriptName": "uploadSGPK"
						},
						_sequenceno: 2
					},
					{
						name: "generic_compressed_file_extractor",
						_sequenceno: 1
					}
				]
			}
		}, ctx
	)
	return datasourceResult;
}

async function typeMapLoader(input, libraries, ctx, bimTypeCollections) {

	let { PlatformApi, UiUtils, IafScriptEngine } = libraries

	let proj = await PlatformApi.IafProj.getCurrent(ctx)

	let atm_defs_coll = await IafScriptEngine.createOrRecreateCollection(
		{
			_name: 'ATM Def Collection',
			_shortName: 'typemap_defs',
			_namespaces: proj._namespaces,
			_description: 'Asset Type Map Collection',
			_userType: 'iaf_dt_type_map_defs_coll'
		}, ctx)

	console.log("Type Map Collection", atm_defs_coll)

	let atm_defs_items_res = await IafScriptEngine.createItemsBulk({
		_userItemId: atm_defs_coll._userItemId,
		_namespaces: proj._namespaces,
		items: bimTypeCollections
	}, ctx)

	return atm_defs_items_res
}

async function setupCDELoader(input, libraries, ctx, documentAttributeCollections_as_objects) {
	console.log(documentAttributeCollections_as_objects, "documentAttributes-Collection")
	let { PlatformApi, UiUtils, IafScriptEngine } = libraries

	let proj = await PlatformApi.IafProj.getCurrent(ctx)


	let file_attrib_coll = await IafScriptEngine.createOrRecreateCollection(
		{
			_name: "FDM File Attrib Collection",
			_shortName: "devConfigfileattrib",
			_namespaces: proj._namespaces,
			_description: "FDM File Attribute Collection",
			_userType: "iaf_cde_file_attrib_coll"
		}, ctx)

	console.log("file_attrib_coll", file_attrib_coll)

	let file_attribs = await IafScriptEngine.createItems({
		_userItemId: file_attrib_coll._userItemId,
		_namespaces: proj._namespaces,
		items: documentAttributeCollections_as_objects
	}, ctx)

	console.log(file_attribs, "file_attribs")
	return file_attribs
}

async function importModeledAssets(input, libraries, ctx, iaf_dt_grid_as_objects, data_as_objects) {

	let { PlatformApi, UiUtils, IafScriptEngine } = libraries

	let proj = await PlatformApi.IafProj.getCurrent(ctx)

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
				epoch: info.Type === "date" ? UiUtils.IafDataPlugin.convertToEpoch(row[info.Property]) : undefined
			}
		})

		return {
			"Asset Name": row["Asset Name"],
			properties: Object.assign({}, props)
		}
	})
	console.log("assetObjects")

	let asset_coll = await IafScriptEngine.createOrRecreateCollection({
		_name: 'Asset Collection',
		_shortName: 'asset_coll',
		_namespaces: proj._namespaces,
		_description: 'Physical Asset Collection',
		_userType: 'iaf_ext_asset_coll'
	}, ctx)

	console.log("asset_coll", asset_coll)

	let indexRes = await IafScriptEngine.createOrRecreateIndex(
		{
			_id: asset_coll._id,
			indexDefs: [
				{
					key: {
						"Asset Name": "text"
					},
					options: {
						"name": "assets_search_index",
						"default_language": "english"
					}
				}
			]
		}, ctx
	)

	let asset_items_res = await IafScriptEngine.createItemsBulk(
		{
			_userItemId: asset_coll._userItemId,
			_namespaces: proj._namespaces,
			items: assetObjects
		}, ctx
	)

	console.log("asset_items_res")

	let asset_query = {
		query: {},
		_userItemId: asset_coll._userItemId,
		options: {
			project: { "Asset Name": 1, _id: 1 },
			page: { getAllItems: true },
			sort: { "_id": 1 }
		}
	}

	let all_assets = await IafScriptEngine.getItems(
		asset_query, ctx
	)

	//Find revitGuid and store in sourceIds array for each asset.
	//Because revitGuid is under asset.property, it's probably easier to fill them from
	//assetRows by finding matching "Asset Name"
	let assetsWithSourceIds = _.map(all_assets, (asset) => {
		let sourceIds = []
		let row = _.find(assetRows, ["Asset Name", asset["Asset Name"]])
		if (row) {
			sourceIds.push(row.revitGuid)
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

	let currentModel = await IafScriptEngine.getCompositeCollection(
		{ query: { "_userType": "bim_model_version", "_namespaces": { "$in": proj._namespaces }, "_itemClass": "NamedCompositeItem" } }, ctx, { getLatestVersion: true }
	)

	console.log("currentModel", JSON.stringify(currentModel))

	if (!currentModel) return "Created Assets. No Model Present"

	let model_els_coll = await IafScriptEngine.getCollectionInComposite(
		currentModel._userItemId, { _userType: "rvt_elements" },
		ctx
	)

	console.log("model_els_coll", model_els_coll)

	let platformIdList = await IafScriptEngine.findInCollectionsByPropValuesBulk(
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
		}, ctx
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


	let result = await IafScriptEngine.createRelations(
		{
			parentUserItemId: asset_coll._userItemId,
			_userItemId: model_els_coll._userItemId,
			_namespaces: proj._namespaces,
			relations: relatedItems
		}, ctx
	)

	console.log('Import of Model Assets Complete')
	//console.log(result)

	return result
}
async function importModeledAssetsWithoutModel(input, libraries, ctx, iaf_dt_grid_as_objects, data_as_objects) {

	let { PlatformApi, UiUtils, IafScriptEngine } = libraries

	let proj = await PlatformApi.IafProj.getCurrent(ctx)

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
				epoch: info.Type === "date" ? UiUtils.IafDataPlugin.convertToEpoch(row[info.Property]) : undefined
			}
		})

		return {
			"Asset Name": row["Asset Name"],
			properties: Object.assign({}, props)
		}
	})
	console.log(assetObjects, "assetObjects")

	let asset_coll = await IafScriptEngine.createOrRecreateCollection({
		_name: 'Asset Collection',
		_shortName: 'asset_coll',
		_namespaces: proj._namespaces,
		_description: 'Physical Asset Collection',
		_userType: 'iaf_ext_asset_coll'
	}, ctx)

	console.log("asset_coll", asset_coll)

	let indexRes = await IafScriptEngine.createOrRecreateIndex(
		{
			_id: asset_coll._id,
			indexDefs: [
				{
					key: {
						"Asset Name": "text"
					},
					options: {
						"name": "assets_search_index",
						"default_language": "english"
					}
				}
			]
		}, ctx
	)

	let asset_items_res = await IafScriptEngine.createItemsBulk(
		{
			_userItemId: asset_coll._userItemId,
			_namespaces: proj._namespaces,
			items: assetObjects
		}, ctx
	)

	console.log("asset_items_res", asset_items_res)

	return asset_items_res
}

async function createOrRecreateAssetIndex(input, libraries, ctx) {

	let { PlatformApi, IafScriptEngine } = libraries

	let proj = await PlatformApi.IafProj.getCurrent(ctx)

	let asset_coll = await IafScriptEngine.getCollection(
		{
			_userType: "iaf_ext_asset_coll",
			_shortName: "asset_coll",
			_itemClass: "NamedUserCollection",
		}, ctx
	)

	let indexRes = await IafScriptEngine.createOrRecreateIndex(
		{
			_id: asset_coll._id,
			indexDefs: [
				{
					key: {
						"Asset Name": "text"
					},
					options: {
						"name": "assets_search_index",
						"default_language": "english"
					}
				}
			]
		}, ctx
	)
	return indexRes
}


async function createOrRecreateSpaceIndex(input, libraries, ctx) {

	let { PlatformApi, IafScriptEngine } = libraries

	let proj = await PlatformApi.IafProj.getCurrent(ctx)

	let space_coll = await IafScriptEngine.getCollection(
		{
			_userType: "iaf_ext_space_coll",
			_shortName: "space_coll",
			_itemClass: "NamedUserCollection",
		}, ctx
	)

	let indexRes = await IafScriptEngine.createOrRecreateIndex(
		{
			_id: space_coll._id,
			indexDefs: [
				{
					key: {
						"properties.Name.val": "text",
						"Space Name": "text"
					},
					options: {
						"name": "text_search_index",
						"default_language": "english"
					}
				}
			]
		}, ctx
	)
	return indexRes
}

async function importModeledSpaces(input, libraries, ctx, iaf_dt_grid_as_objects, data_as_objects) {

	let { PlatformApi, UiUtils, IafScriptEngine } = libraries

	let proj = await PlatformApi.IafProj.getCurrent(ctx)
	//filter out those rows with no space Name
	let spaceRows = _.filter(iaf_dt_grid_as_objects, (row) => _.size(row['Space Name']) > 0)

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
				epoch: info.Type === "date" ? UiUtils.IafDataPlugin.convertToEpoch(row[info.Property]) : undefined
			}
		})

		return {
			"Space Name": row["Space Name"],
			properties: Object.assign({}, props)
		}
	})

	let space_coll = await IafScriptEngine.createOrRecreateCollection({
		_name: 'Space Collection',
		_shortName: 'space_coll',
		_namespaces: proj._namespaces,
		_description: 'Physical Space Collection',
		_userType: 'iaf_ext_space_coll'
	}, ctx)

	console.log("space_coll", space_coll)

	let indexRes = await IafScriptEngine.createOrRecreateIndex(
		{
			_id: space_coll._id,
			indexDefs: [
				{
					key: {
						"properties.Name.val": "text",
						"Space Name": "text"
					},
					options: {
						"name": "text_search_index",
						"default_language": "english"
					}
				}
			]
		}, ctx
	)

	await IafScriptEngine.createItemsBulk(
		{
			_userItemId: space_coll._userItemId,
			_namespaces: proj._namespaces,
			items: spaceObjects
		}, ctx
	)

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
	let all_spaces = await IafScriptEngine.getItems(space_query, ctx)

	console.log("all_spaces", all_spaces)

	//Find revitGuid and store in sourceIds array for each space.
	let spacesWithSourceIds = _.map(all_spaces, (space) => {
		let sourceIds = []
		let row = _.find(spaceRows, ["Space Name", space["Space Name"]])
		if (row) {
			sourceIds.push(row.revitGuid)
		}
		space.sourceIds = sourceIds
		return space

	})

	console.log("spacesWithSourceIds", spacesWithSourceIds)

	let nfallSourceIds = _.map(spacesWithSourceIds, 'sourceIds')

	console.log("nfallSourceIds", nfallSourceIds)

	let allSourceIds = _.flatten(nfallSourceIds)

	console.log("allSourceIds", allSourceIds)

	let currentModel = await IafScriptEngine.getCompositeCollection(
		{ query: { "_userType": "bim_model_version", "_namespaces": { "$in": proj._namespaces }, "_itemClass": "NamedCompositeItem" } }, ctx, { getLatestVersion: true })
	console.log("currentModel", JSON.stringify(currentModel))
	if (!currentModel) return "Created Spaces. No Model Present"
	let model_els_coll = await IafScriptEngine.getCollectionInComposite(
		currentModel._userItemId, { _userType: "rvt_elements" },
		ctx
	)
	console.log("model_els_coll", model_els_coll)

	let platformIdList = await IafScriptEngine.findInCollectionsByPropValuesBulk(
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
		}, ctx
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

	let result = await IafScriptEngine.createRelations(
		{
			parentUserItemId: space_coll._userItemId,
			_userItemId: model_els_coll._userItemId,
			_namespaces: proj._namespaces,
			relations: relatedItems
		}, ctx
	)

	console.log('Import of Model Spaces Complete. result:')
	console.log(result)
}

async function importModeledSpacesWithoutModel(input, libraries, ctx, iaf_dt_grid_as_objects, data_as_objects) {

	let { PlatformApi, UiUtils, IafScriptEngine } = libraries

	let proj = await PlatformApi.IafProj.getCurrent(ctx)
	//filter out those rows with no space Name
	let spaceRows = _.filter(iaf_dt_grid_as_objects, (row) => _.size(row['Space Name']) > 0)

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
				epoch: info.Type === "date" ? UiUtils.IafDataPlugin.convertToEpoch(row[info.Property]) : undefined
			}
		})

		return {
			"Space Name": row["Space Name"],
			properties: Object.assign({}, props)
		}
	})

	let space_coll = await IafScriptEngine.createOrRecreateCollection({
		_name: 'Space Collection',
		_shortName: 'space_coll',
		_namespaces: proj._namespaces,
		_description: 'Physical Space Collection',
		_userType: 'iaf_ext_space_coll'
	}, ctx)

	console.log("space_coll", space_coll)

	let indexRes = await IafScriptEngine.createOrRecreateIndex(
		{
			_id: space_coll._id,
			indexDefs: [
				{
					key: {
						"properties.Name.val": "text",
						"Space Name": "text"
					},
					options: {
						"name": "text_search_index",
						"default_language": "english"
					}
				}
			]
		}, ctx
	)

	let space_item_res = await IafScriptEngine.createItemsBulk(
		{
			_userItemId: space_coll._userItemId,
			_namespaces: proj._namespaces,
			items: spaceObjects
		}, ctx
	)
	return space_item_res
}
async function uploadBIMPKFiles(input, libraries, ctx) {

	let { PlatformApi, UiUtils, IafScriptEngine } = libraries

	let proj = await PlatformApi.IafProj.getCurrent(ctx)

	let selectFiles = await UiUtils.IafLocalFile.selectFiles({ multiple: false, accept: ".bimpk" })
	if (!ctx._namespaces) {
		ctx._namespaces = proj._namespaces
	}

	let uploadedFile = await IafScriptEngine.uploadFile(selectFiles[0], ctx)

	console.log(uploadedFile, "uploadedFile")
}


async function uploadFiles(input, libraries, ctx, callback, filePathForBimpK, bimpkFileName) {


	const { IafFileSvc } = libraries.PlatformApi
	const { IafLocalFile } = libraries.UiUtils
	// tags that we will apply to the files at upload based on file extension
	const fileTags = {
		jpg: ['image', 'jpg'],
		txt: ['text', 'txt'],
		json: ['data', 'json'],
		bimpk: ['model', 'bimpk']
	}
	console.log("fileTags")
	// select the three files in you downloaded from the course

	let filePath = filePathForBimpK

	// Read the file from the local folder
	const fileData = fs.readFileSync(filePath);

	let files = []

	let fileDetails = {
		name: bimpkFileName,
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
		console.log(message)
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

			await IafFileSvc.addFileResumable(file.fileObj, ctx._namespaces, [], tagsForFile, ctx, {
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



}

async function addRemapElementsTypeDatasource(input, libraries, ctx) {

	let { PlatformApi, IafScriptEngine } = libraries
	
	let proj = await PlatformApi.IafProj.getCurrent(ctx)

	const query = {
	  _namespaces: proj._namespaces,
	  _userType: "map_elements_type"
	};

	const datasources = await IafScriptEngine.getDatasources(query, ctx);

	const filteredDatasources = _.filter(datasources, d => d._userType === "map_elements_type"
	  && d._name === "Map Elements type");

	_.each(filteredDatasources, async datasource => await IafScriptEngine.removeDatasource({ orchId: datasource.id }, ctx));

	let datasourceResult = await IafScriptEngine.addDatasource(
	  {
		_name: "Map Elements type",
		_description: "Orchestrator to map elements to dtCategory and dtType from type map coll",
		_namespaces: proj._namespaces,
		_userType: "map_elements_type",
		_params: {
		  tasks: [
			{
			  _orchcomp: "default_script_target",
			  _name: "Map type map to elements",
			  _sequenceno: 1,
			  "_actualparams": {
				"userType": "iaf_map_elms_type",
				"_scriptName": "mapAssetCollection"
			  }
			}
		  ]
		}
	  }, ctx
	)
	return datasourceResult;
}

async function updateFilecreateOrRecreateIndex(input, libraries, ctx) {

	let { PlatformApi, IafScriptEngine } = libraries

	let root_file_cont = await IafScriptEngine.getFileCollection({
		_userType: "file_container",
		_shortName: "Root Container"
	}, ctx)

	let index = await IafScriptEngine.createOrRecreateIndex({
		_id: root_file_cont._id,
		indexDefs: [
			{
				key: {
					name: "text",
					"fileAttributes.Originator": "text",
					"fileAttributes.Document Type": "text",
					"fileAttributes.Levels And Locations": "text"
				},
				options: {
					name: "text_search_index",
					default_language: "english"
				}
			}
		]
	}, ctx)

	return index
}

async function createOrRecreateCollectionsCollection(inpout, libraries, ctx) {

	let { PlatformApi, IafScriptEngine } = libraries

	let proj = await PlatformApi.IafProj.getCurrent(ctx)

	let collections = await IafScriptEngine.createOrRecreateCollection(
		{
			_name: 'Collections Collection',
			_shortName: 'Collections',
			_namespaces: proj._namespaces,
			_description: 'Collections of Entities',
			_userType: 'iaf_ext_coll_coll'
		}, ctx
	)

	IafScriptEngine.createOrRecreateIndex({
		_id: collections._id,
		indexDefs: [
			{
				key: {
					"Collection Name": "text",
					"properties.Type.val": "text"
				},
				options: {
					name: "text_search_index",
					default_language: "english"
				}
			}
		]
	}, ctx)

	return collections
}


async function importBimpkModelFile(input, libraries, ctx, callback) {

	let { PlatformApi, IafScriptEngine } = libraries

	let { IafFileSvc, IafDataSource } = PlatformApi

	let proj = await PlatformApi.IafProj.getCurrent(ctx)

	let searchCriteria = {
		_parents: 'root',
		_name: '.*bimpk'
	}

	let getBimpks = await IafFileSvc.getFiles(searchCriteria, ctx, { _pageSize: 100, getLatestVersion: true });
	let bimpk = getBimpks._list[0];

	console.log('bimpk', bimpk)

	let getVersions = await IafFileSvc.getFileVersions(bimpk._id, ctx);
	let version = _.find(getVersions._list, { _version: bimpk._tipVersion })
	console.log('version', version)

	let bimpkOrch;
	let datasources = await IafDataSource.getOrchestrators(null, ctx);

	console.log('datasources', datasources);

	if (datasources) {
		bimpkOrch = _.find(datasources._list, { _userType: 'bimpk_uploader' });
	} else {
		bimpkOrch = null;
	}

	console.log('bimpkOrch', bimpkOrch);

	let task = _.find(bimpkOrch.orchsteps, { _name: 'default_script_target' });
	let seqTypeId = task._compid;

	console.log('seqTypeId', seqTypeId);

	const orchReq = {
		_namespaces: proj._namespaces,
		orchestratorId: bimpkOrch.id,
		_actualparams: [
			{
				sequence_type_id: seqTypeId,
				params: {
					_fileId: bimpk._id,
					_fileVersionId: version._id
				}
			}
		]
	};
	console.log(orchReq,'orchReq');

	//run orchestrator
	let result = await PlatformApi.IafDataSource.runOrchestrator(bimpkOrch.id, orchReq, ctx);
	console.log(result, "result")

	let orchRunResult = await PlatformApi.IafDataSource.getOrchRunStatus(result.id, ctx);
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
			orchRunResult = await PlatformApi.IafDataSource.getOrchRunStatus(result.id, ctx);
			orchStepRunStatus = orchRunResult[0].orchrunsteps;
		}, 10000);

	});
}

async function createAssetSpaceReln(input, libraries,ctx, assetRelProp, spaceRelProp){
	let { PlatformApi, UiUtils, IafScriptEngine } = libraries
	let iaf_asset_collection = await IafScriptEngine.getCollection(
		{
			"_userType": "iaf_ext_asset_coll",
			"_shortName": "asset_coll",
			"_itemClass": "NamedUserCollection"
		}, ctx
	)

	let allAssets = await IafScriptEngine.getItems({
		"_userItemId": iaf_asset_collection._userItemId,
		"options": { "page": { "getAllItems": true } }
	}, ctx)

	console.log(allAssets.length,'length');
	console.log(allAssets[0],'1 asset');

	let iaf_space_collection = await IafScriptEngine.getCollection(
		{
		  _userType: "iaf_ext_space_coll",
		  _shortName: "space_coll",
		  _itemClass: "NamedUserCollection",
		}, ctx
	  )
	console.log(iaf_space_collection, 'spaceColl');
	let spaces = await IafScriptEngine.getItems({
		"_userItemId": iaf_space_collection._userItemId,
		"options": {"page": {"getAllItems": true}}
	 }, ctx)
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
			let relations = {
				parentUserItemId: iaf_space_collection._userItemId,
				_userItemId: iaf_asset_collection._userItemId,
				_namespaces: ctx._namespaces,
				relations: filteredData
			}
			console.log('relations', relations)
			if(relations){
				await IafScriptEngine.createRelations(relations, ctx);
				let final = { success: true }
				console.log(final,'Assets and Spaces Relation Imported');
			}
		}
	 }
}

let userConfigToUserGroupMapSolAdmin = { userConfig: "iaf_dbm_soladmin_uc", userGroup: "sol_admin" }
let userConfigToUserGroupMapProjectTeam = { userConfig: "iaf_dbm_pt_uc", userGroup: "pt" }
let userConfigToUserGroupMapProjAdmin = { userConfig: "iaf_dbm_projadmin_uc", userGroup: "proj_admin" }
let userConfigToUserGroupMapProjUser = { userConfig: "iaf_dbm_projuser_uc", userGroup: "proj_user" }
let userConfigToUserGroupMapProjVisitor = { userConfig: "iaf_dbm_visitor_uc", userGroup: "proj_visitor" }
let userGroupDescriptors = []
let userConfigDescriptors = []
let userConfigToUserGroupMap = []
let configNames = []
let configContents = []
let scriptNames = new Set([])
let scriptContents = []
let scriptsDescriptors = []

let solutionAdmin = {
	_name: 'Solutions Admin',
	_shortName: 'sol_admin',
	_description: 'Solutions Admin User Group',
	permissions: {
		//accessAll is for easy creation of an admin with access to everything
		accessAll: true
	}
}
let projectTeam = {
	_name: 'Project Team',
	_shortName: 'pt',
	_description: 'Project Team User Group',
	permissions: {
		//accessAll is for easy creation of an admin with access to everything
		accessAll: true
	}
}
let projectAdmin = {
	_name: 'Project Admin',
	_shortName: 'proj_admin',
	_description: 'Project Admin User Group',
	permissions: {
		//accessAll is for easy creation of an admin with access to everything
		accessAll: true
	}
}
let projectUser = {
	_name: 'Project User',
	_shortName: 'proj_user',
	_description: 'Project User Group',
	permissions: {
		//accessAll is for easy creation of an admin with access to everything
		accessAll: true
	}
}
let projectVisitor = {
	_name: 'Project Visitor',
	_shortName: 'proj_visitor',
	_description: 'Project visitor User Group',
	permissions: {
		//accessAll is for easy creation of an admin with access to everything
		accessAll: true
	}
}

let userConfigSolutionAdmin = {
	_name: "DBM Solution Admin",
	_shortName: "iaf_dbm_soladmin_uc",
	_description: "DBM Solution Admin User Config",
	_userType: "ipa-dt"
}
let userConfigProjectTeam = {
	_name: "DBM Project Team",
	_shortName: "iaf_dbm_pt_uc",
	_description: "DBM Project Team User Config",
	_userType: "ipa-dt"
}
let userConfigProjectAdmin = {
	_name: "DBM Project Admin",
	_shortName: "iaf_dbm_projadmin_uc",
	_description: "DBM Project Admin User Config",
	_userType: "ipa-dt"
}
let userConfigProjectUser = {
	_name: "DBM Project User",
	_shortName: "iaf_dbm_projuser_uc",
	_description: "DBM Project User Config",
	_userType: "ipa-dt"
}
let userConfigProjectVisitor = {
	_name: "DBM Project Visitor",
	_shortName: "iaf_dbm_visitor_uc",
	_description: "DBM Project visitor User Config",
	_userType: "ipa-dt"
}

let entityDataConfigAssets = {
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
							"name": "Discipline",
							"accessor": "fileAttributes.fileDiscipline"
						},
						{
							"name": "Type",
							"accessor": "fileAttributes.fileType"
						},
						{
							"name": "Stage",
							"accessor": "fileAttributes.stageDescription"
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
					  "name": "Level",
					  "accessor": "properties.Level.val"
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
let entityDataConfigModelElements = {
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
let entityDataConfigSpaces = {
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
							"name": "Type",
							"accessor": "fileAttributes.fileType"
						},
						{
							"name": "Stage",
							"accessor": "fileAttributes.stageDescription"
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
					  "name": "dtCategory",
					  "accessor": "properties.dtCategory.val"
					},
					{
					  "name": "dtType",
					  "accessor": "properties.dtType.val"
					}
				  ]
				}
			},
		}
	}
}


let entitySelectConfigAssets = {
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
						"property": "dtCategory",
						"script": "getCategoriesWithCount"
					},
					{
						"property": "dtType",
						"script": "getDtTypesWithChildrenCount"
					}
				]
			}
		]
	}
}
let entitySelectConfigSpaces = {
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
						"property": "Space Name",
						"script": "getNamesWithCount"
					}
				]
			}
		]
	}
}
let entitySelectConfigCollection = {
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

let entitySelectConfigModelElement = {
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
				"display": "dtCategory",
				"altScript": "getModelElementsByCatAndType",
				"selects": [
					{
						"display": "dtCategory",
						"script": "getModelRevitDtCategories",
						"propName": "dtCategory"
					},
					{
						"display": "dtType",
						"script": "getModelRevitDtTypesForDtCategory",
						"multi": true,
						"propName": "dtType"
					}
				]
			}
		],
	}
}
let entitySelectConfigFile = {
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
let entitySelectConfigDrawing = {
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

let handlersAsset = {
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
				"iaf_collect_allusers"
			],
			"onHandlerLoad": [
				"loadFileAttributes"
			],
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
						"dtCategory",
						"dtType"
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
							"hidden": ["revitGuid"],
							"hierarchySelects": {
								"id": "edithierarchyselects",
								"query": "<<SCRIPTED_LINKED_SELECTS>>",
								"display": "Category",
								"selects": [
									{
										"display": "dtCategory",
										"script": "getDtCategories"
									},
									{
										"display": "dtType",
										"script": "getDtTypes",
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
					"Export": {
						"allow": true,
						"icon": "fas fa-file-export",
						"script": "exportAssets",
						"showOnTable": true
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
let handlersSpace = {
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
				"iaf_collect_allusers"
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
							"hidden": ["revitGuid"],
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
let handlersNavigator = {
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
				"iaf_collect_allusers"
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
						"script": "getAssets",
						"getEntityFromModel": "getAssetFromModel",
						"spaceMode": false
					},
					"Space": {
						"script": "getSpaces",
						"getEntityFromModel": "getSpaceFromModel",
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
						"Navigator": {
							"allow": true,
							"icon": "inv-icon-svg inv-icon-nav",
							"type": "navigate",
							"showOnTable": true,
							"navigateTo": "navigator"
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

let handlersModelElements = {
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



let handlersFile = {
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
						"script": "getAssetsForFile",
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
let handlerDrawingRegister = {
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




let handlerFileUpload = {
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
let handlerCollection = {
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
									"name": "dtCategory",
									"accessor": "properties.dtCategory.val"
								},
								{
									"name": "dtType",
									"accessor": "properties.dtType.val"
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

let handlersUserGroup = {
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

let handlersSupport = {
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

let handlerScriptRunner = {
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


let handlerManageModel = {
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

let groupedPagesAssetTwinNav = {
	"page": "Navigator",
	"handler": "navigator"
}
let groupedPagesAssetTwinAsset = {
	"page": "Assets",
	"handler": "assets"
}
let groupedPagesAssetTwinModelElement = {
	"page": "ModelElements",
	"handler": "modelelems"
}
let groupedPagesAssetTwinSpace = {
	"page": "spaces",
	"handler": "spaces"
}
let groupedPagesAssetTwinColl = {
	"page": "collections",
	"handler": "collections"
}
let groupedPagesAssetTwinFile = {
	"page": "Files",
	"handler": "files"
}
let groupedPagesAssetTwinFileUpload = {
	"page": "Add Files",
	"handler": "fileUpload"
}

let groupedPagesAssetTwinManageModel = {
	"page": "modelVer",
	"handler": "modelVer"
}
let groupedPagesAdminUsergrp = {
	"page": "userGroup",
	"handler": "userGroup"
}
let groupedPagesAssetTwinScriptRunner = {
	"page": "Script Development",
	"handler": "scriptRunner"
}

let groupedPagesFiles = {
	groupedPages: {
		"Files": {
			"icon": "fas fa-file-alt fa-2x",
			"position": 2,
			"pages": []
		}
	}
}
let groupedPagesAdmin = {
	groupedPages: {
		"Admin": {
			"icon": "fas fa-user-shield fa-2x",
			"position": 3,
			"pages": []
		}
	}
}
let groupedPagesDownloads = {
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
let updateUserConfigContent = {
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

let resetUserConfigContent = {
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

let scriptsDescriptorsBimpk = {
	_name: "BIMPK Upload",
	_shortName: "iaf_bimpk_upload",
	_description: "Load, Transform and Write Model from BIMPK",
	_userType: "iaf_bimpk_upload"
}
let scriptsDescriptorsBimpkPost = {
	_name: "BIMPK Post Import - Copy Inverse Relations",
	_shortName: "iaf_bimpk_post_imp",
	_description: "BIMPK Post Import - Copy Inverse Relations from Prev Version",
	_userType: "iaf_bimpk_post_imp"
}
let scriptsDescriptorsModelImport = {
	_name: "BIMPK Import model",
	_shortName: "iaf_import_model",
	_description: "BIMPK Import Model",
	_userType: "iaf_import_model"
}
let scriptsDescriptorsProjColls = {
	_name: "Load Project Collection Data",
	_shortName: "iaf_dt_proj_colls",
	_description: "Load All Project Collections",
	_userType: "iaf_dt_proj_colls"
}
let scriptsDescriptorsDtTypes = {
	_name: "Type Map Interactions",
	_shortName: "iaf_dt_types",
	_description: "Scripts for interacting with the type map",
	_userType: "iaf_dt_types"
}
let scriptsDescriptorsMapElems = {
	_name: "Re-mapping type elements",
	_shortName: "iaf_map_elms_type",
	_description: "Update model type elements, after BIMtypes updated",
	_userType: "iaf_map_elms_type"
}
let scriptsDescriptorsDash = {
	_name: "Dashboard Scripts",
	_shortName: "iaf_dashboard",
	_description: "Scripts to provide data for dashboard development",
	_userType: "iaf_dashboard"
}
let scriptsDescriptorsFiles = {
	_name: "Files As Entities All Users",
	_shortName: "iaf_files_allusers",
	_description: "Files for Entity View",
	_userType: "iaf_files_allusers"
}
let scriptsDescriptorsColls = {
	_name: "Entity Collection All Users Scripts",
	_shortName: "iaf_collect_allusers",
	_description: "Scripts to interact with collections",
	_userType: "iaf_collect_allusers"
}
let scriptsDescriptorsModelElements = {
	_name: "Model Elements Entity Page",
	_shortName: "iaf_dt_model_elems",
	_description: "Common Model Elements Business Logic",
	_userType: "iaf_dt_model_elems"
}
let scriptsDescriptorsSpace = {
	_name: "Entity Space All Users Logic",
	_shortName: "iaf_entspa_allusers",
	_description: "Common Entity Space Business Logic",
	_userType: "iaf_entspa_allusers"
}
let scriptsDescriptorsAssets = {
	_name: "Entity Asset All Users Logic",
	_shortName: "iaf_entass_allusers",
	_description: "Common Asset Business Logic",
	_userType: "iaf_entass_allusers"
}
let scriptsDescriptorsSgpk = {
	_name: "SGPK Upload",
	_shortName: "iaf_sgpk_upload",
	_description: "Load, Transform and Write Model from BIMPK",
	_userType: "iaf_sgpk_upload"
}
let scriptsDescriptorsAssetMapType = {
	_name: "Asset Type Map User",
	_shortName: "iaf_dt_type_map",
	_description: "Read and Manipulate Collection for Asset Type Map",
	_userType: "iaf_dt_type_map"
}

let scriptsDescriptorsModelRepValidation = {
	_name: "Model Reporting and Validation",
	_shortName: "iaf_ext_val_scr",
	_description: "Scripts to Inspect Model Content and Generate Reports",
	_userType: "iaf_ext_val_scr"
}

async function getScriptData(fileName, localPath) {
	scriptNames.add(fileName)
	let actualPath = localPath[0].substr(-1) !== '/' ? localPath[0] + '/' : localPath[0]
	console.log(actualPath,'actualPath');
	let oneClickPath = 'Solution Engineering/OneClick Project/4.3 scripts/scripts/'
	let fileContents = fs.readFileSync(actualPath + oneClickPath + fileName + '.js', 'utf8')
	//console.log(fileContents, 'Added')
	scriptContents.push(fileContents)
	return true
}

function isScriptExists(loadedScripts, script) {
	console.log(loadedScripts,'loadedScripts')
	return !loadedScripts.filter(x => x._shortName == script).length == 1
}


async function loadScripts(input, libraries, ctx, findUser,
	loadedScripts, documentAttributeCommonName, assetAttributeCommonName, spaceAttributeCommonName, localAppPath) {

		let assetTableProperty = assetAttributeCommonName['tableView'].map(data => {
			return {
				"name": data.TableView,
				"accessor": "properties." + data.TableView
			};
		})
		console.log(assetTableProperty);

		let spaceTableProperty = spaceAttributeCommonName['tableView'].map(data => {
			return {
				"name": data.TableView,
				"accessor": "properties." + data.TableView
			};
		})
		console.log(spaceTableProperty);

	if (findUser[0]["Navigator"] == "Yes") {
		Object.assign(updateUserConfigContent,
			{
				handlers: {
					...updateUserConfigContent.handlers,
					navigator: handlersNavigator.handlers.navigator
				},
			},
			{
				entitySelectConfig: {
					...updateUserConfigContent.entitySelectConfig,
					Space: entitySelectConfigSpaces.entitySelectConfig.Space
				}
			}
		)
		updateUserConfigContent.groupedPages["Asset Twin"].pages.push(groupedPagesAssetTwinNav)
		if(updateUserConfigContent.handlers.navigator.config.tableView.Asset.component.columns.length === 1){
			updateUserConfigContent.handlers.navigator.config.tableView.Asset.component.columns.push(...assetTableProperty)
		}
		if(updateUserConfigContent.handlers.navigator.config.tableView.Space.component.columns.length === 1){
			updateUserConfigContent.handlers.navigator.config.tableView.Space.component.columns.push(...spaceTableProperty)
		}
	}


	if (findUser[0]["ModelElements"] == "Yes" && isScriptExists(loadedScripts, "iaf_dt_model_elems")) {
		scriptsDescriptors.push(scriptsDescriptorsModelElements)
		await getScriptData('iaf_dt_model_elems', localAppPath)
		Object.assign(updateUserConfigContent,
			{
				entityDataConfig: {
					...updateUserConfigContent.entityDataConfig,
					"Model Element": entityDataConfigModelElements.entityDataConfig["Model Element"]
				}
			},
			{
				entitySelectConfig: {
					...updateUserConfigContent.entitySelectConfig,
					"Model Element": entitySelectConfigModelElement.entitySelectConfig["Model Element"]
				}
			},
			{
				handlers: {
					...updateUserConfigContent.handlers,
					modelelems: handlersModelElements.handlers.modelelems
				}
			})
		updateUserConfigContent.groupedPages["Asset Twin"].pages.push(groupedPagesAssetTwinModelElement)
	}


	if (findUser[0]["BIMPK Upload"] == "Yes" && isScriptExists(loadedScripts, "iaf_bimpk_post_imp")) {
		scriptsDescriptors.push(scriptsDescriptorsBimpk, scriptsDescriptorsBimpkPost,scriptsDescriptorsModelImport, scriptsDescriptorsMapElems)
		await getScriptData('iaf_bimpk_post_imp', localAppPath)
		await getScriptData('iaf_bimpk_upload', localAppPath)
		await getScriptData('iaf_import_model', localAppPath)
		await createOrRecreateBIMPKDatasource(input, libraries, ctx)
		await createOrRecreateRemapElementsTypeDatasource(input, libraries, ctx)
	}


	if (findUser[0]["Assets"] == "Yes" && isScriptExists(loadedScripts, "iaf_entass_allusers")) {
		scriptsDescriptors.push(scriptsDescriptorsAssets)
		await getScriptData('iaf_entass_allusers', localAppPath)
		Object.assign(updateUserConfigContent,
			{
				entityDataConfig: {
					...updateUserConfigContent.entityDataConfig,
					Asset: entityDataConfigAssets.entityDataConfig.Asset
				}
			},
			{
				entitySelectConfig: {
					...updateUserConfigContent.entitySelectConfig,
					Asset: entitySelectConfigAssets.entitySelectConfig.Asset
				}
			},
			{
				handlers: {
					...updateUserConfigContent.handlers,
					assets: handlersAsset.handlers.assets
				}
			})


		updateUserConfigContent.groupedPages["Asset Twin"].pages.push(groupedPagesAssetTwinAsset)
		if(updateUserConfigContent.handlers.assets.config.tableView.component.columns.length === 1){
			console.log(...assetTableProperty,'...assetTableProperty')
			updateUserConfigContent.handlers.assets.config.tableView.component.columns.push(...assetTableProperty)
		}
		if(updateUserConfigContent.entityDataConfig.Asset["Asset Properties"].component.hidden.length === 0){
			updateUserConfigContent.entityDataConfig.Asset["Asset Properties"].component.hidden.push(...assetAttributeCommonName['hiddenProps'])
		}
		if(Object.values(updateUserConfigContent.entityDataConfig.Asset["Asset Properties"].component.groups).length === 0){
			updateUserConfigContent.entityDataConfig.Asset["Asset Properties"].component.groups = assetAttributeCommonName['groups']; 
		}
	}


	if (findUser[0]["Spaces"] == "Yes" && isScriptExists(loadedScripts, "iaf_entspa_allusers")) {
		scriptsDescriptors.push(scriptsDescriptorsSpace)
		await getScriptData('iaf_entspa_allusers', localAppPath)
		Object.assign(updateUserConfigContent,
			{
				entityDataConfig: {
					...updateUserConfigContent.entityDataConfig,
					Space: entityDataConfigSpaces.entityDataConfig.Space
				}
			},
			{
				entitySelectConfig: {
					...updateUserConfigContent.entitySelectConfig,
					Space: entitySelectConfigSpaces.entitySelectConfig.Space
				}
			},
			{
				handlers: {
					...updateUserConfigContent.handlers,
					spaces: handlersSpace.handlers.spaces
				}
			})
		updateUserConfigContent.groupedPages["Asset Twin"].pages.push(groupedPagesAssetTwinSpace)
		if(updateUserConfigContent.handlers.spaces.config.tableView.component.columns.length === 1){
			console.log(...spaceTableProperty,'...spaceTableProperty')
			updateUserConfigContent.handlers.spaces.config.tableView.component.columns.push(...spaceTableProperty)
		}
		console.log(updateUserConfigContent.entityDataConfig.Space["Space Properties"].component.hidden.length,'spacelength')
		if(updateUserConfigContent.entityDataConfig.Space["Space Properties"].component.hidden.length === 0){
			updateUserConfigContent.entityDataConfig.Space["Space Properties"].component.hidden.push(...spaceAttributeCommonName['hiddenProps'])
		}
		if(Object.values(updateUserConfigContent.entityDataConfig.Space["Space Properties"].component.groups).length === 0){
			updateUserConfigContent.entityDataConfig.Space["Space Properties"].component.groups = spaceAttributeCommonName['groups']; 
		}
	}

	let arrayOFItems = documentAttributeCommonName.map(data => {
		console.log(data, "documentAttributeCommonNameData")
		return {
			"name": data,
			"query": data == "Manufacturer" || data == "Revision" ? "<<CREATABLE_SCRIPTED_SELECTS>>" : "<<SIMPLE_SELECT>>",
			"script": "get" + data.replace(/\s/g, ""),
			"required": false
		};
	})

	console.log(arrayOFItems);
	let arrayOFItemsFilePropertyUI = documentAttributeCommonName.slice(0, 4).map(data => {
		return {

			"name": data,
			"accessor": data + ".val"

		};
	})
	console.log(arrayOFItemsFilePropertyUI);


	let fileTableProperty = documentAttributeCommonName['tableView'].map(data => {
		return {
			"name": data.TableView,
			"accessor": "properties." + data.TableView + ".val"
		};
	})
	console.log(fileTableProperty,'fileTableProperty');

	let editPropertyFileCollection = documentAttributeCommonName.map((obj1, index) => {
		console.log(obj1, "documentAttributeCommonName2")
		return {
			[obj1]: {
				"query": obj1 == 'Manufacturer' || obj1 == 'Revision' ? "<<CREATABLE_SCRIPTED_SELECTS>>" : "<<SCRIPTED_SELECTS>>",
				"script": "get" + obj1.replace(/\s/g, ""),
				"multi": false
			}
		};
	});

	if (findUser[0]["Files"] == "Yes" && isScriptExists(loadedScripts, "iaf_files_allusers")) {
		scriptsDescriptors.push(scriptsDescriptorsFiles)
		await getScriptData('iaf_files_allusers', localAppPath)

		Object.assign(updateUserConfigContent,
			{
				entitySelectConfig: {
					...updateUserConfigContent.entitySelectConfig,
					File: entitySelectConfigFile.entitySelectConfig.File
				}
			},
			{
				handlers: {
					...updateUserConfigContent.handlers,
					files: handlersFile.handlers.files,
					fileUpload: handlerFileUpload.handlers.fileUpload
				}
			},
			{
				groupedPages: {
					...updateUserConfigContent.groupedPages,
					Files: groupedPagesFiles.groupedPages.Files
				}
			}
		)
		if (updateUserConfigContent.handlers.files.config.data.Properties.component.columns.length === 0) {
			console.log(editPropertyFileCollection, "editPropertyFileCollection")
			Object.assign(updateUserConfigContent.handlers.files.config.actions.Edit.component.propertyUiTypes,
				...editPropertyFileCollection);
		}
		console.log(updateUserConfigContent.handlers.files.config.data.Properties.component.columns.length, "filesLength")
		if (updateUserConfigContent.handlers.files.config.data.Properties.component.columns.length === 0) {
			updateUserConfigContent.handlers.files.config.data.Properties.component.columns.push(...arrayOFItemsFilePropertyUI)
		}
		if (updateUserConfigContent.handlers.files.config.tableView.component.columns.length === 1) {
			updateUserConfigContent.handlers.files.config.tableView.component.columns.push(...fileTableProperty)
		}
		console.log(updateUserConfigContent.handlers.fileUpload.config.columns.length, "filesLength2")
		if (updateUserConfigContent.handlers.fileUpload.config.columns.length === 0) {
			console.log('arrayOFItems', arrayOFItems)
			updateUserConfigContent.handlers.fileUpload.config.columns.push(...arrayOFItems)
		}
		if (updateUserConfigContent.groupedPages["Files"].pages.length === 0) {
			updateUserConfigContent.groupedPages["Files"].pages.push(groupedPagesAssetTwinFile)
			updateUserConfigContent.groupedPages["Files"].pages.push(groupedPagesAssetTwinFileUpload)
		}
	}

	if (findUser[0]["Collections"] == "Yes" && isScriptExists(loadedScripts, "iaf_collect_allusers")) {
		scriptsDescriptors.push(scriptsDescriptorsColls)
		await getScriptData('iaf_collect_allusers', localAppPath)
		Object.assign(updateUserConfigContent,
			{ entitySelectConfig: { ...updateUserConfigContent.entitySelectConfig, Collection: entitySelectConfigCollection.entitySelectConfig.Collection } },
			{ handlers: { ...updateUserConfigContent.handlers, collections: handlerCollection.handlers.collections } })
		updateUserConfigContent.groupedPages["Asset Twin"].pages.push(groupedPagesAssetTwinColl)
	}




	if (findUser[0]["SGPK Upload"] == "Yes" && isScriptExists(loadedScripts, "iaf_sgpk_upload")) {
		scriptsDescriptors.push(scriptsDescriptorsSgpk)
		await getScriptData('iaf_sgpk_upload', localAppPath)
		await createOrRecreateSGPKDatasource(input, libraries, ctx)
	}



	scriptsDescriptors.push(scriptsDescriptorsDtTypes)
	await getScriptData('iaf_dt_types', localAppPath)

	scriptsDescriptors.push(scriptsDescriptorsProjColls)
	await getScriptData('iaf_dt_proj_colls', localAppPath)

	scriptsDescriptors.push(scriptsDescriptorsAssetMapType)
	await getScriptData('iaf_dt_type_map', localAppPath)

	scriptsDescriptors.push(scriptsDescriptorsMapElems)
	await getScriptData('iaf_map_elms_type', localAppPath)

	scriptsDescriptors.push(scriptsDescriptorsModelRepValidation)
	await getScriptData('iaf_ext_val_scr', localAppPath)
}

let ProjSetup = {



	getRunnableScripts() {
		return RunnableScripts
	},

	async oneClickSetup(input, libraries, ctx, callback) {


		let { PlatformApi, UiUtils } = libraries
		const { IafItemSvc } = PlatformApi


		let loadedScripts = await IafItemSvc.getNamedUserItems({
			"query": {}
		}, ctx, {});

		let proj = await PlatformApi.IafProj.getCurrent(ctx)
		console.log('ctx', ctx)

		//return await createOrRecreateSpaceIndex(input, libraries, ctx)
		console.log('Please upload config sheet.')
		let xlsxFiles = await UiUtils.IafLocalFile.selectFiles({ multiple: false, accept: ".xlsx" })
		//console.log(xlsxFiles,'xlsxFiles')
		let typeWorkbook = await UiUtils.IafDataPlugin.readXLSXFiles(xlsxFiles)
		let wbJSON = UiUtils.IafDataPlugin.workbookToJSON(typeWorkbook[0])
		let xlsConfigData = wbJSON.Config
		let xlsConfigDataParsed = UiUtils.IafDataPlugin.parseGridData({ gridData: xlsConfigData })


		let documentAttributeCollectionsForExcelFileRead = _.get(wbJSON, "Document Attributes");
		console.log(documentAttributeCollectionsForExcelFileRead[0], "documentAttributeCollections")

		let documentAttributeCommonName = documentAttributeCollectionsForExcelFileRead[0].filter(val => val !== 'TableView' && val)
		console.log(documentAttributeCommonName, "documentAttributeCommonName")

		let tableProps = UiUtils.IafDataPlugin.parseGridData({ gridData: documentAttributeCollectionsForExcelFileRead });
		let tableViewDatas = tableProps.filter(tableData => tableData.TableView)
		documentAttributeCommonName['tableView'] = tableViewDatas

		let assetAttributeCollectionsFromExcel = _.get(wbJSON, "Assets");
		console.log(assetAttributeCollectionsFromExcel[0], "assetAttributeCollectionsFromExcel")
		let assetAttributeCommonName = assetAttributeCollectionsFromExcel[0] !== undefined ? assetAttributeCollectionsFromExcel[0] : []
		console.log(assetAttributeCommonName, "assetAttributeCommonName")
		
		let hiddenprops = wbJSON["Asset Property Info"]
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
		assetAttributeCommonName['groups'] = groups
		let hiddenpropsParsed = UiUtils.IafDataPlugin.parseGridData({ gridData: hiddenprops });
		//console.log(hiddenpropsParsed, 'asset property')
		let hiddenProps = hiddenpropsParsed.filter(props => props.Hidden).map(hidden => hidden.Hidden)
		let tableView = hiddenpropsParsed.filter(props => props.TableView)
		console.log(tableView,'tableView')
		console.log(hiddenProps,'hiddenProps')
		assetAttributeCommonName['hiddenProps'] = hiddenProps
		assetAttributeCommonName['tableView'] = tableView
		console.log(assetAttributeCommonName, "assetAttributeDatas")
		


		let spaceAttributeCollectionsFromExcel = _.get(wbJSON, "Spaces");
		let spaceAttributeCommonName = spaceAttributeCollectionsFromExcel === undefined ? [] : spaceAttributeCollectionsFromExcel[0]
		console.log(spaceAttributeCommonName, "spaceAttributeCommonName")

		 let spaceProps = wbJSON['Space Property Info']
		// console.log(spaceProps,'spaceprops')
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
		let hiddenSpaceProps = UiUtils.IafDataPlugin.parseGridData({ gridData: spaceProps });
		let hiddenSpaceDatas = hiddenSpaceProps.filter(props => props.Hidden).map(hidden => hidden.Hidden)
		spaceAttributeCommonName['hiddenProps'] = hiddenSpaceDatas

		console.log(spaceGroups,'spaceGroups')
		spaceAttributeCommonName['groups'] = spaceGroups

		let spaceTableView = hiddenSpaceProps.filter(table => table.TableView)
		spaceAttributeCommonName['tableView'] = spaceTableView

		let localAddr = _.get(wbJSON, "Path");
		let localAppPath = localAddr === undefined ? [] : localAddr[1]
		console.log(localAppPath, "localAppPath")



		let userGroups = xlsConfigDataParsed.map(user => user.UserGroupName)
		console.log(loadedScripts._list, 'loadedscr')
		if (isScriptExists(loadedScripts._list, "iaf_dbm_soladmin_uc")) {
			userGroupDescriptors.push(solutionAdmin)
			userConfigDescriptors.push(userConfigSolutionAdmin)
			userConfigToUserGroupMap.push(userConfigToUserGroupMapSolAdmin)
			let findUser = [
				{
					"UserGroup": "Project Admin",
					"UserGroupName": "Solution Admin",
					"Assets": "Yes",
					"Spaces": "Yes",
					"Files": "Yes",
					"ModelElements": "Yes",
					"Collections": "Yes",
					"BIMPK Upload": "Yes",
					"SGPK Upload": "No",
					"Navigator": "Yes"
				}
			]
			await loadScripts(input, libraries, ctx, findUser, loadedScripts._list,
				documentAttributeCommonName, assetAttributeCommonName, spaceAttributeCommonName, localAppPath)
			Object.assign(updateUserConfigContent,
				{
					handlers: {
						...updateUserConfigContent.handlers,
						modelVer: handlerManageModel.handler.modelVer
					}
				},
				{
					groupedPages: {
						...updateUserConfigContent.groupedPages,
						Admin: groupedPagesAdmin.groupedPages.Admin,
					}
				})
			updateUserConfigContent.groupedPages["Admin"].pages.push(groupedPagesAdminUsergrp)
			updateUserConfigContent.groupedPages["Admin"].pages.push(groupedPagesAssetTwinManageModel)

			configNames.push("iaf_dbm_soladmin_uc")
			configContents.push(JSON.stringify(updateUserConfigContent))
			updateUserConfigContent.groupedPages["Asset Twin"].pages = []
			Object.assign(updateUserConfigContent, resetUserConfigContent)
		}
		if (userGroups.includes("Project Admin") && isScriptExists(loadedScripts._list, "iaf_dbm_projadmin_uc")) {
			userGroupDescriptors.push(projectAdmin)
			userConfigDescriptors.push(userConfigProjectAdmin)
			userConfigToUserGroupMap.push(userConfigToUserGroupMapProjAdmin)
			let findUser = xlsConfigDataParsed.filter(x => x.UserGroupName == "Project Admin")
			console.log(findUser, "finduser-projectAdmin")
			await loadScripts(input, libraries, ctx, findUser, loadedScripts._list, documentAttributeCommonName,
				assetAttributeCommonName, spaceAttributeCommonName, localAppPath)
			Object.assign(updateUserConfigContent,
				{
					handlers: {
						...updateUserConfigContent.handlers,
						modelVer: handlerManageModel.handler.modelVer
					}
				},
				{
					groupedPages: {
						...updateUserConfigContent.groupedPages,
						Admin: groupedPagesAdmin.groupedPages.Admin,
					}
				})
			if (updateUserConfigContent.groupedPages["Admin"].pages.length === 0) {
				updateUserConfigContent.groupedPages["Admin"].pages.push(groupedPagesAdminUsergrp)
				updateUserConfigContent.groupedPages["Admin"].pages.push(groupedPagesAssetTwinManageModel)
			}
			configNames.push("iaf_dbm_projadmin_uc")
			configContents.push(JSON.stringify(updateUserConfigContent))
			updateUserConfigContent.groupedPages["Asset Twin"].pages = []
			Object.assign(updateUserConfigContent, resetUserConfigContent)
		}
		if (userGroups.includes("Project User") && isScriptExists(loadedScripts._list, "iaf_dbm_projuser_uc")) {
			userGroupDescriptors.push(projectUser)
			userConfigDescriptors.push(userConfigProjectUser)
			userConfigToUserGroupMap.push(userConfigToUserGroupMapProjUser)
			let findUser = xlsConfigDataParsed.filter(x => x.UserGroupName == "Project User")
			console.log(findUser, "finduser-projectUser")
			await loadScripts(input, libraries, ctx, findUser, loadedScripts._list, documentAttributeCommonName,
				assetAttributeCommonName, spaceAttributeCommonName, localAppPath)
			configNames.push("iaf_dbm_projuser_uc")
			configContents.push(JSON.stringify(updateUserConfigContent))
			updateUserConfigContent.groupedPages["Asset Twin"].pages = []
			Object.assign(updateUserConfigContent, resetUserConfigContent)
		}
		if (userGroups.includes("Project Visitor") && isScriptExists(loadedScripts._list, "iaf_dbm_visitor_uc")) {
			userGroupDescriptors.push(projectVisitor)
			userConfigDescriptors.push(userConfigProjectVisitor)
			userConfigToUserGroupMap.push(userConfigToUserGroupMapProjVisitor)
			let findUser = xlsConfigDataParsed.filter(x => x.UserGroupName == "Project Visitor")
			console.log(findUser, "finduser")
			await loadScripts(input, libraries, ctx, findUser, loadedScripts._list, documentAttributeCommonName,
				assetAttributeCommonName, spaceAttributeCommonName, localAppPath)
			configNames.push("iaf_dbm_visitor_uc")
			configContents.push(JSON.stringify(updateUserConfigContent))
			updateUserConfigContent.groupedPages["Asset Twin"].pages = []
			Object.assign(updateUserConfigContent, resetUserConfigContent)
		}

		if (userGroupDescriptors.length > 0) {
			await createUserGroups(input, libraries, ctx, userGroupDescriptors)
			await userConfigsLoader(input, libraries, ctx, configNames)
			await scriptsLoader(input, libraries, ctx)
		}
		await updateFilecreateOrRecreateIndex(input, libraries, ctx)
		await createOrRecreateCollectionsCollection(input, libraries, ctx)
		const functionAccess = _.get(wbJSON, "Import List")
		console.log(functionAccess, "functionAccess")
		let xlsConfigDataParseds = UiUtils.IafDataPlugin.parseGridData({ gridData: functionAccess })
		let typeMapFunctionAccess = xlsConfigDataParseds.filter(x => x['Function Name'] == "BimType").map(x => x.Access) == "Yes"
		console.log(typeMapFunctionAccess, "TYPEMAPACCESS")

		//Import typeMapLoader - Bim Type Sheet
		const bimTypeCollection = _.get(wbJSON, "Bim Type");
		console.log(bimTypeCollection, "bimTypeCollection")
		if (!bimTypeCollection) {
			console.log("Bim Type Sheet Tab Missing");
		}
		const bimTypeCollection_data_objects = UiUtils.IafDataPlugin.parseGridData(
			{ gridData: bimTypeCollection });
		console.log(bimTypeCollection_data_objects, "bimTypeCollection_data_objects")
		await typeMapLoader(input, libraries, ctx, bimTypeCollection_data_objects)

		let setupCDEFunctionAccess = xlsConfigDataParseds.filter(x => x['Function Name'] == "DocumentAttributes").map(x => x.Access) == "Yes"
		//Import setupCDEFunction - DocumentAttributes Sheet
		const documentAttributeCollections = _.get(wbJSON, "Document Attributes");
		console.log(documentAttributeCollections, "documentAttributeCollections")
		let documentAttributeCollections_as_objects = UiUtils.IafDataPlugin.parseGridData(
			{ gridData: documentAttributeCollections, options: { asColumns: true } })
		console.log(documentAttributeCollections_as_objects, "documentAttributeCollections_as_objects")
		await setupCDELoader(input, libraries, ctx, documentAttributeCollections_as_objects)

		const orderGroupFunctionResult = await new Promise((resolve) =>
			setTimeout(async () => {
				console.log('modelimport')
				let modelImport = xlsConfigDataParseds.filter(x => x['Function Name'] == "ModelImport").map(x => x.Access) == "Yes"
				console.log(modelImport, 'Model Import')
				if (modelImport === true) {

					console.log('Please upload model sheet.')
					let localBimpkPath = _.get(wbJSON, "Path");
					let filePathForBimpK = localBimpkPath[1][1]
					let bimpkFileName = filePathForBimpK.substring(filePathForBimpK.lastIndexOf('/') + 1)
					const uploadFileResults = await new Promise((resolve) =>
						setTimeout(async () => {
							await uploadFiles(input, libraries, ctx, callback, filePathForBimpK, bimpkFileName)
							resolve("true")
						}, 0),
					);
					await addRemapElementsTypeDatasource(input, libraries, ctx, callback)

					let results = await importBimpkModelFile(input, libraries, ctx)
					console.log(results, "final-result")
					if (results === "true") {
						console.log("bimpk-loadedsuccessfully")
						//Import Model Asset Sheet
						let importModeledAssetFunctionAccess =
							xlsConfigDataParseds.filter(x => x['Function Name'] == "Assets").map(x => x.Access) == "Yes"
						console.log(importModeledAssetFunctionAccess, "importModeledAssetFunctionAccess")
						if (importModeledAssetFunctionAccess === true) {
							const xlsAssetPropInfo = wbJSON["Asset Property Info"];
							if (!xlsAssetPropInfo) {
								console.log("Property Info Tab Missing");
							}
							let xlsAssetData = wbJSON.Assets
							let assetDataParsed = UiUtils.IafDataPlugin.parseGridData({ gridData: xlsAssetData });
							let assetPropInfoParsed = UiUtils.IafDataPlugin.parseGridData({ gridData: xlsAssetPropInfo });

							await importModeledAssets(input, libraries, ctx, assetDataParsed, assetPropInfoParsed)
						}
						//Import Model Space Sheet
						let importModeledSpaceFunctionAccess = xlsConfigDataParseds.filter(x => x['Function Name'] == "Spaces").map(x => x.Access) == "Yes"
						if (importModeledSpaceFunctionAccess === true) {
							const xlsSpacePropInfo = wbJSON["Space Property Info"];
							console.log(xlsSpacePropInfo, "space property info")
							if (!xlsSpacePropInfo) {
								console.log("Property Info Tab Missing");
							}
							let xlsSpaceData = wbJSON.Spaces
							console.log(xlsSpaceData, "xlsSpaceData")
							let spaceDataParsed = UiUtils.IafDataPlugin.parseGridData({ gridData: xlsSpaceData });
							console.log(spaceDataParsed, "spaceDataParsed")
							let spacePropInfoParsed = UiUtils.IafDataPlugin.parseGridData({ gridData: xlsSpacePropInfo });
							console.log(spacePropInfoParsed, "spacePropInfoParsed")

							await importModeledSpaces(input, libraries, ctx, spaceDataParsed, spacePropInfoParsed)
						}
					}
				}
				else {
					//Import Model Asset Sheet
					let importModeledAssetFunctionAccess =
						xlsConfigDataParseds.filter(x => x['Function Name'] == "Assets").map(x => x.Access) == "Yes"
					console.log(importModeledAssetFunctionAccess, "importModeledAssetFunctionAccess")
					if (importModeledAssetFunctionAccess === true) {
						const xlsAssetPropInfo = wbJSON["Asset Property Info"];
						if (!xlsAssetPropInfo) {
							console.log("Property Info Tab Missing");
						}
						let xlsAssetData = wbJSON.Assets
						let assetDataParsed = UiUtils.IafDataPlugin.parseGridData({ gridData: xlsAssetData });
						let assetPropInfoParsed = UiUtils.IafDataPlugin.parseGridData({ gridData: xlsAssetPropInfo });

						//await importModeledAssets(input, libraries, ctx, assetDataParsed, assetPropInfoParsed)
						await importModeledAssetsWithoutModel(input, libraries, ctx, assetDataParsed, assetPropInfoParsed)

					}
					//Import Model Space Sheet
					let importModeledSpaceFunctionAccess = xlsConfigDataParseds.filter(x => x['Function Name'] == "Spaces").map(x => x.Access) == "Yes"
					if (importModeledSpaceFunctionAccess === true) {
						const xlsSpacePropInfo = wbJSON["Space Property Info"];
						console.log(xlsSpacePropInfo, "space property info")
						if (!xlsSpacePropInfo) {
							console.log("Property Info Tab Missing");
						}
						let xlsSpaceData = wbJSON.Spaces
						console.log(xlsSpaceData, "xlsSpaceData")
						let spaceDataParsed = UiUtils.IafDataPlugin.parseGridData({ gridData: xlsSpaceData });
						console.log(spaceDataParsed, "spaceDataParsed")
						let spacePropInfoParsed = UiUtils.IafDataPlugin.parseGridData({ gridData: xlsSpacePropInfo });
						console.log(spacePropInfoParsed, "spacePropInfoParsed")

						//await importModeledSpaces(input, libraries, ctx, spaceDataParsed, spacePropInfoParsed)
						await importModeledSpacesWithoutModel(input, libraries, ctx, spaceDataParsed, spacePropInfoParsed)
					}

				}
				resolve("true")
			}, 6000),
		);

		//create relation between space and asset
		const xlsAssetPropInfo = wbJSON["Asset Property Info"];
		const xlsSpacePropInfo = wbJSON["Space Property Info"];
		let assetPropParsed = UiUtils.IafDataPlugin.parseGridData({ gridData: xlsAssetPropInfo })
		let spacePropParsed = UiUtils.IafDataPlugin.parseGridData({ gridData: xlsSpacePropInfo })
		if(assetPropParsed[0].Relation && spacePropParsed[0].Relation){
			await createAssetSpaceReln(input, libraries, ctx, assetPropParsed[0].Relation, spacePropParsed[0].Relation)
		}
	}
}

export default ProjSetup