import React, {useEffect, useState} from "react"

const MatterportViewer = ({url, allowFullscreen, options, width, height, padding, borderRadius}) => {

  const [matterportUrl, setMatterportUrl] = useState(null)

  let isValidConfig = () => {
    return !!url
  }

  useEffect(() => {
    const makeUrl = async () => {
      
      /*
       * config.options can contain any options from
       * https://support.matterport.com/hc/en-us/articles/209980967-URL-Parameters#introduction-0-0
       */
      
      let newUrl = url

      if (options) {
        
         let keys = Object.keys(options)

         if (keys.length > 0) {
           
           keys.forEach((key) => {
             newUrl += "&" + key + "=" + options[key]
           })
         }
      }
      
      setMatterportUrl(newUrl)
    }
    
    makeUrl()
  }, [])

  let component = <div>Loading</div>
  
  if (!isValidConfig()){
    component = <span>Please provide a valid Matterport configuration!</span>
  } else if (matterportUrl) {
    
    let styles = {
      maxWidth: width ? width : '100%',
      minWidth: width ? width : '100%',
      minHeight: height ? height : '100%',
      maxHeight: height ? height : '100%'
    }
  
    component = <iframe src={matterportUrl}
                    style={styles}
                    className="responsive-iframe"
                    frameBorder="0" 
                    allowFullScreen={!!allowFullscreen}
                    allow="xr-spatial-tracking" >
                </iframe>
   }

  return (
    <div style={{padding: padding? padding : '15px', width: '100%', height: '100%'}}>
      <div className="scripted-matterport-container" style={{borderRadius: borderRadius? borderRadius : null}}>
        {component}
      </div>
    </div>
  )

}

export const MatterportViewerFactory = {
  create: ({config, data}) => {
    
    //data and options provided by the script will do a shallow replace
    //so properties of options are not merged, just one options object
    //replaces the other. In most cases I believe a script will only
    //be supplying the url and not the options anyway
    let options = {...config.config.options, ...data}
  
    return <MatterportViewer {...options} {...config.config}/>
    
  }
}

export default MatterportViewer
