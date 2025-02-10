let sgpk = {
async getAssetsSgpk(input, libraries, ctx, callback) {
    console.log('input', input)
    const { IafScriptEngine } = libraries.PlatformApi
    let assetColl = IafScriptEngine.getVar('iaf_asset_collection')
    let assetQuery = {
        query: input.entityInfo,
        collectionDesc: { _userType: assetColl._userType, _userItemId: assetColl._userItemId },
        options: { page: { getAllItems: true } }
    }
    console.log("assetQuery", assetQuery)

    let assets = await IafScriptEngine.getItems(assetQuery, ctx)

    console.log("assets", assets)

    let assetsAsEntities = assets.map((a) => {
        a.original = _.cloneDeep(a)
        a['Entity Name'] = a['Asset Name']
        a.modelViewerIds = [a.properties.ItemGUID.val]
        return a
    })

    return assetsAsEntities
},
async getAssetFromModelSgpk(input, libraries, ctx, callback) {
    console.log('inputgetAssetFromModel', input)
    const { IafScriptEngine } = libraries.PlatformApi
    let iaf_asset_collection = IafScriptEngine.getVar('iaf_asset_collection')
    console.log(iaf_asset_collection, _.trim(input.modelInfo.id))
    let asset_query = {
        query: { "properties.ItemGUID.val": _.trim(input.modelInfo.id) },
        collectionDesc: { _userType: iaf_asset_collection._userType, _userItemId: iaf_asset_collection._userItemId },
        options: { page: { getAllItems: true } }
    }
    let queryResults = await IafScriptEngine.getItems(asset_query, ctx)
    console.log('queryResults', queryResults)
    let asset = null
    if (queryResults.length > 0) {
        asset = queryResults.map(asset => {
            return {
                _id: asset._id,
                "Entity Name": asset['Asset Name'],
                properties: asset.properties,
                modelViewerIds: [asset.properties.ItemGUID.val],
            }
        })[0]
    }
    console.log('asset', asset)
    return asset
},
async getSpacesSgpk(input, libraries, ctx, callback) {
    console.log('input', input)
    const { IafScriptEngine } = libraries.PlatformApi
    let spaceColl = IafScriptEngine.getVar('iaf_space_collection')
    let relatedQuery = {
        parent: {
            query: input?.entityInfo || {},
            collectionDesc: { _userType: spaceColl._userType, _userItemId: spaceColl._userItemId },
            options: { page: { getAllItems: true } }
        },
        related: [
            {
                relatedDesc: {
                    _relatedUserType: "rvt_elements",
                    //_relatedUserItemVersionId: elemColl._userItemVersionId
                },
                options: { project: { _id: 1, package_id: 1 } },
                as: "revitElementIds"
            }
        ]
    }

    console.log(relatedQuery)

    let spaces = await IafScriptEngine.findWithRelated(relatedQuery, ctx).catch((err) => {
        return err
    })

    console.log(spaces)

    let spacesAsEntities = spaces._list.map((a) => {
        a.original = _.cloneDeep(a)
        a['Entity Name'] = a['Space Name']
        a.modelViewerIds = a.revitElementIds._list.map(e => e.package_id)
        return a
    })

    return spacesAsEntities

},
async getSpaceFromModelSgpk(input, libraries, ctx, callback) {

    console.log('inputgetAssetFromModel', input)
    const { IafScriptEngine } = libraries.PlatformApi
    let iaf_space_collection = IafScriptEngine.getVar('iaf_space_collection')
    console.log(iaf_space_collection, _.trim(input.modelInfo.id))
    let space_query = {
        query: { "properties.ItemGUID.val": _.trim(input.modelInfo.id) },
        collectionDesc: {
            _userType: iaf_space_collection._userType,
            _userItemId: iaf_space_collection._userItemId
        },
        options: { page: { getAllItems: true } }
    }
    let queryResults = await IafScriptEngine.getItems(space_query, ctx)
    console.log('queryResults', queryResults)
    let space = null
    if (queryResults.length > 0) {
        space = queryResults.map(space => {
            return {
                "Entity Name": space['Space Name'],
                properties: space.properties,
                modelViewerIds: space.properties.ItemGUID.val,
            }
        })[0]
    }
    console.log('space', space)
    return space

},
async getCategoriesWithCountSgpk(input, libraries, ctx) {
    let { PlatformApi } = libraries
    let iaf_asset_collection = await PlatformApi.IafScriptEngine.getVar('iaf_asset_collection')
    let distinctCats = await PlatformApi.IafScriptEngine.getDistinct({
        collectionDesc: { _userType: iaf_asset_collection._userType, _id: iaf_asset_collection._id },
        field: "properties.Category.val",
        query: {}
    }, ctx)
    //check this
    distinctCats = _.sortBy(distinctCats, cat => cat._id)
    let distinctCatWithTypeCountQuery = distinctCats.map(cat => {
        return {
            _userItemId: iaf_asset_collection._id,
            query: { "properties.Category.val": cat },
            options: { page: { _pageSize: 0, getPageInfo: true } }
        }
    })
    let catsPageInfo = await PlatformApi.IafScriptEngine.getItemsMulti(distinctCatWithTypeCountQuery, ctx);
    let distinctCatsWithPageInfo = _.zip(distinctCats, catsPageInfo)
    let distinctCatsWithTypeCount = distinctCatsWithPageInfo.map(catWithPage => {
        return {
            name: catWithPage[0],
            childCount: catWithPage[1]._total
        }
    })
    return distinctCatsWithTypeCount
},
async getTypesWithChildrenCountSgpk(input, libraries, ctx, callback) {
    console.log("input", input)
    let { PlatformApi } = libraries
    let iaf_asset_collection = await PlatformApi.IafScriptEngine.getVar('iaf_asset_collection')
    let distinctTypes = await PlatformApi.IafScriptEngine.getDistinct({
        collectionDesc: { _userType: iaf_asset_collection._userType, _id: iaf_asset_collection._id },
        field: 'properties.Type.val',
        query: { "properties.Category.val": input.input.Category }
    }, ctx)
    console.log('distinctTypes', distinctTypes)
    let distinctTypestWithChildCountQuery = distinctTypes.map(type => {
        return {
            _userItemId: iaf_asset_collection._id,
            query: {
                'properties.Category.val': input.input.Category,
                'properties.Type.val': type
            },
            options: { page: { _pageSize: 0, getPageInfo: true } }
        }
    })
    console.log('distinctTypestWithChildCountQuery', distinctTypestWithChildCountQuery)
    let typesPageInfo = await PlatformApi.IafScriptEngine.getItemsMulti(distinctTypestWithChildCountQuery, ctx);

    console.log('typesPageInfo', typesPageInfo)
    let distinctTypesWithPageInfo = _.zip(distinctTypes, typesPageInfo)
    console.log('distinctTypesWithPageInfo', distinctTypesWithPageInfo)

    let distinctTypesWithChildrenCount = distinctTypesWithPageInfo.map(typeWithpage => {
        return {
            name: typeWithpage[0],
            childCount: typeWithpage[1]._total
        }
    })
    console.log('distinctTypesWithChildrenCount', distinctTypesWithChildrenCount)
    return distinctTypesWithChildrenCount
},
async getAssetsForFileSgpk(input, libraries, ctx) {
    let { PlatformApi } = libraries
    let iaf_ext_files_coll = await PlatformApi.IafScriptEngine.getVar('iaf_ext_files_coll')
    let iaf_asset_collection = PlatformApi.IafScriptEngine.getVar('iaf_asset_collection')
    console.log("iaf_asset_collection", iaf_asset_collection)
    console.log('getAssetsForFile INPUT', input)
    let assetQuery = [{
      parent: {
        query: { _id: input.entityInfo._id },
        collectionDesc: { _userType: iaf_ext_files_coll._userType, _userItemId: iaf_ext_files_coll._userItemId },
        options: { page: { getAllItems: true } },
        sort: { _id: 1 }
      },
      related: [
        {
          relatedDesc: { _relatedUserType: iaf_asset_collection._userType, _isInverse: true },
          as: 'AssetInfo'
        }
      ]
    }]
    let queryResults = await PlatformApi.IafScriptEngine.findWithRelatedMulti(assetQuery, ctx)
    console.log("queryResults", queryResults)
    let assets = queryResults[0]._list[0].AssetInfo._list
    console.log("assets", assets)
    //return assets
    let assetForTheFile
    let finalAssetForTheFile
    let header = [["Asset Name", "Actuation Type", "Type"]]
    if (assets.length > 0) {
        assetForTheFile = assets.map(asset => [
            asset['Asset Name'],
            asset.properties['Actuation Type'].val,
            asset.properties['Type'].val
      ])
      finalAssetForTheFile = header.concat(assetForTheFile)
    } else {
      finalAssetForTheFile = []
    }
    console.log(finalAssetForTheFile,'finalAssetForTheFile');
    
    return finalAssetForTheFile
  },
}
export default sgpk