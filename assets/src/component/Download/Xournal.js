import React, { useEffect, useState } from "react";
import { Facebook } from "react-content-loader";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
// import  path  from 'path';
// import path from 'path-browserify';
// const path = require('path')
import * as path from 'path';


export default function Xournal() {
  const history = useHistory();
  const selected = useSelector((state) => state.explorer.selected);
  const [url, setUrl] = useState("");



  // let url; // Declare url here
  let encodedPath

  useEffect(() => {
    // Move the hook calls to the top level
  

    if (selected.length > 0) {
      const target = selected[0];
      const protocol = "xopp://";
      const rawPath = target.path;
      const basePath = rawPath.slice(1);
      const fileName = target.name;
      // url = path + "/" + name;
      const filePath = path.join(basePath, fileName);
      // const filePath = protocol + basePath + fileName
      encodedPath = protocol + encodeURIComponent(filePath);

      setUrl(encodedPath)

      console.log("\nTARGETTT ", JSON.stringify(target));
      console.log("\npath ", JSON.stringify(target.path));
      console.log("\nname ", JSON.stringify(target.name));
      console.log("\nurl ", JSON.stringify(url));
      console.log("\nurl ", JSON.stringify(encodedPath));
    
    }

    console.log("Xournal triggered");
  }, []);

  return (
    <div
      style={{
        textAlign: "center",
      }}
    >
      
        {url && (
          <div id="xournal">
          <iframe src={url} hidden></iframe>
          <h1>OPENING YOUR XOURNAL FILE</h1>
          <h2>{url}</h2></div>
          )}
      

    </div>
  );
}
