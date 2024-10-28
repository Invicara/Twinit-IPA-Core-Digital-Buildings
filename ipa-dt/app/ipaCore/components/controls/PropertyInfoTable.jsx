import React, {useEffect, useState} from "react"
import clsx from "clsx";

import {SimpleTable} from '@invicara/ipa-core/modules/IpaControls'
import {ScriptHelper, FileHelpers}  from '@invicara/ipa-core/modules/IpaUtils'
import _ from "lodash";

const PropertyInfoTable = (props) => {

  const [propertyInfo, setPropertyInfo] = useState({})
  const [picUrl, setPicUrl] = useState()

  useEffect(() => {
    const fetchData = async () => {
      const result = await ScriptHelper.executeScript(props.script)
      setPropertyInfo(result)
    }
    fetchData()
  }, [])

  if (_.keys(propertyInfo).length==0) {
    return <div>Loading...</div>
  }

  let pi = Object.assign({}, propertyInfo)
  let name = pi.Name
  let address = pi.Address
  let picInfo = pi.ImageFile
  delete pi.Name
  delete pi.Address
  delete pi.ImageFile
  let rows = Object.entries(pi).filter(([k,v]) => typeof(v)=="string" || typeof(v)=="number")

  let twoCol = !!picInfo.fileId && (!!name || !!address || !!rows.length > 0)

  let pic = {}
  if (!picUrl && picInfo.fileId)
    FileHelpers.getFileUrl(picInfo.fileId).then(url => setPicUrl(url))
  else
    pic = {backgroundImage: `url("${picUrl}")`}

  return (
    <div className={clsx({"property-info-table": true, "two-col": twoCol, "one-col": !twoCol})}>
      {twoCol && <div>
        <div className="picture-container" style={pic}> </div>
      </div>}
      <div>
        <h1>{name}</h1>
        <h2>{address}</h2>
        <SimpleTable className="property-info-sub-table" rows={rows} />
      </div>
    </div>
  )
}

export default PropertyInfoTable
