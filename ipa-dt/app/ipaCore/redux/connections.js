import { createSelector, createSlice} from '@reduxjs/toolkit'
import SisenseConnectConnector from '../../client/connectors/SisenseConnectConnector'
import SisenseIframeConnector from '../../client/connectors/SisenseIframeConnector'
import _ from 'lodash'
import produce from "immer";

const connectorsMap = {
  SisenseConnect: SisenseConnectConnector,
  SisenseIframe: SisenseIframeConnector
}

let connectionInfo = {}
const addConnectionInfo = connection => connectionInfo[connection.name] = connection.connectionInfo

let initialState = {
    connections: []
};

const connectionsSlice = createSlice({
    name: 'connectors',
    initialState,
    reducers: {
        addConnections: (state, {payload: newConnections }) => {
            state.connections =  state.connections.concat(newConnections)
        }
    }
});

const { actions, reducer } = connectionsSlice
export default reducer

//private selectors
const getConnectionsSlice = store => store.connections

//Public selectors
export const getAllConnections = createSelector(getConnectionsSlice, connctionsSlice => connctionsSlice.connections)

//Action creators
const { addConnections } = actions

//Thunks
export const initializeConnections = (connectorDefs) => async (dispatch, getState) => {
  
  let newConnections = []
  for (let i = 0; i < connectorDefs.length; i++) {
    let connector = connectorsMap[connectorDefs[i].name]
    if (connector && !_.find(getAllConnections(getState()), {name: connectorDefs[i].name})) {
      let connection = await connector.connect(connectorDefs[i])
      addConnectionInfo(connection)
      newConnections.push(_.omit(connection, ['connectionInfo']))
    }
  }
  
  await dispatch(addConnections(newConnections))
  
}

export const getConnection = (connectionName) => (dispatch, getState) => {
  
  let baseConnection = _.find(getAllConnections(getState()), {name: connectionName})
  if (!baseConnection) return null
  
  let finalConnection = produce(baseConnection, draftConnection => {
    draftConnection.connectionInfo = connectionInfo[baseConnection.name]
  })
  
  return finalConnection
  
}

