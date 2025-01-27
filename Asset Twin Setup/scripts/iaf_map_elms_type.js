const mapElementsType = async (param, libraries, ctx)=>{ 
      
    const { IafScriptEngine } = libraries;
    let iaf_ext_current_bim_model = await IafScriptEngine.getCompositeCollections(
        { query: { "_userType": "bim_model_version",
          "_itemClass": "NamedCompositeItem"}},
    ctx, { getLatestVersion: true });

    console.log("iaf_ext_current_bim_model-easyAssetTwin", iaf_ext_current_bim_model)

    let latestModelComposite;
    if (iaf_ext_current_bim_model && iaf_ext_current_bim_model._list && iaf_ext_current_bim_model._list.length) {
        latestModelComposite = _.last(_.sortBy(iaf_ext_current_bim_model._list, m => m._metadata._updatedAt));
    }

    console.log("latestModelComposite-easyAssetTwin", latestModelComposite)

    let model_els_coll = await IafScriptEngine.getCollectionInComposite(latestModelComposite._userItemId, { _userType: "rvt_elements" }, ctx)
    console.log("model_els_coll-easyAssetTwin", model_els_coll)

    let model_type_el_coll = await IafScriptEngine.getCollectionInComposite(latestModelComposite._userItemId, { _userType: "rvt_type_elements" }, ctx)
    console.log("model_type_el_coll-easyAssetTwin", model_type_el_coll)

    let type_map_collection = await IafScriptEngine.getCollection(
		{
		  _userType: "iaf_dt_type_map_defs_coll",
		  _shortName: "typemap_defs",
		  _itemClass: "NamedUserCollection",
		}, ctx
	)

    console.log("type_map_collection-easyAssetTwin", type_map_collection)

    let typeElements =  await IafScriptEngine
    .getItems({
        _userItemId: model_type_el_coll._userItemId,
        options: { page: {getAllItems: true, _pageSize:1000}}
    },ctx);

    console.log("typeElements-easyAssetTwin")

    let assetTypeMap =  await IafScriptEngine
    .getItems({
        collectionDesc: {
            _userItemId: type_map_collection._userItemId,
        },
        options: { page: {getAllItems: true, _pageSize:1000}}
    },ctx);

    console.log("assetTypeMap-easyAssetTwin")

    let elements =  await IafScriptEngine
    .getItems({
        _userItemId: model_els_coll._userItemId,
        options: { page: {getAllItems: true, _pageSize:1000}}
    },ctx);
    console.log("elements-easyAssetTwin")

    console.log(JSON.stringify({"message":"Re-mapping Type Elements-easyAssetTwin"}));
    for (let typeElement of typeElements){
        if(typeElement.hasOwnProperty("dtCategory")){
            delete typeElement.dtCategory;
            delete typeElement.dtType
        }
        if (assetTypeMap && typeElement.properties.hasOwnProperty("Revit Family") && typeElement.properties.hasOwnProperty("Revit Type")) {
            let _myRow = assetTypeMap.find(x => x["Revit Family"] == typeElement.properties["Revit Family"].val && x["Revit Type"] == typeElement.properties["Revit Type"].val);
            //console.log("_myRow-CSB2", _myRow)
            if (_myRow) {
                console.log("adding typmap-easyAssetTwin")
                typeElement.dtCategory = _myRow.dtCategory;
                typeElement.dtType = _myRow.dtType;
            }     
        }
    }
    console.log(JSON.stringify({"message":"Re-mapping Model Elements"}));
    for (let element of elements){
        if(element.hasOwnProperty("dtCategory")){
            delete element.dtCategory;
            delete element.dtType
        }
        let _myVal = typeElements.find(x => x.id == element.type_id);
        if(_myVal){
            element.dtCategory = _myVal.dtCategory;
            element.dtType = _myVal.dtType;
        }
    }
    await IafScriptEngine.updateItemsBulk({
        _userItemId: model_els_coll._userItemId,
        items: elements

    },ctx);
    console.log("Model elements updated-easyAssetTwin");

    await IafScriptEngine.updateItemsBulk({
        _userItemId: model_type_el_coll._userItemId,
        items: typeElements
    },ctx);
    console.log("Type elements updated-easyAssetTwin");
    
}


export default {
    async mapAssetCollection(params, libraries, ctx) { 
        const { IafScriptEngine } = libraries;
        console.log("mapAssetCollection Func Start")
        await mapElementsType(params, libraries, ctx);
        
        let assetCollection = await IafScriptEngine
            .getCollection({
                _userType: "iaf_ext_asset_coll",
                _shortName: "asset_coll",
                _itemClass: "NamedUserCollection"
            },ctx);

        if(assetCollection){
            let assets = await IafScriptEngine
                .getItems({
                    _userItemId: assetCollection._userItemId,
                    options: {
                        page: {
                            getAllItems: true
                        }
                    }
            },ctx);
            let assetTypeMap =  await IafScriptEngine
                .getItems({
                    "collectionDesc": {
                        "_userType": "iaf_dt_type_map_defs_coll",
                    },
                    options: {
                        page: {
                            getAllItems: true
                        }
                    }
             },ctx);
            console.log(JSON.stringify({"message":"Re-mapping Assets"}));
            for (let asset of assets){
                if (asset.properties.hasOwnProperty("Revit Family") && asset.properties.hasOwnProperty("Revit Type")) {
                    let _myRow = assetTypeMap.find(x => x["Revit Family"] == asset.properties["Revit Family"].val && x["Revit Type"] == asset.properties["Revit Type"].val);
                        if (_myRow) {
                            asset.properties.dtCategory.val = _myRow.dtCategory;
                            asset.properties.dtType.val = _myRow.dtType;
                        }
                    }

            }

            await IafScriptEngine.updateItemsBulk({
                _userItemId: assetCollection._userItemId,
                items: assets
            },ctx);
            return true;
        }
        else{ console.log(JSON.stringify({"message":"No Assets Found so Skipping Assets"})); }

    }

}