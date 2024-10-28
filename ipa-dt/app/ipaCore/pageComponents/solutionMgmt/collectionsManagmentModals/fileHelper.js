import * as UiUtils from '@dtplatform/ui-utils'

export const ProcessXlsxFile = async (json) => {
    let items = []
    let propertyInfo = json['Property Info']
    let propertyInfoParsed = await UiUtils.IafDataPlugin.parseGridData({ gridData: propertyInfo })
    _.each(json, async (sheet, index) => {
      if ((parseInt(index))) {
        let sheetParsed = await UiUtils.IafDataPlugin.parseGridData({ gridData: sheet })
        let propertiesForSheet = _.filter(propertyInfoParsed, prop => prop['sheet id'] === index)

        _.each(sheetParsed, async (item) => {
          let propertiesForEntity = {}
          if(item.Mark !== undefined) {
            propertiesForEntity[Object.keys(item)[0]] = {
              dName: Object.keys(item)[0],
              type: 'text',
              hasMultipleValues: false,
              uom: undefined,
              val: Object.values(item)[0]
            }
            _.each(propertiesForSheet, prop => {
                propertiesForEntity[prop.Property] = {
                  dName: prop.Property,
                  type: prop.Type,
                  hasMultipleValues: false,
                  uom: prop.uom,
                  val: undefined
                }
            })
            let itemProps = {}
            _.each(propertiesForEntity, prop=>{
                        prop.val = item[prop.dName]
                        itemProps[prop.dName] = prop
                    })
          items.push({
            Name: Object.values(item)[0], 
            properties: itemProps
          })}
        })
      }
    });
    return items
  }