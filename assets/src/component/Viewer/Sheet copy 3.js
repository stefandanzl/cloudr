import React, { useEffect, useRef } from 'react';
import "./Sheet.css";

export default function Luckysheet()  {
   // Flag to track whether the scripts are loaded
   const script1Loaded = useRef(false);
   const script2Loaded = useRef(false);
 

  const luckyCss = {
    margin: '0px',
    padding: '0px',
    // position: 'absolute',
    width: "100%", 
    height: "calc(100vh - 64px)", 
    // width: '100%',
    // height: '100%',
    // left: '0px',
    // top: '0px',
    color: "black !important",
  };


  // Include stylesheets directly in the head of the document
  useEffect(() => {
    const linkElement1 = document.createElement('link');
    linkElement1.rel = 'stylesheet';
    linkElement1.href = 'https://cdn.jsdelivr.net/npm/luckysheet/dist/plugins/css/pluginsCss.css';
    document.head.appendChild(linkElement1);

    const linkElement2 = document.createElement('link');
    linkElement2.rel = 'stylesheet';
    linkElement2.href = 'https://cdn.jsdelivr.net/npm/luckysheet/dist/plugins/plugins.css';
    document.head.appendChild(linkElement2);

    const linkElement3 = document.createElement('link');
    linkElement3.rel = 'stylesheet';
    linkElement3.href = 'https://cdn.jsdelivr.net/npm/luckysheet/dist/css/luckysheet.css';
    document.head.appendChild(linkElement3);

    const linkElement4 = document.createElement('link');
    linkElement4.rel = 'stylesheet';
    linkElement4.href = 'https://cdn.jsdelivr.net/npm/luckysheet/dist/assets/iconfont/iconfont.css';
    document.head.appendChild(linkElement4);

    // Add cleanup function to remove the link elements when the component unmounts
    return () => {
      document.head.removeChild(linkElement1);
      document.head.removeChild(linkElement2);
      document.head.removeChild(linkElement3);
      document.head.removeChild(linkElement4);
    };
  }, []); 

 
  useEffect(() => {
    
  
    // Load plugin.js script
    const scriptElement1 = document.createElement('script');
    scriptElement1.src = 'https://cdn.jsdelivr.net/npm/luckysheet/dist/plugins/js/plugin.js';
    scriptElement1.type = 'text/javascript';
    scriptElement1.onload = () => {
      if (!script1Loaded.current) {
        // plugin.js script has loaded, now load luckysheet.umd.js script
        script1Loaded.current = true;
        console.log('plugin.js loaded');
        const scriptElement2 = document.createElement('script');
        scriptElement2.src = 'https://cdn.jsdelivr.net/npm/luckysheet/dist/luckysheet.umd.js';
        scriptElement2.type = 'text/javascript';
        scriptElement2.onload = () => {
          if (!script2Loaded.current) {
            // Both scripts have loaded, now you can initialize Luckysheet
            script2Loaded.current = true;
            console.log('luckysheet.umd.js loaded');
            const luckysheet = window.luckysheet;
            luckysheet.create({
              container: 'luckysheetDiv',
            });
  
            // Add cleanup function to remove the script elements when the component unmounts
            return () => {
              document.head.removeChild(scriptElement1);
              document.head.removeChild(scriptElement2);
            };
          }
        };
  
        // Append luckysheet.umd.js script to head
        document.head.appendChild(scriptElement2);
      }
    };
  
    // Append plugin.js script to head
    document.head.appendChild(scriptElement1);
  
    
  }, []);
  


  return (
    <div id="luckysheetDiv" style={luckyCss}></div>
  )
}

