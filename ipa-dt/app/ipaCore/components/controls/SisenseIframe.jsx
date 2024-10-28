
import React, {useEffect, useState} from 'react'
import {getRandomString} from '@invicara/ipa-core/modules/IpaUtils'
import {compose} from "redux";
import {connect} from "react-redux";
import {getAllConnections, getConnection} from "../../redux/connections";


const SisenseIframe = ({dashboardId, filters, settings, getConnection, allConnections, width, height, dashboard}) => {

  let isValidConfig = () => {
    return !!dashboardId
  }
  
  const [sisenseLoaded, setSisenseLoaded] = useState(false)
  const [containerid, setContainerid] = useState(getRandomString('sisense-embed-container-'))
  const [frameid, setFrameid] = useState(getRandomString('sisense-embed-'))
  const [status, setStatus] = useState('Loading')
  const [myConnector, setMyConnector] = useState(null)
  const [sisenseFrame, setSisenseFrame] = useState(null)
  
  useEffect(() => {
    return () => {
      window.removeEventListener('message', handleNavigateToMessageEvent)
    }
  }, [])
  
  useEffect(() => {
    
    let connector = getConnection("SisenseIframe")
    //check to see if Sisense Embed SDK has already been loaded
    if (!connector) {
      setStatus('Connector not loaded')
    } else if (!!connector && !isValidConfig()) {
      setStatus('Invalid Sisense iframe config')
    } else if (!!connector && isValidConfig()) {
      setMyConnector(connector)
      setSisenseLoaded(true)
    }
    
  }, [allConnections])
  
  useEffect(() => {
    
    if (sisenseLoaded) {
      
      window.addEventListener('message', handleNavigateToMessageEvent, false)
      
      //once we know the sisense script is loaded create the embed iframe
      const { SisenseFrame, enums } = window['sisense.embed'];
      // Create an instance of SisenseFrame
      const sisenseFrame = new SisenseFrame({
        // Sisense application URL, including protocol and port if required
        url: myConnector.url,
        // OID of dashboard to load initially
        dashboard: dashboardId,
        settings: {
          showToolbar: settings && settings.showToolbar ? settings.showToolbar : false,
          showLeftPane: settings && settings.showLeftPane ? settings.showLeftPane : false,
          showRightPane: settings && settings.showRightPane ? settings.showRightPane : false
        },
        // Existing iFrame DOM element
        element: document.getElementById(frameid)
      })

      // Calling render() will apply the above configuration to the existing iFrame element
        sisenseFrame.render().then(() => {
            console.log("Sisense iFrame ready!");
            sisenseFrame.dashboard.applyFilters(filters)
        })
       
        setSisenseFrame(sisenseFrame)
      }
      
  }, [sisenseLoaded])
  
  useEffect(() => {
    if (sisenseFrame)
      sisenseFrame.dashboard.applyFilters(filters)
  }, [filters])
  
  const handleNavigateToMessageEvent = (e) => {
    
    if (e.data.query && e.data.entityType)
      dashboard.props.setQueryParams({query: e.data.query, entityType: e.data.entityType, senderEntityType: e.data.entityType})
    
    if (e.origin === myConnector.url && e.data.handler) {
      let action = {
        type: 'navigate',
        navigateTo: e.data.handler
      }

      dashboard.doAction(action)
    }
    
  }  
  
  let styles = {
    maxWidth: width ? width : '100%',
    minWidth: width ? width : '100%',
    minHeight: height ? height : '100%',
    maxHeight: height ? height : '100%'
  }   
    
  return (   
    
      <div id={containerid} className="generic-iframe-container" style={{width: styles.maxWidth, height: styles.maxHeight}}>
        {!sisenseLoaded && <div>{status}</div>}
        {sisenseLoaded && <iframe id={frameid} style={styles}></iframe>}
      </div>

  )

}

export const SisenseIframeFactory = {
  create: ({config, data}) => {
    
    //data and options provided by the script will do a shallow replace
    //so properties of options are not merged, just one options object
    //replaces the other. In most cases I believe a script will only
    //be supplying the url and not the options anyway
    let options = {...config.config, ...data}
  
    return <SisenseIframe {...options} {...config.config}/>
    
  }
}

const mapStateToProps = (state) => ({
  allConnections: getAllConnections(state)
})

const mapDispatchToProps = {
    getConnection
}

//export default AppProvider;
export default compose(
  
  connect(mapStateToProps, mapDispatchToProps),
  
)(SisenseIframe)