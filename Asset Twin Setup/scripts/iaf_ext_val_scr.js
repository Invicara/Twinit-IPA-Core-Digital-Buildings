let runnableScripts = [
    { name: "Generate BIM Type Report", script: "generateBIMTypeReport" },
    { name: "Export Asset Data", script: "exportAssetData" },
    { name: "Export Space Data", script: "exportSpaceData" }
]

let extval = {
    //Exposes the runnable steps to script execution tools like the vscode extension
    getRunnableScripts() {
        return runnableScripts
    },

    //This function is used to generate BIM Type report
    async generateBIMTypeReport(input, libraries, ctx) {
        let { PlatformApi , IafScriptEngine, UiUtils} = libraries

        let {IafProj} = PlatformApi

        let IAF_workspace = await IafProj.getCurrent(ctx)

        console.log("workspace", IAF_workspace)

        let currentModel = await IafScriptEngine.getCompositeCollections({
			query:
			{
				"_userType": "bim_model_version",
				"_namespaces": { "$in": IAF_workspace._namespaces },
				"_itemClass": "NamedCompositeItem"
			}
		}, ctx, { getLatestVersion: true });

		if (!currentModel) return "No Model Present"
   
		let latestModelComposite;
		if (currentModel && currentModel._list && currentModel._list.length) {
		  latestModelComposite = _.last(_.sortBy(currentModel._list, m => m._metadata._updatedAt));
		}

		console.log("latestModelComposite",JSON.stringify(latestModelComposite))
		
		let iaf_ext_type_elem_coll = await IafScriptEngine.getCollectionInComposite(
		latestModelComposite._userItemId, { _userType: "rvt_type_elements" }, ctx)

		console.log("iaf_ext_type_elem_coll", iaf_ext_type_elem_coll)

        let iaf_dt_model_el_types = await IafScriptEngine.getItems({
            collectionDesc: {
                _userItemId: iaf_ext_type_elem_coll._userItemId,
                _namespaces: IAF_workspace._namespaces
            },
            query: { "properties.Revit Family": { $exists: true } },
            options: { page: { getAllItems: true } }
        }, ctx)
        console.log('iaf_dt_model_el_types', iaf_dt_model_el_types)

        //let header = [["Revit Category", "Revit Family", "Revit Type", "dtCategory", "dtType"]]
        let assetTypes = iaf_dt_model_el_types.map(type => {
            //if (type.baType)
            return {
                "Revit Category": type.properties['Revit Category'].val,
                "Revit Family": type.properties['Revit Family'].val,
                "Revit Type": type.properties['Revit Type'].val,
                "dtCategory": type.dtCategory ? type.dtCategory : '',
                "dtType": type.dtType ? type.dtType : ''}
        })
        console.log(assetTypes,'assetTypes');
        
        let sheetArrays = [{ sheetName: "Sheet1", objects: assetTypes }]
        console.log('shetArrays', sheetArrays)
        
        let relationWorkbook = await UiUtils.IafDataPlugin.createWorkbookFromAoO(sheetArrays);

        let savedWorkbook = await UiUtils.IafDataPlugin.saveWorkbook(relationWorkbook,"EasyAssetTwin_BIMTypes.xlsx");
        console.log('savedWorkbook', savedWorkbook)
    },

    //This function is used to export Asset Data from model
    async exportAssetData(input, libraries, ctx){

        let { PlatformApi , IafScriptEngine, UiUtils} = libraries
        let proj = await PlatformApi.IafProj.getCurrent(ctx)

        let iaf_ext_current_bim_model = await IafScriptEngine.getCompositeCollection(
            { query: { "_userType": "bim_model_version", "_namespaces": { "$in": proj._namespaces }, "_itemClass": "NamedCompositeItem" } }, ctx, { getLatestVersion: true })
        console.log("iaf_ext_current_bim_model", iaf_ext_current_bim_model); 

        let model_els_coll = await IafScriptEngine.getCollectionInComposite(
            iaf_ext_current_bim_model._userItemId, { _userType: "rvt_elements" }, ctx)
        console.log("model_els_coll", model_els_coll);

        let type_coll = await IafScriptEngine.getCollectionInComposite(
            iaf_ext_current_bim_model._userItemId, { _userType: "rvt_type_elements" }, ctx)
        console.log("type_coll", type_coll);

        let elem_coll = await IafScriptEngine.getCollectionInComposite(
            iaf_ext_current_bim_model._userItemId, { _userType: "rvt_element_props" }, ctx)
        console.log("elem_coll", elem_coll);

        let iaf_asset_collection = await IafScriptEngine.getCollection(
            {
              _userType: "iaf_ext_asset_coll",
              _shortName: "asset_coll",
              _itemClass: "NamedUserCollection",
            }, ctx
        );
        console.log('iaf_asset_collection', iaf_asset_collection);

        let bimQuery;

        if (iaf_asset_collection) {
            bimQuery = [{
                parent: {
                    query: { dtCategory: { $exists: true } },
                    collectionDesc: { _userType: "rvt_elements", _userItemId: model_els_coll._userItemId },
                    options: { page: { getAllItems: true } },
                    sort: { _id: 1 }
                },
                related: [
                    {
                        relatedDesc: { _relatedUserType: "rvt_type_elements" },
                        as: 'Revit Type Properties'
                    },
                    {
                        relatedDesc: { _relatedUserType: "rvt_element_props" },
                        as: 'Revit Element Properties'
                    },
                    {
                        relatedDesc: { _relatedUserType: iaf_asset_collection._userType, _isInverse: true },
                        as: 'AssetInfo',
                        options: {project: { "Asset Name": 1, properties:1 }}
                    }
                ]
            }]
        } else {
            bimQuery = [{
                parent: {
                    query: { dtCategory: { $exists: true } },
                    collectionDesc: { _userType: "rvt_elements", _userItemId: model_els_coll._userItemId },
                    options: { page: { getAllItems: true } },
                    sort: { _id: 1 }
                },
                related: [
                    {
                        relatedDesc: { _relatedUserType: "rvt_type_elements" },
                        as: 'Revit Type Properties'
                    },
                    {
                        relatedDesc: { _relatedUserType: "rvt_element_props" },
                        as: 'Revit Element Properties'
                    }
                ]
            }]
        }
        console.log("bim_query", JSON.stringify(bimQuery));  

        let queryResults = await IafScriptEngine.findWithRelatedMulti(bimQuery, ctx)
        console.log("queryResults", queryResults);   

        let assetList =  queryResults[0]._list
        console.log("assetList", assetList);

        let reduced = assetList.map(elem => {
            let result = {
                platformId: elem._id,
                revitGuid: elem.source_id,
                dtCategory: elem.dtCategory,
                dtType: elem.dtType,
                "Asset Name": _.get(elem, "AssetInfo._list[0]") ?  _.get(elem, "AssetInfo._list[0].Asset Name") : ''
            }
            let typeProps = _.get(elem, "Revit Type Properties._list[0].properties")
            let elemProps = _.get(elem, "Revit Element Properties._list[0].properties")

            for (const property in typeProps) {
                let key = typeProps[property].dName
                result[key] = typeProps[property].val
            }

            for (const property in elemProps) {
                let key = elemProps[property].dName
                result[key] = elemProps[property].val
            }
            return result
        })

        console.log("reduced", reduced)

        let sheetArrays = [{ sheetName: "Assets", objects: reduced }]
        console.log('shetArrays', sheetArrays)
        let relationWorkbook = await UiUtils.IafDataPlugin.createWorkbookFromAoO(sheetArrays)
        console.log('relationWorkbook', relationWorkbook)
        let savedWorkbook = await UiUtils.IafDataPlugin.saveWorkbook(relationWorkbook,"EasyAssetTwin_Exported_Assets.xlsx");
        console.log('savedWorkbook', savedWorkbook)
    },

    //This function is used to export Space Data from model
    async exportSpaceData(input, libraries, ctx){

        let { PlatformApi , IafScriptEngine, UiUtils} = libraries
        console.log
        let proj = await PlatformApi.IafProj.getCurrent(ctx)
        let iaf_ext_current_bim_model = await IafScriptEngine.getCompositeCollection(
            { query: { "_userType": "bim_model_version", "_namespaces": { "$in": proj._namespaces }, "_itemClass": "NamedCompositeItem" } }, ctx, { getLatestVersion: true })
        console.log("iaf_ext_current_bim_model", iaf_ext_current_bim_model);    
        let model_els_coll = await IafScriptEngine.getCollectionInComposite(
            iaf_ext_current_bim_model._userItemId, { _userType: "rvt_elements" }, ctx)
        console.log("model_els_coll", model_els_coll);
        let type_coll = await IafScriptEngine.getCollectionInComposite(
            iaf_ext_current_bim_model._userItemId, { _userType: "rvt_type_elements" }, ctx)
        console.log("type_coll", type_coll);
        let bim_query = {
            parent: {
                query: {"dtCategory": { $exists: false }},
                collectionDesc: { _userItemId: model_els_coll._userItemId, _userType: "rvt_elements"},
                options: { page: { getAllItems: true, getLatestVersion: true }},
                sort: { "_id": 1 }
              },
              related: [
                    {
                        relatedDesc: { _relatedUserType: "rvt_type_elements" },
                        as: 'Revit Type Properties'
                    },
                    {
                        relatedDesc: { _relatedUserType: "rvt_element_props" },
                        as: 'Revit Element Properties'
                    }
                ]
        }
        console.log("bim_query", bim_query);     
        let queryResults = await IafScriptEngine.findWithRelatedMulti([bim_query], ctx)
        console.log("queryResults", queryResults);  
        let spaceList =  queryResults[0]._list
        console.log("spaceList", spaceList); 
        let reduced = spaceList.map(elem => {
           let result = {
                revitGuid: elem.source_id,
                Name:  _.get(elem, "Revit Element Properties._list[0].properties.Name.val"),
                Number:  _.get(elem, "Revit Element Properties._list[0].properties.Number.val"),
                Area:  _.get(elem, "Revit Element Properties._list[0].properties.Area.val"),
                area_uom:  _.get(elem, "Revit Element Properties._list[0].properties.Area.uom"),
                "Revit Category":  _.get(elem, "Revit Type Properties._list[0].properties.Revit Category.val"),
                "Revit Family":  _.get(elem, "Revit Type Properties._list[0].properties.Revit Family.val")
            }
            let typeProps = _.get(elem, "Revit Type Properties._list[0].properties")
            let elemProps = _.get(elem, "Revit Element Properties._list[0].properties")

            for (const property in typeProps) {
                let key = typeProps[property].dName
                result[key] = typeProps[property].val
            }

            for (const property in elemProps) {
                let key = elemProps[property].dName
                result[key] = elemProps[property].val
            }
            return result
        })
        console.log("reduced", reduced)
        let sheetArrays = [{ sheetName: "Spaces", objects: reduced }]
        console.log('shetArrays', sheetArrays)
        let relationWorkbook = await UiUtils.IafDataPlugin.createWorkbookFromAoO(sheetArrays)
        console.log('relationWorkbook', relationWorkbook)
        let savedWorkbook = await UiUtils.IafDataPlugin.saveWorkbook(relationWorkbook,"EasyAssetTwin_Exported_Spaces.xlsx");
        console.log('savedWorkbook', savedWorkbook)
    }
}

export default extval