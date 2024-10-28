import React from 'react';

const connect = (connectConfig) => {
  
  return new Promise((resolve, reject) => {
    
    const connectOnLoad = () => {
      Sisense.connect(connectConfig.config.url, false).then((app) => {
        resolve({name: connectConfig.name, connectionInfo: {sisenseApp: app}})
    })}

    let sisenseDivExists = !!document.getElementById('sisenseApp')
    
    if (!sisenseDivExists) {
      console.log('Connecting SisenseConnect!', connectConfig.config)
      
      let sisenseDiv = document.createElement('div')
      sisenseDiv.id = 'sisenseApp'
      sisenseDiv.style.cssText = "display: none;"
      document.body.appendChild(sisenseDiv)

      //Loading Sisense sisense.js
      let sisenseScript = document.createElement('script')
      sisenseScript.type ='application/javascript'
      sisenseScript.src = connectConfig.config.url + '/js/sisense.v1.js'
      sisenseScript.async = true
      sisenseScript.onload = () => {
        connectOnLoad()
      }

      document.body.appendChild(sisenseScript);
    } else {
      console.error('SisenseConnect already loaded!')
      resolve({name: connectConfig.name, errorMessage: 'SisenseConnect already loaded!'})
    }
  })
  
}

export default {
  connect
}