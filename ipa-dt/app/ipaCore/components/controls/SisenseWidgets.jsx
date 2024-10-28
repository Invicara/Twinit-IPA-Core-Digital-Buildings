
import React, {useEffect, useState} from 'react'
import {getRandomString} from '@invicara/ipa-core/modules/IpaUtils'
import {compose} from "redux";
import {connect} from "react-redux";
import {getConnection, getAllConnections} from "../../redux/connections"
import clsx from "clsx";

const SisenseWidgets = ({dashboardId, widgets, filters, showHeader=true, widgetTitle, showClearFilter=true, getConnection, allConnections, onClick, dashboard}) => {

  let isValidConfig = () => {
    return !!widgets && !!widgets.length
  }
  
  const [sisenseLoaded, setSisenseLoaded] = useState(false)
  const [widgetDivId, setWidgetDivId] = useState(getRandomString('sisense-connect-'))
  const [status, setStatus] = useState('Loading...')
  const [myConnector, setMyConnector] = useState(null)
  const [widgetDashboard, setWidgetDashboard] = useState(null)
  const [isFiltered, setIsFiltered] = useState(false)
  
  
  useEffect(() => {
    return () => {
      //document.getElementById(widgetDivId).removeEventListener('NavigateTo', handleNavigateToEvent)
      window.removeEventListener('message', handleNavigateToMessageEvent)
    }
  }, [])
  
  useEffect(() => {

    let connector = getConnection("SisenseConnect")
    //check to see if Sisense Embed SDK has already been loaded
    if (!connector) {
      setStatus('Loading...')
    } else if (!!connector && !isValidConfig()) {
      setStatus('Invalid Widgets config')
    } else if (!!connector && isValidConfig()) {
      setMyConnector(connector)
      setSisenseLoaded(true)
    }
    
  }, [allConnections])
  
  useEffect(() => {
    
    const loadWidgets = async () => {
      
      let widgetDash
      if (dashboardId) {
        widgetDash = await myConnector.connectionInfo.sisenseApp.dashboards.load(dashboardId)
      } else {
        widgetDash = new Dashboard()
        myConnector.connectionInfo.sisenseApp.dashboards.add(widgetDash)
      }
      
      widgetDash.on('filterschanged', (dash, type) => {
        console.log('filterschanged', type)
        
        let filters = {}
        if (type.type !== 'remove') {
          setIsFiltered(true)
          type.items.forEach((item) => {
            filters[item.jaql.column] = item.jaql.filter.members
          })
        }
        
        if (onClick) onClick(filters)
      })

      for (let i = 0; i < widgets.length; i++) {
        await widgetDash.widgets.load(widgets[i].id)
        let dashWidget = widgetDash.widgets.get(widgets[i].id)
        dashWidget.container = document.getElementById("w-" + widgets[i].id)
      }
      
      widgetDash.refresh()
      setWidgetDashboard(widgetDash)
    }
    
    if (sisenseLoaded) {
      
      loadWidgets()
      window.addEventListener('message', handleNavigateToMessageEvent, false)
    }
      
  }, [sisenseLoaded])
  
  useEffect(() => {
    if (widgetDashboard) {
      widgetDashboard.$$model.filters.update(filters, {refresh: true, save: false})
      setIsFiltered(true)
    }
  }, [filters])
  
  useEffect(() => {
    
    if (widgetDashboard && !isFiltered) {
      widgetDashboard.$$model.filters.clear()
      widgetDashboard.refresh()
    }
    
  }, [isFiltered])
    
  const handleNavigateToMessageEvent = (e) => {

    if (e.data.query && e.data.entityType)
      dashboard.props.setQueryParams({query: e.data.query, entityType: e.data.entityType, senderEntityType: e.data.entityType})

    if ((e.origin === myConnector.url || e.origin === window.location.origin) && e.data.handler) {
      let action = {
        type: 'navigate',
        navigateTo: e.data.handler
      }

      dashboard.doAction(action)
    }
  }
  
  const getWidgetTitle = (widget) => {
    
    if (widget.widgetTitle)
      return widget.widgetTitle
    else if (widgetDashboard && widgetDashboard.$$widgets && widgetDashboard.$$widgets.$$widgetsMap && widgetDashboard.$$widgets.$$widgetsMap[widget.id]) 
      return widgetDashboard.$$widgets.$$widgetsMap[widget.id].title
    else return ""
    
  }
  
  const clearDashboardFilters = () => {

    setIsFiltered(false)
    
  }
  
  return (   
        <div id={widgetDivId}>
          {widgets.map(widget =>  <div key={widget.id} className="sisense-widget-container" style={widget.style} >
             {!sisenseLoaded && <div>{status}</div>}
            <div>
              {widget.showHeader && <div className={clsx('widget-header', widget.showClearFilter && 'with-filter', !widget.showClearFilter && 'without-filter')}>
                <div className='widget-title'>{getWidgetTitle(widget)}</div>
                {widget.showClearFilter && isFiltered && <div className="widget-filter-control" onClick={clearDashboardFilters}><i className='fas fa-ban'></i> Clear Selection</div>}
              </div>}
            </div>
            <div id={"w-"+widget.id} ></div>
        </div>)}
          
        </div>
  )

}

export const SisenseWidgetsFactory = {
  create: ({config, data}) => {
    
    //data and options provided by the script will do a shallow replace
    //so properties of options are not merged, just one options object
    //replaces the other.
    let options = {...config.config, ...data}
  
    let WidgetComponent = compose(
            connect(mapStateToProps, mapDispatchToProps),
    )(SisenseWidgets)
    
    return <WidgetComponent {...options} {...config.config} />
    
  }
}

const mapStateToProps = (state) => ({
  allConnections: getAllConnections(state)
})

const mapDispatchToProps = {
    getConnection
}

export default compose(
  
  connect(mapStateToProps, mapDispatchToProps),
  
)(SisenseWidgets)