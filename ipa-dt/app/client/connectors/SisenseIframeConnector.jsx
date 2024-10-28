import React from 'react';

const connect = (connectConfig) => {
  
  return new Promise((resolve, reject) => {
    
    const connectOnLoad = () => {
        resolve({name: connectConfig.name, url: connectConfig.config.url})
    }
    
    //check to see if Sisense Embed SDK has already been loaded
    if (!window['sisense.embed']) {
      console.log('Connecting SisenseIframe!', connectConfig.config)
      //Loading Sisense frame.js
      let embedScript = document.createElement('script')
      embedScript.type ='application/javascript'
      embedScript.src = connectConfig.config.url + '/js/frame.js'
      embedScript.async = true
      embedScript.onload = () => {
        connectOnLoad()
      }
      
      document.body.appendChild(embedScript);
      
    } else {
      //Sisense frame.js already loaded
      console.error('SisenseIframeConnector already loaded!')
      resolve({name: connectConfig.name, errorMessage: 'SisenseIframeConnector already loaded!'})
    }
  })
  
}

export default {
  connect
}